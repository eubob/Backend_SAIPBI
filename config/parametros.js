"use strict";

const PARAMETROS_PADRAO = [
  {
    chave: "ESTOQUE.PERMITIR_SALDO_NEGATIVO",
    valor: "false",
    tipo: "BOOLEANO",
    grupo: "ESTOQUE",
    descricao: "Define se o sistema permite estoque com saldo negativo.",
  },
  {
    chave: "ESTOQUE.DIAS_COBERTURA_PADRAO",
    valor: "15",
    tipo: "INTEIRO",
    grupo: "ESTOQUE",
    descricao: "Quantidade padrão de dias de cobertura de estoque.",
  },
  {
    chave: "ESTOQUE.NIVEL_SERVICO_PADRAO",
    valor: "95",
    tipo: "DECIMAL",
    grupo: "ESTOQUE",
    descricao: "Nível de serviço padrão utilizado nos cálculos de estoque.",
  },

  {
    chave: "COMPRAS.LEAD_TIME_PADRAO",
    valor: "7",
    tipo: "INTEIRO",
    grupo: "COMPRAS",
    descricao: "Lead time padrão de fornecedores, em dias.",
  },
  {
    chave: "COMPRAS.LOTE_MINIMO_PADRAO",
    valor: "1",
    tipo: "INTEIRO",
    grupo: "COMPRAS",
    descricao: "Lote mínimo padrão utilizado nas recomendações de compra.",
  },

  {
    chave: "ANALYTICS.JANELA_HISTORICO_DIAS",
    valor: "90",
    tipo: "INTEIRO",
    grupo: "ANALYTICS",
    descricao: "Quantidade padrão de dias utilizados na janela histórica.",
  },
  {
    chave: "ANALYTICS.PERIODO_PREVISAO_DIAS",
    valor: "30",
    tipo: "INTEIRO",
    grupo: "ANALYTICS",
    descricao: "Horizonte padrão das previsões de demanda.",
  },

  {
    chave: "RISCO.LIMITE_ALTO",
    valor: "80",
    tipo: "DECIMAL",
    grupo: "RISCO",
    descricao: "Percentual mínimo para classificação de risco alto.",
  },
  {
    chave: "RISCO.LIMITE_MEDIO",
    valor: "50",
    tipo: "DECIMAL",
    grupo: "RISCO",
    descricao: "Percentual mínimo para classificação de risco médio.",
  },
];

module.exports = {
  PARAMETROS_PADRAO,
};
