"use strict";

process.env.JWT_SECRET = "saipbi-unit-tests-only";

const { test, before, after, beforeEach, mock } = require("node:test");
const assert = require("node:assert/strict");
const { existsSync, readFileSync } = require("node:fs");
const path = require("node:path");
const jwt = require("jsonwebtoken");
const db = require("../../models");
const authConfig = require("../../config/auth");
const AppError = require("../../utils/AppError");
const errorHandler = require("../../middlewares/errorHandler");
const { converterValor } = require("../../services/parametroService");
const app = require("../../app");

let server;
let base;
const users = ["Administrador", "Gestor", "Operador"].map((nome, index) => ({
  id: index + 1,
  empresa_id: 10,
  perfil_id: index + 1,
  ativo: true,
  nome: "Usuário de teste",
  perfil: { id: index + 1, nome },
  empresa: { id: 10, ativo: true, nome_fantasia: "Empresa de teste" },
}));

before(async () => {
  server = app.listen(0, "127.0.0.1");
  await new Promise((resolve, reject) => {
    server.once("listening", resolve);
    server.once("error", reject);
  });
  base = `http://127.0.0.1:${server.address().port}`;
});
beforeEach(() => {
  mock.restoreAll();
  mock.method(db.Usuario, "findOne", async ({ where }) => {
    // O lookup da autenticação não possui empresa_id; consultas de domínio possuem.
    if (where.empresa_id !== undefined) return null;
    return users.find((user) => user.id === Number(where.id)) || null;
  });
  mock.method(db.Usuario, "findAll", async ({ where, attributes }) => {
    assert.equal(where.empresa_id, 10);
    assert.ok(attributes.exclude.includes("senha"));
    return [{ id: 1, nome: "Usuário de teste" }];
  });
});
after(async () => {
  mock.restoreAll();
  await new Promise((resolve) => server.close(resolve));
  await db.sequelize.close();
});

async function request(
  route,
  { method = "GET", body, raw, user = 1, token } = {},
) {
  const headers = { "Content-Type": "application/json" };
  if (user !== null)
    headers.Authorization = `Bearer ${token || jwt.sign({ id: user }, authConfig.jwt.secret)}`;
  const response = await fetch(base + route, {
    method,
    headers,
    body: raw ?? (body === undefined ? undefined : JSON.stringify(body)),
  });
  const data = await response.json();
  return { status: response.status, data };
}

test("FEAT01-BE-003: somente user.js implementa o router de usuários", () => {
  assert.equal(
    existsSync(path.join(__dirname, "../../routes/usuarios.js")),
    false,
  );
  const index = readFileSync(
    path.join(__dirname, "../../routes/index.js"),
    "utf8",
  );
  assert.match(index, /require\("\.\/user"\)/);
  assert.doesNotMatch(index, /require\("\.\/usuarios"\)/);
});

test("router único atende os prefixos versionado e legado para Admin", async () => {
  for (const route of ["/api/v1/usuarios", "/usuarios"]) {
    const result = await request(route);
    assert.equal(result.status, 200);
    assert.equal(result.data.length, 1);
    assert.equal("senha" in result.data[0], false);
  }
});

test("sem token e token inválido retornam 401 em JSON", async () => {
  for (const options of [{ user: null }, { token: "invalido" }]) {
    const result = await request("/api/v1/usuarios", options);
    assert.equal(result.status, 401);
    assert.deepEqual(Object.keys(result.data), ["mensagem"]);
  }
});

test("Gestor/Operador recebem 403 em todas as operações de usuários", async () => {
  for (const prefix of ["/api/v1", ""]) {
    for (const user of [2, 3]) {
      for (const [method, suffix] of [
        ["GET", ""],
        ["POST", ""],
        ["PUT", "/1"],
        ["PUT", "/1/status"],
      ]) {
        const result = await request(`${prefix}/usuarios${suffix}`, {
          method,
          user,
          body: method === "GET" ? undefined : {},
        });
        assert.equal(
          result.status,
          403,
          `${user} ${method} ${prefix}${suffix}`,
        );
      }
    }
  }
});

test("ID de outro tenant é procurado com empresa autenticada e retorna 404", async () => {
  let checked = false;
  mock.method(db.Usuario, "findOne", async ({ where }) => {
    if (where.empresa_id === undefined) return users[0];
    assert.deepEqual(where, { id: "99", empresa_id: 10 });
    checked = true;
    return null;
  });
  const result = await request("/api/v1/usuarios/99?empresa_id=20");
  assert.equal(result.status, 404);
  assert.ok(checked);
});

