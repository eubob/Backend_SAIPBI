"use strict";

const AppError = require("../utils/AppError");
const { Saida, ItemSaida, Produto, Sequelize } = require("../models");

const { Op } = Sequelize;
const DIA_MS = 86400000;
const LIMITE_DIAS = 366;
const FORMATO_DATA = /^\d{4}-\d{2}-\d{2}$/;

/**
 * Valida um período fechado [inicio, fim] em datas UTC (YYYY-MM-DD) e devolve
 * o intervalo semiaberto [inicio, fimExclusivo) usado nas consultas.
 */
function validarPeriodo(inicio, fim) {
  if (!FORMATO_DATA.test(inicio || "") || !FORMATO_DATA.test(fim || "")) {
    throw new AppError(400, "Informe inicio e fim no formato YYYY-MM-DD.");
  }
  const a = new Date(`${inicio}T00:00:00.000Z`);
  const b = new Date(`${fim}T00:00:00.000Z`);
  if (
    Number.isNaN(a.getTime()) ||
    Number.isNaN(b.getTime()) ||
    a.toISOString().slice(0, 10) !== inicio ||
    b.toISOString().slice(0, 10) !== fim ||
    b < a ||
    (b - a) / DIA_MS > LIMITE_DIAS
  ) {
    throw new AppError(
      400,
      `Período inválido ou superior a ${LIMITE_DIAS} dias.`,
    );
  }
  return { inicio: a, fimExclusivo: new Date(b.getTime() + DIA_MS) };
}

const dinheiro = (centavos) => Math.round(centavos) / 100;

async function indicadoresComerciais(empresaId, inicio, fim) {
  const periodo = validarPeriodo(inicio, fim);
  const vendas = await Saida.findAll({
    where: {
      empresa_id: empresaId,
      tipo: "VENDA",
      status: "REGISTRADA",
      data_hora: { [Op.gte]: periodo.inicio, [Op.lt]: periodo.fimExclusivo },
    },
    attributes: ["id", "data_hora", "cliente_id"],
    include: [
      {
        model: ItemSaida,
        as: "itens",
        attributes: ["produto_id", "quantidade", "preco_unitario"],
        include: [
          {
            model: Produto,
            as: "produto",
            attributes: ["id", "nome"],
            required: true,
            where: { empresa_id: empresaId },
          },
        ],
      },
    ],
    order: [["data_hora", "ASC"]],
  });

  const porDia = new Map();
  const produtos = new Map();
  const clientes = new Set();
  let receitaCentavos = 0;
  let unidades = 0;

  for (const venda of vendas) {
    const dia = new Date(venda.data_hora).toISOString().slice(0, 10);
    if (venda.cliente_id) clientes.add(venda.cliente_id);
    for (const item of venda.itens) {
      const quantidade = Number(item.quantidade);
      const centavos = Math.round(Number(item.preco_unitario) * 100) * quantidade;
      receitaCentavos += centavos;
      unidades += quantidade;
      porDia.set(dia, (porDia.get(dia) || 0) + centavos);
      const p = produtos.get(item.produto_id) || {
        produto: item.produto.nome,
        unidades: 0,
        receitaCentavos: 0,
      };
      p.unidades += quantidade;
      p.receitaCentavos += centavos;
      produtos.set(item.produto_id, p);
    }
  }

  return {
    periodo: { inicio, fim },
    indicadores: {
      quantidadeVendas: vendas.length,
      faturamento: dinheiro(receitaCentavos),
      ticketMedio: vendas.length ? dinheiro(receitaCentavos / vendas.length) : 0,
      unidadesVendidas: unidades,
      clientesIdentificados: clientes.size,
    },
    faturamentoDiario: [...porDia].map(([data, centavos]) => ({
      data,
      valor: dinheiro(centavos),
    })),
    produtosMaisVendidos: [...produtos.values()]
      .sort((a, b) => b.receitaCentavos - a.receitaCentavos)
      .slice(0, 5)
      .map((p) => ({
        produto: p.produto,
        unidades: p.unidades,
        faturamento: dinheiro(p.receitaCentavos),
      })),
    limitacoes: [
      "Sem metas ou vendedores: o esquema atual não relaciona saídas a vendedores nem define metas.",
      "Faturamento bruto (quantidade × preço unitário) de saídas REGISTRADAS; não considera impostos, descontos ou devoluções e não equivale a receita recebida.",
      "Clientes identificados não representam todos os clientes ativos.",
    ],
  };
}

module.exports = { validarPeriodo, indicadoresComerciais };
