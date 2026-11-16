const { indicadoresComerciais } = require('./comercialAnalyticsService');

// Contrato estável: o serviço de indicadores reais pode ser substituído
// sem alterar o controlador nem o provedor de IA.
function exemploDemonstrativo(inicio, fim) {
  return {
    periodo: { inicio, fim },
    indicadores: { quantidadeVendas: 320, faturamento: 125430, ticketMedio: 391.97, unidadesVendidas: 480, clientesIdentificados: 152 },
    faturamentoDiario: [],
    produtosMaisVendidos: [],
    limitacoes: [
      'DADOS SINTÉTICOS PARA DESENVOLVIMENTO: não representam operações reais.',
      'Sem série temporal, metas ou detalhamento de produtos; não inferir tendências nem causas.'
    ]
  };
}

async function obterContextoComercial({ empresaId, inicio, fim }) {
  // O modo demo só é permitido em desenvolvimento e exige ativação explícita.
  const demonstracao = process.env.NODE_ENV === 'development' && process.env.IA_MODO_DEMO === 'true';
  if (demonstracao) {
    // Valida o período com a mesma regra do serviço real, sem consultar o banco.
    const padrao = /^\d{4}-\d{2}-\d{2}$/;
    if (!padrao.test(inicio || '') || !padrao.test(fim || '')) {
      throw Object.assign(new Error('Informe datas no formato YYYY-MM-DD.'), { status: 400 });
    }
    const a = new Date(`${inicio}T00:00:00Z`);
    const b = new Date(`${fim}T00:00:00Z`);
    if (Number.isNaN(a.getTime()) || Number.isNaN(b.getTime()) || a.toISOString().slice(0,10) !== inicio || b.toISOString().slice(0,10) !== fim || b < a || (b-a)/86400000 > 366) {
      throw Object.assign(new Error('Período inválido ou superior a 366 dias.'), { status: 400 });
    }
    return { ...exemploDemonstrativo(inicio, fim), origem: 'DEMONSTRACAO' };
  }
  const dados = await indicadoresComerciais(empresaId, inicio, fim);
  return { ...dados, origem: 'BANCO' };
}

module.exports = { obterContextoComercial };
