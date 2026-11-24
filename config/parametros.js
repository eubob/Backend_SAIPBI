"use strict";

/**
 * Parâmetros por empresa (tabela parametro_sistema).
 *
 * `minimo`/`maximo` são regras de validação aplicadas pelo servidor; não são
 * gravados no banco. Novos parâmetros entram aqui e são criados para cada
 * empresa na primeira leitura da tela de parâmetros.
 */
const PARAMETROS_PADRAO = [
  {
    chave: "ESTOQUE.PERMITIR_SALDO_NEGATIVO",
    valor: "false",
    tipo: "BOOLEANO",
    grupo: "ESTOQUE",
    descricao: "Define se o sistema permite estoque com saldo negativo.",
  },
  {
    chave: "ESTOQUE.ESTOQUE_MINIMO_PADRAO",
    valor: "0",
    tipo: "INTEIRO",
    grupo: "ESTOQUE",
    descricao:
      "Estoque mínimo herdado por produtos e categorias que não definem o próprio valor.",
    minimo: 0,
    maximo: 2147483647,
  },
  {
    chave: "ESTOQUE.ESTOQUE_SEGURANCA_PADRAO",
    valor: "0",
    tipo: "INTEIRO",
    grupo: "ESTOQUE",
    descricao:
      "Estoque de segurança herdado por produtos e categorias que não definem o próprio valor.",
    minimo: 0,
    maximo: 2147483647,
  },
  {
    chave: "ESTOQUE.DIAS_COBERTURA_PADRAO",
    valor: "15",
    tipo: "INTEIRO",
    grupo: "ESTOQUE",
    descricao: "Quantidade padrão de dias de cobertura de estoque.",
    minimo: 1,
    maximo: 365,
  },
  {
    chave: "ESTOQUE.NIVEL_SERVICO_PADRAO",
    valor: "95",
    tipo: "DECIMAL",
    grupo: "ESTOQUE",
    descricao: "Nível de serviço padrão (%) utilizado nos cálculos de estoque.",
    minimo: 50,
    maximo: 99.9,
  },

  {
    chave: "COMPRAS.LEAD_TIME_PADRAO",
    valor: "7",
    tipo: "INTEIRO",
    grupo: "COMPRAS",
    descricao: "Lead time padrão de fornecedores, em dias.",
    minimo: 1,
    maximo: 365,
  },
  {
    chave: "COMPRAS.LOTE_MINIMO_PADRAO",
    valor: "1",
    tipo: "INTEIRO",
    grupo: "COMPRAS",
    descricao: "Lote mínimo padrão utilizado nas recomendações de compra.",
    minimo: 1,
    maximo: 1000000,
  },

  {
    chave: "ANALYTICS.JANELA_HISTORICO_DIAS",
    valor: "90",
    tipo: "INTEIRO",
    grupo: "ANALYTICS",
    descricao:
      "Janela operacional de consulta, em dias. Não limita o histórico armazenado.",
    minimo: 7,
    maximo: 3650,
  },
  {
    chave: "ANALYTICS.PERIODO_PREVISAO_DIAS",
    valor: "30",
    tipo: "INTEIRO",
    grupo: "ANALYTICS",
    descricao: "Horizonte padrão das previsões de demanda, em dias.",
    minimo: 1,
    maximo: 365,
  },

  {
    chave: "RISCO.LIMITE_ALTO",
    valor: "80",
    tipo: "DECIMAL",
    grupo: "RISCO",
    descricao: "Percentual mínimo para classificação de risco alto.",
    minimo: 0,
    maximo: 100,
  },
  {
    chave: "RISCO.LIMITE_MEDIO",
    valor: "50",
    tipo: "DECIMAL",
    grupo: "RISCO",
    descricao:
      "Percentual mínimo para classificação de risco médio (deve ser menor que o limite alto).",
    minimo: 0,
    maximo: 100,
  },
];

const DEFINICOES = new Map(PARAMETROS_PADRAO.map((p) => [p.chave, p]));

/** Campos que são gravados em parametro_sistema (sem as regras de validação). */
const registroPadrao = ({ chave, valor, tipo, grupo, descricao }) => ({
  chave,
  valor,
  tipo,
  grupo,
  descricao,
});

module.exports = { PARAMETROS_PADRAO, DEFINICOES, registroPadrao };
