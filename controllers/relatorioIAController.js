"use strict";

const { obterContextoComercial } = require("../services/contextoIAService");
const { gerarAnalise } = require("../services/openRouterService");

async function contexto(req, res, next) {
  try {
    const { inicio, fim } = req.query;
    const dados = await obterContextoComercial({
      empresaId: req.auth.empresaId,
      inicio,
      fim,
    });
    return res.json(dados);
  } catch (erro) {
    return next(erro);
  }
}

async function relatorio(req, res, next) {
  try {
    const { inicio, fim } = req.body || {};
    const dados = await obterContextoComercial({
      empresaId: req.auth.empresaId,
      inicio,
      fim,
    });
    if (!dados.indicadores.quantidadeVendas) {
      return res.json({
        dados,
        relatorio: null,
        mensagem: "Sem vendas no período. Não foi necessário chamar a IA.",
      });
    }
    const resultado = await gerarAnalise(dados);
    return res.json({ dados, ...resultado, geradoEm: new Date().toISOString() });
  } catch (erro) {
    return next(erro);
  }
}

module.exports = { contexto, relatorio };
