# Auditoria pública e de arquitetura — ACE Produtora

Data: 03/10/2026. Site inspecionado: https://aceprodutora.com.br.

Escopo: páginas públicas encontradas no sitemap e na navegação; revisão do código de apresentação, campeonatos, inscrições, FACEIT, segurança e testes. Comparação com a auditoria visual de 22/09/2026.

Nenhuma alteração em produção, inscrição real, autenticação administrativa, sincronização FACEIT ou deploy foi realizada. Este documento é o início do roteiro de melhorias, não uma certificação de ausência de falhas. O código revisado está na branch de desenvolvimento `fix/faceit-bracket-layout`; o SHA efetivamente implantado não foi consultado na AWS.

## 1. Conclusão

A base é aproveitável e não justifica uma reescrita. Existem componentes genéricos de partidas e formatos, integração FACEIT no servidor, limites de requisição e controles de upload. Os maiores riscos são vínculos de dados baseados no nome do campeonato e regras de apresentação que não usam a mesma fonte de verdade.

Problemas prioritários:

1. Erro de hidratação React em todas as páginas testadas, associado à ofuscação de e-mail pelo Cloudflare.
2. Inscrição enviada para o campeonato aberto no momento do envio, sem validar o campeonato exibido originalmente.
3. Renomear um campeonato altera o nome nas inscrições, mas não as chaves de unicidade correspondentes.
4. Snapshot de encerramento gravado, mas não utilizado pela página pública; sincronização manual pode modificar dados de torneios encerrados.
5. CSS da inscrição altera o botão da Copa Ace 10 depois de navegação entre páginas.

Não houve erro HTTP nas páginas encontradas, imagens carregadas quebradas nem overflow horizontal do documento nos tamanhos examinados. Rolagem interna de tabelas e brackets é outra questão: deve continuar utilizável por teclado e não ser resolvida reduzindo indiscriminadamente todo o texto.

## 2. Cobertura e método

Foram examinadas 18 rotas distintas, 42 visitas principais incluindo variações de agenda e normalização da URL da home. Todas responderam HTTP 200.

| Página | Desktop e mobile | Observação principal |
| --- | --- | --- |
| `/` | 1440 e 390 px | Campeonato em disputa ainda descrito como próximo |
| `/campeonatos/ace-clutch-3` | 1440 e 390 px | Bracket presente; destaque incorreto do Hall na navegação |
| `/copa-ace-10` | 1440 e 390 px | Divergência entre cronograma, status e partidas |
| `/inscreva-se` | 1440 e 390 px | Contraste de etapa e risco de vínculo no envio |
| `/schedule` | 1440 e 390 px | Filtros funcionam; ordenação de datas ausentes inadequada |
| `/news` | 1440 e 390 px | Notícia sem resumo visível, conteúdo a confirmar |
| `/hall-of-fame` | 1440 e 390 px | Datas/resultados precisam de fonte única |
| `/hall-of-fame/copa-ace-1` | 1440 e 390 px | Página-resumo ainda incompleta |
| `/hall-of-fame/copa-ace-2` | 1440 e 390 px | Página-resumo ainda incompleta |
| `/hall-of-fame/copa-ace-3` | 1440 e 390 px | Página-resumo ainda incompleta |
| `/hall-of-fame/copa-ace-4` | 1440 e 390 px | Página-resumo ainda incompleta |
| `/hall-of-fame/copa-ace-5` | 1440 e 390 px | Página-resumo ainda incompleta |
| `/hall-of-fame/copa-ace-6` | 1440 e 390 px | Página-resumo ainda incompleta |
| `/hall-of-fame/copa-ace-7` | 1440 e 390 px | Contraste dos títulos de chaves |
| `/hall-of-fame/copa-ace-8` | 1440 e 390 px | Tabelas roláveis sem foco de teclado |
| `/hall-of-fame/ace-clutch` | 1440 e 390 px | Componente genérico funcionando |
| `/hall-of-fame/ace-clutch-2` | 1440 e 390 px | Upper/lower/final presentes |
| `/hall-of-fame/copa-ace-9` | 1440 e 390 px | Tabelas roláveis sem foco de teclado |

Também foram visitadas `/schedule?campeonato=ace-clutch-3` e `/schedule?campeonato=copa-ace-10`. Os breakpoints 360, 720, 768 e 1280 px foram verificados adicionalmente na home, Ace Clutch 3, inscrição, agenda e Copa Ace 9. A largura de 720 px verifica reflow equivalente a reduzir à metade uma janela de 1440 px; não substitui um teste completo de zoom em navegadores diferentes.

