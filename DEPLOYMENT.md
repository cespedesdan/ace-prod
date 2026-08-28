# Publicação da Ace Produtora 1.1.0

Guia da produção atual em uma instância AWS EC2 com Ubuntu, Caddy, Next.js e SQLite. Os domínios usados são `aceprodutora.com.br` e `www.aceprodutora.com.br`.

## Arquitetura

```text
Internet
  ├─ TCP 80  ── Caddy ── redirecionamento HTTPS
  └─ TCP 443 ── Caddy ── 127.0.0.1:8001 ── Next.js ── SQLite + storage
```

O Next.js permanece acessível apenas pelo loopback. Caddy gerencia HTTPS e encaminha as requisições para a porta 8001.

## Requisitos

- Ubuntu Server na AWS EC2.
- Node.js 24 LTS, npm, Git, Caddy e SQLite.
- DNS do domínio raiz e `www` apontando para o IP público ou Elastic IP da instância.
- Portas 22, 80 e 443 liberadas no Security Group; a porta 8001 não deve ser pública.
- Cloudflare em SSL/TLS `Full (strict)` depois da emissão do certificado.

## 1. Preparar o projeto

```bash
sudo install -d -o ubuntu -g ubuntu /srv/ace-prod
git clone https://github.com/cespedesdan/ace-prod.git /srv/ace-prod
cd /srv/ace-prod
cp .env.example .env.local
chmod 600 .env.local
```

Gere o segredo JWT:

```bash
openssl rand -hex 32
```

Preencha `.env.local` sem versionar o arquivo:

```dotenv
JWT_SECRET=CHAVE_ALEATORIA_COM_PELO_MENOS_32_CARACTERES
ADMIN_EMAIL=EMAIL_PRIVADO_DO_ADMINISTRADOR
ADMIN_PASSWORD=
FACEIT_API_KEY=CHAVE_PRIVADA_DA_FACEIT
FACEIT_OAUTH_CLIENT_ID=CLIENT_ID_DA_FACEIT
FACEIT_OAUTH_CLIENT_SECRET=CLIENT_SECRET_DA_FACEIT
FACEIT_OAUTH_REDIRECT_URI=https://aceprodutora.com.br/api/faceit/ownership/callback
FACEIT_OAUTH_COOKIE_SECRET=OUTRA_CHAVE_ALEATORIA_COM_PELO_MENOS_32_CARACTERES
TRUST_PROXY=true
```

Crie um cliente OAuth2 no FACEIT App Studio com a mesma URL de retorno configurada acima. O formulário usa Authorization Code com PKCE e somente aceita a inscrição quando a conta autenticada ainda é a líder do time informado. `TRUST_PROXY=true` é seguro nesta arquitetura porque o Next.js escuta apenas em `127.0.0.1` e o Caddy normaliza os cabeçalhos de IP. As chaves FACEIT nunca devem usar o prefixo `NEXT_PUBLIC_`.

## 2. Instalar e preparar o banco

```bash
npm ci
npm run db:generate
npm run db:migrate
npm run db:migrate:status
```

Em uma instalação nova, as migrations criam toda a estrutura. Nunca use `prisma migrate dev` em produção.

### Banco anterior à migration-base

Se a máquina já possuía `prisma/dev.db` antes da migration `20260716160000_v1_baseline`, faça backup e execute uma única vez:

```bash
npx prisma migrate resolve --applied 20260716160000_v1_baseline
npm run db:migrate:status
```

Não execute esse comando em banco vazio.

## 3. Criar ou redefinir o administrador

```bash
read -s -p "Senha do administrador: " ADMIN_PASSWORD; echo
ADMIN_PASSWORD="$ADMIN_PASSWORD" npm run db:seed
unset ADMIN_PASSWORD
```

O seed cria ou atualiza somente o administrador. A senha é armazenada como hash bcrypt com custo 12 e não deve permanecer no `.env.local`.

## 4. Validar e construir

```bash
npm run check
npm audit
npm run build
```

## 5. Instalar o serviço Next.js

O arquivo `deploy/ace-prod.service` assume o usuário `ubuntu` e o projeto em `/srv/ace-prod`.

```bash
sudo cp deploy/ace-prod.service /etc/systemd/system/ace-prod.service
sudo systemctl daemon-reload
sudo systemctl enable --now ace-prod
sudo systemctl status ace-prod --no-pager
```

Comandos operacionais:

```bash
sudo systemctl stop ace-prod
sudo systemctl start ace-prod
sudo systemctl restart ace-prod
journalctl -u ace-prod -n 100 --no-pager
```

## 6. Ativar Caddy e HTTPS

```bash
sudo cp deploy/Caddyfile /etc/caddy/Caddyfile
sudo caddy validate --config /etc/caddy/Caddyfile
sudo systemctl enable --now caddy
sudo systemctl reload caddy
sudo systemctl status caddy --no-pager
```

O Caddyfile inclui HTTPS automático, redireciona todo acesso de `www.aceprodutora.com.br` para o domínio raiz, aplica compressão, limite de 23 MiB, HSTS e proxy para `127.0.0.1:8001`. O domínio raiz canônico mantém os cookies `__Host-` do OAuth FACEIT no mesmo host do início ao retorno da autenticação.

Teste externamente:

```bash
curl -I http://aceprodutora.com.br
curl -I https://aceprodutora.com.br
curl -I https://www.aceprodutora.com.br
```

O último comando deve responder com redirecionamento permanente para a mesma rota e query string em `https://aceprodutora.com.br`.

## Proteções ativas

