"use strict";

const consulta = require("../services/estoqueConsultaService");

// Leituras do módulo de estoque. Operações que alteram saldo entram na F03.
const responder = (fn) => async (req, res, next) => {
  try {
    return res.json(await fn(req.auth.empresaId, req.query));
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  resumo: responder((empresaId) => consulta.resumo(empresaId)),
  posicao: responder((empresaId, q) =>
    consulta.posicao(empresaId, { incluirInativos: q.inativos === "true" }),
  ),
  movimentacoes: responder(consulta.movimentacoes),
};
