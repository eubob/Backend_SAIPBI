# SAIPBI

Backend Node/Express/Sequelize.
## Execução

Configurar .env conforme .env.example, com banco já provisionado, JWT_SECRET e PORT. Executar `npm ci` se as dependências ainda não estiverem instaladas e `npm run dev` para iniciar. O ambiente inspecionado usa porta 8080; o prefixo principal é `/api/v1`. O alias legado permanece disponível.

Migrations: `npm run db:migrate` somente quando houver migrations pendentes no ambiente pretendido, após backup. A migration `20261124120000-regras-estoque-herdadas` torna `produto.estoque_minimo` opcional (valores existentes preservados), acrescenta máximo/segurança ao produto, padrões à categoria e `multiplo_compra` ao vínculo produto × fornecedor. Seu `down` remove essas colunas e converte mínimos NULL em 0.

Seeders inserem dados de demonstração (empresa, perfis, usuários com senha `1234` e parâmetros). Usam INSERT IGNORE pela chave única: repetir não duplica nem sobrescreve valores ajustados. Não usar db:reset sobre dados a preservar.

## Dados de desenvolvimento

`npm run db:seed:dev` gera dados **sintéticos** para uma empresa existente (padrão: documento `00000000000191`, a empresa demo; outra via `SEED_EMPRESA_DOCUMENTO`). Cria 5 categorias, 4 fornecedores, 8 clientes, 15 produtos (SKU `DEV-…`) com fornecedores e 24 meses de histórico: saldo inicial, compras (recebidas, em trânsito e canceladas), recebimentos, vendas com sazonalidade (verão, inverno e Natal), cancelamentos com estorno e ajustes de perda. O razão fecha com `produto.estoque_atual`.

- Fica em `seeders/dev/` e **não** roda com `npm run db:seed`.
- Bloqueado com `NODE_ENV=production`; é determinístico e idempotente (não insere de novo se já houver SKUs `DEV-`).
- `npm run db:seed:dev:undo` remove somente o que ele criou (SKUs `DEV-` e registros marcados com `[DEV]`).
- Não misturar com histórico real de produção: os dados servem para desenvolver telas e testar métodos, não para comprovar previsões.

## APIs de leitura (estoque e vendas)

Somente leitura, para todos os perfis autenticados: `GET /estoque/resumo`, `/estoque/posicao`, `/estoque/movimentacoes` (filtros combináveis `direcao` ENTRADA/SAIDA, `tipo`, `produto_id`, `inicio`, `fim`, `busca`; paginação `pagina`/`por_pagina`), `GET /vendas` (`status`, `inicio`, `fim`, `limite`) e `/vendas/indicadores`. Quantidades de unidades diferentes não são somadas; valores de estoque são gerenciais (saldo × custo de referência).

## Regras de estoque (herança)

Mínimo, máximo e segurança seguem produto → categoria → empresa: NULL herda do nível acima e zero é explícito. A empresa define `ESTOQUE.ESTOQUE_MINIMO_PADRAO` e `ESTOQUE.ESTOQUE_SEGURANCA_PADRAO`; não há máximo de empresa (sem máximo no produto/categoria = sem limite). As respostas de produto incluem `regras_estoque` com valor efetivo e origem. Alterações de produto, categoria ou parâmetro que deixariam algum produto com máximo efetivo menor que o mínimo ou a segurança são recusadas (400/409) e nada é gravado.

## IA (OpenRouter)

`OPENROUTER_API_KEY` fica apenas no servidor; `OPENROUTER_MODEL` escolhe o modelo. Sem chave, a rota responde 503 tipado e o restante do sistema continua disponível. `IA_MODO_DEMO=true` só vale com `NODE_ENV=development` e marca os dados como sintéticos.

## Verificação

- `npm run lint`: verificação de sintaxe JavaScript.
- `npm run test:unit`: contratos HTTP das duas tarefas do ciclo, usando doubles de ORM e sem escrita no banco.
- `node scripts/verify-api-readonly.js`: requer banco local configurado e usuários ativos; verifica leituras e rejeições de escrita, sem mutações.
- `node scripts/export-schema.js`: exporta metadados locais para database.dbml e docs/evidencias/schema-real.json.

O script de integração assina JWTs localmente usando a configuração do servidor e não testa senha/login. Não usar sua evidência como substituto de E2E completo ou isolamento A/B real.

 Schema observado: [database.dbml](database.dbml). O SQL gerado em evidências serve para validar sintaxe DBML; CHECKs/defaults/colunas geradas em notas impedem tratá-lo como dump fiel para restauração.
