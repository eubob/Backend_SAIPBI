"use strict";

/**
 * DADOS SINTÉTICOS DE DESENVOLVIMENTO — não representam operações reais.
 *
 * Gera, para UMA empresa já existente, cadastros (categorias, fornecedores,
 * clientes, produtos e vínculos) e 24 meses de histórico coerente:
 * inventário inicial, compras (recebidas, pendentes e canceladas),
 * recebimentos, vendas com sazonalidade, cancelamentos com estorno e ajustes.
 * O razão (movimentacao_estoque) fecha com produto.estoque_atual.
 *
 * Uso (somente fora de produção):
 *   npm run db:seed:dev          # empresa demo (documento 00000000000191)
 *   SEED_EMPRESA_DOCUMENTO=... npm run db:seed:dev
 *   npm run db:seed:dev:undo     # remove somente o que este seeder criou
 *
 * Identificação: SKUs com prefixo DEV- e observações iniciadas por [DEV].
 * Idempotente: se a empresa já tiver produtos DEV-, nada é inserido.
 * O gerador é determinístico (mesma semente → mesmos dados).
 */

const MARCADOR = "[DEV] Dados sintéticos de desenvolvimento";
const PREFIXO_SKU = "DEV-";
const DIAS_HISTORICO = 730;
const DIA_MS = 86400000;
const FUSO_MS = 3 * 3600000; // horário de Brasília (UTC-3), sem horário de verão

const CATEGORIAS = [
  { nome: "Refrigerantes", estoque_minimo_padrao: 40, estoque_maximo_padrao: 600, estoque_seguranca_padrao: 20 },
  { nome: "Sucos", estoque_minimo_padrao: 20, estoque_maximo_padrao: null, estoque_seguranca_padrao: 10 },
  { nome: "Águas", estoque_minimo_padrao: 60, estoque_maximo_padrao: 900, estoque_seguranca_padrao: 30 },
  { nome: "Energéticos", estoque_minimo_padrao: null, estoque_maximo_padrao: null, estoque_seguranca_padrao: null },
  { nome: "Chás e Cafés", estoque_minimo_padrao: 15, estoque_maximo_padrao: 250, estoque_seguranca_padrao: 5 },
];

const FORNECEDORES = [
  { chave: "fab", razao_social: "Fábrica Sintética de Bebidas Ltda (DEV)", documento: "DEV0000000001", contato: "comercial@fabrica.dev" },
  { chave: "dist", razao_social: "Distribuidora Exemplo Central (DEV)", documento: "DEV0000000002", contato: "pedidos@distribuidora.dev" },
  { chave: "agua", razao_social: "Fonte Modelo Águas Minerais (DEV)", documento: "DEV0000000003", contato: "vendas@fonte.dev" },
  { chave: "cha", razao_social: "Importadora Teste de Chás (DEV)", documento: "DEV0000000004", contato: "contato@importadora.dev" },
];

const CLIENTES = [
  ["Mercado Bom Preço (DEV)", "DEVCLI0000001"],
  ["Padaria Pão Quente (DEV)", "DEVCLI0000002"],
  ["Restaurante Sabor Caseiro (DEV)", "DEVCLI0000003"],
  ["Lanchonete Esquina (DEV)", "DEVCLI0000004"],
  ["Conveniência Posto 24h (DEV)", "DEVCLI0000005"],
  ["Hotel Central (DEV)", "DEVCLI0000006"],
  ["Academia Movimento (DEV)", "DEVCLI0000007"],
  ["Bar do Centro (DEV)", "DEVCLI0000008"],
];

