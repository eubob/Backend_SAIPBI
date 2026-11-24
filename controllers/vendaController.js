"use strict";

const { Op } = require("sequelize");
const AppError = require("../utils/AppError");
const { Saida, ItemSaida, Cliente, Produto } = require("../models");
const {
  indicadoresComerciais,
  validarPeriodo,
} = require("../services/comercialAnalyticsService");

const STATUS = ["REGISTRADA", "CANCELADA"];
const DIA_MS = 86400000;

/** Sem datas, considera os últimos 30 dias (UTC), incluindo hoje. */
function periodoPadrao(inicio, fim) {
  if (inicio !== undefined || fim !== undefined) return { inicio, fim };
  const hoje = new Date();
  return {
    inicio: new Date(hoje.getTime() - 29 * DIA_MS).toISOString().slice(0, 10),
    fim: hoje.toISOString().slice(0, 10),
  };
}

function totalCentavos(itens) {
  return itens.reduce(
    (t, i) => t + Math.round(Number(i.preco_unitario) * 100) * i.quantidade,
    0,
  );
}

exports.listarVendas = async (req, res, next) => {
  try {
    const { status, limite = "300" } = req.query;
    const { inicio, fim } = periodoPadrao(req.query.inicio, req.query.fim);
    const periodo = validarPeriodo(inicio, fim);
    const quantidade = Number(limite);
    if (!Number.isInteger(quantidade) || quantidade < 1 || quantidade > 2000)
      throw new AppError(400, "limite deve ser um inteiro entre 1 e 2000.");
    if (status !== undefined && !STATUS.includes(status))
      throw new AppError(400, "Status inválido.");

    const vendas = await Saida.findAll({
      where: {
        empresa_id: req.auth.empresaId,
        data_hora: { [Op.gte]: periodo.inicio, [Op.lt]: periodo.fimExclusivo },
        ...(status ? { status } : {}),
      },
      include: [
        { model: Cliente, as: "cliente", attributes: ["id", "nome"] },
        {
          model: ItemSaida,
          as: "itens",
          attributes: ["quantidade", "preco_unitario"],
          include: [{ model: Produto, as: "produto", attributes: ["id", "nome", "unidade"] }],
        },
      ],
      order: [
        ["data_hora", "DESC"],
        ["id", "DESC"],
      ],
      limit: quantidade,
    });

    return res.json({
      periodo: { inicio, fim },
      vendas: vendas.map((v) => ({
        id: v.id,
        data_hora: v.data_hora,
        status: v.status,
        cancelada_em: v.cancelada_em,
        cliente: v.cliente,
        itens: v.itens.length,
        // Bruto: quantidade × preço unitário, sem impostos/descontos/devoluções.
        valor: totalCentavos(v.itens) / 100,
      })),
    });
  } catch (error) {
    return next(error);
  }
};

exports.indicadores = async (req, res, next) => {
  try {
    const { inicio, fim } = periodoPadrao(req.query.inicio, req.query.fim);
    const periodo = validarPeriodo(inicio, fim);
    const empresaId = req.auth.empresaId;
    const [dados, canceladas] = await Promise.all([
      indicadoresComerciais(empresaId, inicio, fim),
      Saida.count({
        where: {
          empresa_id: empresaId,
          status: "CANCELADA",
          data_hora: { [Op.gte]: periodo.inicio, [Op.lt]: periodo.fimExclusivo },
        },
      }),
    ]);
    return res.json({
      ...dados,
      status: [
        { status: "REGISTRADA", quantidade: dados.indicadores.quantidadeVendas },
        { status: "CANCELADA", quantidade: canceladas },
      ],
    });
  } catch (error) {
    return next(error);
  }
};
