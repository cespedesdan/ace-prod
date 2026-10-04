# Auditoria visual e roteiro de melhoria

Data: 22/09/2026. Ambiente inspecionado: site público https://aceprodutora.com.br.

## Escopo e limites

Inspeção visual e do conteúdo renderizado de Home, Agenda, Notícias, Hall da Fama, Copa Ace 9, Copa Ace 10, Ace Clutch 3 e primeira etapa de inscrição. Revisão mobile de inscrição, agenda, home/menu e parte da Copa Ace 9. Conferência pontual do CSS e componentes no repositório para confirmar as observações.

Não foram realizadas inscrições, pagamentos ou alterações no painel. A etapa de pagamento, as telas administrativas e todos os estados de erro ainda precisam de revisão visual. Esta auditoria não certifica o site como pixel perfect: isso exige uma referência visual aprovada e comparação de capturas em resoluções fixas.

## Diagnóstico

A identidade noturna, os títulos esportivos e a linguagem dos cards já são reconhecíveis. O principal problema é a falta de consistência entre páginas, estados do campeonato e hierarquia das informações. Não é necessário redesenhar o site inteiro.

### P0 — informação pública contraditória

1. Copa Ace 10: o Hall da Fama apresenta campeão e vice, mas o hero da página ainda diz “10ª edição · inscrições abertas”. O status mostrado no conteúdo FACEIT é “A definir”. Sincronizar a apresentação pública com o estado administrativo, preservando o tema especial da edição.
2. Datas: o cronograma termina em 07/09, enquanto a final aparece na agenda em 21/09. O Hall também mostra 07/09/2026. Conferir a data oficial e identificar claramente cronograma previsto e partidas realizadas; não inventar ou alterar resultados para eliminar a divergência.
3. Vice-campeão: o Hall mostra “Team Patron”, enquanto a final da FACEIT mostra “PEITRON”. Validar se é a mesma equipe ou erro cadastral antes de corrigir.

### P1 — acessibilidade e organização

4. Inscrição: botão “Continuar” com texto #1c1124 sobre #bd1159 tem contraste aproximado de 2,93:1. Texto branco sobre esse mesmo rosa alcança 6,20:1. Os placeholders #8a6675 sobre #12040a chegam a 4,05:1. Corrigir texto de ação, placeholders, ajuda e foco de teclado.
5. Campos: as bordas rosa translúcidas se confundem com o fundo; reforçar a separação entre campo, painel e página. Os inputs renderizam fonte de 14 px; adotar 16 px no mobile e revisar labels/ajudas sem transformar toda a interface em caixa alta.
6. Agenda: a ordenação atual usa número da rodada antes da data, intercalando playoffs da rodada 1 entre rodadas do suíço. Separar campeonato, estágio e rodada; resultados recentes primeiro; jogos futuros em ordem cronológica. Renomear o cabeçalho “Agenda das cinco rodadas” quando também houver playoffs.
7. Agenda mobile: cronograma e duas seções vazias ocupam várias telas antes dos resultados. Destacar conteúdo disponível e compactar os estados vazios. Manter Hoje, Próximas e Finalizadas como filtros explícitos.

### P2 — consistência visual e acabamento

8. Ace Clutch 3: o formulário e os botões usam rosa, mas títulos auxiliares, premiação e links da página do campeonato continuam em ciano. Usar rosa como acento da edição; manter ciano nas páginas institucionais.
9. Navbar: campeonato e inscrição aparecem como dois botões rosa de destaque equivalente. Reservar o preenchimento forte para “Inscreva-se”; diferenciar o link do campeonato com contorno ou acento discreto. Estado ativo da navegação deve ser independente da chamada comercial.
10. Home: o símbolo ACE ocupa um grande quadro decorativo. Reduzir seu peso visual ou usar um asset real da edição; aproximar do topo nome, datas, taxa e inscrição. Preservar a presença institucional da produtora.
11. Campeonato novo: “Nenhum estágio FACEIT vinculado” expõe uma configuração administrativa. Exibir “Confrontos serão divulgados em breve” ou omitir a seção até haver partidas. Evitar vários grandes cards sem conteúdo.
12. Hall da Fama: datas numéricas e por extenso convivem na mesma lista; logos têm pesos visuais diferentes dentro dos quadrados. Padronizar datas e tamanho óptico das imagens, preservando proporções. Distinguir edições abertas do arquivo de campeões. Não preencher datas históricas sem fonte.
13. Notícias: uma única notícia gera uma grande área vazia. Melhorar resumo, hierarquia editorial e capa quando houver imagem adequada; limitar a largura de leitura do artigo expandido. Não criar notícias fictícias para preencher a página.
14. Mobile: compactar o bloco “Antes de começar” para aproximar o formulário, manter espaços laterais consistentes e dar largura adequada às ações. Revisar tabelas e brackets em contêineres com rolagem própria e indicação de navegação.
15. Estrutura acessível: há landmarks main aninhados em páginas como inscrição e campeonatos. Manter um único main; usar section/article nas subdivisões.

## Direção visual proposta

