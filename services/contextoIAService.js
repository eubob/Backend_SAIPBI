"use strict";

const {
  indicadoresComerciais,
  validarPeriodo,
} = require("./comercialAnalyticsService");

// Contrato estável: o serviço de indicadores reais pode ser substituído
// sem alterar o controlador nem o provedor de IA.
function exemploDemonstrativo(inicio, fim) {
  return {
    periodo: { inicio, fim },
    indicadores: {
      quantidadeVendas: 320,
      faturamento: 125430,
      ticketMedio: 391.97,
      unidadesVendidas: 480,
      clientesIdentificados: 152,
    },
    faturamentoDiario: [],
    produtosMaisVendidos: [],
    limitacoes: [
      "DADOS SINTÉTICOS PARA DESENVOLVIMENTO: não representam operações reais.",
      "Sem série temporal, metas ou detalhamento de produtos; não inferir tendências nem causas.",
    ],
  };
}

function modoDemonstracaoAtivo() {
  // Só é permitido em desenvolvimento e exige ativação explícita.
  return (
    process.env.NODE_ENV === "development" && process.env.IA_MODO_DEMO === "true"
  );
}

async function obterContextoComercial({ empresaId, inicio, fim }) {
  if (modoDemonstracaoAtivo()) {
    // Mesma regra de período do serviço real, sem consultar o banco.
    validarPeriodo(inicio, fim);
    return { ...exemploDemonstrativo(inicio, fim), origem: "DEMONSTRACAO" };
  }
  const dados = await indicadoresComerciais(empresaId, inicio, fim);
  return { ...dados, origem: "BANCO" };
}

module.exports = { obterContextoComercial };