- Prisma sem SQL bruto nas rotas de inscrição e administração.
- Chave FACEIT utilizada somente no servidor.
- Prova de controle do time por OAuth2 da FACEIT, vinculada à conta líder e válida por 15 minutos.
- Consultas públicas à FACEIT limitadas por IP em produção.
- Elencos e campeonatos armazenados como snapshots, com sincronização manual.
- Corpo das inscrições limitado a 22 MiB e arquivos individuais a 10 MiB.
- Arquivos validados por MIME e assinatura binária.
- Comprovantes disponíveis somente para administrador autenticado.
- Inscrições limitadas a três tentativas em 24 horas por e-mail e IP.
- Login limitado por e-mail e IP.
- JWT em cookie `httpOnly`, `Secure` em produção e `SameSite=Strict`.

## Backup

Os dados persistentes são `prisma/dev.db` e `storage/registrations/`. Faça backup dos dois juntos:

```bash
cd /srv/ace-prod
mkdir -p backups
sqlite3 prisma/dev.db ".backup 'backups/ace-prod.db'"
cp -a storage/registrations backups/registrations
```

Proteja a cópia como dado pessoal e teste periodicamente a restauração. Nunca envie banco, uploads ou `.env.local` ao Git.

## Atualizar a aplicação

```bash
cd /srv/ace-prod
sudo systemctl stop ace-prod
git pull --ff-only
npm ci
npm run db:generate
npm run db:migrate
npm run check
npm audit
npm run build
sudo systemctl start ace-prod
sudo systemctl status ace-prod --no-pager
```

O Caddy pode permanecer ativo durante a atualização e poderá responder `502` enquanto o Next.js estiver parado.

## Deploy automático com GitHub Actions

O workflow `.github/workflows/ci-deploy.yml` executa as validações em todo pull request para `main`. Depois do merge, ele publica o commit exato na EC2. Antes de alterar o código, `scripts/deploy-production.sh` para o serviço e copia o banco e os uploads para:

```text
/home/ubuntu/backups/ace-prod/AAAAMMDDTHHMMSSZ-COMMIT/
```

Se migration, instalação, build ou teste de saúde falhar, o script restaura o commit e os dados anteriores automaticamente.

### 1. Criar uma chave exclusiva para o deploy

No PowerShell do computador de desenvolvimento:

```powershell
ssh-keygen -t ed25519 -f "$HOME\.ssh\ace-prod-github-actions" -C "github-actions-ace-prod"
```

Pressione Enter duas vezes quando for solicitada a senha. A automação não pode responder a uma solicitação interativa. Não reutilize a chave administrativa `.pem` da AWS.

Mostre somente a chave pública:

```powershell
Get-Content "$HOME\.ssh\ace-prod-github-actions.pub"
```

Na EC2, acrescente essa linha a `/home/ubuntu/.ssh/authorized_keys`, mantendo a chave existente:

```text
restrict ssh-ed25519 AAAA... github-actions-ace-prod
```

O prefixo `restrict` desabilita encaminhamentos e terminal interativo para essa chave, mas permite os comandos necessários ao deploy. Depois, confira as permissões:

```bash
chmod 700 ~/.ssh
chmod 600 ~/.ssh/authorized_keys
```

Confirme também que a produção está na branch `main`, sem alterações versionadas, e que o usuário pode controlar o serviço sem senha interativa:

```bash
cd /srv/ace-prod
git branch --show-current
git status --short
sudo -n systemctl status ace-prod --no-pager
```

### 2. Conferir a identidade SSH da EC2

Na EC2:

```bash
sudo ssh-keygen -lf /etc/ssh/ssh_host_ed25519_key.pub
```

No PowerShell, substitua `HOST_DA_EC2` e compare o fingerprint exibido:

```powershell
ssh-keyscan HOST_DA_EC2 | ssh-keygen -lf -
```

Somente se os fingerprints forem iguais, gere o conteúdo que será salvo no GitHub:

```powershell
ssh-keyscan -H HOST_DA_EC2
```

### 3. Criar o ambiente e os segredos no GitHub

No repositório, acesse **Settings > Environments > New environment**, crie `production` e cadastre:

**Environment secrets**

- `EC2_SSH_KEY_B64`: chave privada codificada em Base64. Gere e copie sem alterar o conteúdo:

  ```powershell
  [Convert]::ToBase64String([IO.File]::ReadAllBytes("$HOME\.ssh\ace-prod-github-actions")) | Set-Clipboard
  ```

- `EC2_KNOWN_HOSTS`: saída validada de `ssh-keyscan -H HOST_DA_EC2`.

**Environment variables**

- `EC2_HOST`: hostname público, Elastic IP ou domínio da EC2, sem `https://`.
- `EC2_USER`: `ubuntu`.

Opcionalmente, em **Deployment branches and tags**, permita somente `main`. Se **Required reviewers** estiver disponível, adicione sua conta para exigir aprovação manual antes da produção.

Em **Settings > Rules > Rulesets**, proteja a `main`: exija pull request, o status **Validar aplicação** aprovado e bloqueie force push. Assim, o deploy só recebe código que passou pelo CI.

### 4. Fluxo de publicação

1. Envie a branch de desenvolvimento ao GitHub e abra um pull request para `main`.
2. Aguarde o job **Validar aplicação** terminar com sucesso.
3. Faça o merge.
4. A atualização da `main` inicia **Publicar na AWS**.
5. Acompanhe em **Actions > CI e deploy**.

Também é possível iniciar manualmente em **Actions > CI e deploy > Run workflow**, escolhendo `main`.

O SSH da EC2 precisa aceitar conexões do runner do GitHub. A porta 22 não deve ser aberta mais do que o necessário; mantenha a chave dedicada, o `fail2ban` e as regras do Security Group ativos.
