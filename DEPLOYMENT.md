# Publicação da Ace Produtora 1.0.0

Este guia descreve a publicação no computador Windows que hospeda o projeto. A configuração incluída assume os domínios `aceprodutora.com.br` e `www.aceprodutora.com.br`.

## Arquitetura

```text
Internet
  ├─ TCP 80  ── Caddy ── redirecionamento HTTPS
  └─ TCP 443 ── Caddy ── 127.0.0.1:8001 ── Next.js ── SQLite + storage
```

O Next.js nunca deve ser publicado diretamente nas portas 80 ou 443. O script `npm run start` aceita conexões apenas em `127.0.0.1:8001`; o Caddy termina o TLS e encaminha as requisições.

## Requisitos

- Node.js 24 LTS.
- Caddy 2.10 ou superior disponível no `PATH`.
- DNS dos domínios raiz e `www` apontando para o IP público do local.
- Registros DNS atualmente publicados pelo proxy da Cloudflare.
- Portas TCP 80 e 443 encaminhadas pelo roteador para o computador e liberadas no Firewall do Windows.
- Acesso de escrita a `prisma/` e `storage/registrations/`.

No Windows, o Caddy pode ser instalado pelo Chocolatey ou Scoop:

```powershell
choco install caddy
# ou
scoop install caddy
```

Para produção contínua, execute Node e Caddy como serviços do Windows com reinício automático. Não dependa de terminais abertos.

## 1. Preparar variáveis privadas

```powershell
Copy-Item .env.example .env.local
node -e "console.log(require('node:crypto').randomBytes(32).toString('hex'))"
```

Copie o valor gerado para `JWT_SECRET` e configure o arquivo assim:

```dotenv
JWT_SECRET=CHAVE_ALEATORIA_GERADA
ADMIN_EMAIL=admin@exemplo.com
ADMIN_PASSWORD=
TRUST_PROXY=true
```

`TRUST_PROXY=true` só é seguro porque o Next escuta no loopback e o Caddy sobrescreve os cabeçalhos de IP. Em acesso direto ou desenvolvimento, use `false`.

## 2. Instalar, migrar e construir

```powershell
npm ci
npm run db:generate
npm run db:migrate
npm run build
```

Em uma instalação nova, `db:migrate` cria todas as tabelas pela migration-base `20260716160000_v1_baseline`.

### Banco existente anterior à migration-base

Esta cópia local já foi marcada como atualizada. Se outra máquina possuir um `prisma/dev.db` criado antes da migration-base:

1. Faça backup do banco e dos uploads.
2. Confirme que o schema já corresponde à versão 1.0.0.
3. Execute uma única vez:

```powershell
npx prisma migrate resolve --applied 20260716160000_v1_baseline
npm run db:migrate:status
```

Não execute `migrate resolve` em um banco vazio; use `npm run db:migrate`.

## 3. Criar ou redefinir o administrador

```powershell
$env:ADMIN_PASSWORD="SUA_SENHA_FORTE"; npm run db:seed; Remove-Item Env:ADMIN_PASSWORD
```

- Login: valor privado definido em `ADMIN_EMAIL`.
- A senha não fica armazenada em texto puro; o banco recebe um hash bcrypt com custo 12.
- Não mantenha `ADMIN_PASSWORD` preenchida em `.env.local` depois do seed.

## 4. Validar e iniciar o Next.js

```powershell
npm run lint
npx tsc --noEmit
npm run test:security
npm audit
npm run build
npm run start
```

O processo ficará disponível somente em `http://127.0.0.1:8001`.

## 5. Ativar HTTPS nas portas 80 e 443

O arquivo [deploy/Caddyfile](./deploy/Caddyfile) já contém:

- Certificado automático para o domínio raiz e `www`.
- Redirecionamento automático de HTTP para HTTPS.
- Proxy para `127.0.0.1:8001`.
- Limite externo de corpo em 23 MiB.
- `X-Real-IP` sobrescrito e `X-Forwarded-For` normalizado pelo proxy.
- Faixas oficiais IPv4 e IPv6 da Cloudflare configuradas como proxies confiáveis.
- HSTS, compressão e remoção do cabeçalho `Server`.

Valide antes de iniciar:

```powershell
caddy validate --config .\deploy\Caddyfile
caddy run --config .\deploy\Caddyfile
```

O primeiro certificado só será emitido se o DNS estiver correto e as portas 80/443 estiverem acessíveis pela internet. Para recarregar uma configuração ativa sem interromper conexões:

```powershell
caddy reload --config .\deploy\Caddyfile
```

Se o domínio definitivo ou o IP local forem diferentes, altere os endereços e a diretiva `bind` no Caddyfile antes de executar.

Como o domínio usa a Cloudflare, mantenha o modo SSL/TLS em `Full (strict)` depois que o certificado do Caddy estiver ativo. Revise as faixas confiáveis do Caddyfile caso a Cloudflare publique uma atualização em suas listas oficiais.

### Firewall do Windows

Em um PowerShell executado como administrador:

```powershell
New-NetFirewallRule -DisplayName "Ace Produtora HTTPS" -Direction Inbound -Protocol TCP -LocalPort 443 -Action Allow
New-NetFirewallRule -DisplayName "Ace Produtora HTTP Redirect" -Direction Inbound -Protocol TCP -LocalPort 80 -Action Allow
```

Não crie uma regra pública para a porta 8001 em produção.

## 6. Testar a publicação

```powershell
curl.exe -I http://aceprodutora.com.br
curl.exe -I https://aceprodutora.com.br
curl.exe -I https://www.aceprodutora.com.br
```

O primeiro comando deve redirecionar para HTTPS. Os demais devem responder pela porta 443 com certificado válido.

## Proteções ativas

- Prisma sem SQL bruto nas rotas de inscrição e administração.
- Leitura limitada do fluxo: 22 MiB para inscrições e 4 KiB para login, inclusive sem `Content-Length`.
- Caddy rejeita requisições acima de 23 MiB antes de chegarem ao Node.
- Arquivos individuais limitados a 10 MiB e validados por MIME e assinatura binária.
- Comprovantes disponíveis somente para administrador autenticado.
- Caminhos de arquivo protegidos contra saída da pasta de armazenamento.
- Inscrições limitadas a três tentativas em 24 horas por e-mail e IP.
- Login limitado por e-mail e IP, com bloqueio após tentativas inválidas.
- Identificadores do rate limit armazenados apenas como SHA-256.
- Registros expirados de rate limit removidos automaticamente após sete dias.
- JWT assinado, cookie `httpOnly`, `Secure` em produção e `SameSite=Strict`.

## Backup

O conjunto persistente é formado por:

- `prisma/dev.db`
- `storage/registrations/`

Faça backup dos dois locais juntos e proteja a cópia como dado pessoal. Para uma cópia consistente, pare temporariamente o processo Node ou use a função de backup do SQLite:

```powershell
New-Item -ItemType Directory -Force backups | Out-Null
sqlite3 prisma/dev.db ".backup 'backups/ace-prod.db'"
Copy-Item storage/registrations backups/registrations -Recurse -Force
```

Teste periodicamente a restauração em outra pasta. Nunca force a inclusão de `prisma/dev.db`, `.env.local` ou `storage/registrations/` no Git.

## Atualização da aplicação

```powershell
git pull
npm ci
npm run db:generate
npm run db:migrate
npm run build
```

Depois, reinicie apenas o serviço Node. O Caddy pode permanecer ativo e continuará atendendo HTTPS; durante a reinicialização curta ele poderá responder `502` até o Next voltar.
