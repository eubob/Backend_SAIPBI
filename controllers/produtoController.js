"use strict";

const { Transaction } = require("sequelize");
const AppError = require("../utils/AppError");
const { Produto, Categoria, sequelize } = require("../models");
const regras = require("../services/regrasEstoqueService");

const ATRIBUTOS_CATEGORIA = [
  "id",
  "nome",
  "ativo",
  "estoque_minimo_padrao",
  "estoque_maximo_padrao",
  "estoque_seguranca_padrao",
];
const includeCategoria = [
  { model: Categoria, as: "categoria", attributes: ATRIBUTOS_CATEGORIA },
];
const CAMPOS_REGRA = ["estoque_minimo", "estoque_maximo", "estoque_seguranca"];

async function buscarCategoriaAtiva(id, empresaId, transaction) {
  const categoria = await Categoria.findOne({
    attributes: ATRIBUTOS_CATEGORIA,
    where: { id, empresa_id: empresaId, ativo: true },
    transaction,
    // Serializa com alterações dos padrões da categoria (que usam FOR UPDATE).
    ...(transaction ? { lock: Transaction.LOCK.SHARE } : {}),
  });
  if (!categoria)
    throw new AppError(404, "Categoria não encontrada nesta empresa ou inativa.");
  return categoria;
}

async function garantirSkuDisponivel(empresaId, sku, produtoId, transaction) {
  const existente = await Produto.findOne({
    where: { empresa_id: empresaId, sku },
    transaction,
  });
  if (existente && existente.id !== produtoId)
    throw new AppError(409, "Já existe produto com esse SKU nesta empresa.");
}

async function responderComRegras(empresaId, produto) {
  const padroes = await regras.padroesEmpresa(empresaId);
  return regras.comRegras(produto, padroes);
}

exports.listarProdutos = async (req, res, next) => {
  try {
    const [produtos, padroes] = await Promise.all([
      Produto.findAll({
        where: { empresa_id: req.auth.empresaId },
        include: includeCategoria,
        order: [["nome", "ASC"]],
      }),
      regras.padroesEmpresa(req.auth.empresaId),
    ]);
    return res
      .status(200)
      .json(produtos.map((p) => regras.comRegras(p, padroes)));
  } catch (error) {
    return next(error);
  }
};

exports.buscarProdutoPorId = async (req, res, next) => {
  try {
    const produto = await Produto.findOne({
      where: { id: req.params.id, empresa_id: req.auth.empresaId },
      include: includeCategoria,
    });
    if (!produto)
      return res.status(404).json({ mensagem: "Produto não encontrado." });
    return res.json(await responderComRegras(req.auth.empresaId, produto));
  } catch (error) {
    return next(error);
  }
};

exports.criarProduto = async (req, res, next) => {
  try {
    const empresaId = req.auth.empresaId;
    const {
      categoria_id,
      nome,
      sku,
      unidade = "un",
      preco_venda,
      custo,
      ativo = true,
    } = req.body;
    const dados = {
      empresa_id: empresaId,
      categoria_id,
      nome: nome.trim(),
      sku: sku.trim(),
      unidade: String(unidade).trim() || "un",
      preco_venda,
      custo,
      // O saldo nunca vem do cliente: só movimentações alteram estoque_atual.
      estoque_atual: 0,
      ativo,
    };
    for (const campo of CAMPOS_REGRA) dados[campo] = req.body[campo] ?? null;

    const produto = await sequelize.transaction(async (transaction) => {
      const categoria = await buscarCategoriaAtiva(
        categoria_id,
        empresaId,
        transaction,
      );
      await regras.validarProduto(empresaId, dados, categoria, transaction);
      await garantirSkuDisponivel(empresaId, dados.sku, undefined, transaction);
      return Produto.create(dados, { transaction });
    });
    return res
      .status(201)
      .json({ mensagem: "Produto cadastrado com sucesso.", produto });
  } catch (error) {
    return next(error);
  }
};

exports.atualizarProduto = async (req, res, next) => {
  try {
    const empresaId = req.auth.empresaId;
    const produto = await sequelize.transaction(async (transaction) => {
      const registro = await Produto.findOne({
        where: { id: req.params.id, empresa_id: empresaId },
        lock: transaction.LOCK.UPDATE,
        transaction,
      });
      if (!registro) throw new AppError(404, "Produto não encontrado.");

      const { nome, sku, unidade, preco_venda, custo, ativo } = req.body;
      // Só exige categoria ativa quando ela muda: a tela reenvia a categoria
      // atual, que pode ter sido inativada depois do cadastro do produto.
      const trocaCategoria =
        req.body.categoria_id !== undefined &&
        Number(req.body.categoria_id) !== registro.categoria_id;
      if (trocaCategoria) registro.categoria_id = req.body.categoria_id;
      if (sku !== undefined) {
        registro.sku = sku.trim();
        await garantirSkuDisponivel(empresaId, registro.sku, registro.id, transaction);
      }
      if (nome !== undefined) registro.nome = nome.trim();
      if (unidade !== undefined) registro.unidade = unidade.trim();
      if (preco_venda !== undefined) registro.preco_venda = preco_venda;
      if (custo !== undefined) registro.custo = custo;
      if (ativo !== undefined) registro.ativo = ativo;
      for (const campo of CAMPOS_REGRA)
        if (req.body[campo] !== undefined) registro[campo] = req.body[campo];

      // A categoria é relida (e bloqueada) sempre que as regras podem mudar.
      const categoria =
        trocaCategoria
          ? await buscarCategoriaAtiva(registro.categoria_id, empresaId, transaction)
          : await Categoria.findOne({
              attributes: ATRIBUTOS_CATEGORIA,
              where: { id: registro.categoria_id, empresa_id: empresaId },
              lock: transaction.LOCK.SHARE,
              transaction,
            });
      await regras.validarProduto(empresaId, registro, categoria, transaction);

      await registro.save({ transaction });
      return registro;
    });

    const atualizado = await Produto.findOne({
      where: { id: produto.id, empresa_id: empresaId },
      include: includeCategoria,
    });
    return res.json({
      mensagem: "Produto atualizado com sucesso.",
      produto: await responderComRegras(empresaId, atualizado),
    });
  } catch (error) {
    return next(error);
  }
};

exports.deletarProduto = async (req, res, next) => {
  try {
    const produto = await Produto.findOne({
      where: { id: req.params.id, empresa_id: req.auth.empresaId },
    });
    if (!produto)
      return res.status(404).json({ mensagem: "Produto não encontrado." });
    produto.ativo = false;
    await produto.save();
    return res.json({ mensagem: "Produto inativado com sucesso.", produto });
  } catch (error) {
    return next(error);
  }
};
