"use strict";

const AppError = require("../utils/AppError");
const { Categoria, sequelize } = require("../models");
const regras = require("../services/regrasEstoqueService");

const CAMPOS_PADRAO = [
  "estoque_minimo_padrao",
  "estoque_maximo_padrao",
  "estoque_seguranca_padrao",
];

async function garantirNomeDisponivel(empresaId, nome, categoriaId, transaction) {
  const existente = await Categoria.findOne({
    where: { empresa_id: empresaId, nome },
    transaction,
  });
  if (existente && existente.id !== categoriaId)
    throw new AppError(409, "Já existe categoria com esse nome nesta empresa.");
}

/** Os próprios padrões da categoria também precisam ser coerentes entre si. */
function validarPadroesDaCategoria(categoria) {
  const conflito = regras.conflitoRegras(regras.resolverRegras(null, categoria, null));
  if (conflito) throw new AppError(400, conflito);
}

exports.listarCategorias = async (req, res, next) => {
  try {
    const registros = await Categoria.findAll({
      where: { empresa_id: req.auth.empresaId },
      order: [["nome", "ASC"]],
    });
    return res.status(200).json(registros);
  } catch (error) {
    return next(error);
  }
};

exports.buscarCategoriaPorId = async (req, res, next) => {
  try {
    const registro = await Categoria.findOne({
      where: { id: req.params.id, empresa_id: req.auth.empresaId },
    });
    if (!registro)
      return res.status(404).json({ mensagem: "Categoria não encontrada." });
    return res.status(200).json(registro);
  } catch (error) {
    return next(error);
  }
};

exports.criarCategoria = async (req, res, next) => {
  try {
    const empresaId = req.auth.empresaId;
    const dados = {
      empresa_id: empresaId,
      nome: req.body.nome.trim(),
      ativo: req.body.ativo ?? true,
    };
    for (const campo of CAMPOS_PADRAO) dados[campo] = req.body[campo] ?? null;
    validarPadroesDaCategoria(dados);
    await garantirNomeDisponivel(empresaId, dados.nome);

    const registro = await Categoria.create(dados);
    return res.status(201).json({
      mensagem: "Categoria cadastrada com sucesso.",
      categoria: registro,
    });
  } catch (error) {
    return next(error);
  }
};

exports.atualizarCategoria = async (req, res, next) => {
  try {
    const empresaId = req.auth.empresaId;
    const registro = await sequelize.transaction(async (transaction) => {
      const categoria = await Categoria.findOne({
        where: { id: req.params.id, empresa_id: empresaId },
        lock: transaction.LOCK.UPDATE,
        transaction,
      });
      if (!categoria) throw new AppError(404, "Categoria não encontrada.");

      if (req.body.nome !== undefined) {
        categoria.nome = req.body.nome.trim();
        await garantirNomeDisponivel(empresaId, categoria.nome, categoria.id, transaction);
      }
      if (req.body.ativo !== undefined) categoria.ativo = req.body.ativo;

      const padroesAlterados = CAMPOS_PADRAO.filter(
        (campo) =>
          req.body[campo] !== undefined && req.body[campo] !== categoria[campo],
      );
      for (const campo of padroesAlterados) categoria[campo] = req.body[campo];
      if (padroesAlterados.length) {
        validarPadroesDaCategoria(categoria);
        // Nenhum produto pode passar a ter máximo efetivo < mínimo/segurança.
        await regras.validarCategoria(empresaId, categoria, transaction);
      }

      await categoria.save({ transaction });
      return categoria;
    });

    return res.status(200).json({
      mensagem: "Categoria atualizada com sucesso.",
      categoria: registro,
    });
  } catch (error) {
    return next(error);
  }
};

exports.deletarCategoria = async (req, res, next) => {
  try {
    const registro = await Categoria.findOne({
      where: { id: req.params.id, empresa_id: req.auth.empresaId },
    });
    if (!registro)
      return res.status(404).json({ mensagem: "Categoria não encontrada." });
    registro.ativo = false;
    await registro.save();
    return res.status(200).json({
      mensagem: "Categoria inativada com sucesso.",
      categoria: registro,
    });
  } catch (error) {
    return next(error);
  }
};
