"use strict";

const AppError = require("../utils/AppError");

const text = (max, nullable = false) => ({ type: "text", max, nullable });
const integer = (min = 1, max = 4294967295) => ({ type: "integer", min, max });
const INT_MAX = 2147483647;
// Quantidade de regra de estoque: NULL herda do nível acima; zero é explícito.
const regraEstoque = { ...integer(0, INT_MAX), nullable: true };
const money = { type: "decimal", min: 0.01, max: 9999999999.99 };
const boolean = { type: "boolean" };
const email = { ...text(100), email: true };

const schemas = {
  login: { required: ["email", "senha"], fields: { email, senha: text(255) } },
  usuario: {
    required: ["nome", "email", "senha", "perfil_id"],
    fields: {
      nome: text(100),
      email,
      senha: text(255),
      perfil_id: integer(),
      ativo: boolean,
    },
  },
  empresa: {
    fields: {
      razao_social: text(150),
      nome_fantasia: text(150),
      documento: text(20, true),
      email: { ...text(120, true), email: true },
      telefone: text(20, true),
    },
  },
  categoria: {
    required: ["nome"],
    fields: {
      nome: text(100),
      ativo: boolean,
      estoque_minimo_padrao: regraEstoque,
      estoque_maximo_padrao: regraEstoque,
      estoque_seguranca_padrao: regraEstoque,
    },
  },
  cliente: {
    required: ["nome"],
    fields: {
      nome: text(150),
      documento: text(20, true),
      contato: text(150, true),
      ativo: boolean,
    },
  },
  fornecedor: {
    required: ["razao_social", "documento"],
    fields: {
      razao_social: text(150),
      documento: text(20),
      contato: text(150, true),
      ativo: boolean,
    },
  },
  produto: {
    required: ["categoria_id", "nome", "sku", "preco_venda", "custo"],
    fields: {
      categoria_id: integer(),
      nome: text(150),
      sku: text(50),
      unidade: text(10),
      preco_venda: money,
      custo: money,
      estoque_minimo: regraEstoque,
      estoque_maximo: regraEstoque,
      estoque_seguranca: regraEstoque,
      ativo: boolean,
    },
  },
  produtoFornecedor: {
    required: ["fornecedor_id", "prazo_padrao_dias", "custo"],
    fields: {
      fornecedor_id: integer(),
      prazo_padrao_dias: integer(),
      lote_minimo: integer(),
      multiplo_compra: integer(1, 1000000),
      custo: money,
      principal: boolean,
    },
  },
};

function invalid(field) {
  throw new AppError(400, `Campo ${field} inválido.`);
}

function validateField(value, rule, field) {
  if (value === null && rule.nullable) return;
  if (rule.type === "boolean") {
    if (typeof value !== "boolean") invalid(field);
  } else if (rule.type === "text") {
    if (
      typeof value !== "string" ||
      value.length > rule.max ||
      (!rule.nullable && !value.trim())
    )
      invalid(field);
    if (
      rule.email &&
      value.trim() &&
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim())
    )
      invalid(field);
  } else {
    if (typeof value !== "number" && typeof value !== "string") invalid(field);
    if (typeof value === "string" && !/^\d+(?:\.\d+)?$/.test(value))
      invalid(field);
    const number = Number(value);
    if (!Number.isFinite(number) || number < rule.min || number > rule.max)
      invalid(field);
    if (rule.type === "integer" && !Number.isInteger(number)) invalid(field);
    if (rule.type === "decimal" && Number(number.toFixed(2)) !== number)
      invalid(field);
  }
}

function validateRequest(schemaName) {
  const schema = schemas[schemaName];
  if (!schema) throw new Error("Schema de validação inexistente.");
  return (req, res, next) => {
    if (!["POST", "PUT", "PATCH"].includes(req.method)) return next();
    try {
      const body = req.body;
      if (!body || typeof body !== "object" || Array.isArray(body))
        throw new AppError(400, "Informe um objeto JSON.");
      if (req.method === "POST") {
        for (const field of schema.required || [])
          if (body[field] === undefined) invalid(field);
      }
      for (const [field, rule] of Object.entries(schema.fields)) {
        if (body[field] !== undefined) validateField(body[field], rule, field);
      }
      // Campos adicionais (incluindo empresa_id) não são fonte de autorização.
      return next();
    } catch (error) {
      return next(error);
    }
  };
}

function validateId(req, res, next, value) {
  if (
    !/^[1-9]\d*$/.test(value) ||
    !Number.isSafeInteger(Number(value)) ||
    Number(value) > 4294967295
  ) {
    return next(new AppError(400, "Identificador inválido."));
  }
  return next();
}

function validateParametros(req, res, next) {
  if (req.method !== "PUT") return next();
  try {
    const body = req.body;
    if (!body || typeof body !== "object" || Array.isArray(body))
      throw new AppError(400, "Informe um objeto JSON.");
    const items = req.params.chave
      ? [{ chave: req.params.chave, valor: body.valor }]
      : body.parametros;
    if (!Array.isArray(items) || !items.length)
      throw new AppError(
        400,
        "Informe ao menos um parâmetro para atualização.",
      );
    for (const item of items) {
      if (
        !item ||
        typeof item.chave !== "string" ||
        !item.chave.trim() ||
        item.chave.length > 100 ||
        item.valor === null ||
        !["string", "number", "boolean"].includes(typeof item.valor) ||
        String(item.valor).length > 255 ||
        (typeof item.valor === "number" && !Number.isFinite(item.valor))
      ) {
        throw new AppError(
          400,
          "Cada parâmetro deve possuir chave e valor válidos.",
        );
      }
    }
    return next();
  } catch (error) {
    return next(error);
  }
}

module.exports = { validateRequest, validateId, validateParametros };
