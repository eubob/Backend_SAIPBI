"use strict";

/**
 * Consultas somente de leitura do módulo de estoque. Nada aqui altera saldo.
 *
 * Regras de apresentação (plano do módulo):
 * - quantidades de unidades diferentes nunca são somadas entre si: totais
 *   são agrupados por unidade;
 * - valores monetários são gerenciais (saldo × custo de referência do produto),
 *   não valor contábil.
 */

const { Op } = require("sequelize");
const AppError = require("../utils/AppError");
const {
  Produto,
  Categoria,
  Compra,
  ItemCompra,
  Entrada,
  ItemEntrada,
  Fornecedor,
  Saida,
  ItemSaida,
  Cliente,
  MovimentacaoEstoque,
} = require("../models");
const regras = require("./regrasEstoqueService");
const { validarPeriodo } = require("./comercialAnalyticsService");

const TIPOS_MOVIMENTO = [
  "INVENTARIO_INICIAL",
  "ENTRADA_COMPRA",
  "SAIDA_VENDA",
  "ESTORNO_VENDA",
  "AJUSTE",
];
const centavos = (valor) => Math.round(Number(valor) * 100);
const reais = (c) => Math.round(c) / 100;

function limite(valor, padrao = 300, maximo = 2000) {
  if (valor === undefined) return padrao;
  const n = Number(valor);
  if (!Number.isInteger(n) || n < 1 || n > maximo)
    throw new AppError(400, `limite deve ser um inteiro entre 1 e ${maximo}.`);
  return n;
}

/** Período opcional: sem datas, não filtra; com datas, usa a regra comercial. */
function filtroPeriodo(inicio, fim, campo = "data_hora") {
  if (inicio === undefined && fim === undefined) return {};
  const periodo = validarPeriodo(inicio, fim);
  return { [campo]: { [Op.gte]: periodo.inicio, [Op.lt]: periodo.fimExclusivo } };
}

/** Soma quantidades por unidade: [{ unidade: "un", quantidade: 10 }, ...]. */
function somarPorUnidade(pares) {
  const mapa = new Map();
  for (const [unidade, quantidade] of pares)
    mapa.set(unidade, (mapa.get(unidade) || 0) + Number(quantidade));
  return [...mapa].map(([unidade, quantidade]) => ({ unidade, quantidade }));
}

function statusEstoque(saldo, regrasProduto) {
  if (saldo <= 0) return "SEM_ESTOQUE";
  const minimo = regrasProduto.minimo.valor;
  const maximo = regrasProduto.maximo.valor;
  if (minimo !== null && saldo < minimo) return "ABAIXO_MINIMO";
  if (maximo !== null && saldo > maximo) return "ACIMA_MAXIMO";
  return "NORMAL";
}

async function quantidadeEmTransito(empresaId) {
  const itens = await ItemCompra.findAll({
    attributes: ["produto_id", "quantidade"],
    include: [
      {
        model: Compra,
        as: "compra",
        attributes: [],
        where: { empresa_id: empresaId, status: "PEDIDA" },
        required: true,
      },
    ],
  });
  const mapa = new Map();
  for (const item of itens)
    mapa.set(item.produto_id, (mapa.get(item.produto_id) || 0) + Number(item.quantidade));
  return mapa;
}

/** Posição atual por produto: saldo, trânsito, regras efetivas e status. */
async function posicao(empresaId, { incluirInativos = false } = {}) {
  const [produtos, padroes, transito] = await Promise.all([
    Produto.findAll({
      where: { empresa_id: empresaId, ...(incluirInativos ? {} : { ativo: true }) },
      include: [
        {
          model: Categoria,
          as: "categoria",
          attributes: [
            "id",
            "nome",
            "estoque_minimo_padrao",
            "estoque_maximo_padrao",
            "estoque_seguranca_padrao",
          ],
        },
      ],
      order: [["nome", "ASC"]],
    }),
    regras.padroesEmpresa(empresaId),
    quantidadeEmTransito(empresaId),
  ]);

  return produtos.map((p) => {
    const regrasProduto = regras.resolverRegras(p, p.categoria, padroes);
    const saldo = Number(p.estoque_atual);
    return {
      id: p.id,
      nome: p.nome,
      sku: p.sku,
      unidade: p.unidade,
      ativo: p.ativo,
      categoria: p.categoria ? { id: p.categoria.id, nome: p.categoria.nome } : null,
      saldo,
      em_transito: transito.get(p.id) || 0,
      custo: Number(p.custo),
      valor_custo: reais(centavos(p.custo) * Math.max(saldo, 0)),
      regras_estoque: regrasProduto,
      status: statusEstoque(saldo, regrasProduto),
    };
  });
}

