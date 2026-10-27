const { Categoria } = require("../models");

exports.listarCategorias = async (req, res) => {
  try {
    const registros = await Categoria.findAll({
      where: { empresa_id: req.auth.empresaId },
      order: [["nome", "ASC"]],
    });
    return res.status(200).json(registros);
  } catch (error) {
    console.error(error);
    return res
      .status(500)
      .json({ mensagem: "Erro interno ao listar categorias." });
  }
};

exports.buscarCategoriaPorId = async (req, res) => {
  try {
    const registro = await Categoria.findOne({
      where: { id: req.params.id, empresa_id: req.auth.empresaId },
    });
    if (!registro)
      return res.status(404).json({ mensagem: "Categoria não encontrado." });
    return res.status(200).json(registro);
  } catch (error) {
    console.error(error);
    return res
      .status(500)
      .json({ mensagem: "Erro interno ao buscar categoria." });
  }
};

exports.criarCategoria = async (req, res) => {
  try {
    const dados = {};
    dados.nome =
      req.body.nome !== undefined && req.body.nome !== null
        ? String(req.body.nome).trim() || null
        : null;
    dados.ativo = req.body.ativo !== undefined ? Boolean(req.body.ativo) : true;
    if (!dados.nome)
      return res.status(400).json({ mensagem: "nome é obrigatório." });
    if (dados.nome) {
      const existe = await Categoria.findOne({
        where: { empresa_id: req.auth.empresaId, nome: dados.nome },
      });
      if (existe)
        return res
          .status(409)
          .json({
            mensagem: "Já existe registro com esse nome nesta empresa.",
          });
    }
    const registro = await Categoria.create({
      ...dados,
      empresa_id: req.auth.empresaId,
    });
    return res
      .status(201)
      .json({
        mensagem: "Categoria cadastrado com sucesso.",
        categoria: registro,
      });
  } catch (error) {
    console.error(error);
    return res
      .status(500)
      .json({ mensagem: "Erro interno ao criar categoria." });
  }
};

exports.atualizarCategoria = async (req, res) => {
  try {
    const registro = await Categoria.findOne({
      where: { id: req.params.id, empresa_id: req.auth.empresaId },
    });
    if (!registro)
      return res.status(404).json({ mensagem: "Categoria não encontrado." });
    if (req.body.nome !== undefined)
      registro.nome =
        req.body.nome === null ? null : String(req.body.nome).trim() || null;
    if (req.body.ativo !== undefined) registro.ativo = Boolean(req.body.ativo);
    if (registro.nome) {
      const existe = await Categoria.findOne({
        where: { empresa_id: req.auth.empresaId, nome: registro.nome },
      });
      if (existe && existe.id !== registro.id)
        return res
          .status(409)
          .json({
            mensagem: "Já existe registro com esse nome nesta empresa.",
          });
    }
    await registro.save();
    return res
      .status(200)
      .json({
        mensagem: "Categoria atualizado com sucesso.",
        categoria: registro,
      });
  } catch (error) {
    console.error(error);
    return res
      .status(500)
      .json({ mensagem: "Erro interno ao atualizar categoria." });
  }
};

exports.deletarCategoria = async (req, res) => {
  try {
    const registro = await Categoria.findOne({
      where: { id: req.params.id, empresa_id: req.auth.empresaId },
    });
    if (!registro)
      return res.status(404).json({ mensagem: "Categoria não encontrado." });
    registro.ativo = false;
    await registro.save();
    return res
      .status(200)
      .json({
        mensagem: "Categoria inativado com sucesso.",
        categoria: registro,
      });
  } catch (error) {
    console.error(error);
    return res
      .status(500)
      .json({ mensagem: "Erro interno ao inativar categoria." });
  }
};
