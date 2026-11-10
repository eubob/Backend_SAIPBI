"use strict";

const AppError = require("../utils/AppError");
const { ParametroSistema } = require("../models");
const { PARAMETROS_PADRAO } = require("../config/parametros");

function converterValor(valor, tipo) {
  if (
    valor === null ||
    valor === undefined ||
    !["string", "number", "boolean"].includes(typeof valor)
  ) {
    throw new AppError(400, "Valor de parâmetro inválido.");
  }
  switch (tipo) {
    case "INTEIRO": {
      const convertido = Number(valor);

      if (
        typeof valor === "boolean" ||
        String(valor).trim() === "" ||
        !Number.isSafeInteger(convertido)
      ) {
        throw new AppError(400, "O valor deve ser um número inteiro.");
      }

      return convertido;
    }

    case "DECIMAL": {
      const convertido = Number(valor);

      if (
        typeof valor === "boolean" ||
        String(valor).trim() === "" ||
        !Number.isFinite(convertido)
      ) {
        throw new AppError(400, "O valor deve ser um número decimal válido.");
      }

      return convertido;
    }

    case "BOOLEANO": {
      if (valor === true || valor === "true" || valor === 1 || valor === "1") {
        return true;
      }

      if (
        valor === false ||
        valor === "false" ||
        valor === 0 ||
        valor === "0"
      ) {
        return false;
      }

      throw new AppError(400, "O valor deve ser verdadeiro ou falso.");
    }

    case "HORA": {
      const texto = String(valor).trim();

      if (!/^([01]\d|2[0-3]):([0-5]\d)$/.test(texto)) {
        throw new AppError(400, "O valor deve estar no formato HH:mm.");
      }

      return texto;
    }

    case "TEXTO":
      return String(valor);

    default:
      throw new AppError(400, "Tipo de parâmetro inválido.");
  }
}

function serializarValor(valor, tipo) {
  const convertido = converterValor(valor, tipo);

  if (tipo === "BOOLEANO") {
    return convertido ? "true" : "false";
  }

  return String(convertido);
}

async function garantirParametrosEmpresa(empresaId) {
  for (const parametro of PARAMETROS_PADRAO) {
    await ParametroSistema.findOrCreate({
      where: {
        empresa_id: empresaId,
        chave: parametro.chave,
      },
      defaults: {
        empresa_id: empresaId,
        ...parametro,
      },
    });
  }
}

async function listar(empresaId) {
  await garantirParametrosEmpresa(empresaId);

  return ParametroSistema.findAll({
    where: {
      empresa_id: empresaId,
    },
    order: [
      ["grupo", "ASC"],
      ["chave", "ASC"],
    ],
  });
}

async function buscarPorChave(empresaId, chave) {
  await garantirParametrosEmpresa(empresaId);

  return ParametroSistema.findOne({
    where: {
      empresa_id: empresaId,
      chave,
    },
  });
}

async function atualizar(empresaId, chave, valor) {
  const parametro = await buscarPorChave(empresaId, chave);

  if (!parametro) {
    throw new AppError(404, "Parâmetro não encontrado.");
  }

  parametro.valor = serializarValor(valor, parametro.tipo);

  await parametro.save();

  return parametro;
}

async function atualizarVarios(empresaId, parametros) {
  if (!Array.isArray(parametros) || parametros.length === 0) {
    throw new AppError(400, "Informe ao menos um parâmetro para atualização.");
  }

  const resultados = [];

  for (const item of parametros) {
    if (!item || !item.chave || item.valor === undefined) {
      throw new AppError(400, "Cada parâmetro deve possuir chave e valor.");
    }

    const atualizado = await atualizar(empresaId, item.chave, item.valor);

    resultados.push(atualizado);
  }

  return resultados;
}

function formatarParametro(parametro) {
  const json = parametro.toJSON ? parametro.toJSON() : parametro;

  return {
    ...json,
    valor_convertido: converterValor(json.valor, json.tipo),
  };
}

module.exports = {
  converterValor,
  serializarValor,
  garantirParametrosEmpresa,
  listar,
  buscarPorChave,
  atualizar,
  atualizarVarios,
  formatarParametro,
};