const DIRECOES = ["ENTRADA", "SAIDA"];

/** Origem operacional do lançamento (separada da direção do saldo). */
function origemMovimento(m) {
  const compra = m.item_entrada?.entrada?.compra;
  if (m.tipo === "ENTRADA_COMPRA")
    return {
      documento: "COMPRA",
      id: m.item_entrada?.entrada?.compra_id ?? null,
      contraparte: compra?.fornecedor?.razao_social ?? null,
    };
  if (m.tipo === "SAIDA_VENDA" || m.tipo === "ESTORNO_VENDA")
    return {
      documento: "VENDA",
      id: m.item_saida?.saida_id ?? null,
      contraparte: m.item_saida?.saida?.cliente?.nome ?? null,
    };
  return null;
}

function inteiroPositivo(valor, campo, maximo = Number.MAX_SAFE_INTEGER) {
  const n = Number(valor);
  if (!/^[1-9]\d*$/.test(String(valor)) || n > maximo)
    throw new AppError(400, `${campo} inválido.`);
  return n;
}

/**
 * Razão de estoque com filtros combináveis e paginação no servidor.
 * - direcao: ENTRADA (quantidade > 0) ou SAIDA (quantidade < 0); o sinal do
 *   razão é preservado nas linhas.
 * - tipo: origem operacional (lista separada por vírgula).
 * - produto_id, inicio/fim (YYYY-MM-DD, até 366 dias), busca (nome ou SKU).
 */
async function movimentacoes(empresaId, filtros = {}) {
  const where = { empresa_id: empresaId, ...filtroPeriodo(filtros.inicio, filtros.fim) };
  if (filtros.direcao !== undefined && filtros.direcao !== "") {
    if (!DIRECOES.includes(filtros.direcao))
      throw new AppError(400, "Direção inválida. Use ENTRADA ou SAIDA.");
    where.quantidade = { [filtros.direcao === "ENTRADA" ? Op.gt : Op.lt]: 0 };
  }
  if (filtros.tipo !== undefined && filtros.tipo !== "") {
    const tipos = String(filtros.tipo).split(",");
    if (tipos.some((t) => !TIPOS_MOVIMENTO.includes(t)))
      throw new AppError(400, "Tipo de movimentação inválido.");
    where.tipo = tipos;
  }
  if (filtros.produto_id !== undefined && filtros.produto_id !== "")
    where.produto_id = inteiroPositivo(filtros.produto_id, "produto_id");

  const whereProduto = { empresa_id: empresaId };
  const busca = String(filtros.busca ?? "").trim();
  if (busca.length > 100) throw new AppError(400, "Busca muito longa.");
  if (busca) {
    // Escapa curingas do LIKE para que % e _ digitados sejam literais.
    const termo = `%${busca.replace(/[\\%_]/g, (c) => `\\${c}`)}%`;
    whereProduto[Op.or] = [{ nome: { [Op.like]: termo } }, { sku: { [Op.like]: termo } }];
  }

  const pagina = filtros.pagina === undefined ? 1 : inteiroPositivo(filtros.pagina, "pagina", 100000);
  const porPagina =
    filtros.por_pagina === undefined ? 25 : inteiroPositivo(filtros.por_pagina, "por_pagina", 200);

  const { count, rows } = await MovimentacaoEstoque.findAndCountAll({
    where,
    include: [
      {
        model: Produto,
        as: "produto",
        attributes: ["id", "nome", "sku", "unidade"],
        where: whereProduto,
        required: true,
      },
      {
        model: ItemEntrada,
        as: "item_entrada",
        attributes: ["id"],
        include: [
          {
            model: Entrada,
            as: "entrada",
            attributes: ["compra_id"],
            include: [
              {
                model: Compra,
                as: "compra",
                attributes: ["id"],
                include: [{ model: Fornecedor, as: "fornecedor", attributes: ["razao_social"] }],
              },
            ],
          },
        ],
      },
      {
        model: ItemSaida,
        as: "item_saida",
        attributes: ["id", "saida_id"],
        include: [
          {
            model: Saida,
            as: "saida",
            attributes: ["id"],
            include: [{ model: Cliente, as: "cliente", attributes: ["nome"] }],
          },
        ],
      },
    ],
    order: [
      ["data_hora", "DESC"],
      ["id", "DESC"],
    ],
    limit: porPagina,
    offset: (pagina - 1) * porPagina,
  });

  return {
    total: count,
    pagina,
    por_pagina: porPagina,
    itens: rows.map((m) => ({
      id: m.id,
      data_hora: m.data_hora,
      direcao: m.quantidade > 0 ? "ENTRADA" : "SAIDA",
      tipo: m.tipo,
      produto: m.produto,
      quantidade: m.quantidade,
      saldo_anterior: m.saldo_apos - m.quantidade,
      saldo_apos: m.saldo_apos,
      motivo: m.motivo,
      origem: origemMovimento(m),
    })),
  };
}