Ferramentas: Chrome headless, inspeção DOM/console/rede, capturas, axe e Lighthouse. Menus mobile, foco inicial por teclado, filtros da agenda e expansão da notícia foram exercitados. Não foram testados Safari, dispositivos físicos, leitores de tela ou todos os fluxos privados do administrador.

Evidências de desenvolvimento, não versionadas, em `D:\Desktop\ace-prod\.performance-reports\auditoria-publica-2026-10-03`:

- `report.json`: rotas, HTTP, console, acessibilidade, imagens, recursos e dimensões.
- `probes.json`: comparação da hidratação, breakpoints, teclado e filtros.
- `navigation.json`: acesso não autenticado e vazamento de CSS entre páginas.
- `performance-summary.json` e `*-lighthouse.json`: medições de desempenho.
- `*-1440.png`, `*-390.png`, `*-viewport.png` e `*-section.png`: capturas de referência.

Limitação das capturas longas: elementos com `content-visibility: auto` podem aparecer vazios fora do viewport no screenshot, mesmo estando presentes no DOM. Não foram classificados como defeito apenas por essa captura. Capturas de seção e inspeção direta foram utilizadas para não confundir otimização de renderização com conteúdo ausente.

## 3. Confiabilidade e arquitetura — prioridade alta

### A01 — Hidratação quebrada pelo HTML modificado na borda

**Evidência pública:** React #418 nas 42 visitas principais. O HTML recebido contém `data-cfemail` e o script de decodificação do Cloudflare. Em um teste controlado no navegador de auditoria, restaurar somente o texto/link de e-mail antes da execução do React eliminou o erro da home. Nenhuma configuração real do Cloudflare foi alterada.

**Efeito:** React reconstrói a árvore incompatível, causando trabalho desnecessário e risco de comportamento inconsistente. Não foi demonstrado que esse erro sozinho explica toda a latência.

**Correção proposta:** compatibilizar ou excluir esse trecho da ofuscação de e-mail. Alteração no Cloudflare precisa de autorização própria; não usar `suppressHydrationWarning` para apenas esconder o problema.

