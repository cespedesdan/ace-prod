# Ace Produtora 1.1.0

Site oficial da Ace Produtora e da Copa ACE 10, desenvolvido com Next.js 15, React 19, TypeScript, Tailwind CSS, Prisma e SQLite.

**Versão atual: 1.1.0 — Integração FACEIT com snapshots.**

O formulário consulta o time na FACEIT, preenche o nome oficial e salva um snapshot do elenco. Campeonatos vinculados mantêm snapshots de times, partidas, horários e resultados por sincronização automática, com atualização manual disponível no painel administrativo.

## Funcionalidades

- Home, agenda, notícias e Hall da Fama das edições anteriores.
- Páginas históricas orientadas a dados, com componentes reutilizáveis por formato de campeonato.
- Página oficial da Copa ACE 10 com 16 vagas e equipes confirmadas.
- Inscrição de equipes com PIX, logo e comprovante de pagamento privado.
- Consulta do time na FACEIT, preenchimento automático do nome e snapshot do elenco.
- Painel administrativo para notícias e aprovação de inscrições.
- Sincronização manual do elenco FACEIT pelo painel administrativo.
- Gerenciamento de campeonatos FACEIT com vínculos, snapshots e sincronização automática independente por edição.
- Histórico da última sincronização automática e da última falha no painel administrativo.
- Classificação suíça baseada somente em partidas finalizadas na FACEIT; partidas canceladas não alteram campanhas ou resultados.
- Publicação automática do snapshot em páginas integradas, atualmente na Copa ACE 10.
- Publicação automática das equipes aprovadas na página da Copa ACE 10.
- Carregamento público otimizado com imagens responsivas, CSS por rota, React Compiler, renderização adiada e cache com revalidação.
- Autenticação administrativa com bcrypt e JWT em cookie `httpOnly`.

## Segurança e integridade

- A API de inscrição permanece fechada por padrão e só aceita envios quando `REGISTRATIONS_OPEN=true`.
- Inscrições ativas reservam separadamente o ID FACEIT e o nome normalizado da equipe; uma rejeição libera as duas reservas para um novo envio corrigido.
- Campos públicos possuem limites no servidor. Imagens são decodificadas, limitadas a 25 milhões de pixels e reprocessadas sem metadados ou conteúdo excedente antes do armazenamento; imagens animadas são rejeitadas.
- Alterações administrativas exigem origem válida, usam sessão `__Host-` em produção e respostas privadas não podem ser armazenadas em cache.
- Login administrativo possui limites persistentes por origem, combinação de e-mail/origem e conta. Inscrições são limitadas por e-mail e, quando o proxy é confiável, também por IP.
- A Política de Segurança de Conteúdo opera em modo de relatório. O coletor aceita somente relatórios CSP limitados, higienizados e enviados pela mesma origem.

## Funcionalidades em avaliação

Estas propostas estão em pull requests e ainda não fazem parte da versão atual:

- [#19 — sincronização acionada por webhook da FACEIT](https://github.com/cespedesdan/ace-prod/pull/19): rascunho que mantém a reconciliação agendada como segurança; aguarda validação com um evento real da FACEIT e correção da auditoria Lighthouse.
- [#11 — confirmação do líder do time pela FACEIT](https://github.com/cespedesdan/ace-prod/pull/11): fluxo OAuth que ainda precisa ser atualizado contra a `main`, ter os conflitos resolvidos e ser integrado à interface antes da reabertura das inscrições.

Não configure webhooks ou credenciais OAuth em produção antes de essas propostas serem aprovadas e integradas.

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
| `/admin/faceit` | Vínculo, sincronização e desvinculação de campeonatos FACEIT |
| `/admin/noticias` | Criação, edição e exclusão de notícias |
| `/api/security/csp-report` | Coletor interno de relatórios da política de segurança |

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

Em desenvolvimento, `TRUST_PROXY` deve permanecer `false`.

Defina `FACEIT_API_KEY` no `.env.local` para habilitar a consulta de times. A chave é usada somente pelo servidor: não use prefixo `NEXT_PUBLIC_` e nunca a envie ao Git.

Mantenha `REGISTRATIONS_OPEN=false` fora da janela de inscrições. Alterar somente a interface não abre nem fecha a API; reinicie o servidor depois de mudar esse valor.

## Primeiro administrador

Defina `ADMIN_EMAIL` no `.env.local`. Para criar o administrador ou redefinir sua senha no PowerShell:

```powershell
$env:ADMIN_EMAIL="admin@exemplo.com"; $env:ADMIN_PASSWORD="SUA_SENHA_FORTE"; npm run db:seed; Remove-Item Env:ADMIN_EMAIL, ADMIN_PASSWORD
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
| `npm run analyze` | Gera o build com análise dos pacotes |
| `npm run start` | Produção interna em `127.0.0.1:8001` |
| `npm run perf:seed` | Prepara dados determinísticos quando `PERFORMANCE_FIXTURES=true` |
| `npm run perf:audit` | Mede as rotas públicas com Lighthouse |
| `npm run db:generate` | Gera o Prisma Client |
| `npm run db:migrate` | Aplica migrations pendentes |
| `npm run db:migrate:status` | Verifica o estado das migrations |
| `npm run db:seed` | Cria ou atualiza somente o administrador |
| `npm run lint` | Executa ESLint |
| `npm run check` | Executa lint, TypeScript e todos os testes locais |
| `npm run test:security` | Testa rate limit e consultas parametrizadas |
| `npm run test:faceit-sync` | Testa sincronização manual/automática, falhas e agendamento FACEIT |
| `npm run test:tournaments` | Verifica formatos e regras MD1/MD3 das páginas históricas |
| `npm run sync:faceit` | Sincroniza campeonatos FACEIT cuja atualização está pendente |

## Produção HTTPS

O Node não deve ficar exposto diretamente na internet nem executar TLS. Em produção:

1. Next.js escuta somente em `127.0.0.1:8001`.
2. Caddy escuta nas portas públicas 80 e 443.
3. HTTP é redirecionado automaticamente para HTTPS.
4. Caddy gerencia o certificado TLS e envia o IP validado ao Next.js.

O arquivo pronto está em `deploy/Caddyfile`. Consulte [DEPLOYMENT.md](./DEPLOYMENT.md) para instalação, DNS, migrations, firewall e backup.

O repositório também inclui CI e deploy automático pela GitHub Actions, com backup de banco e uploads, rollback e teste de saúde. A configuração dos segredos está no mesmo guia de publicação.

## Verificação da versão

```powershell
npm run check
npm audit
npm run build
```

As consultas da aplicação usam Prisma e são parametrizadas. Não introduza `$queryRawUnsafe` ou `$executeRawUnsafe`.
