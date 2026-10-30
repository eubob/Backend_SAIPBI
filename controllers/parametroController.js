"use strict";

const parametroService = require("../services/parametroService");

exports.listarParametros = async (req, res) => {
  try {
    const parametros = await parametroService.listar(req.auth.empresaId);

    return res
      .status(200)
      .json(parametros.map(parametroService.formatarParametro));
  } catch (error) {
    console.error("Erro ao listar parâmetros:", error);

    return res.status(500).json({
      mensagem: "Erro interno ao listar parâmetros.",
    });
  }
};

exports.buscarParametro = async (req, res) => {
  try {
    const parametro = await parametroService.buscarPorChave(
      req.auth.empresaId,
      req.params.chave,
    );

    if (!parametro) {
      return res.status(404).json({
        mensagem: "Parâmetro não encontrado.",
      });
    }

    return res.status(200).json(parametroService.formatarParametro(parametro));
  } catch (error) {
    console.error("Erro ao buscar parâmetro:", error);

    return res.status(500).json({
      mensagem: "Erro interno ao buscar parâmetro.",
    });
  }
};

exports.atualizarParametro = async (req, res) => {
  try {
    if (req.body.valor === undefined) {
      return res.status(400).json({
        mensagem: "O valor do parâmetro é obrigatório.",
      });
    }

    const parametro = await parametroService.atualizar(
      req.auth.empresaId,
      req.params.chave,
      req.body.valor,
    );

    return res.status(200).json({
      mensagem: "Parâmetro atualizado com sucesso.",
      parametro: parametroService.formatarParametro(parametro),
    });
  } catch (error) {
    console.error("Erro ao atualizar parâmetro:", error);

    return res.status(error.status || 400).json({
      mensagem: error.message || "Não foi possível atualizar o parâmetro.",
    });
  }
};

exports.atualizarParametros = async (req, res) => {
  try {
    const parametros = await parametroService.atualizarVarios(
      req.auth.empresaId,
      req.body.parametros,
    );

    return res.status(200).json({
      mensagem: "Parâmetros atualizados com sucesso.",
      parametros: parametros.map(parametroService.formatarParametro),
    });
  } catch (error) {
    console.error("Erro ao atualizar parâmetros:", error);

    return res.status(error.status || 400).json({
      mensagem: error.message || "Não foi possível atualizar os parâmetros.",
    });
  }
};
