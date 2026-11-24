"use strict";

const AppError = require("../utils/AppError");
const {
  Produto,
  Fornecedor,
  ProdutoFornecedor,
  sequelize,
} = require("../models");

const CAMPOS_EDITAVEIS = [
  "prazo_padrao_dias",
  "lote_minimo",
  "multiplo_compra",
  "custo",
];
const includeFornecedor = [
  {
    model: Fornecedor,
    as: "fornecedor",
    attributes: ["id", "razao_social", "documento", "ativo"],
  },
];

/**
 * Bloqueia a linha do produto: todas as alterações de vínculos de um mesmo
 * produto ficam serializadas, o que torna a troca de principal atômica.
 */
async function bloquearProduto(produtoId, empresaId, transaction) {
  const produto = await Produto.findOne({
    where: { id: produtoId, empresa_id: empresaId },
    lock: transaction.LOCK.UPDATE,
    transaction,
  });
  if (!produto) throw new AppError(404, "Produto não encontrado.");
  return produto;
}

async function desmarcarPrincipal(empresaId, produtoId, transaction) {
  await ProdutoFornecedor.update(
    { principal: false },
    { where: { empresa_id: empresaId, produto_id: produtoId, principal: true }, transaction },
  );
}

const buscarVinculo = (id, empresaId, transaction) =>
  ProdutoFornecedor.findOne({
    where: { id, empresa_id: empresaId },
    include: includeFornecedor,
    transaction,
  });

exports.listarFornecedoresDoProduto = async (req, res, next) => {
  try {
    const produto = await Produto.findOne({
      where: { id: req.params.id, empresa_id: req.auth.empresaId },
    });
    if (!produto)
      return res.status(404).json({ mensagem: "Produto não encontrado." });
    const vinculos = await ProdutoFornecedor.findAll({
      where: { empresa_id: req.auth.empresaId, produto_id: produto.id },
      include: includeFornecedor,
      order: [
        ["principal", "DESC"],
        ["id", "ASC"],
      ],
    });
    return res.json(vinculos);
  } catch (error) {
    return next(error);
  }
};

exports.vincularFornecedor = async (req, res, next) => {
  try {
    const empresaId = req.auth.empresaId;
    const {
      fornecedor_id,
      prazo_padrao_dias,
      lote_minimo = 1,
      multiplo_compra = 1,
      custo,
      principal = false,
    } = req.body;

    const vinculo = await sequelize.transaction(async (transaction) => {
      const produto = await bloquearProduto(req.params.id, empresaId, transaction);
      if (!produto.ativo)
        throw new AppError(409, "Não é possível vincular fornecedor a produto inativo.");
      const fornecedor = await Fornecedor.findOne({
        where: { id: fornecedor_id, empresa_id: empresaId, ativo: true },
        transaction,
      });
      if (!fornecedor)
        throw new AppError(404, "Fornecedor não encontrado nesta empresa ou inativo.");
      const existente = await ProdutoFornecedor.findOne({
        where: { empresa_id: empresaId, produto_id: produto.id, fornecedor_id },
        transaction,
      });
      if (existente) throw new AppError(409, "Fornecedor já vinculado.");

      if (principal) await desmarcarPrincipal(empresaId, produto.id, transaction);
      const criado = await ProdutoFornecedor.create(
        {
          empresa_id: empresaId,
          produto_id: produto.id,
          fornecedor_id,
          prazo_padrao_dias,
          lote_minimo,
          multiplo_compra,
          custo,
          principal,
        },
        { transaction },
      );
      return buscarVinculo(criado.id, empresaId, transaction);
    });

    return res
      .status(201)
      .json({ mensagem: "Fornecedor vinculado com sucesso.", vinculo });
  } catch (error) {
    return next(error);
  }
};

exports.atualizarVinculo = async (req, res, next) => {
  try {
    const empresaId = req.auth.empresaId;
    const vinculo = await sequelize.transaction(async (transaction) => {
      const produto = await bloquearProduto(req.params.id, empresaId, transaction);
      const registro = await ProdutoFornecedor.findOne({
        where: { id: req.params.vinculoId, produto_id: produto.id, empresa_id: empresaId },
        include: includeFornecedor,
        transaction,
      });
      if (!registro) throw new AppError(404, "Vínculo não encontrado.");

      for (const campo of CAMPOS_EDITAVEIS)
        if (req.body[campo] !== undefined) registro[campo] = req.body[campo];

      if (req.body.principal === true && !registro.principal) {
        if (!registro.fornecedor?.ativo)
          throw new AppError(409, "Fornecedor inativo não pode ser o principal.");
        await desmarcarPrincipal(empresaId, produto.id, transaction);
      }
      if (req.body.principal !== undefined) registro.principal = req.body.principal;

      await registro.save({ transaction });
      return registro;
    });

    return res.json({ mensagem: "Vínculo atualizado com sucesso.", vinculo });
  } catch (error) {
    return next(error);
  }
};

exports.removerVinculo = async (req, res, next) => {
  try {
    const empresaId = req.auth.empresaId;
    await sequelize.transaction(async (transaction) => {
      const produto = await bloquearProduto(req.params.id, empresaId, transaction);
      const registro = await ProdutoFornecedor.findOne({
        where: { id: req.params.vinculoId, produto_id: produto.id, empresa_id: empresaId },
        transaction,
      });
      if (!registro) throw new AppError(404, "Vínculo não encontrado.");
      await registro.destroy({ transaction });
    });
    return res.json({ mensagem: "Fornecedor desvinculado com sucesso." });
  } catch (error) {
    return next(error);
  }
};
