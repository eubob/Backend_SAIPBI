# SAIPBI

Backend Node/Express/Sequelize.
## Execução

Configurar .env conforme .env.example, com banco já provisionado, JWT_SECRET e PORT. Executar `npm ci` se as dependências ainda não estiverem instaladas e `npm run dev` para iniciar. O ambiente inspecionado usa porta 8080; o prefixo principal é `/api/v1`. O alias legado permanece disponível.

Migrations: `npm run db:migrate` somente quando houver migrations pendentes no ambiente pretendido. Os seeders atuais inserem dados de demonstração e não devem ser repetidos indiscriminadamente. Não usar db:reset sobre dados a preservar.

## Verificação

- `npm run lint`: verificação de sintaxe JavaScript.
- `npm run test:unit`: contratos HTTP das duas tarefas do ciclo, usando doubles de ORM e sem escrita no banco.
- `node scripts/verify-api-readonly.js`: requer banco local configurado e usuários ativos; verifica leituras e rejeições de escrita, sem mutações.
- `node scripts/export-schema.js`: exporta metadados locais para database.dbml e docs/evidencias/schema-real.json.

O script de integração assina JWTs localmente usando a configuração do servidor e não testa senha/login. Não usar sua evidência como substituto de E2E completo ou isolamento A/B real.

 Schema observado: [database.dbml](database.dbml). O SQL gerado em evidências serve para validar sintaxe DBML; CHECKs/defaults/colunas geradas em notas impedem tratá-lo como dump fiel para restauração.
