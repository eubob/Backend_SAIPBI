"use strict";

const { ParametroSistema } = require("../models");
const { PARAMETROS_PADRAO } = require("../config/parametros");

function converterValor(valor, tipo) {
  switch (tipo) {
    case "INTEIRO": {
      const convertido = Number(valor);

      if (!Number.isInteger(convertido)) {
        throw new Error("O valor deve ser um número inteiro.");
      }

      return convertido;
    }

    case "DECIMAL": {
      const convertido = Number(valor);

      if (!Number.isFinite(convertido)) {
        throw new Error("O valor deve ser um número decimal válido.");
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

      throw new Error("O valor deve ser verdadeiro ou falso.");
    }

    case "HORA": {
      const texto = String(valor).trim();

      if (!/^([01]\d|2[0-3]):([0-5]\d)$/.test(texto)) {
        throw new Error("O valor deve estar no formato HH:mm.");
      }

      return texto;
    }

    case "TEXTO":
      return String(valor);

    default:
      throw new Error(`Tipo de parâmetro inválido: ${tipo}.`);
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
    const erro = new Error("Parâmetro não encontrado.");
    erro.status = 404;
    throw erro;
  }

  parametro.valor = serializarValor(valor, parametro.tipo);

  await parametro.save();

  return parametro;
}

async function atualizarVarios(empresaId, parametros) {
  if (!Array.isArray(parametros) || parametros.length === 0) {
    const erro = new Error("Informe ao menos um parâmetro para atualização.");
    erro.status = 400;
    throw erro;
  }

  const resultados = [];

  for (const item of parametros) {
    if (!item.chave || item.valor === undefined) {
      const erro = new Error("Cada parâmetro deve possuir chave e valor.");
      erro.status = 400;
      throw erro;
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
