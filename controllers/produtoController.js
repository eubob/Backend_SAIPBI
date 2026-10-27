const { Produto, Categoria } = require("../models");

const includeCategoria = [
  { model: Categoria, as: "categoria", attributes: ["id", "nome", "ativo"] },
];

exports.listarProdutos = async (req, res) => {
  try {
    return res
      .status(200)
      .json(
        await Produto.findAll({
          where: { empresa_id: req.auth.empresaId },
          include: includeCategoria,
          order: [["nome", "ASC"]],
        }),
      );
  } catch (error) {
    console.error(error);
    return res
      .status(500)
      .json({ mensagem: "Erro interno ao listar produtos." });
  }
};
exports.buscarProdutoPorId = async (req, res) => {
  try {
    const produto = await Produto.findOne({
      where: { id: req.params.id, empresa_id: req.auth.empresaId },
      include: includeCategoria,
    });
    if (!produto)
      return res.status(404).json({ mensagem: "Produto não encontrado." });
    return res.json(produto);
  } catch (error) {
    console.error(error);
    return res
      .status(500)
      .json({ mensagem: "Erro interno ao buscar produto." });
  }
};
exports.criarProduto = async (req, res) => {
  try {
    const {
      categoria_id,
      nome,
      sku,
      unidade = "un",
      preco_venda,
      custo,
      estoque_minimo = 0,
      ativo = true,
    } = req.body;
    if (!categoria_id || !nome?.trim() || !sku?.trim())
      return res
        .status(400)
        .json({ mensagem: "categoria_id, nome e sku são obrigatórios." });
    if (
      Number(preco_venda) <= 0 ||
      Number(custo) <= 0 ||
      Number(estoque_minimo) < 0
    )
      return res
        .status(400)
        .json({ mensagem: "Valores monetários/estoque mínimo inválidos." });
    const categoria = await Categoria.findOne({
      where: { id: categoria_id, empresa_id: req.auth.empresaId, ativo: true },
    });
    if (!categoria)
      return res
        .status(404)
        .json({
          mensagem: "Categoria não encontrada nesta empresa ou inativa.",
        });
    if (
      await Produto.findOne({
        where: { empresa_id: req.auth.empresaId, sku: sku.trim() },
      })
    )
      return res
        .status(409)
        .json({ mensagem: "Já existe produto com esse SKU nesta empresa." });
    const produto = await Produto.create({
      empresa_id: req.auth.empresaId,
      categoria_id,
      nome: nome.trim(),
      sku: sku.trim(),
      unidade: String(unidade).trim() || "un",
      preco_venda,
      custo,
      estoque_minimo,
      estoque_atual: 0,
      ativo: Boolean(ativo),
    });
    return res
      .status(201)
      .json({ mensagem: "Produto cadastrado com sucesso.", produto });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ mensagem: "Erro interno ao criar produto." });
  }
};
exports.atualizarProduto = async (req, res) => {
  try {
    const produto = await Produto.findOne({
      where: { id: req.params.id, empresa_id: req.auth.empresaId },
    });
    if (!produto)
      return res.status(404).json({ mensagem: "Produto não encontrado." });
    const {
      categoria_id,
      nome,
      sku,
      unidade,
      preco_venda,
      custo,
      estoque_minimo,
      ativo,
    } = req.body;
    if (categoria_id !== undefined) {
      const cat = await Categoria.findOne({
        where: {
          id: categoria_id,
          empresa_id: req.auth.empresaId,
          ativo: true,
        },
      });
      if (!cat)
        return res
          .status(404)
          .json({
            mensagem: "Categoria não encontrada nesta empresa ou inativa.",
          });
      produto.categoria_id = categoria_id;
    }
    if (sku !== undefined) {
      const v = String(sku).trim();
      if (!v) return res.status(400).json({ mensagem: "SKU inválido." });
      const e = await Produto.findOne({
        where: { empresa_id: req.auth.empresaId, sku: v },
      });
      if (e && e.id !== produto.id)
        return res
          .status(409)
          .json({ mensagem: "Já existe produto com esse SKU nesta empresa." });
      produto.sku = v;
    }
    if (nome !== undefined) produto.nome = String(nome).trim();
    if (unidade !== undefined) produto.unidade = String(unidade).trim();
    if (preco_venda !== undefined) {
      if (Number(preco_venda) <= 0)
        return res.status(400).json({ mensagem: "Preço inválido." });
      produto.preco_venda = preco_venda;
    }
    if (custo !== undefined) {
      if (Number(custo) <= 0)
        return res.status(400).json({ mensagem: "Custo inválido." });
      produto.custo = custo;
    }
    if (estoque_minimo !== undefined) {
      if (Number(estoque_minimo) < 0)
        return res.status(400).json({ mensagem: "Estoque mínimo inválido." });
      produto.estoque_minimo = estoque_minimo;
    }
    if (ativo !== undefined) produto.ativo = Boolean(ativo);
    await produto.save();
    return res.json({ mensagem: "Produto atualizado com sucesso.", produto });
  } catch (error) {
    console.error(error);
    return res
      .status(500)
      .json({ mensagem: "Erro interno ao atualizar produto." });
  }
};
exports.deletarProduto = async (req, res) => {
  try {
    const produto = await Produto.findOne({
      where: { id: req.params.id, empresa_id: req.auth.empresaId },
    });
    if (!produto)
      return res.status(404).json({ mensagem: "Produto não encontrado." });
    produto.ativo = false;
    await produto.save();
    return res.json({ mensagem: "Produto inativado com sucesso.", produto });
  } catch (error) {
    console.error(error);
    return res
      .status(500)
      .json({ mensagem: "Erro interno ao inativar produto." });
  }
};
