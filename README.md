# Ace Produtora 1.0.0

Site oficial da Ace Produtora e da Copa ACE 10, desenvolvido com Next.js 15, React 19, TypeScript, Tailwind CSS, Prisma e SQLite.

## Funcionalidades

- Home, agenda, notícias e Hall da Fama das edições anteriores.
- Página oficial da Copa ACE 10 com 16 vagas e equipes confirmadas.
- Inscrição de equipes com PIX, logo e comprovante de pagamento privado.
- Painel administrativo para notícias e aprovação de inscrições.
- Publicação automática das equipes aprovadas na página da Copa ACE 10.
- Autenticação administrativa com bcrypt e JWT em cookie `httpOnly`.
- Rate limit persistente por e-mail e, atrás do proxy confiável, também por IP.
- Validação de campos, arquivos, assinaturas binárias e caminhos de armazenamento.

## Rotas

| Rota | Finalidade |
| --- | --- |
| `/` | Home e prévia da classificação |
| `/copa-ace-10` | Página oficial da Copa ACE 10 |
| `/inscreva-se` | Formulário de inscrição |
| `/schedule` | Agenda da primeira rodada |
| `/news` | Notícias publicadas |
| `/hall-of-fame` | Histórico dos campeonatos |
| `/admin/login` | Login administrativo |
| `/admin` | Painel administrativo |
| `/admin/inscricoes` | Aprovação e rejeição de inscrições |
| `/admin/noticias` | Criação, edição e exclusão de notícias |

## Desenvolvimento local

Requisitos recomendados: Node.js 24 LTS e npm.

```powershell
npm ci
Copy-Item .env.example .env.local
npm run db:generate
npm run db:migrate
npm run dev
```

O servidor de desenvolvimento escuta em todas as interfaces na porta `8001`:

- `http://localhost:8001`
- `http://192.168.1.50:8001`, quando esse for o IP do computador.

Em desenvolvimento, `TRUST_PROXY` deve permanecer `false`.

## Primeiro administrador

O e-mail administrativo é `financeiro@aceprodutora.com.br`. Para criar o administrador ou redefinir sua senha no PowerShell:

```powershell
$env:ADMIN_PASSWORD="SUA_SENHA_FORTE"; npm run db:seed; Remove-Item Env:ADMIN_PASSWORD
```

O seed configura somente o administrador. Ele não cria times, partidas, notícias ou campeonatos fictícios.

## Dados persistentes

- Banco: `prisma/dev.db`
- Logos e comprovantes: `storage/registrations/`
- Estrutura versionada do banco: `prisma/migrations/`

O banco e os uploads são privados e estão ignorados pelo Git. Os dois precisam entrar no plano de backup.

## Scripts

| Comando | Ação |
| --- | --- |
| `npm run dev` | Desenvolvimento em `0.0.0.0:8001` |
| `npm run build` | Build otimizado de produção |
| `npm run start` | Produção interna em `127.0.0.1:8001` |
| `npm run db:generate` | Gera o Prisma Client |
| `npm run db:migrate` | Aplica migrations pendentes |
| `npm run db:migrate:status` | Verifica o estado das migrations |
| `npm run db:seed` | Cria ou atualiza somente o administrador |
| `npm run lint` | Executa ESLint |
| `npm run test:security` | Testa rate limit e consultas parametrizadas |

## Produção HTTPS

O Node não deve ficar exposto diretamente na internet nem executar TLS. Em produção:

1. Next.js escuta somente em `127.0.0.1:8001`.
2. Caddy escuta nas portas públicas 80 e 443.
3. HTTP é redirecionado automaticamente para HTTPS.
4. Caddy gerencia o certificado TLS e envia o IP validado ao Next.js.

O arquivo pronto está em `deploy/Caddyfile`. Consulte [DEPLOYMENT.md](./DEPLOYMENT.md) para instalação, DNS, migrations, firewall e backup.

## Verificação da versão

```powershell
npm run lint
npx tsc --noEmit
npm run test:security
npm audit
npm run build
```

As consultas da aplicação usam Prisma e são parametrizadas. Não introduza `$queryRawUnsafe` ou `$executeRawUnsafe`.
