#!/usr/bin/env bash
set -Eeuo pipefail
umask 077

TARGET_SHA="${1:-}"
APP_DIR="${APP_DIR:-/srv/ace-prod}"
BACKUP_ROOT="${BACKUP_ROOT:-/srv/backups/ace-prod}"
SERVICE_NAME="${SERVICE_NAME:-ace-prod}"
SYNC_SERVICE_NAME="ace-prod-faceit-sync.service"
SYNC_TIMER_NAME="ace-prod-faceit-sync.timer"
SYSTEMD_DIR="/etc/systemd/system"
MIN_ROOT_FREE_KB=$((1024 * 1024))
MIN_APP_FREE_KB=$((1024 * 1024))
BACKUP_MARGIN_KB=$((512 * 1024))

fail() {
  echo "Erro: $*" >&2
  if declare -F rollback >/dev/null; then
    rollback 1
  fi
  exit 1
}

require_free_space() {
  local path="$1" required_kb="$2" available
  available="$(df -Pk "$path" | awk 'END { print $4 }')"
  [[ "$available" =~ ^[0-9]+$ ]] || fail "nao foi possivel verificar o espaco em $path"
  (( available >= required_kb )) || fail "espaco insuficiente em $path: disponiveis ${available}KB; necessarios ${required_kb}KB"
}

verify_sqlite_backup() {
  node --disable-warning=ExperimentalWarning -e '
    const { DatabaseSync } = require("node:sqlite");
    const db = new DatabaseSync(process.argv[1], { readOnly: true });
    const result = db.prepare("PRAGMA integrity_check").get();
    db.close();
    if (result?.integrity_check !== "ok") {
      console.error("Backup SQLite reprovado na verificacao de integridade.");
      process.exit(1);
    }
  ' "$1"
}