/** Recebimentos de compras no período (usado nos indicadores do painel). */
async function recebimentos(empresaId, filtros = {}) {
  const registros = await Entrada.findAll({
    where: { empresa_id: empresaId, ...filtroPeriodo(filtros.inicio, filtros.fim, "data_recebimento") },
    include: [
      {
        model: Compra,
        as: "compra",
        attributes: ["id", "data_pedido", "data_prevista", "status"],
        include: [{ model: Fornecedor, as: "fornecedor", attributes: ["id", "razao_social"] }],
      },
      {
        model: ItemEntrada,
        as: "itens",
        attributes: ["quantidade_recebida"],
        include: [
          { model: ItemCompra, as: "item_compra", attributes: ["custo_unitario"] },
          { model: Produto, as: "produto", attributes: ["unidade"] },
        ],
      },
    ],
    order: [
      ["data_recebimento", "DESC"],
      ["id", "DESC"],
    ],
    limit: limite(filtros.limite),
  });

  return registros.map((e) => ({
    id: e.id,
    data_recebimento: e.data_recebimento,
    compra_id: e.compra?.id ?? null,
    data_prevista: e.compra?.data_prevista ?? null,
    no_prazo: e.compra ? e.data_recebimento <= e.compra.data_prevista : null,
    fornecedor: e.compra?.fornecedor ?? null,
    itens: e.itens.length,
    quantidades: somarPorUnidade(e.itens.map((i) => [i.produto.unidade, i.quantidade_recebida])),
    valor: reais(
      e.itens.reduce(
        (total, i) => total + centavos(i.item_compra.custo_unitario) * i.quantidade_recebida,
        0,
      ),
    ),
  }));
}

/** Indicadores do painel de estoque. */
async function resumo(empresaId) {
  const agora = new Date();
  const inicioMes = new Date(Date.UTC(agora.getUTCFullYear(), agora.getUTCMonth(), 1));
  const [itens, ultimas, recebimentosMes, vendasMes, comprasPendentes] = await Promise.all([
    posicao(empresaId),
    movimentacoes(empresaId, { por_pagina: 8 }),
    recebimentos(empresaId, {
      inicio: inicioMes.toISOString().slice(0, 10),
      fim: agora.toISOString().slice(0, 10),
      limite: 2000,
    }),
    Saida.count({
      where: { empresa_id: empresaId, status: "REGISTRADA", data_hora: { [Op.gte]: inicioMes } },
    }),
    Compra.count({ where: { empresa_id: empresaId, status: "PEDIDA" } }),
  ]);

  const porCategoria = new Map();
  for (const p of itens) {
    const nome = p.categoria?.nome || "Sem categoria";
    porCategoria.set(nome, (porCategoria.get(nome) || 0) + centavos(p.valor_custo));
  }
  const contar = (status) => itens.filter((p) => p.status === status).length;

  return {
    atualizado_em: agora.toISOString(),
    produtos_ativos: itens.length,
    saldo_por_unidade: somarPorUnidade(itens.map((p) => [p.unidade, Math.max(p.saldo, 0)])),
    valor_estoque_custo: reais(itens.reduce((t, p) => t + centavos(p.valor_custo), 0)),
    abaixo_minimo: contar("ABAIXO_MINIMO"),
    sem_estoque: contar("SEM_ESTOQUE"),
    acima_maximo: contar("ACIMA_MAXIMO"),
    compras_pendentes: comprasPendentes,
    mes: {
      inicio: inicioMes.toISOString().slice(0, 10),
      recebimentos: recebimentosMes.length,
      valor_recebido: reais(recebimentosMes.reduce((t, e) => t + centavos(e.valor), 0)),
      vendas: vendasMes,
    },
    valor_por_categoria: [...porCategoria]
      .map(([categoria, c]) => ({ categoria, valor: reais(c) }))
      .sort((a, b) => b.valor - a.valor),
    atencao: itens
      .filter((p) => p.status === "SEM_ESTOQUE" || p.status === "ABAIXO_MINIMO")
      .slice(0, 10),
    ultimas_movimentacoes: ultimas.itens,
  };
}

module.exports = { posicao, movimentacoes, resumo };