// perfil de sazonalidade → fator por mês (jan..dez)
const SAZONALIDADE = {
  verao: [1.5, 1.4, 1.15, 0.95, 0.8, 0.7, 0.7, 0.8, 0.95, 1.1, 1.3, 1.7],
  inverno: [0.6, 0.6, 0.8, 1.0, 1.3, 1.6, 1.7, 1.4, 1.1, 0.9, 0.7, 0.7],
  natal: [1.0, 0.9, 0.95, 1.0, 1.0, 0.95, 0.95, 1.0, 1.0, 1.05, 1.3, 2.1],
  estavel: [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
};
// domingo..sábado
const DIA_SEMANA = [0.55, 0.9, 0.95, 1.0, 1.05, 1.3, 1.25];

// demanda = unidades/dia em mês neutro; regras null herdam da categoria/empresa
const PRODUTOS = [
  { sku: "REF-COLA-2L", nome: "Refrigerante Cola 2L", cat: "Refrigerantes", un: "un", preco: 9.99, custo: 5.4, demanda: 9, perfil: "natal", forn: ["fab", "dist"], multiplo: 6 },
  { sku: "REF-COLA-350", nome: "Refrigerante Cola Lata 350ml", cat: "Refrigerantes", un: "un", preco: 4.49, custo: 2.1, demanda: 14, perfil: "verao", forn: ["fab", "dist"], multiplo: 12 },
  { sku: "REF-LARANJA-2L", nome: "Refrigerante Laranja 2L", cat: "Refrigerantes", un: "un", preco: 8.49, custo: 4.6, demanda: 5, perfil: "verao", forn: ["fab"], multiplo: 6 },
  { sku: "REF-GUARANA-2L", nome: "Refrigerante Guaraná 2L", cat: "Refrigerantes", un: "un", preco: 8.99, custo: 4.8, demanda: 6, perfil: "natal", forn: ["dist"], multiplo: 6, minimo: 30 },
  { sku: "REF-LIMAO-1L", nome: "Refrigerante Limão 1L", cat: "Refrigerantes", un: "un", preco: 6.29, custo: 3.2, demanda: 2.5, perfil: "verao", forn: ["dist"], multiplo: 6, minimo: 0 },
  { sku: "SUC-UVA-1L", nome: "Suco de Uva Integral 1L", cat: "Sucos", un: "un", preco: 14.9, custo: 8.3, demanda: 3, perfil: "natal", forn: ["dist"], multiplo: 6 },
  { sku: "SUC-LARANJA-1L", nome: "Suco de Laranja 1L", cat: "Sucos", un: "un", preco: 9.5, custo: 5.1, demanda: 4, perfil: "verao", forn: ["dist", "fab"], multiplo: 12, maximo: 200 },
  { sku: "AGU-500", nome: "Água Mineral 500ml", cat: "Águas", un: "un", preco: 2.5, custo: 0.9, demanda: 22, perfil: "verao", forn: ["agua"], multiplo: 12 },
  { sku: "AGU-1500", nome: "Água Mineral 1,5L", cat: "Águas", un: "un", preco: 4.2, custo: 1.7, demanda: 10, perfil: "verao", forn: ["agua", "dist"], multiplo: 6 },
  { sku: "AGU-GAS-500", nome: "Água com Gás 500ml", cat: "Águas", un: "un", preco: 3.2, custo: 1.2, demanda: 6, perfil: "estavel", forn: ["agua"], multiplo: 12 },
  { sku: "ENE-250", nome: "Energético 250ml", cat: "Energéticos", un: "un", preco: 9.9, custo: 5.5, demanda: 4, perfil: "estavel", forn: ["dist"], multiplo: 6, minimo: 24, seguranca: 12 },
  { sku: "ENE-473", nome: "Energético 473ml", cat: "Energéticos", un: "un", preco: 13.9, custo: 7.9, demanda: 1.5, perfil: "estavel", forn: ["dist"], multiplo: 6 },
  { sku: "CHA-MATE-1L", nome: "Chá Mate 1L", cat: "Chás e Cafés", un: "un", preco: 6.9, custo: 3.3, demanda: 3, perfil: "verao", forn: ["cha", "dist"], multiplo: 6 },
  { sku: "CHA-CAMOMILA", nome: "Chá de Camomila (caixa 15 sachês)", cat: "Chás e Cafés", un: "cx", preco: 7.5, custo: 3.9, demanda: 1.8, perfil: "inverno", forn: ["cha"], multiplo: 10 },
  { sku: "CAF-GRAO-500", nome: "Café em Grão 500g", cat: "Chás e Cafés", un: "pct", preco: 32.9, custo: 19.5, demanda: 1.6, perfil: "inverno", forn: ["cha"], multiplo: 5 },
];

// ---------- utilitários determinísticos ----------
function gerador(semente) {
  let a = semente >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const rand = gerador(20261124);
const entre = (min, max) => min + Math.floor(rand() * (max - min + 1));
const escolher = (lista) => lista[Math.floor(rand() * lista.length)];
function poisson(lambda) {
  if (lambda <= 0) return 0;
  const limite = Math.exp(-lambda);
  let k = 0;
  let p = 1;
  do {
    k += 1;
    p *= rand();
  } while (p > limite);
  return k - 1;
}
const dataISO = (d) => new Date(d).toISOString().slice(0, 10);
const arredondarMultiplo = (q, m) => Math.ceil(q / m) * m;
/** Data/hora UTC a partir do dia (meia-noite local) e de uma hora local. */
const horaLocal = (diaLocalMs, hora, minuto = 0) =>
  new Date(diaLocalMs + hora * 3600000 + minuto * 60000 + FUSO_MS);

async function inserirEmLotes(queryInterface, tabela, linhas, transaction, tamanho = 1000) {
  for (let i = 0; i < linhas.length; i += tamanho)
    await queryInterface.bulkInsert(tabela, linhas.slice(i, i + tamanho), { transaction });
}

async function proximoId(sequelize, tabela, transaction) {
  const [[{ maximo }]] = await sequelize.query(
    `SELECT COALESCE(MAX(id), 0) AS maximo FROM \`${tabela}\``,
    { transaction },
  );
  return Number(maximo) + 1;
}

async function localizarEmpresa(sequelize) {
  const documento = process.env.SEED_EMPRESA_DOCUMENTO || "00000000000191";
  const [empresas] = await sequelize.query(
    "SELECT id FROM empresa WHERE documento = ? AND deleted_at IS NULL LIMIT 1",
    { replacements: [documento] },
  );
  if (!empresas.length)
    throw new Error(
      `Empresa com documento ${documento} não encontrada. Rode os seeders iniciais ou defina SEED_EMPRESA_DOCUMENTO.`,
    );
  return empresas[0].id;
}

function garantirAmbienteDesenvolvimento() {
  if ((process.env.NODE_ENV || "development") === "production")
    throw new Error("Seeder de desenvolvimento bloqueado em NODE_ENV=production.");
}

/** Simula o histórico em memória e devolve as linhas de cada tabela. */
function simular({ empresaId, produtos, vinculosPorProduto, clienteIds, ids, hojeLocal }) {
  const agora = new Date();
  const linhas = {
    compra: [],
    item_compra: [],
    entrada: [],
    item_entrada: [],
    saida: [],
    item_saida: [],
    movimentacao_estoque: [],
  };
  const saldo = new Map(produtos.map((p) => [p.id, 0]));
  const emAberto = new Map(); // produto_id → compra pendente
  const recebimentos = new Map(); // dia (ms) → [compras a receber]
  const inicio = hojeLocal - DIAS_HISTORICO * DIA_MS;

  const mover = (produtoId, tipo, quantidade, dataHora, extra = {}) => {
    const novo = saldo.get(produtoId) + quantidade;
    saldo.set(produtoId, novo);
    linhas.movimentacao_estoque.push({
      id: ids.movimentacao_estoque++,
      empresa_id: empresaId,
      produto_id: produtoId,
      tipo,
      quantidade,
      saldo_apos: novo,
      data_hora: dataHora,
      item_entrada_id: extra.item_entrada_id ?? null,
      item_saida_id: extra.item_saida_id ?? null,
      motivo: extra.motivo ?? null,
      created_at: agora,
    });
  };

  // Inventário inicial: cerca de 3 semanas de demanda média.
  for (const p of produtos)
    mover(p.id, "INVENTARIO_INICIAL", Math.max(12, Math.round(p.demanda * 21)), horaLocal(inicio, 7), {
      motivo: "Saldo de abertura (dados sintéticos)",
    });

  for (let dia = 0; dia <= DIAS_HISTORICO; dia += 1) {
    const diaMs = inicio + dia * DIA_MS;
    const data = new Date(diaMs + FUSO_MS);
    const mes = data.getUTCMonth();
    const semana = data.getUTCDay();

    // 1) Recebimentos previstos para hoje (às 8h).
    for (const compra of recebimentos.get(diaMs) || []) {
      const entradaId = ids.entrada++;
      linhas.entrada.push({
        id: entradaId,
        empresa_id: empresaId,
        compra_id: compra.id,
        data_recebimento: dataISO(diaMs + FUSO_MS),
        observacao: MARCADOR,
        created_at: agora,
        updated_at: agora,
      });
      for (const item of compra.itens) {
        const itemEntradaId = ids.item_entrada++;
        linhas.item_entrada.push({
          id: itemEntradaId,
          entrada_id: entradaId,
          item_compra_id: item.id,
          produto_id: item.produto_id,
          quantidade_recebida: item.quantidade,
          created_at: agora,
          updated_at: agora,
        });
        mover(item.produto_id, "ENTRADA_COMPRA", item.quantidade, horaLocal(diaMs, 8, entre(0, 50)), {
          item_entrada_id: itemEntradaId,
        });
        emAberto.delete(item.produto_id);
      }
      compra.registro.status = "RECEBIDA";
    }

    // 2) Vendas do dia: demanda por produto limitada ao saldo (falta censura a venda).
    const numeroVendas = Math.max(1, poisson(9 * DIA_SEMANA[semana]));
    const vendas = Array.from({ length: numeroVendas }, () => new Map());
    for (const p of produtos) {
      let unidades = poisson(p.demanda * SAZONALIDADE[p.perfil][mes] * DIA_SEMANA[semana]);
      unidades = Math.min(unidades, saldo.get(p.id));
      while (unidades > 0) {
        const lote = Math.min(unidades, entre(1, Math.max(2, Math.round(p.demanda))));
        const venda = escolher(vendas);
        venda.set(p.id, (venda.get(p.id) || 0) + lote);
        unidades -= lote;
      }
    }
    const minutosOrdenados = vendas.map(() => entre(9 * 60, 20 * 60)).sort((a, b) => a - b);
    // Vendas e estornos do dia viram eventos aplicados em ordem cronológica,
    // para que saldo_apos siga a mesma ordem de data_hora no razão.
    const eventos = [];
    vendas.forEach((itens, indice) => {
      if (!itens.size) return;
      const quando = horaLocal(diaMs, 0, minutosOrdenados[indice]);
      if (quando > agora) return; // nada no futuro
      const cancelar = rand() < 0.02;
      const saidaId = ids.saida++;
      const registro = {
        id: saidaId,
        empresa_id: empresaId,
        cliente_id: rand() < 0.7 ? escolher(clienteIds) : null,
        tipo: "VENDA",
        data_hora: quando,
        status: "REGISTRADA",
        cancelada_em: null,
        observacao: MARCADOR,
        created_at: agora,
        updated_at: agora,
      };
      linhas.saida.push(registro);
      const itensVenda = [];
      for (const [produtoId, quantidade] of itens) {
        const p = produtos.find((x) => x.id === produtoId);
        const itemSaidaId = ids.item_saida++;
        linhas.item_saida.push({
          id: itemSaidaId,
          saida_id: saidaId,
          produto_id: produtoId,
          quantidade,
          preco_unitario: p.preco,
          created_at: agora,
          updated_at: agora,
        });
        eventos.push([quando, () => mover(produtoId, "SAIDA_VENDA", -quantidade, quando, { item_saida_id: itemSaidaId })]);
        itensVenda.push([produtoId, quantidade, itemSaidaId]);
      }
      if (cancelar) {
        const canceladaEm = new Date(quando.getTime() + entre(10, 90) * 60000);
        registro.status = "CANCELADA";
        registro.cancelada_em = canceladaEm;
        for (const [produtoId, quantidade, itemSaidaId] of itensVenda)
          eventos.push([canceladaEm, () => mover(produtoId, "ESTORNO_VENDA", quantidade, canceladaEm, { item_saida_id: itemSaidaId })]);
      }
    });
    // sort é estável: empates mantêm a ordem de criação (venda antes do estorno).
    eventos.sort((a, b) => a[0] - b[0]).forEach(([, aplicar]) => aplicar());

    // 3) Ajuste mensal de avaria/perda (dia 15, às 23h, depois de vendas e estornos).
    if (data.getUTCDate() === 15) {
      for (const p of produtos) {
        if (rand() < 0.35 && saldo.get(p.id) > 3)
          mover(p.id, "AJUSTE", -entre(1, 3), horaLocal(diaMs, 23), {
            motivo: escolher(["Avaria no armazenamento", "Produto vencido", "Divergência na contagem"]),
          });
      }
    }

    // 4) Reposição ao fim do dia: abaixo de mínimo + segurança, sem compra aberta.
    const porFornecedor = new Map();
    for (const p of produtos) {
      if (emAberto.has(p.id) || saldo.get(p.id) > p.pontoPedido) continue;
      const vinculo = vinculosPorProduto.get(p.id)[rand() < 0.85 ? 0 : vinculosPorProduto.get(p.id).length - 1];
      const alvo = p.alvo;
      let quantidade = Math.max(vinculo.lote_minimo, alvo - saldo.get(p.id));
      quantidade = arredondarMultiplo(quantidade, vinculo.multiplo_compra);
      const grupo = porFornecedor.get(vinculo.fornecedor_id) || { vinculo, itens: [] };
      grupo.itens.push({ produto_id: p.id, quantidade, custo: vinculo.custo });
      porFornecedor.set(vinculo.fornecedor_id, grupo);
    }
    for (const [fornecedorId, grupo] of porFornecedor) {
      const prazo = Math.max(...grupo.itens.map((i) => vinculosPorProduto.get(i.produto_id).find((v) => v.fornecedor_id === fornecedorId).prazo_padrao_dias));
      const atraso = rand() < 0.2 ? entre(1, 4) : 0;
      const compraId = ids.compra++;
      const registro = {
        id: compraId,
        empresa_id: empresaId,
        fornecedor_id: fornecedorId,
        data_pedido: dataISO(diaMs + FUSO_MS),
        data_prevista: dataISO(diaMs + FUSO_MS + prazo * DIA_MS),
        status: "PEDIDA",
        observacao: MARCADOR,
        created_at: agora,
        updated_at: agora,
      };
      linhas.compra.push(registro);
      const compra = { id: compraId, registro, itens: [] };
      for (const item of grupo.itens) {
        const itemCompraId = ids.item_compra++;
        linhas.item_compra.push({
          id: itemCompraId,
          compra_id: compraId,
          produto_id: item.produto_id,
          quantidade: item.quantidade,
          custo_unitario: item.custo,
          created_at: agora,
          updated_at: agora,
        });
        compra.itens.push({ id: itemCompraId, produto_id: item.produto_id, quantidade: item.quantidade });
        emAberto.set(item.produto_id, compra);
      }
      const chegada = diaMs + (prazo + atraso) * DIA_MS;
      // Chegadas após hoje ficam pendentes (mercadoria em trânsito).
      if (chegada <= hojeLocal) recebimentos.set(chegada, [...(recebimentos.get(chegada) || []), compra]);
    }
  }

  // Algumas compras antigas canceladas (sem itens recebidos), para histórico de status.
  for (let i = 0; i < 3; i += 1) {
    const diaMs = inicio + entre(60, DIAS_HISTORICO - 60) * DIA_MS;
    const fornecedorId = escolher([...new Set([...vinculosPorProduto.values()].flat().map((v) => v.fornecedor_id))]);
    const produto = produtos.find((p) => vinculosPorProduto.get(p.id).some((v) => v.fornecedor_id === fornecedorId));
    const vinculo = vinculosPorProduto.get(produto.id).find((v) => v.fornecedor_id === fornecedorId);
    const compraId = ids.compra++;
    linhas.compra.push({
      id: compraId,
      empresa_id: empresaId,
      fornecedor_id: fornecedorId,
      data_pedido: dataISO(diaMs + FUSO_MS),
      data_prevista: dataISO(diaMs + FUSO_MS + vinculo.prazo_padrao_dias * DIA_MS),
      status: "CANCELADA",
      observacao: `${MARCADOR} — cancelada pelo comprador`,
      created_at: agora,
      updated_at: agora,
    });
    linhas.item_compra.push({
      id: ids.item_compra++,
      compra_id: compraId,
      produto_id: produto.id,
      quantidade: arredondarMultiplo(produto.alvo, vinculo.multiplo_compra),
      custo_unitario: vinculo.custo,
      created_at: agora,
      updated_at: agora,
    });
  }

  return { linhas, saldo };
}

module.exports = {
  async up(queryInterface) {
    garantirAmbienteDesenvolvimento();
    const { sequelize } = queryInterface;
    const empresaId = await localizarEmpresa(sequelize);

    const [existentes] = await sequelize.query(
      "SELECT COUNT(*) AS n FROM produto WHERE empresa_id = ? AND sku LIKE ?",
      { replacements: [empresaId, `${PREFIXO_SKU}%`] },
    );
    if (Number(existentes[0].n) > 0) {
      console.log("Dados de desenvolvimento já existem para esta empresa; nada foi inserido.");
      return;
    }

    const agora = new Date();
    await sequelize.transaction(async (transaction) => {
      const opcoes = { transaction, ignoreDuplicates: true };
      const comDatas = (linha) => ({ ...linha, empresa_id: empresaId, created_at: agora, updated_at: agora });

      // Cadastros (reaproveita registros com o mesmo nome/documento, se existirem).
      await queryInterface.bulkInsert("categoria", CATEGORIAS.map((c) => comDatas({ ...c, ativo: true })), opcoes);
      await queryInterface.bulkInsert(
        "fornecedor",
        FORNECEDORES.map(({ razao_social, documento, contato }) => comDatas({ razao_social, documento, contato, ativo: true })),
        opcoes,
      );
      await queryInterface.bulkInsert(
        "cliente",
        CLIENTES.map(([nome, documento]) => comDatas({ nome, documento, contato: null, ativo: true })),
        opcoes,
      );

      const [categorias] = await sequelize.query(
        "SELECT id, nome, estoque_minimo_padrao, estoque_seguranca_padrao, estoque_maximo_padrao FROM categoria WHERE empresa_id = ? AND nome IN (?)",
        { replacements: [empresaId, CATEGORIAS.map((c) => c.nome)], transaction },
      );
      const [fornecedores] = await sequelize.query(
        "SELECT id, documento FROM fornecedor WHERE empresa_id = ? AND documento IN (?)",
        { replacements: [empresaId, FORNECEDORES.map((f) => f.documento)], transaction },
      );
      const [clientes] = await sequelize.query(
        "SELECT id FROM cliente WHERE empresa_id = ? AND documento IN (?)",
        { replacements: [empresaId, CLIENTES.map((c) => c[1])], transaction },
      );
      const categoriaPorNome = new Map(categorias.map((c) => [c.nome, c]));
      const fornecedorPorChave = new Map(
        FORNECEDORES.map((f) => [f.chave, fornecedores.find((x) => x.documento === f.documento).id]),
      );

      // Produtos (ids explícitos para montar o histórico em memória).
      let proximoProduto = await proximoId(sequelize, "produto", transaction);
      const produtos = PRODUTOS.map((p) => {
        const categoria = categoriaPorNome.get(p.cat);
        const minimo = p.minimo ?? categoria.estoque_minimo_padrao ?? 0;
        const seguranca = p.seguranca ?? categoria.estoque_seguranca_padrao ?? 0;
        const maximo = p.maximo ?? categoria.estoque_maximo_padrao;
        return {
          ...p,
          id: proximoProduto++,
          categoriaId: categoria.id,
          pontoPedido: minimo + seguranca,
          // Reposição mira ~30 dias de demanda sazonal média, sem passar do máximo.
          alvo: Math.min(maximo ?? Infinity, Math.max(minimo + seguranca + 1, Math.round(p.demanda * 30))),
        };
      });

      let proximoVinculo = await proximoId(sequelize, "produto_fornecedor", transaction);
      const vinculosPorProduto = new Map();
      const linhasVinculo = [];
      for (const p of produtos) {
        const vinculos = p.forn.map((chave, indice) => ({
          id: proximoVinculo++,
          empresa_id: empresaId,
          produto_id: p.id,
          fornecedor_id: fornecedorPorChave.get(chave),
          prazo_padrao_dias: indice === 0 ? entre(3, 7) : entre(5, 12),
          lote_minimo: p.multiplo,
          multiplo_compra: p.multiplo,
          custo: Number((p.custo * (indice === 0 ? 1 : 1.06)).toFixed(2)),
          principal: indice === 0,
          created_at: agora,
          updated_at: agora,
        }));
        vinculosPorProduto.set(p.id, vinculos);
        linhasVinculo.push(...vinculos);
      }

      const ids = {};
      for (const tabela of ["compra", "item_compra", "entrada", "item_entrada", "saida", "item_saida", "movimentacao_estoque"])
        ids[tabela] = await proximoId(sequelize, tabela, transaction);

      const hoje = new Date(Date.now() - FUSO_MS);
      const hojeLocal = Date.UTC(hoje.getUTCFullYear(), hoje.getUTCMonth(), hoje.getUTCDate());
      const { linhas, saldo } = simular({
        empresaId,
        produtos,
        vinculosPorProduto,
        clienteIds: clientes.map((c) => c.id),
        ids,
        hojeLocal,
      });

      await queryInterface.bulkInsert(
        "produto",
        produtos.map((p) => ({
          id: p.id,
          empresa_id: empresaId,
          categoria_id: p.categoriaId,
          nome: p.nome,
          sku: `${PREFIXO_SKU}${p.sku}`,
          unidade: p.un,
          preco_venda: p.preco,
          custo: p.custo,
          estoque_minimo: p.minimo ?? null,
          estoque_maximo: p.maximo ?? null,
          estoque_seguranca: p.seguranca ?? null,
          estoque_atual: saldo.get(p.id),
          ativo: true,
          created_at: agora,
          updated_at: agora,
        })),
        { transaction },
      );
      await queryInterface.bulkInsert("produto_fornecedor", linhasVinculo, { transaction });
      for (const tabela of ["compra", "item_compra", "entrada", "item_entrada", "saida", "item_saida", "movimentacao_estoque"])
        await inserirEmLotes(queryInterface, tabela, linhas[tabela], transaction);

      console.log(
        `Dados de desenvolvimento: ${produtos.length} produtos, ${linhas.saida.length} vendas, ` +
          `${linhas.compra.length} compras, ${linhas.movimentacao_estoque.length} movimentações.`,
      );
    });
  },

  async down(queryInterface) {
    garantirAmbienteDesenvolvimento();
    const { sequelize } = queryInterface;
    const empresaId = await localizarEmpresa(sequelize);
    const rep = { replacements: { empresaId, marcador: `${MARCADOR}%`, sku: `${PREFIXO_SKU}%` } };

    await sequelize.transaction(async (transaction) => {
      const exec = (sql) => sequelize.query(sql, { ...rep, transaction });
      const produtosDev =
        "SELECT id FROM produto WHERE empresa_id = :empresaId AND sku LIKE :sku";
      await exec(`DELETE FROM movimentacao_estoque WHERE empresa_id = :empresaId AND produto_id IN (${produtosDev})`);
      await exec(`DELETE ie FROM item_entrada ie JOIN entrada e ON e.id = ie.entrada_id WHERE e.empresa_id = :empresaId AND e.observacao LIKE :marcador`);
      await exec("DELETE FROM entrada WHERE empresa_id = :empresaId AND observacao LIKE :marcador");
      await exec(`DELETE ic FROM item_compra ic JOIN compra c ON c.id = ic.compra_id WHERE c.empresa_id = :empresaId AND c.observacao LIKE :marcador`);
      await exec("DELETE FROM compra WHERE empresa_id = :empresaId AND observacao LIKE :marcador");
      await exec(`DELETE i FROM item_saida i JOIN saida s ON s.id = i.saida_id WHERE s.empresa_id = :empresaId AND s.observacao LIKE :marcador`);
      await exec("DELETE FROM saida WHERE empresa_id = :empresaId AND observacao LIKE :marcador");
      await exec(`DELETE FROM produto_fornecedor WHERE empresa_id = :empresaId AND produto_id IN (SELECT id FROM (${produtosDev}) p)`);
      await exec("DELETE FROM produto WHERE empresa_id = :empresaId AND sku LIKE :sku");
      // Cadastros de apoio só são removidos se nada mais os referenciar.
      await sequelize.query(
        "DELETE FROM cliente WHERE empresa_id = :empresaId AND documento IN (:docs) AND id NOT IN (SELECT cliente_id FROM (SELECT DISTINCT cliente_id FROM saida WHERE cliente_id IS NOT NULL) s)",
        { replacements: { empresaId, docs: CLIENTES.map((c) => c[1]) }, transaction },
      );
      await sequelize.query(
        "DELETE FROM fornecedor WHERE empresa_id = :empresaId AND documento IN (:docs) AND id NOT IN (SELECT fornecedor_id FROM (SELECT DISTINCT fornecedor_id FROM produto_fornecedor UNION SELECT DISTINCT fornecedor_id FROM compra) f)",
        { replacements: { empresaId, docs: FORNECEDORES.map((f) => f.documento) }, transaction },
      );
      await sequelize.query(
        "DELETE FROM categoria WHERE empresa_id = :empresaId AND nome IN (:nomes) AND id NOT IN (SELECT categoria_id FROM (SELECT DISTINCT categoria_id FROM produto) p)",
        { replacements: { empresaId, nomes: CATEGORIAS.map((c) => c.nome) }, transaction },
      );
    });
  },
};