verify_backup() {
  local backup_dir="$1"
  [[ -f "$backup_dir/CHECKSUMS.sha256" ]] || return 1
  (cd "$backup_dir" && sha256sum --check --status CHECKSUMS.sha256) || return 1
  verify_sqlite_backup "$backup_dir/dev.db"
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
RESTORE_TEST_DIR=""
CODE_CHANGED=0
BACKUP_READY=0
SYNC_UNITS_CHANGED=0
SYNC_TIMER_WAS_ENABLED=0

[[ -f prisma/dev.db ]] || fail "banco de dados prisma/dev.db nao encontrado"
mkdir -p "$BACKUP_ROOT"
[[ ! -e "$BACKUP_DIR" ]] || fail "o destino do backup ja existe: $BACKUP_DIR"
BACKUP_PAYLOAD_KB="$(du -sk prisma/dev.db | awk '{ print $1 }')"
for backup_source in prisma/dev.db-wal storage/registrations; do
  if [[ -e "$backup_source" ]]; then
    source_kb="$(du -sk "$backup_source" | awk '{ print $1 }')"
    BACKUP_PAYLOAD_KB=$((BACKUP_PAYLOAD_KB + source_kb))
  fi
done
require_free_space / "$MIN_ROOT_FREE_KB"
require_free_space "$APP_DIR" "$MIN_APP_FREE_KB"
require_free_space "$BACKUP_ROOT" "$((BACKUP_PAYLOAD_KB * 2 + BACKUP_MARGIN_KB))"

cleanup_restore_test() {
  if [[ -n "$RESTORE_TEST_DIR" && -d "$RESTORE_TEST_DIR" ]]; then
    rm -rf -- "$RESTORE_TEST_DIR"
  fi
}

rollback() {
  local exit_code="${1:-$?}"
  trap - ERR

  echo "Deploy falhou. Restaurando $PREVIOUS_SHA..." >&2
  cleanup_restore_test
  sudo -n systemctl stop "$SYNC_TIMER_NAME" || true
  sudo -n systemctl stop "$SYNC_SERVICE_NAME" || true
  sudo -n systemctl stop "$SERVICE_NAME" || true

  if [[ "$BACKUP_READY" -eq 1 ]] && ! verify_backup "$BACKUP_DIR"; then
    echo "Backup $BACKUP_DIR falhou na validacao; deploy e dados atuais foram preservados para analise." >&2
    sudo -n systemctl start "$SERVICE_NAME" || true
    if [[ "$SYNC_TIMER_WAS_ENABLED" -eq 1 ]]; then
      sudo -n systemctl enable --now "$SYNC_TIMER_NAME" || true
    fi
    exit "$exit_code"
  fi

  if [[ "$SYNC_UNITS_CHANGED" -eq 1 ]]; then
    for unit in "$SYNC_SERVICE_NAME" "$SYNC_TIMER_NAME"; do
      if [[ -f "$BACKUP_DIR/systemd/$unit" ]]; then
        sudo -n install -m 0644 "$BACKUP_DIR/systemd/$unit" "$SYSTEMD_DIR/$unit" || true
      else
        sudo -n rm -f "$SYSTEMD_DIR/$unit" || true
      fi
    done
    sudo -n systemctl daemon-reload || true
  fi
  if [[ "$CODE_CHANGED" -eq 1 ]]; then
    git reset --hard "$PREVIOUS_SHA" || true
  fi

  if [[ "$BACKUP_READY" -eq 1 ]]; then
    rm -f prisma/dev.db prisma/dev.db-wal prisma/dev.db-shm
    for database_file in dev.db dev.db-wal; do
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
  if [[ "$SYNC_TIMER_WAS_ENABLED" -eq 1 ]]; then
    sudo -n systemctl enable --now "$SYNC_TIMER_NAME" || true
  fi
  echo "Rollback concluido. Backup preservado em $BACKUP_DIR" >&2
  exit "$exit_code"
}

trap rollback ERR

echo "Parando $SERVICE_NAME e criando backup..."
if sudo -n systemctl is-enabled --quiet "$SYNC_TIMER_NAME"; then
  SYNC_TIMER_WAS_ENABLED=1
fi
sudo -n systemctl stop "$SYNC_TIMER_NAME" || true
sudo -n systemctl stop "$SYNC_SERVICE_NAME" || true
sudo -n systemctl stop "$SERVICE_NAME"
mkdir -p "$BACKUP_DIR"

# SHM is a rebuildable WAL index; integrity reads can modify it.
for database_file in prisma/dev.db prisma/dev.db-wal; do
  if [[ -f "$database_file" ]]; then
    cp -a "$database_file" "$BACKUP_DIR/"
  fi
done

if [[ -d storage/registrations ]]; then
  cp -a storage/registrations "$BACKUP_DIR/registrations"
fi

mkdir -p "$BACKUP_DIR/systemd"
for unit in "$SYNC_SERVICE_NAME" "$SYNC_TIMER_NAME"; do
  if [[ -f "$SYSTEMD_DIR/$unit" ]]; then
    sudo -n cp -a "$SYSTEMD_DIR/$unit" "$BACKUP_DIR/systemd/$unit"
  fi
done

printf 'previous_sha=%s\ntarget_sha=%s\ncreated_at=%s\n' \
  "$PREVIOUS_SHA" "$TARGET_SHA" "$TIMESTAMP" > "$BACKUP_DIR/manifest.txt"

(
  cd "$BACKUP_DIR"
  find . -type f ! -name CHECKSUMS.sha256 ! -path './dev.db-shm' -print0 | sort -z | xargs -0 sha256sum > CHECKSUMS.sha256
  sha256sum --check --status CHECKSUMS.sha256
)
verify_sqlite_backup "$BACKUP_DIR/dev.db"

echo "Ensaiando a restauracao do backup..."
RESTORE_TEST_DIR="$(mktemp -d "$BACKUP_ROOT/.restore-test.XXXXXX")"
cp -a "$BACKUP_DIR/." "$RESTORE_TEST_DIR/"
(cd "$RESTORE_TEST_DIR" && sha256sum --check --status CHECKSUMS.sha256)
verify_sqlite_backup "$RESTORE_TEST_DIR/dev.db"
if [[ -d storage/registrations ]]; then
  diff -qr storage/registrations "$RESTORE_TEST_DIR/registrations" >/dev/null
elif [[ -e "$RESTORE_TEST_DIR/registrations" ]]; then
  fail "o ensaio encontrou uploads extras no backup"
fi
cleanup_restore_test
RESTORE_TEST_DIR=""
BACKUP_READY=1

echo "Atualizando codigo para $TARGET_SHA..."
git merge --ff-only "$TARGET_SHA"
CODE_CHANGED=1

npm ci
npm run db:generate
npm run db:migrate
npm run build

sudo -n systemctl start "$SERVICE_NAME"

HEALTHY=0
for attempt in {1..30}; do
  if curl --fail --silent --show-error --max-time 3 http://127.0.0.1:8001/ >/dev/null; then
    HEALTHY=1
    break
  fi
  sleep 2
done

[[ "$HEALTHY" -eq 1 ]] || fail "a aplicacao nao respondeu na porta 8001"

echo "Instalando sincronizacao automatica da FACEIT..."
SYNC_UNITS_CHANGED=1
sudo -n install -m 0644 "deploy/$SYNC_SERVICE_NAME" "$SYSTEMD_DIR/$SYNC_SERVICE_NAME"
sudo -n install -m 0644 "deploy/$SYNC_TIMER_NAME" "$SYSTEMD_DIR/$SYNC_TIMER_NAME"
sudo -n systemctl daemon-reload
sudo -n systemctl start "$SYNC_SERVICE_NAME"
sudo -n systemctl enable --now "$SYNC_TIMER_NAME"
sudo -n systemctl is-enabled --quiet "$SYNC_TIMER_NAME"
sudo -n systemctl is-active --quiet "$SYNC_TIMER_NAME"

trap - ERR
echo "Deploy concluido. Backup: $BACKUP_DIR"