test("JSON inválido e corpo excessivo recebem erro JSON sem conteúdo original", async () => {
  const malformed = await request("/api/v1/auth/login", {
    method: "POST",
    raw: '{"senha":"segredo",',
    user: null,
  });
  assert.deepEqual(malformed, {
    status: 400,
    data: { mensagem: "JSON inválido." },
  });
  const huge = await request("/api/v1/auth/login", {
    method: "POST",
    body: { senha: "x".repeat(110000) },
    user: null,
  });
  assert.equal(huge.status, 413);
  assert.deepEqual(Object.keys(huge.data), ["mensagem"]);
});

test("rota inexistente responde 404 JSON para usuário autenticado", async () => {
  assert.deepEqual(await request("/api/v1/inexistente"), {
    status: 404,
    data: { mensagem: "Rota não encontrada." },
  });
});

test("IDs malformados são 400 antes da consulta de domínio", async () => {
  for (const id of ["0", "-1", "1.2", "abc", "4294967296", "1%20OR%201=1"]) {
    assert.equal((await request(`/api/v1/usuarios/${id}`)).status, 400);
  }
  assert.equal((await request("/api/v1/usuarios/%E0%A4%A")).status, 400);
});

test("token expirado, futuro ou cabeçalho com conteúdo extra é rejeitado", async () => {
  for (const payload of [
    { id: 1, exp: 1 },
    { id: 1, nbf: Math.floor(Date.now() / 1000) + 3600 },
  ]) {
    assert.equal(
      (
        await request("/api/v1/usuarios", {
          token: jwt.sign(payload, authConfig.jwt.secret),
        })
      ).status,
      401,
    );
  }
  assert.equal(
    (
      await request("/api/v1/usuarios", {
        token: `${jwt.sign({ id: 1 }, authConfig.jwt.secret)} extra`,
      })
    ).status,
    401,
  );
});

test("login rejeita tipos inválidos antes de consultar credenciais", async () => {
  for (const body of [
    {},
    [],
    { email: {}, senha: "x" },
    { email: "a@b.test", senha: 123 },
  ]) {
    assert.equal(
      (
        await request("/api/v1/auth/login", {
          method: "POST",
          body,
          user: null,
        })
      ).status,
      400,
    );
  }
});

test("dados mestres rejeitam texto vazio, tipos indevidos, booleanos falsos em string e limites", async () => {
  for (const [route, body] of [
    ["categorias", { nome: " " }],
    ["categorias", { nome: "x", ativo: "false" }],
    ["categorias", { nome: "x".repeat(101) }],
    ["clientes", { nome: [] }],
    ["fornecedores", { razao_social: "Fornecedor" }],
    ["empresa", { email: "inválido" }],
  ]) {
    const method = route === "empresa" ? "PUT" : "POST";
    assert.equal(
      (await request(`/api/v1/${route}`, { method, body })).status,
      400,
    );
  }
});

test("categoria válida preserva contrato e ignora tenant adulterado no body", async () => {
  let created;
  mock.method(db.Categoria, "findOne", async ({ where }) => {
    assert.equal(where.empresa_id, 10);
    return null;
  });
  mock.method(db.Categoria, "create", async (data) => {
    created = data;
    return { id: 1, ...data };
  });
  const result = await request("/api/v1/categorias", {
    method: "POST",
    body: { nome: "Categoria válida", empresa_id: 99, ativo: true },
  });
  assert.equal(result.status, 201);
  assert.equal(created.empresa_id, 10);
  assert.equal(result.data.categoria.nome, "Categoria válida");
});

test("produto rejeita números ausentes/não finitos/fracionários/fora da precisão", async () => {
  const valid = {
    categoria_id: 1,
    nome: "Produto",
    sku: "SKU",
    preco_venda: 1,
    custo: 1,
  };
  for (const changes of [
    { preco_venda: null },
    { custo: "NaN" },
    { custo: "Infinity" },
    { custo: true },
    { custo: 1.001 },
    { custo: 10000000000 },
    { estoque_minimo: 1.5 },
    { categoria_id: " " },
  ]) {
    const result = await request("/api/v1/produtos", {
      method: "POST",
      body: { ...valid, ...changes },
    });
    assert.equal(result.status, 400);
  }
  const { custo, ...missing } = valid;
  assert.equal(custo, 1);
  assert.equal(
    (await request("/api/v1/produtos", { method: "POST", body: missing }))
      .status,
    400,
  );
});