- Base: preservar o tema noturno ACE, com três níveis claros de superfície: página, painel e campo/card interno.
- Identidade institucional: ciano já existente no projeto.
- Ace Clutch: #bd1159 como acento; rosa claro para texto sobre fundo escuro; branco em botões preenchidos.
- Copa Ace 10: preservar dourado e identidade comemorativa, restritos ao seu escopo.
- Estados: sucesso, erro, ao vivo e encerrado devem ter texto/ícone além de cor.
- Tipografia: manter as fontes existentes; fonte display nos títulos, fonte de leitura em conteúdo e controles. Usar números tabulares em placares e tabelas.
- Espaçamento: escala de 4/8 px, containers e margens laterais compartilhados; evitar valores avulsos por página sem necessidade.
- Botões: primário, secundário e discreto, com alturas e alinhamento de ícones consistentes. Meta de área de toque de 44 px para as ações principais.
- Logos: contêiner quadrado, object-fit contain e padding óptico por proporção; fundo claro apenas quando necessário para a leitura da marca.

## Roteiro de implementação

### Etapa 1 — coerência do conteúdo

Corrigir a apresentação do estado da Copa Ace 10 e revisar datas/vice com os dados oficiais. Separar estágio e ordem cronológica na agenda. Trocar mensagens técnicas públicas por mensagens adequadas ao visitante.

Aceite: home, Hall, página do campeonato e agenda não apresentam estados conflitantes; nenhuma partida é reordenada apenas porque outro estágio reutiliza o número da rodada.

### Etapa 2 — base visual compartilhada

Reutilizar variáveis de cor e componentes existentes para botões, campos, cards, badges e cabeçalhos. Corrigir contraste e reduzir conflitos entre regras globais e temas de edição. Preservar os componentes genéricos dos formatos de torneio.

Aceite: texto comum com contraste >= 4,5:1; controles/foco distinguíveis; mesma ação com mesma aparência em páginas equivalentes; dourado da Copa 10 não invade Agenda ou Hall.

### Etapa 3 — home, campeonato e inscrição

Reequilibrar hero, CTA e card do campeonato na home. Aplicar o tema Ace Clutch à página correspondente. Melhorar estados vazios. Compactar início da inscrição e revisar os dois passos, upload, PIX, confirmação, carregamento e falhas de FACEIT em desenvolvimento.

Aceite: identificação clara de edição, período, valor e ação; primeira etapa legível no celular; nenhuma inscrição real gerada pelo teste.

### Etapa 4 — agenda, arquivo e notícias

Polir densidade dos resultados e filtros por estágio. Padronizar datas/logos do Hall. Preservar três colunas dos playoffs no desktop, com navegação horizontal controlada no mobile. Melhorar apresentação editorial das notícias.

Aceite: informação principal aparece antes de blocos vazios; nomes longos e placares não se sobrepõem; nenhuma rolagem horizontal involuntária da página.

### Etapa 5 — revisão pixel perfect

Estabelecer capturas de referência aprovadas e comparar em 360, 390, 768, 1280 e 1440 px. Validar Chrome/Edge e um navegador mobile real quando disponível. Revisar teclado, foco, zoom a 200%, imagens lentas, estados vazios, erros e loading. Executar checks/build existentes e verificar rotas históricas em servidor de produção de desenvolvimento.

Aceite: revisão visual documentada, sem cortes/sobreposições; contraste aprovado; links e controles funcionais; diferenças intencionais registradas. Abrir PR em branch feat/ ou fix/, sem publicar na AWS automaticamente nesta fase de revisão.

## Prompt para orientar a execução

Atue como designer de produto e desenvolvedor frontend sênior no projeto ACE Produtora. Use esta auditoria como ponto de partida e valide o estado atual antes de editar. Faça o polimento visual em desenvolvimento, preservando os dados, a integração FACEIT e os componentes genéricos dos formatos de campeonato.

Mantenha tema noturno e tipografia da marca. Use a identidade institucional nas páginas gerais, rosa #bd1159 na Ace Clutch e dourado apenas no escopo da Copa Ace 10. Reutilize os tokens e componentes existentes, sem criar um componente por edição ou adicionar bibliotecas desnecessárias.

Execute o roteiro por etapas: primeiro estados/datas e organização da agenda; depois contraste, botões, campos e superfícies; em seguida home, campeonato e inscrição; por fim Hall, notícias e revisão responsiva. Confirme divergências factuais antes de alterar datas, vencedores ou premiações.

Na inscrição, corrija o contraste do botão Continuar e dos placeholders, use texto de input legível no mobile e revise também pagamento, uploads, PIX, loading, sucesso e erro. Nas páginas públicas, substitua mensagens técnicas de integração por estados úteis ao visitante. Na agenda, separe suíço e playoffs e ordene partidas pela data adequada ao filtro.

Antes de afirmar que está pixel perfect, compare capturas em 360, 390, 768, 1280 e 1440 px com uma referência visual aprovada. Valide contraste, teclado, foco, overflow, proporção das logos e alinhamento de textos/placares. Apresente antes/depois, arquivos alterados, verificações realizadas e pendências. Use branch feat/ ou fix/; não use codex/ nem adicione coautoria. Não faça deploy ou envie inscrição real durante a revisão.

## Referências de acessibilidade

- Contraste de texto: https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html
- Contraste de controles: https://www.w3.org/WAI/WCAG22/Understanding/non-text-contrast.html

Os valores de contraste acima foram calculados a partir das cores computadas do formulário publicado; não representam uma auditoria automatizada completa de conformidade.