Referências: [React #418](https://react.dev/errors/418) e [ofuscação de e-mail do Cloudflare](https://developers.cloudflare.com/waf/tools/scrape-shield/email-address-obfuscation/).

### A02 — Inscrição sem identidade estável do campeonato

**Código:** [RegistrationForm.tsx](D:/Desktop/ace-prod/src/components/RegistrationForm.tsx), [página de inscrição](D:/Desktop/ace-prod/src/app/inscreva-se/page.tsx) e [endpoint de inscrições](D:/Desktop/ace-prod/src/app/api/registrations/route.ts:87).

O formulário recebe nome, logo, limite e datas, mas não envia o ID do torneio exibido. O endpoint consulta novamente `getOpenRegistrationTournament()` ao receber o envio.

**Cenário de falha:** visitante abre formulário de A; administração abre B; visitante envia o formulário antigo; a inscrição pode ser registrada em B. É um risco confirmado pela análise do fluxo, não um incidente reproduzido com inscrição real.

**Correção mínima:** enviar `tournamentId` e validar no servidor publicação, abertura e identidade. Se o torneio tiver mudado, retornar conflito com orientação útil e preservar os campos preenchidos. O valor/PIX manual da edição continua permitido, conforme a decisão do projeto.

### A03 — Renomear campeonato enfraquece a prevenção de duplicatas

**Código:** [registration-claim.ts](D:/Desktop/ace-prod/src/lib/registration-claim.ts:13) e [atualização do campeonato](D:/Desktop/ace-prod/src/app/api/admin/tournaments/route.ts:163).

`Registration.tournament` e `FaceitChampionship.tournament` são strings, não relações com `Tournament.id`. `claimKey` e `teamNameClaimKey` incluem o nome normalizado. Ao renomear, o endpoint atualiza as strings de torneio, mas não essas chaves. Um envio posterior calcula uma chave diferente, podendo permitir a equipe duplicada.

**Correção imediata:** manter as chaves consistentes na mesma transação e testar renomeação com inscrições existentes. **Evolução recomendada:** relacionar inscrições e vínculos FACEIT por ID estável, com migração incremental e backup; nomes devem ser apresentação, não identidade.

### A04 — Encerramento não congela efetivamente o histórico

**Código:** `Tournament.finalSnapshotJson` em [schema.prisma](D:/Desktop/ace-prod/prisma/schema.prisma:55), ação de encerramento em [tournaments/route.ts](D:/Desktop/ace-prod/src/app/api/admin/tournaments/route.ts:120), leitor em [campeonatos/[slug]/page.tsx](D:/Desktop/ace-prod/src/app/campeonatos/[slug]/page.tsx:47).

O snapshot final é gravado, mas o leitor público continua consultando inscrições e campeonatos FACEIT atuais. A atualização do campeonato encerrado é bloqueada no cadastro, e a sincronização automática é desabilitada; porém o endpoint de sincronização manual não valida o estado do campeonato antes de escrever.

**Correção proposta:** definir uma política única: campeonato finalizado exibe snapshot e rejeita alterações de integração, salvo reabertura explícita. Testar fechar, sincronizar manualmente, desvincular e reabrir. Não apagar snapshots existentes.

### A05 — Vazamento de tema entre inscrição e Copa Ace 10

**Evidência pública:** a borda de `.copa10-button-secondary` é `rgba(217,154,40,.62)` ao abrir a Copa Ace 10 diretamente. Após navegar por Inscreva-se → Hall → Copa Ace 10 sem reload, passa para `rgba(189,17,89,.62)`.

**Origem:** [registration-theme.css](D:/Desktop/ace-prod/src/app/inscreva-se/registration-theme.css:50) declara seletores `copa10-*` globalmente; [copa-theme.css](D:/Desktop/ace-prod/src/app/copa-ace-10/copa-theme.css:136) usa os mesmos seletores. CSS de rotas pode continuar carregado na navegação.

**Correção mínima:** delimitar todos os seletores pela raiz de sua página; a médio prazo, renomear as classes compartilhadas para nomes sem edição e usar variáveis de tema. Ace Clutch permanece rosa `#bd1159`; dourado permanece exclusivo da Copa Ace 10. Testar ordem de navegação nos dois sentidos, não apenas reload.

## 4. Arquitetura — evolução sem reescrita

### A06 — O seletor genérico de formatos ainda está incompleto

As páginas históricas possuem modelos compartilhados em [TournamentFormatPage.tsx](D:/Desktop/ace-prod/src/components/TournamentFormatPage.tsx). A página dinâmica usa `FaceitDoubleEliminationBracket` para dupla eliminação e `BracketLane` para todos os outros casos. Assim, um futuro suíço ou grupos round robin não recebe automaticamente a visualização adequada ao formato.

**Proposta:** normalizar a leitura de arquivos históricos e snapshots FACEIT para os contratos já existentes; selecionar o renderer por formato. Reaproveitar os modelos, sem criar um componente por campeonato. Preservar a rota e a identidade especial da Copa Ace 10.

Aceite: exemplos isolados para suíço + playoffs, round robin + playoffs, grupos double elimination + playoffs, single e double elimination. Chave superior, inferior, final e partidas ainda desconhecidas devem continuar distinguíveis. A ausência de confrontos oficiais não autoriza inventar resultados.

### A07 — Invalidação de dados dependente de edição

`revalidateTournament()` em [faceit-championship/route.ts](D:/Desktop/ace-prod/src/app/api/admin/faceit-championship/route.ts:80) só invalida páginas para o nome `Copa Ace 10`. O worker automático grava snapshots sem uma política equivalente de invalidação das páginas.

Não foi comprovado cache desatualizado na produção nesta inspeção; algumas páginas já são dinâmicas. Ainda assim, a regra é inconsistente. Centralizar caminhos por ID/slug e documentar a política de leitura/cache após sincronizar e desvincular. Validar em build de produção, não somente no servidor de desenvolvimento.

### A08 — Estilos e estado de UI com acoplamento excessivo

`globals.css` redefine classes utilitárias como `bg-white` e `text-slate-*` dentro de certos painéis. Temas também remapeiam cores ciano para rosa, com valores literais e `!important`. Isso dificulta prever a cor real de um componente lendo seu JSX.

Os filtros em `ScheduleFilters.tsx` alteram visibilidade e contadores diretamente no DOM. Funcionam hoje, mas IDs/seletor global tornam reutilização e evolução mais frágeis.

**Proposta incremental:** usar os tokens existentes em classes semânticas de painel, texto, borda e botão; extrair apenas onde houver duplicação real. Para a agenda, manter funções puras de agrupamento e ter um único proprietário React do estado dos filtros. Não adicionar biblioteca de estado, novo framework ou sistema de design externo.

## 5. Design, conteúdo e acessibilidade

### D01 — Navegação destaca a página errada

Na Ace Clutch 3, o atributo `aria-current` aponta corretamente para o torneio, mas o Hall recebe o fundo de link ativo. [globals.css](D:/Desktop/ace-prod/src/app/globals.css:445) associa qualquer `.tournament-page` que não seja agenda/Copa 10 ao Hall; a inscrição também entra nesse seletor.

Usar o estado real da navegação em vez de inferir a página pela presença de uma classe no body. Aceite: um único destino ativo visualmente por menu, consistente com `aria-current`.

### D02 — Destaque do campeonato depende de inscrições abertas

Navbar e home consultam `getOpenRegistrationTournament()`. Quando as inscrições são fechadas, o campeonato em andamento pode deixar de ser destaque, com fallback para Copa Ace 10.

Separar campeonato destacado de campeonato com inscrições abertas. Inscreva-se só aparece quando permitido; campeonato em progresso continua acessível. Não é necessário reintroduzir uma faixa de status acima do hero, que já foi recusada pelo usuário.

### D03 — Contraste e estrutura semântica

Achados do axe confirmados por inspeção:

- Copyright do rodapé com contraste aproximado de 4,44:1; ajustar o token para margem segura acima de 4,5:1.
- Etapa “Pagamento” da inscrição com aproximadamente 3,85:1; é texto informativo, não controle desabilitado isento de contraste.
- Copa Ace 7: títulos pequenos “Chave superior” e “Chave inferior” com aproximadamente 3,48:1 e 3,09:1.
- `layout.tsx` fornece `<main>`, mas várias páginas/componentes retornam outro `<main>` aninhado. Manter um único landmark principal e usar seções nas páginas.
- Hall e Copa Ace 10 apresentam saltos na hierarquia de headings.
- Tabelas roláveis dos grupos da Copa Ace 8 e 9 não recebem foco por teclado. Adicionar foco, nome acessível e indicação de rolagem à região quando necessário.
- Falta link de pular para o conteúdo principal.

O menu mobile tem foco ciano visível e alvo de 24×24 px; não foi classificado como falha por ausência de foco. Aumentar a área clicável para aproximadamente 44×44 px é uma melhoria de uso, mantendo o ícone do mesmo tamanho.

Critério de contraste: [WCAG — contraste mínimo](https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html). Não clarear indiscriminadamente todo o tema; ajustar textos secundários e separar superfícies de forma consistente.

### D04 — Agenda funciona, mas ordena mal datas ausentes

[ScheduleList.tsx](D:/Desktop/ace-prod/src/components/ScheduleList.tsx:61) usa `MAX_SAFE_INTEGER` para datas ausentes tanto na ordem crescente quanto na decrescente. Em finalizadas, jogos sem horário ficam acima dos resultados recentes. A produção mostra TEKU × All4Kill sem horário antes dos demais resultados da Ace Clutch 3; a agenda da Copa 10 coloca duas canceladas sem data antes da final.

Ordenar datas ausentes sempre ao final. Separar semanticamente canceladas de resultados disputados, sem excluir registros oficiais. Em um campeonato encerrado, abrir a agenda nos resultados, evitando duas grandes seções vazias antes deles. Preservar os filtros de fase/rodada e as cinco rodadas do suíço.

Os filtros foram exercitados: Hoje = 1 partida, Próximas = 0, Finalizadas = 10, Todas = 11 no snapshot da Ace Clutch 3. Não estão quebrados.

### D05 — Hierarquia visual e legibilidade

- Manter títulos e fontes existentes; reduzir metadados em caixa alta e espaçamento de letras em telas pequenas, sobretudo no bracket.
- Usar uma ação principal por bloco: acompanhar campeonato em progresso; inscrever-se quando aberto; ver resultados quando finalizado.
- Na dupla eliminação, manter upper/lower/final separados e o componente compartilhado. Textos de origem como “Vencedor Lower - rodada…” estão truncados; oferecer nome completo acessível e detalhe no foco, não apenas hover.
- Não reduzir o zoom de toda a página para acomodar brackets. Preservar tamanho mínimo do texto e rolagem interna sinalizada em mobile; avaliar compactação de padding/gap antes de reduzir fonte.
- Nas tabelas, usar alinhamento numérico consistente e manter nome/logo identificáveis; cabeçalho e foco não devem desaparecer no fundo.
- Nas notícias, mostrar um resumo útil antes de “Ler notícia completa”. A expansão nativa funciona; a página pode ter melhor hierarquia mesmo com apenas uma publicação.
- Ajustar `scroll-margin-top` dos destinos das abas para evitar títulos ocultos pela Navbar fixa.

### D06 — Divergências factuais: confirmar antes de editar

1. Copa Ace 10: cronograma e Hall apontam término em 07/09, enquanto a final da agenda FACEIT aparece em 21/09/2026. Confirmar se o cronograma deve ser rotulado como previsto ou atualizado para realizado.
2. Hall da Copa Ace 10 mostra vice “Team Patron”; a classificação FACEIT usa “PEITRON”. Confirmar se é a mesma equipe e qual nome deve ser publicado.
3. Copa Ace 10 tem campeão no Hall, mas a área FACEIT exibe status “A definir”. Definir a tradução/fonte do estado final.
4. Ace Clutch 3 aparece como “Próximo campeonato”/“Inscrições abertas” enquanto já tem resultados em 02/10 e partida em 03/10. Confirmar se inscrições continuam intencionalmente abertas; não fechá-las automaticamente nesta auditoria.
5. A notícia “SORTEIO ROLANDO!!”, de 22/08/2026, permanece atual na listagem. Confirmar validade; não inventar término.
6. Copa Ace 1–6 têm páginas-resumo incompletas e datas não informadas. Melhorar o estado editorial sem inventar brackets ou datas.

## 6. SEO e descoberta

O sitemap responde 200, mas contém URLs estáticas e não inclui o campeonato dinâmico Ace Clutch 3. Nenhuma canonical foi encontrada nos documentos inspecionados. Vários arquivos históricos compartilham título e descrição genéricos.

Adicionar torneios publicados ao sitemap, metadados específicos e canonical de cada rota; preservar a rota especial da Copa Ace 10. Preview administrativo deve ser explicitamente `noindex`. `robots.txt` funciona; rotas administrativas devem continuar protegidas por autenticação, não apenas robots.

## 7. Segurança e testes

Pontos positivos observados no código:

- FACEIT consultada no servidor, URL validada, timeout e paginação limitados; snapshots armazenados evitam consultar a API a cada visita pública.
- Prisma nas consultas, sem ocorrência de `$queryRawUnsafe`/`$executeRawUnsafe` na busca realizada.
- Limites de corpo de requisição, validação de arquivo por conteúdo e processamento de imagens; comprovantes privados e logos públicas restritas ao fluxo correspondente.
- Login com bcrypt, cookie administrativo HttpOnly/Secure em produção, validação de token, proteção de origem e limites por e-mail/IP.
- Worker com lease e intervalos de sincronização diferenciados.
- CSP existe em modo Report-Only; não é uma política de bloqueio ativa. Evolução para enforcement exige observar relatórios e testar YouTube, imagens e fontes antes.

GET público sem autenticação em `/api/admin/verify`, `/api/admin/tournaments` e `/api/admin/registrations` retornou 401. Regulamento PDF e robots retornaram 200. Isso não é um pentest nem comprova todas as permissões privadas. A configuração real de proxy/IP, segredos, backups e permissões do servidor não foi acessada.

Validações de desenvolvimento realizadas:

- ESLint: passou, após remoção dos scripts temporários da auditoria.
- TypeScript (`tsc --noEmit`): passou.
- `test:tournaments`: passou.
- `test:audit`: passou.
- `test:headers`: passou.
- `audit:security`: gate passou com a exceção já documentada de `braces` nas ferramentas de desenvolvimento, válida até 02/11/2026. Há alertas high nessa cadeia; não interpretar o gate como zero vulnerabilidades.

Testes que criam inscrições, modificam abertura de torneios, sincronizam dados ou fazem uploads não foram executados contra o banco atual. Próxima melhoria: banco temporário/fixtures isoladas para que a suíte completa possa rodar sem tocar campeonatos reais de desenvolvimento. Não foi feita nova build nesta etapa exclusivamente documental.

## 8. Desempenho público

Uma execução Lighthouse mobile por rota, com simulação de rede/CPU. É uma fotografia, não teste de carga nem Core Web Vitals de usuários reais.

| Rota | Performance | FCP | LCP | TBT | CLS | Transferido |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| Home | 88 | 2,36 s | 3,55 s | 41 ms | 0,0006 | 204 kB |
| Agenda | 81 | 3,04 s | 3,80 s | 0 ms | 0 | 217 kB |
| Ace Clutch 3 | 86 | 3,02 s | 3,39 s | 0 ms | 0 | 265 kB |

Há espaço para melhorar a apresentação inicial; as amostras não mostram bloqueio alto de CPU nem instabilidade de layout. Primeiro corrigir hidratação e investigar elemento LCP/recursos críticos, depois repetir três execuções por rota e comparar medianas. Não concluir necessidade de aumentar RAM com base nesses resultados.

## 9. Roteiro recomendado e critérios de aceite

### Etapa 1 — Confiabilidade e isolamento de temas

Corrigir A02/A03 com testes isolados; delimitar CSS A05 e ativo da Navbar D01. Resolver A01 com abordagem compatível com Cloudflare, mediante aprovação para qualquer configuração externa.

Aceite: formulário antigo nunca entra no torneio novo; renomeação não libera duplicatas; Copa 10 continua dourada em todas as ordens de navegação; um link ativo por menu; console sem React #418 depois da correção efetiva.

### Etapa 2 — Acessibilidade e agenda

Contraste, único main, hierarquia de headings, skip link, regiões roláveis focáveis, alvos mobile, ordenação de datas e estados vazios compactos.

Aceite: zero violações dos itens corrigidos no axe; acesso completo aos filtros/tabelas por teclado; sem overflow do documento em 360/390/768/1280/1440 px; texto legível com zoom de 200%; canceladas não confundidas com jogos disputados; datas ausentes no final.

### Etapa 3 — Ciclo de vida dos campeonatos

Após aprovar a política: ID estável, snapshot final usado publicamente, bloqueio de sincronização encerrada, destaque independente das inscrições e invalidação genérica.

Aceite: fechar não remove acesso público ao torneio; snapshot permanece igual após sync recusado; reabertura explícita é auditável; regressões da Copa 10 cobertas; migração validada em cópia do banco e com rollback documentado.

### Etapa 4 — Formatos compartilhados e acabamento

Aplicar adapters aos componentes de formatos existentes; SEO dinâmico, notícia com resumo e ajustes de espaçamento/bracket. Alterar datas, nomes e estado editorial somente após confirmação de D06.

Aceite: cada formato tem exemplo de regressão; logos mantidas em proporção correta; ausência de dados tem mensagem útil; upper/lower/final continuam distintos; canonical/sitemap contêm torneios publicados e excluem previews.

Para cada etapa: capturas antes/depois no mesmo viewport e fixture, verificações de navegação direta e interna, testes, revisão de diff e aprovação antes de enviar a produção. Não juntar migração de dados com uma reescrita visual extensa.

## 10. Direção proposta

Começar pela Etapa 1 e pelos ajustes objetivos de acessibilidade. A orientação Ponytail influenciou a recomendação: corrigir a base existente, reaproveitar os componentes e evitar novas camadas ou dependências sem necessidade demonstrada.

Mudanças estruturais para aprovação prévia: migração para relações por ID, política de snapshot e formato normalizado compartilhado. Ajustes de tema, contraste, ordenação e semântica não precisam de uma nova arquitetura.

## 11. Correções implementadas em desenvolvimento

Branch: `fix/public-audit-corrections`. Sem commit, push ou deploy nesta etapa. Este registro complementa os achados originais; a produção continua dependendo da publicação das correções.

- **A01:** contato estático delimitado pelos marcadores `email_off` oficiais do Cloudflare. O HTML renderizado é verificado por teste; a eliminação efetiva do erro na borda deve ser confirmada após publicação. Nenhuma configuração externa foi alterada.
- **A02:** formulário envia ID; servidor rejeita formulário de outro campeonato antes da consulta FACEIT e revalida abertura/publicação/nome dentro da transação de gravação. Conflitos retornam mensagem útil, sem limpar os campos do formulário.
- **A03:** renomeação atualiza nome e chaves de unicidade na mesma transação; rejeitadas continuam sem reservas e datas de atualização são preservadas para não reordenar inscrições.
- **A05/D01:** temas de inscrição e Copa 10 delimitados; removidos estilos antigos de inscrição dourada; navegação ativa usa `aria-current`, não a classe de uma página no body.
- **D02:** destaque mantém campeonato em progresso após o fechamento das inscrições; CTA de inscrição continua condicionado à abertura. Título neutro “Campeonato em destaque” evita afirmar uma fase temporal incorreta.
- **D03:** único main nas páginas públicas, skip link, menu com alvo maior, hierarquia de headings, tabelas focáveis e contraste dos textos/etapas/saldos de grupos corrigidos.
- **D04:** partidas sem data ficam ao final dos resultados; seções sem jogos não ocupam o estado inicial, mas permanecem acessíveis por seus filtros. Região dos filtros localizada pelo componente, não por busca global do ID.
- **D05:** notícia longa tem resumo antes da expansão; âncoras de torneio têm margem para Navbar fixa; nomes existentes e fontes preservados.
- **A07/SEO:** sincronização manual e desvinculação invalidam rotas genéricas; sitemap inclui torneios publicados, sem duplicatas, com revalidação de 60 segundos e invalidação administrativa. Canonicals e metadados próprios adicionados; preview autenticado marcado noindex.
- **Testes:** verificações com escrita agora usam banco temporário exclusivo, criado pelas migrations. Proteções impedem executá-las diretamente no banco normal.

Regressões verificadas por `test:public-regressions`: troca A → B com formulário antigo, fechamento durante a consulta FACEIT, envio válido com API simulada, renomeação sem liberar duplicatas e sem mudar ordem, rejeitadas liberadas, destaque com inscrições fechadas e sitemap sem rascunhos. Testes existentes de segurança, sincronização e formatos também passaram no ambiente isolado.

Pendências preservadas:

1. A04: política de snapshot final e proteção uniforme de alterações após encerramento, incluindo inscrições e integração. Não foi mudado o comportamento do histórico sem definir a política completa.
2. A06: adapter único para todos os formatos nas páginas dinâmicas; modelos históricos e dupla eliminação atuais foram preservados.
3. A08: substituir gradualmente remapeamentos de utilitários por classes semânticas; filtros ainda usam o mecanismo existente de visibilidade de HTML, agora limitado ao seu painel.
4. A07: política de atualização das páginas após o worker automático externo; invalidação manual está corrigida.
5. D06: confirmar datas, vice da Copa 10, status editorial e notícia antes de alterar fatos.
6. Validar os marcadores de e-mail no Cloudflare depois do deploy e acompanhar a exceção temporária de `braces`.

Capturas e relatório de regressão visual ficam em `.performance-reports/correcoes-publicas-2026-10-03`. Referência anterior é o site publicado; a base de dados de desenvolvimento pode diferir, portanto não é uma comparação pixel a pixel de resultados ou conteúdo. Não foram enviadas inscrições ao site publicado.

### Validação final das correções

- `npm run check`: suíte completa aprovada, incluindo os testes isolados de inscrições e renomeação.
- `npm run build`: build otimizada aprovada, com 43 páginas geradas. Qualidades de imagem utilizadas no projeto explicitadas na configuração, sem trocar versões ou adicionar dependências.
- 11 rotas × 390/1440 px: zero violações detectadas pelo axe nos critérios executados (WCAG 2 A/AA, 2.1 AA e boas práticas), zero erros JavaScript, zero imagens quebradas e um único `main` por página.
- Seis rotas adicionais em 360/768/1280 px e reflow equivalente a 200% (720 CSS px em viewport físico de 1440 px): sem overflow do documento; menu mobile abre dentro da tela. Isso não substitui uma auditoria completa manual de acessibilidade.
- Navegação interna Copa 10 → inscrição → Hall → Copa 10: borda dourada preservada. Skip link recebeu foco e levou ao conteúdo por teclado.
- Agenda em desenvolvimento estava sem partidas vinculadas: o estado vazio foi inspecionado; ordenação com partidas, incluindo canceladas sem data, foi verificada por fixtures nos testes. Não se afirma validação interativa completa dos filtros com a base de produção nesta rodada.
- Capturas revisadas visualmente: Home mobile, Copa Ace 8 desktop e formulário em reflow. As demais capturas e resultados automatizados estão no diretório de evidências.
- Servidor temporário de validação encerrado ao final. Nenhuma alteração publicada em produção.
