"use strict";

// Integração com o banco local sem inserts/updates/deletes e sem expor tokens ou PII.
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const jwt = require("jsonwebtoken");
const db = require("../models");
const authConfig = require("../config/auth");
const app = require("../app");
let server;

async function main() {
  await db.sequelize.authenticate();
  const users = await db.Usuario.findAll({
    where: { ativo: true },
    attributes: ["id", "empresa_id"],
    include: [
      { model: db.Perfil, as: "perfil", attributes: ["nome"], required: true },
      {
        model: db.Empresa,
        as: "empresa",
        attributes: ["id"],
        where: { ativo: true },
        required: true,
      },
    ],
  });
  assert.ok(users.length, "Necessário um usuário ativo no banco local.");
  assert.ok(authConfig.jwt.secret, "JWT_SECRET deve estar configurado.");
  server = app.listen(0, "127.0.0.1");
  await new Promise((resolve, reject) => {
    server.once("listening", resolve);
    server.once("error", reject);
  });
  const base = `http://127.0.0.1:${server.address().port}`;
  const results = [];
  async function check(route, expected, user, method = "GET", body) {
    const headers = { "Content-Type": "application/json" };
    if (user)
      headers.Authorization = `Bearer ${jwt.sign({ id: user.id }, authConfig.jwt.secret, { expiresIn: "5m" })}`;
    const response = await fetch(base + route, {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
    });
    const payload = await response.json();
    assert.equal(response.status, expected, `${method} ${route}`);
    assert.ok(
      !JSON.stringify(payload).includes('"senha"'),
      "Resposta não deve conter senha.",
    );
    if (expected >= 400) assert.deepEqual(Object.keys(payload), ["mensagem"]);
    results.push({
      metodo: method,
      rota: route,
      perfil: user?.perfil.nome || "público",
      esperado: expected,
      obtido: response.status,
      ...(expected >= 400 ? { resposta: payload } : {}),
    });
  }
  const first = users[0];
  await check("/api/v1/usuarios", 401);
  await check("/api/v1/auth/login", 400, null, "POST", {});
  for (const route of [
    "/api/v1/auth/me",
    "/api/v1/empresa",
    "/api/v1/categorias",
    "/api/v1/clientes",
    "/api/v1/fornecedores",
    "/api/v1/produtos",
    "/api/v1/perfis",
  ])
    await check(route, 200, first);
  for (const profile of ["Administrador", "Gestor", "Operador"]) {
    const user = users.find((u) => u.perfil.nome === profile);
    if (!user) {
      results.push({
        perfil: profile,
        estado: "não validado: perfil sem usuário ativo",
      });
      continue;
    }
    const admin = profile === "Administrador";
    await check("/api/v1/usuarios", admin ? 200 : 403, user);
    await check("/usuarios", admin ? 200 : 403, user);
    await check("/api/v1/usuarios", admin ? 400 : 403, user, "POST", {});
    if (!admin)
      await check("/api/v1/empresa", 403, user, "PUT", {
        nome_fantasia: "Não deve ser gravado",
      });
    if (admin) {
      await check("/api/v1/usuarios/4294967295", 404, user);
      await check("/api/v1/usuarios/abc", 400, user);
      await check("/api/v1/produtos", 400, user, "POST", {
        categoria_id: 1,
        nome: "Não gravar",
        sku: "INVALIDO",
        preco_venda: "NaN",
        custo: 1,
      });
    }
  }
  await check("/api/v1/produtos/4294967295", 404, first);
  await check("/api/v1/inexistente", 404, first);
  const tenantCount = new Set(users.map((u) => u.empresa_id)).size;
  const evidence = {
    data: new Date().toISOString(),
    banco_real: true,
    mutacoes_executadas: false,
    autenticacao: "JWT assinado localmente; fluxo de senha não exercitado",
    tenants_com_usuarios_ativos: tenantCount,
    isolamento_AB:
      "Consulta com empresa autenticada coberta em teste com doubles; CRUD A/B real pendente",
    resultados: results,
  };
  const dir = path.join(__dirname, "../docs/evidencias");
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(
    path.join(dir, "api-banco-real.json"),
    JSON.stringify(evidence, null, 2),
  );
  console.log(
    JSON.stringify({
      verificacoes: results.length,
      falhas: 0,
      mutacoes_executadas: false,
      tenants_com_usuarios_ativos: tenantCount,
    }),
  );
}

main()
  .catch(() => {
    console.error(
      "Falha na validação de leitura da API. Nenhuma evidência de sucesso foi gerada.",
    );
    process.exitCode = 1;
  })
  .finally(async () => {
    if (server) await new Promise((resolve) => server.close(resolve));
    await db.sequelize.close();
  });