test("produto aceita centavos e limite monetário válidos sem alterar saldo pelo cliente", async () => {
  mock.method(db.Categoria, "findOne", async ({ where }) => {
    assert.equal(where.empresa_id, 10);
    return { id: 1, ativo: true };
  });
  mock.method(db.Produto, "findOne", async () => null);
  mock.method(db.Produto, "create", async (data) => ({ id: 1, ...data }));
  for (const value of [9999999999.99, "1.25"]) {
    const result = await request("/api/v1/produtos", {
      method: "POST",
      body: {
        categoria_id: 1,
        nome: "Produto válido",
        sku: "SKU",
        preco_venda: value,
        custo: value,
        estoque_atual: 100,
        empresa_id: 99,
      },
    });
    assert.equal(result.status, 201);
    assert.equal(result.data.produto.estoque_atual, 0);
    assert.equal(result.data.produto.empresa_id, 10);
  }
});

test("vínculo produto-fornecedor rejeita prazo/lote/custo inválidos", async () => {
  for (const body of [
    { fornecedor_id: 1, custo: 1 },
    { fornecedor_id: 1, prazo_padrao_dias: 1.5, custo: 1 },
    { fornecedor_id: 1, prazo_padrao_dias: 1, custo: 1, lote_minimo: 0 },
  ]) {
    assert.equal(
      (
        await request("/api/v1/produtos/1/fornecedores", {
          method: "POST",
          body,
        })
      ).status,
      400,
    );
  }
});

test("parâmetros rejeitam itens nulos, objetos e valores excessivos", async () => {
  for (const body of [
    {},
    { parametros: [null] },
    { parametros: [{ chave: "A", valor: {} }] },
    { parametros: [{ chave: "A", valor: "x".repeat(256) }] },
  ]) {
    assert.equal(
      (await request("/api/v1/parametros", { method: "PUT", body })).status,
      400,
    );
  }
  assert.equal(
    (
      await request("/api/v1/parametros/A", {
        method: "PUT",
        body: { valor: null },
      })
    ).status,
    400,
  );
  for (const value of [null, "", " ", true, {}, Infinity])
    assert.throws(() => converterValor(value, "INTEIRO"), AppError);
});

test("exceções ORM são normalizadas pelo pipeline HTTP", async () => {
  for (const [name, status] of [
    ["SequelizeValidationError", 400],
    ["SequelizeUniqueConstraintError", 409],
    ["SequelizeForeignKeyConstraintError", 409],
  ]) {
    mock.method(db.Usuario, "findAll", async () => {
      throw Object.assign(new Error("SQL e dados privados"), {
        name,
        sql: "segredo",
      });
    });
    const result = await request("/api/v1/usuarios");
    assert.equal(result.status, status);
    assert.deepEqual(Object.keys(result.data), ["mensagem"]);
    assert.doesNotMatch(JSON.stringify(result.data), /SQL|segredo|stack/);
  }
  mock.method(db.Usuario, "findAll", async () => {
    throw Object.assign(new Error("SQL privado"), {
      name: "SequelizeDatabaseError",
      original: { code: "ER_CONSTRAINT_FAILED" },
    });
  });
  assert.equal((await request("/api/v1/usuarios")).status, 400);
});

test("falha inesperada não expõe SQL/credenciais na resposta ou log", async () => {
  const log = mock.method(console, "error", () => {});
  mock.method(db.Usuario, "findAll", async () => {
    throw new Error("senha=segredo SQL SELECT");
  });
  assert.deepEqual(await request("/api/v1/usuarios"), {
    status: 500,
    data: { mensagem: "Erro interno do servidor." },
  });
  assert.equal(log.mock.callCount(), 1);
  assert.doesNotMatch(JSON.stringify(log.mock.calls), /segredo|SELECT/);
});

test("erro do banco na autenticação também usa o handler central", async () => {
  mock.method(console, "error", () => {});
  mock.method(db.Usuario, "findOne", async () => {
    throw new Error("credencial privada");
  });
  assert.deepEqual(await request("/api/v1/usuarios"), {
    status: 500,
    data: { mensagem: "Erro interno do servidor." },
  });
});

test("AppError confiável é exposto; status/message de erro arbitrário são ocultados", () => {
  for (const [error, expected] of [
    [new AppError(400, "Entrada inválida."), 400],
    [Object.assign(new Error("SQL privado"), { status: 400 }), 500],
  ]) {
    mock.method(console, "error", () => {});
    let status;
    let body;
    const res = {
      status(value) {
        status = value;
        return this;
      },
      json(value) {
        body = value;
      },
    };
    errorHandler(error, {}, res, () => assert.fail());
    assert.equal(status, expected);
    assert.doesNotMatch(body.mensagem, /SQL/);
  }
  let forwarded;
  const error = new Error("já enviada");
  errorHandler(error, {}, { headersSent: true }, (value) => {
    forwarded = value;
  });
  assert.equal(forwarded, error);
});
