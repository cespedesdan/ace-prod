# Exceção temporária da auditoria de dependências

Autorizada em **03/10/2026**, com expiração automática em **02/11/2026 às 00:00 UTC**.

## Escopo e motivo

O aviso [GHSA-vfj7-8cjw-p6xm](https://github.com/advisories/GHSA-vfj7-8cjw-p6xm)
afeta `braces` até 3.0.3, sem versão corrigida publicada na data da revisão.
O pacote chega exclusivamente pelas ferramentas de lint:

`eslint-config-next → @next/eslint-plugin-next → fast-glob → micromatch → braces`.

A atualização forçada proposta pelo npm faria downgrade de `eslint-config-next`
para 14.2.35, desalinhando-o do Next 15.5.24. Não foi aplicada.
As dependências TypeScript do lint foram atualizadas dentro dos intervalos existentes,
e `brace-expansion` foi corrigido. Os cinco alertas restantes correspondem a esse
único aviso e seus quatro dependentes; **a vulnerabilidade não foi corrigida**.

## Proteções mantidas

`npm run audit:security` executa a auditoria completa e bloqueia qualquer alerta alto
ou crítico, exceto a cadeia exata acima, somente quando cada pacote está marcado
como `dev: true` no arquivo de versões. Outro aviso, pacote ausente, classificação
crítica, presença em produção, falha da auditoria ou exceção expirada bloqueia o CI.
Alertas moderados e baixos continuam visíveis, mantendo o limiar anterior de bloqueio.

A exceção não aceita padrões de glob recebidos de usuários: o lint utiliza apenas
código/configuração do repositório. Revisar alterações de configuração e não executar
lint sobre entradas externas não confiáveis. Isso limita a exposição, mas não elimina
o risco de negação de serviço no ambiente de desenvolvimento/CI.

## Validação e remoção

```sh
npm run test:audit
npm run audit:security
npm audit --omit=dev --audit-level=high
```

`npm audit --audit-level=high` continuará reportando a vulnerabilidade original.
Não usar `--force` ou `|| true` para ocultá-la. Antes do vencimento, verificar uma
correção oficial, atualizar as dependências e remover a exceção e este documento;
qualquer prorrogação exige nova aprovação explícita. Não há renovação automática.
