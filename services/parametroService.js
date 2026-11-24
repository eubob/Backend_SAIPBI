"use strict";

const AppError = require("../utils/AppError");
const { ParametroSistema, sequelize } = require("../models");
const {
  PARAMETROS_PADRAO,
  DEFINICOES,
  registroPadrao,
} = require("../config/parametros");
const regrasEstoque = require("./regrasEstoqueService");

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
      if (valor === true || valor === "true" || valor === 1 || valor === "1")
        return true;
      if (valor === false || valor === "false" || valor === 0 || valor === "0")
        return false;
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

/** Converte e verifica a faixa permitida pela definição do parâmetro. */
function validarValor(chave, valor, tipo) {
  const convertido = converterValor(valor, tipo);
  const definicao = DEFINICOES.get(chave);
  if (typeof convertido === "number" && definicao) {
    if (
      (definicao.minimo !== undefined && convertido < definicao.minimo) ||
      (definicao.maximo !== undefined && convertido > definicao.maximo)
    ) {
      throw new AppError(
        400,
        `${chave} deve estar entre ${definicao.minimo} e ${definicao.maximo}.`,
      );
    }
  }
  return convertido;
}

const serializar = (convertido, tipo) =>
  tipo === "BOOLEANO" ? (convertido ? "true" : "false") : String(convertido);

/** Regras que envolvem mais de um parâmetro, avaliadas sobre o estado final. */
function validarDependencias(valores) {
  const alto = valores.get("RISCO.LIMITE_ALTO");
  const medio = valores.get("RISCO.LIMITE_MEDIO");
  if (alto !== undefined && medio !== undefined && medio >= alto) {
    throw new AppError(
      400,
      "RISCO.LIMITE_MEDIO deve ser menor que RISCO.LIMITE_ALTO.",
    );
  }
}

/**
 * Cria, sem sobrescrever, os parâmetros padrão ausentes da empresa.
 * Idempotente e seguro sob concorrência (INSERT IGNORE na chave única).
 */
async function garantirParametrosEmpresa(empresaId) {
  const existentes = await ParametroSistema.findAll({
    attributes: ["chave"],
    where: { empresa_id: empresaId },
  });
  const chaves = new Set(existentes.map((p) => p.chave));
  const ausentes = PARAMETROS_PADRAO.filter((p) => !chaves.has(p.chave));
  if (!ausentes.length) return;
  await ParametroSistema.bulkCreate(
    ausentes.map((p) => ({ empresa_id: empresaId, ...registroPadrao(p) })),
    { ignoreDuplicates: true },
  );
}

async function listar(empresaId) {
  await garantirParametrosEmpresa(empresaId);
  return ParametroSistema.findAll({
    where: { empresa_id: empresaId },
    order: [
      ["grupo", "ASC"],
      ["chave", "ASC"],
    ],
  });
}

async function buscarPorChave(empresaId, chave) {
  await garantirParametrosEmpresa(empresaId);
  return ParametroSistema.findOne({ where: { empresa_id: empresaId, chave } });
}

/**
 * Atualiza um ou mais parâmetros de forma atômica: valida todas as chaves,
 * tipos, faixas e dependências antes de gravar; qualquer erro desfaz o lote.
 */
async function atualizarVarios(empresaId, itens) {
  if (!Array.isArray(itens) || itens.length === 0) {
    throw new AppError(400, "Informe ao menos um parâmetro para atualização.");
  }
  const chavesRecebidas = itens.map((item) => item?.chave);
  if (new Set(chavesRecebidas).size !== chavesRecebidas.length) {
    throw new AppError(400, "O lote possui parâmetros repetidos.");
  }

  await garantirParametrosEmpresa(empresaId);

  return sequelize.transaction(async (transaction) => {
    const parametros = await ParametroSistema.findAll({
      where: { empresa_id: empresaId },
      lock: transaction.LOCK.UPDATE,
      transaction,
    });
    const porChave = new Map(parametros.map((p) => [p.chave, p]));
    const valores = new Map(
      parametros.map((p) => {
        try {
          return [p.chave, converterValor(p.valor, p.tipo)];
        } catch {
          return [p.chave, undefined];
        }
      }),
    );

    const alterados = [];
    for (const { chave, valor } of itens) {
      const parametro = porChave.get(chave);
      if (!parametro) throw new AppError(404, `Parâmetro ${chave} não encontrado.`);
      const convertido = validarValor(chave, valor, parametro.tipo);
      valores.set(chave, convertido);
      alterados.push([parametro, convertido]);
    }

    validarDependencias(valores);

    if (alterados.some(([p]) => regrasEstoque.CHAVES_PADRAO_EMPRESA.includes(p.chave))) {
      const novosPadroes = Object.fromEntries(
        regrasEstoque.CHAVES_PADRAO_EMPRESA.map((chave) => [chave, valores.get(chave)]),
      );
      await regrasEstoque.validarPadroesEmpresa(empresaId, novosPadroes, transaction);
    }

    for (const [parametro, convertido] of alterados) {
      parametro.valor = serializar(convertido, parametro.tipo);
      await parametro.save({ transaction });
    }
    return alterados.map(([parametro]) => parametro);
  });
}

async function atualizar(empresaId, chave, valor) {
  const [parametro] = await atualizarVarios(empresaId, [{ chave, valor }]);
  return parametro;
}

function formatarParametro(parametro) {
  const json = parametro.toJSON ? parametro.toJSON() : parametro;
  const definicao = DEFINICOES.get(json.chave);
  return {
    ...json,
    valor_convertido: converterValor(json.valor, json.tipo),
    minimo: definicao?.minimo ?? null,
    maximo: definicao?.maximo ?? null,
  };
}

module.exports = {
  converterValor,
  garantirParametrosEmpresa,
  listar,
  buscarPorChave,
  atualizar,
  atualizarVarios,
  formatarParametro,
};
