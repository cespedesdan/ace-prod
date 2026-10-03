# Chaveamento FACEIT em dupla eliminação

O componente `FaceitDoubleEliminationBracket` é utilizado pelos campeonatos genéricos com formato `DOUBLE_ELIMINATION`. Não modifica a página exclusiva da Copa Ace 10.

- Upper, lower e grande final aparecem no mesmo quadro conectado, com rolagem horizontal e foco de teclado.
- O tamanho da chave considera as equipes presentes no snapshot, arredondado para a potência de dois seguinte. Com oito equipes, são três rodadas upper e quatro lower.
- Os grupos FACEIT 1 e 2 identificam upper e lower, conforme validado na Ace Clutch 3.
- A ordenação usa a progressão das equipes, não o horário das partidas. Linhas contínuas indicam avanço confirmado; tracejadas indicam trajetos futuros ou descidas para a lower.
- Vagas futuras não criam partidas no banco. Exibem os vencedores conhecidos ou a origem da vaga, sem inventar placares, datas ou MD.
- A grande final é identificada pelos finalistas das rodadas finais previstas, não pela última rodada parcial disponível.
- Partidas cuja posição não pode ser determinada continuam visíveis em uma seção separada. Não são descartadas.

Limites: o snapshot da Data API não contém o seeding completo nem todas as vagas futuras. Em torneios parcialmente criados, com byes ou variações de formato, posições não confirmadas permanecem pendentes. Um reset de grande final não recebe uma posição oficial inferida; a partida é preservada para revisão.

Validação: `npm run test:tournaments`, `npx tsc --noEmit`, `npm run lint` e `npm run build`. Os testes cobrem estrutura de quatro/oito equipes, ordenação independente da entrada, avanços e final não identificada prematuramente.
