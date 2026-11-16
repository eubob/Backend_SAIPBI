const { Saida, ItemSaida, Produto, Cliente, Sequelize } = require('../models');
const { Op } = Sequelize;

function validarPeriodo(inicio, fim) {
  const regex = /^\d{4}-\d{2}-\d{2}$/;
  if (!regex.test(inicio || '') || !regex.test(fim || '')) throw Object.assign(new Error('Informe inicio e fim em YYYY-MM-DD.'), { status: 400 });
  const a = new Date(`${inicio}T00:00:00.000Z`);
  const b = new Date(`${fim}T00:00:00.000Z`);
  if (isNaN(a) || isNaN(b) || a.toISOString().slice(0,10) !== inicio || b.toISOString().slice(0,10) !== fim || b < a || (b-a)/86400000 > 366) throw Object.assign(new Error('Período inválido ou superior a 366 dias.'), { status: 400 });
  const exclusivo = new Date(b.getTime()+86400000);
  return { a, exclusivo };
}

async function indicadoresComerciais(empresaId, inicio, fim) {
  const { a, exclusivo } = validarPeriodo(inicio, fim);
  const vendas = await Saida.findAll({
    where: { empresa_id: empresaId, tipo: 'VENDA', status: 'REGISTRADA', data_hora: { [Op.gte]: a, [Op.lt]: exclusivo } },
    attributes: ['id', 'data_hora', 'cliente_id'],
    include: [{ model: ItemSaida, as: 'itens', attributes: ['produto_id','quantidade','preco_unitario'], include: [{ model: Produto, as: 'produto', attributes: ['id','nome'], required: true, where: { empresa_id: empresaId } }] }],
    order: [['data_hora','ASC']]
  });
  const porDia = new Map();
  const produtos = new Map();
  const clientes = new Set();
  let receitaCentavos = 0;
  let unidades = 0;
  for (const venda of vendas) {
    const dia = new Date(venda.data_hora).toISOString().slice(0,10);
    if (venda.cliente_id) clientes.add(venda.cliente_id);
    for (const item of venda.itens) {
      const centavos = Math.round(Number(item.preco_unitario)*100) * Number(item.quantidade);
      receitaCentavos += centavos;
      unidades += Number(item.quantidade);
      porDia.set(dia, (porDia.get(dia)||0)+centavos);
      const id = item.produto_id;
      const p = produtos.get(id) || { produto: item.produto.nome, unidades: 0, receitaCentavos: 0 };
      p.unidades += Number(item.quantidade);
      p.receitaCentavos += centavos;
      produtos.set(id,p);
    }
  }
  const dinheiro = c => Math.round(c)/100;
  return {
    periodo: { inicio, fim },
    indicadores: { quantidadeVendas: vendas.length, faturamento: dinheiro(receitaCentavos), ticketMedio: vendas.length ? dinheiro(receitaCentavos/vendas.length) : 0, unidadesVendidas: unidades, clientesIdentificados: clientes.size },
    faturamentoDiario: [...porDia].map(([data, centavos])=>({ data, valor: dinheiro(centavos) })),
    produtosMaisVendidos: [...produtos.values()].sort((a,b)=>b.receitaCentavos-a.receitaCentavos).slice(0,5).map(p=>({ produto:p.produto, unidades:p.unidades, faturamento:dinheiro(p.receitaCentavos) })),
    limitacoes: ['Sem metas ou vendedores: o esquema atual não relaciona saídas a vendedores nem define metas.', 'Vendas calculadas a partir de saídas REGISTRADAS e seus itens; não equivalem necessariamente a receita recebida.', 'Clientes identificados não representam todos os clientes ativos.']
  };
}
module.exports = { indicadoresComerciais };
