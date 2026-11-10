"use strict";

// Apenas metadados: não exporta registros, credenciais ou conteúdo empresarial.
const fs = require("node:fs");
const path = require("node:path");
const db = require("../models");

async function main() {
  const select = (sql) =>
    db.sequelize.query(sql, { type: db.Sequelize.QueryTypes.SELECT });
  const columns =
    await select(`SELECT TABLE_NAME AS tabela, COLUMN_NAME AS coluna,
    COLUMN_TYPE AS tipo, IS_NULLABLE AS nullable, COLUMN_DEFAULT AS padrao,
    COLUMN_KEY AS chave, EXTRA AS extra, GENERATION_EXPRESSION AS geracao
    FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() ORDER BY TABLE_NAME, ORDINAL_POSITION`);
  const foreignKeys =
    await select(`SELECT k.TABLE_NAME AS tabela, k.CONSTRAINT_NAME AS nome,
    k.COLUMN_NAME AS coluna, k.REFERENCED_TABLE_NAME AS tabela_ref, k.REFERENCED_COLUMN_NAME AS coluna_ref,
    r.DELETE_RULE AS exclusao, r.UPDATE_RULE AS atualizacao
    FROM information_schema.KEY_COLUMN_USAGE k
    JOIN information_schema.REFERENTIAL_CONSTRAINTS r ON r.CONSTRAINT_SCHEMA=k.CONSTRAINT_SCHEMA
      AND r.TABLE_NAME=k.TABLE_NAME AND r.CONSTRAINT_NAME=k.CONSTRAINT_NAME
    WHERE k.TABLE_SCHEMA=DATABASE() AND k.REFERENCED_TABLE_NAME IS NOT NULL
    ORDER BY k.TABLE_NAME, k.CONSTRAINT_NAME, k.ORDINAL_POSITION`);
  const indexes = await select(`SELECT TABLE_NAME AS tabela, INDEX_NAME AS nome,
    NON_UNIQUE AS nao_unico, COLUMN_NAME AS coluna FROM information_schema.STATISTICS
    WHERE TABLE_SCHEMA=DATABASE() ORDER BY TABLE_NAME, INDEX_NAME, SEQ_IN_INDEX`);
  const checks =
    await select(`SELECT t.TABLE_NAME AS tabela, c.CONSTRAINT_NAME AS nome, c.CHECK_CLAUSE AS expressao
    FROM information_schema.CHECK_CONSTRAINTS c JOIN information_schema.TABLE_CONSTRAINTS t
      ON t.CONSTRAINT_SCHEMA=c.CONSTRAINT_SCHEMA AND t.CONSTRAINT_NAME=c.CONSTRAINT_NAME AND t.CONSTRAINT_TYPE='CHECK'
    WHERE c.CONSTRAINT_SCHEMA=DATABASE() ORDER BY t.TABLE_NAME, c.CONSTRAINT_NAME`);
  const migrationTable = columns.find(
    (c) => c.tabela.toLowerCase() === "sequelizemeta",
  )?.tabela;
  const migrations = migrationTable
    ? await select(`SELECT name FROM \`${migrationTable}\` ORDER BY name`)
    : [];
  const tables = [...new Set(columns.map((c) => c.tabela))];
  const groups = (items, key) =>
    Object.values(
      items.reduce((acc, item) => {
        (acc[key(item)] ||= []).push(item);
        return acc;
      }, {}),
    );
  const date = new Date().toISOString().slice(0, 10);
  const quote = (value) =>
    `'${String(value).replace(/\\/g, "\\\\").replace(/'/g, "\\'").replace(/\r?\n/g, "\\n")}'`;
  const lines = [
    `// Schema observado em ${date}; origem: information_schema do banco local.`,
    "// Colunas geradas e CHECKs são preservados como notas; não executar como migration.",
    "",
  ];
  for (const table of tables) {
    lines.push(`Table ${table} {`);
    for (const c of columns.filter((c) => c.tabela === table)) {
      const settings = [];
      if (c.chave === "PRI") settings.push("pk");
      if (c.nullable === "NO") settings.push("not null");
      if (c.extra.includes("auto_increment")) settings.push("increment");
      const notes = [];
      if (c.padrao !== null) notes.push(`DEFAULT ${c.padrao}`);
      if (c.geracao) notes.push(`GENERATED ${c.geracao} (${c.extra})`);
      if (notes.length) settings.push(`note: ${quote(notes.join("; "))}`);
      lines.push(
        `  ${c.coluna} "${c.tipo.replace(/"/g, '\\"')}"${settings.length ? ` [${settings.join(", ")}]` : ""}`,
      );
    }
    const tableChecks = checks.filter((c) => c.tabela === table);
    if (tableChecks.length)
      lines.push(
        `  Note: ${quote(tableChecks.map((c) => `${c.nome}: ${c.expressao}`).join("\n"))}`,
      );
    const grouped = groups(
      indexes.filter((i) => i.tabela === table && i.nome !== "PRIMARY"),
      (i) => i.nome,
    );
    if (grouped.length) {
      lines.push("  indexes {");
      for (const group of grouped) {
        const settings = [`name: ${quote(group[0].nome)}`];
        if (!Number(group[0].nao_unico)) settings.push("unique");
        lines.push(
          `    (${group.map((i) => i.coluna).join(", ")}) [${settings.join(", ")}]`,
        );
      }
      lines.push("  }");
    }
    lines.push("}", "");
  }
  const actions = {
    CASCADE: "cascade",
    RESTRICT: "restrict",
    "SET NULL": "set null",
    "NO ACTION": "no action",
  };
  for (const group of groups(foreignKeys, (k) => `${k.tabela}.${k.nome}`)) {
    const first = group[0];
    const local = group.map((k) => k.coluna).join(", ");
    const target = group.map((k) => k.coluna_ref).join(", ");
    lines.push(
      `Ref: ${first.tabela}.${group.length > 1 ? `(${local})` : local} > ${first.tabela_ref}.${group.length > 1 ? `(${target})` : target} [delete: ${actions[first.exclusao]}, update: ${actions[first.atualizacao]}]`,
    );
  }
  const modelDifferences = [];
  for (const model of Object.values(db).filter((m) => m?.rawAttributes)) {
    const table = model.getTableName();
    const actual = columns.filter((c) => c.tabela === table);
    const expected = Object.values(model.rawAttributes).map((a) => a.field);
    for (const field of expected)
      if (!actual.some((c) => c.coluna === field))
        modelDifferences.push(`${table}.${field}: ausente no banco`);
    for (const c of actual)
      if (!expected.includes(c.coluna))
        modelDifferences.push(
          `${table}.${c.coluna}: somente no banco${c.geracao ? " (coluna gerada)" : ""}`,
        );
  }
  const pending = fs
    .readdirSync(path.join(__dirname, "../migrations"))
    .filter(
      (name) =>
        name.endsWith(".js") && !migrations.some((m) => m.name === name),
    );
  const evidence = path.join(__dirname, "../docs/evidencias");
  fs.mkdirSync(evidence, { recursive: true });
  fs.writeFileSync(
    path.join(__dirname, "../database.dbml"),
    lines.join("\n") + "\n",
  );
  fs.writeFileSync(
    path.join(evidence, "schema-real.json"),
    JSON.stringify(
      {
        data: date,
        tables,
        columns,
        foreignKeys,
        indexes,
        checks,
        migrations,
        pending,
        modelDifferences,
      },
      null,
      2,
    ),
  );
  console.log(
    JSON.stringify(
      {
        tables: tables.length,
        columns: columns.length,
        foreignKeys: groups(foreignKeys, (k) => `${k.tabela}.${k.nome}`).length,
        checks: checks.length,
        migrations: migrations.length,
        pending,
        modelDifferences,
      },
      null,
      2,
    ),
  );
}

main()
  .catch((error) => {
    console.error("Falha ao exportar metadados:", error.name);
    process.exitCode = 1;
  })
  .finally(() => db.sequelize.close());
