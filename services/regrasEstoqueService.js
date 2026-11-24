"use strict";

/**
 * Regras de estoque com herança produto → categoria → empresa.
 *
 * NULL (ou ausência) herda do nível acima; zero é explícito e prevalece.
 * O máximo não tem padrão de empresa: sem máximo no produto/categoria o item
 * não possui limite superior. Nada é copiado para o produto: a regra efetiva
 * é sempre calculada, com a origem informada.
 */

const { Transaction } = require("sequelize");
const AppError = require("../utils/AppError");
const { ParametroSistema, Produto, Categoria } = require("../models");
const { DEFINICOES } = require("../config/parametros");

const REGRAS = {
  minimo: {
    produto: "estoque_minimo",
    categoria: "estoque_minimo_padrao",
    parametro: "ESTOQUE.ESTOQUE_MINIMO_PADRAO",
  },
  maximo: {
    produto: "estoque_maximo",
    categoria: "estoque_maximo_padrao",
    parametro: null,
  },
  seguranca: {
    produto: "estoque_seguranca",
    categoria: "estoque_seguranca_padrao",
    parametro: "ESTOQUE.ESTOQUE_SEGURANCA_PADRAO",
  },
};

const CHAVES_PADRAO_EMPRESA = Object.values(REGRAS)
  .map((r) => r.parametro)
  .filter(Boolean);

const definido = (v) => v !== null && v !== undefined;

/**
 * Lê os padrões da empresa sem criar registros. Se a linha ainda não existir,
 * usa o valor padrão do sistema. Com `lock`, bloqueia as linhas em modo
 * compartilhado para serializar com alterações de parâmetros.
 */
async function padroesEmpresa(empresaId, { transaction, lock = false } = {}) {
  const linhas = await ParametroSistema.findAll({
    attributes: ["chave", "valor"],
    where: { empresa_id: empresaId, chave: CHAVES_PADRAO_EMPRESA },
    transaction,
    ...(lock && transaction ? { lock: Transaction.LOCK.SHARE } : {}),
  });
  const valores = new Map(linhas.map((l) => [l.chave, l.valor]));
  return Object.fromEntries(
    CHAVES_PADRAO_EMPRESA.map((chave) => [
      chave,
      Number(valores.get(chave) ?? DEFINICOES.get(chave).valor),
    ]),
  );
}

/**
 * Calcula a regra efetiva de cada campo.
 * @returns {{minimo:{valor:number|null,origem:string|null}, maximo:..., seguranca:...}}
 */
function resolverRegras(produto, categoria, padroes) {
  const resultado = {};
  for (const [nome, regra] of Object.entries(REGRAS)) {
    const doProduto = produto?.[regra.produto];
    const daCategoria = categoria?.[regra.categoria];
    if (definido(doProduto))
      resultado[nome] = { valor: Number(doProduto), origem: "PRODUTO" };
    else if (definido(daCategoria))
      resultado[nome] = { valor: Number(daCategoria), origem: "CATEGORIA" };
    else if (regra.parametro && padroes)
      resultado[nome] = { valor: padroes[regra.parametro], origem: "EMPRESA" };
    else resultado[nome] = { valor: null, origem: null };
  }
  return resultado;
}

/** Retorna a mensagem do conflito ou null quando as regras são coerentes. */
function conflitoRegras(regras) {
  const max = regras.maximo.valor;
  if (max === null) return null;
  if (regras.minimo.valor !== null && max < regras.minimo.valor)
    return "O estoque máximo efetivo não pode ser menor que o mínimo efetivo.";
  if (regras.seguranca.valor !== null && max < regras.seguranca.valor)
    return "O estoque máximo efetivo não pode ser menor que o estoque de segurança efetivo.";
  return null;
}

/** Os padrões da empresa só influenciam a validação quando há máximo efetivo. */
function precisaPadroesEmpresa(produto, categoria) {
  const temMaximo =
    definido(produto?.estoque_maximo) || definido(categoria?.estoque_maximo_padrao);
  if (!temMaximo) return false;
  return ["minimo", "seguranca"].some(
    (nome) =>
      !definido(produto?.[REGRAS[nome].produto]) &&
      !definido(categoria?.[REGRAS[nome].categoria]),
  );
}

/** Valida as regras de um produto (valores candidatos) antes de gravar. */
async function validarProduto(empresaId, produto, categoria, transaction) {
  const padroes = precisaPadroesEmpresa(produto, categoria)
    ? await padroesEmpresa(empresaId, { transaction, lock: true })
    : null;
  const conflito = conflitoRegras(resolverRegras(produto, categoria, padroes));
  if (conflito) throw new AppError(400, conflito);
}

function erroProdutosAfetados(conflitos) {
  const exemplos = conflitos.slice(0, 5).join(", ");
  const resto = conflitos.length > 5 ? ` e mais ${conflitos.length - 5}` : "";
  return new AppError(
    409,
    `A alteração deixaria ${conflitos.length} produto(s) com máximo menor que o mínimo ou a segurança efetivos: ${exemplos}${resto}.`,
  );
}

/**
 * Valida a mudança de padrões de uma categoria contra todos os seus produtos.
 * Deve rodar na mesma transação que grava a categoria (já bloqueada).
 */
async function validarCategoria(empresaId, categoria, transaction) {
  const produtos = await Produto.findAll({
    attributes: ["sku", "estoque_minimo", "estoque_maximo", "estoque_seguranca"],
    where: { empresa_id: empresaId, categoria_id: categoria.id },
    transaction,
  });
  const padroes = produtos.some((p) => precisaPadroesEmpresa(p, categoria))
    ? await padroesEmpresa(empresaId, { transaction, lock: true })
    : null;
  const conflitos = produtos
    .filter((p) => conflitoRegras(resolverRegras(p, categoria, padroes)))
    .map((p) => p.sku);
  if (conflitos.length) throw erroProdutosAfetados(conflitos);
}

/**
 * Valida novos padrões da empresa (chave → número) contra todos os produtos.
 * Chamado dentro da transação que atualiza os parâmetros.
 */
async function validarPadroesEmpresa(empresaId, novosPadroes, transaction) {
  const produtos = await Produto.findAll({
    attributes: ["sku", "estoque_minimo", "estoque_maximo", "estoque_seguranca"],
    where: { empresa_id: empresaId },
    include: [
      {
        model: Categoria,
        as: "categoria",
        attributes: [
          "estoque_minimo_padrao",
          "estoque_maximo_padrao",
          "estoque_seguranca_padrao",
        ],
      },
    ],
    transaction,
  });
  const conflitos = produtos
    .filter((p) => conflitoRegras(resolverRegras(p, p.categoria, novosPadroes)))
    .map((p) => p.sku);
  if (conflitos.length) throw erroProdutosAfetados(conflitos);
}

/** Acrescenta `regras_estoque` (valor efetivo + origem) à resposta do produto. */
function comRegras(produto, padroes) {
  const json = produto.toJSON ? produto.toJSON() : { ...produto };
  return {
    ...json,
    regras_estoque: resolverRegras(json, json.categoria, padroes),
  };
}

module.exports = {
  CHAVES_PADRAO_EMPRESA,
  padroesEmpresa,
  resolverRegras,
  conflitoRegras,
  validarProduto,
  validarCategoria,
  validarPadroesEmpresa,
  comRegras,
};
