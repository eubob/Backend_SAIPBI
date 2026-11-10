"use strict";

const parametroService = require("../services/parametroService");

exports.listarParametros = async (req, res, next) => {
  try {
    const parametros = await parametroService.listar(req.auth.empresaId);

    return res
      .status(200)
      .json(parametros.map(parametroService.formatarParametro));
  } catch (error) {
    return next(error);
  }
};

exports.buscarParametro = async (req, res, next) => {
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
    return next(error);
  }
};

exports.atualizarParametro = async (req, res, next) => {
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
    return next(error);
  }
};

exports.atualizarParametros = async (req, res, next) => {
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
    return next(error);
  }
};
