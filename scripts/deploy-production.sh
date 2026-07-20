#!/usr/bin/env bash
set -Eeuo pipefail
umask 077

TARGET_SHA="${1:-}"
APP_DIR="${APP_DIR:-/home/ubuntu/ace-prod}"
BACKUP_ROOT="${BACKUP_ROOT:-/home/ubuntu/backups/ace-prod}"
SERVICE_NAME="${SERVICE_NAME:-ace-prod}"

fail() {
  echo "Erro: $*" >&2
  exit 1
}

[[ "$TARGET_SHA" =~ ^[0-9a-f]{40}$ ]] || fail "commit de destino invalido"
[[ -d "$APP_DIR/.git" ]] || fail "repositorio nao encontrado em $APP_DIR"

cd "$APP_DIR"

git cat-file -e "$TARGET_SHA^{commit}" 2>/dev/null || fail "commit nao encontrado"
[[ "$(git rev-parse origin/main)" == "$TARGET_SHA" ]] || fail "o commit nao e a main remota"
[[ "$(git branch --show-current)" == "main" ]] || fail "a producao nao esta na branch main"
[[ -z "$(git status --porcelain --untracked-files=no)" ]] || fail "a producao possui alteracoes locais"

PREVIOUS_SHA="$(git rev-parse HEAD)"
TIMESTAMP="$(date -u +%Y%m%dT%H%M%SZ)"
BACKUP_DIR="$BACKUP_ROOT/$TIMESTAMP-$PREVIOUS_SHA"
CODE_CHANGED=0
BACKUP_READY=0

rollback() {
  local exit_code=$?
  trap - ERR

  echo "Deploy falhou. Restaurando $PREVIOUS_SHA..." >&2
  sudo -n systemctl stop "$SERVICE_NAME" || true

  if [[ "$CODE_CHANGED" -eq 1 ]]; then
    git reset --hard "$PREVIOUS_SHA" || true
  fi

  if [[ "$BACKUP_READY" -eq 1 ]]; then
    rm -f prisma/dev.db prisma/dev.db-wal prisma/dev.db-shm
    for database_file in dev.db dev.db-wal dev.db-shm; do
      if [[ -f "$BACKUP_DIR/$database_file" ]]; then
        cp -a "$BACKUP_DIR/$database_file" "prisma/$database_file"
      fi
    done

    if [[ -d "$BACKUP_DIR/registrations" ]]; then
      rm -rf storage/registrations
      mkdir -p storage
      cp -a "$BACKUP_DIR/registrations" storage/registrations
    fi
  fi

  if [[ "$CODE_CHANGED" -eq 1 ]]; then
    npm ci || true
    npm run db:generate || true
    npm run build || true
  fi

  sudo -n systemctl start "$SERVICE_NAME" || true
  echo "Rollback concluido. Backup preservado em $BACKUP_DIR" >&2
  exit "$exit_code"
}

trap rollback ERR

echo "Parando $SERVICE_NAME e criando backup..."
sudo -n systemctl stop "$SERVICE_NAME"
mkdir -p "$BACKUP_DIR"

for database_file in prisma/dev.db prisma/dev.db-wal prisma/dev.db-shm; do
  if [[ -f "$database_file" ]]; then
    cp -a "$database_file" "$BACKUP_DIR/"
  fi
done

if [[ -d storage/registrations ]]; then
  cp -a storage/registrations "$BACKUP_DIR/registrations"
fi

printf 'previous_sha=%s\ntarget_sha=%s\ncreated_at=%s\n' \
  "$PREVIOUS_SHA" "$TARGET_SHA" "$TIMESTAMP" > "$BACKUP_DIR/manifest.txt"
BACKUP_READY=1

echo "Atualizando codigo para $TARGET_SHA..."
git merge --ff-only "$TARGET_SHA"
CODE_CHANGED=1

npm ci
npm run db:generate
npm run db:migrate
npm run build

sudo -n systemctl start "$SERVICE_NAME"

for attempt in {1..30}; do
  if curl --fail --silent --show-error --max-time 3 http://127.0.0.1:8001/ >/dev/null; then
    trap - ERR
    echo "Deploy concluido. Backup: $BACKUP_DIR"
    exit 0
  fi
  sleep 2
done

fail "a aplicacao nao respondeu na porta 8001"
