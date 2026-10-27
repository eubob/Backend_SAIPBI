const { Produto, Fornecedor, ProdutoFornecedor } = require("../models");
exports.listarFornecedoresDoProduto = async (req, res) => {
  try {
    const produto = await Produto.findOne({
      where: { id: req.params.id, empresa_id: req.auth.empresaId },
    });
    if (!produto)
      return res.status(404).json({ mensagem: "Produto não encontrado." });
    const vinculos = await ProdutoFornecedor.findAll({
      where: { empresa_id: req.auth.empresaId, produto_id: produto.id },
      include: [{ model: Fornecedor, as: "fornecedor" }],
      order: [["principal", "DESC"]],
    });
    return res.json(vinculos);
  } catch (e) {
    console.error(e);
    return res.status(500).json({ mensagem: "Erro interno." });
  }
};
exports.vincularFornecedor = async (req, res) => {
  try {
    const {
      fornecedor_id,
      prazo_padrao_dias,
      lote_minimo = 1,
      custo,
      principal = false,
    } = req.body;
    const empresa_id = req.auth.empresaId;
    const produto = await Produto.findOne({
      where: { id: req.params.id, empresa_id, ativo: true },
    });
    const fornecedor = await Fornecedor.findOne({
      where: { id: fornecedor_id, empresa_id, ativo: true },
    });
    if (!produto || !fornecedor)
      return res
        .status(404)
        .json({
          mensagem: "Produto ou fornecedor não encontrado nesta empresa.",
        });
    if (
      Number(prazo_padrao_dias) <= 0 ||
      Number(lote_minimo) <= 0 ||
      Number(custo) <= 0
    )
      return res
        .status(400)
        .json({ mensagem: "Prazo, lote e custo devem ser maiores que zero." });
    if (
      await ProdutoFornecedor.findOne({
        where: { empresa_id, produto_id: produto.id, fornecedor_id },
      })
    )
      return res.status(409).json({ mensagem: "Fornecedor já vinculado." });
    if (principal)
      await ProdutoFornecedor.update(
        { principal: false },
        { where: { empresa_id, produto_id: produto.id, principal: true } },
      );
    const vinculo = await ProdutoFornecedor.create({
      empresa_id,
      produto_id: produto.id,
      fornecedor_id,
      prazo_padrao_dias,
      lote_minimo,
      custo,
      principal: Boolean(principal),
    });
    return res
      .status(201)
      .json({ mensagem: "Fornecedor vinculado com sucesso.", vinculo });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ mensagem: "Erro interno." });
  }
};
exports.atualizarVinculo = async (req, res) => {
  try {
    const empresa_id = req.auth.empresaId;
    const v = await ProdutoFornecedor.findOne({
      where: {
        id: req.params.vinculoId,
        produto_id: req.params.id,
        empresa_id,
      },
    });
    if (!v)
      return res.status(404).json({ mensagem: "Vínculo não encontrado." });
    for (const f of ["prazo_padrao_dias", "lote_minimo", "custo"])
      if (req.body[f] !== undefined) {
        if (Number(req.body[f]) <= 0)
          return res
            .status(400)
            .json({ mensagem: `${f} deve ser maior que zero.` });
        v[f] = req.body[f];
      }
    if (req.body.principal !== undefined) {
      if (Boolean(req.body.principal))
        await ProdutoFornecedor.update(
          { principal: false },
          { where: { empresa_id, produto_id: v.produto_id, principal: true } },
        );
      v.principal = Boolean(req.body.principal);
    }
    await v.save();
    return res.json({
      mensagem: "Vínculo atualizado com sucesso.",
      vinculo: v,
    });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ mensagem: "Erro interno." });
  }
};
exports.removerVinculo = async (req, res) => {
  try {
    const v = await ProdutoFornecedor.findOne({
      where: {
        id: req.params.vinculoId,
        produto_id: req.params.id,
        empresa_id: req.auth.empresaId,
      },
    });
    if (!v)
      return res.status(404).json({ mensagem: "Vínculo não encontrado." });
    await v.destroy();
    return res.json({ mensagem: "Fornecedor desvinculado com sucesso." });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ mensagem: "Erro interno." });
  }
};
