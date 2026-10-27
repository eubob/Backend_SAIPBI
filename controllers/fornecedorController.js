const { Fornecedor } = require("../models");

exports.listarFornecedors = async (req, res) => {
  try {
    const registros = await Fornecedor.findAll({
      where: { empresa_id: req.auth.empresaId },
      order: [["razao_social", "ASC"]],
    });
    return res.status(200).json(registros);
  } catch (error) {
    console.error(error);
    return res
      .status(500)
      .json({ mensagem: "Erro interno ao listar fornecedors." });
  }
};

exports.buscarFornecedorPorId = async (req, res) => {
  try {
    const registro = await Fornecedor.findOne({
      where: { id: req.params.id, empresa_id: req.auth.empresaId },
    });
    if (!registro)
      return res.status(404).json({ mensagem: "Fornecedor não encontrado." });
    return res.status(200).json(registro);
  } catch (error) {
    console.error(error);
    return res
      .status(500)
      .json({ mensagem: "Erro interno ao buscar fornecedor." });
  }
};

exports.criarFornecedor = async (req, res) => {
  try {
    const dados = {};
    dados.razao_social =
      req.body.razao_social !== undefined && req.body.razao_social !== null
        ? String(req.body.razao_social).trim() || null
        : null;
    dados.documento =
      req.body.documento !== undefined && req.body.documento !== null
        ? String(req.body.documento).trim() || null
        : null;
    dados.contato =
      req.body.contato !== undefined && req.body.contato !== null
        ? String(req.body.contato).trim() || null
        : null;
    dados.ativo = req.body.ativo !== undefined ? Boolean(req.body.ativo) : true;
    if (!dados.razao_social)
      return res.status(400).json({ mensagem: "razao_social é obrigatório." });
    if (!dados.documento)
      return res.status(400).json({ mensagem: "documento é obrigatório." });
    if (dados.documento) {
      const existe = await Fornecedor.findOne({
        where: { empresa_id: req.auth.empresaId, documento: dados.documento },
      });
      if (existe)
        return res.status(409).json({
          mensagem: "Já existe registro com esse documento nesta empresa.",
        });
    }
    const registro = await Fornecedor.create({
      ...dados,
      empresa_id: req.auth.empresaId,
    });
    return res.status(201).json({
      mensagem: "Fornecedor cadastrado com sucesso.",
      fornecedor: registro,
    });
  } catch (error) {
    console.error(error);
    return res
      .status(500)
      .json({ mensagem: "Erro interno ao criar fornecedor." });
  }
};

exports.atualizarFornecedor = async (req, res) => {
  try {
    const registro = await Fornecedor.findOne({
      where: { id: req.params.id, empresa_id: req.auth.empresaId },
    });
    if (!registro)
      return res.status(404).json({ mensagem: "Fornecedor não encontrado." });
    if (req.body.razao_social !== undefined)
      registro.razao_social =
        req.body.razao_social === null
          ? null
          : String(req.body.razao_social).trim() || null;
    if (req.body.documento !== undefined)
      registro.documento =
        req.body.documento === null
          ? null
          : String(req.body.documento).trim() || null;
    if (req.body.contato !== undefined)
      registro.contato =
        req.body.contato === null
          ? null
          : String(req.body.contato).trim() || null;
    if (req.body.ativo !== undefined) registro.ativo = Boolean(req.body.ativo);
    if (registro.documento) {
      const existe = await Fornecedor.findOne({
        where: {
          empresa_id: req.auth.empresaId,
          documento: registro.documento,
        },
      });
      if (existe && existe.id !== registro.id)
        return res.status(409).json({
          mensagem: "Já existe registro com esse documento nesta empresa.",
        });
    }
    await registro.save();
    return res.status(200).json({
      mensagem: "Fornecedor atualizado com sucesso.",
      fornecedor: registro,
    });
  } catch (error) {
    console.error(error);
    return res
      .status(500)
      .json({ mensagem: "Erro interno ao atualizar fornecedor." });
  }
};

exports.deletarFornecedor = async (req, res) => {
  try {
    const registro = await Fornecedor.findOne({
      where: { id: req.params.id, empresa_id: req.auth.empresaId },
    });
    if (!registro)
      return res.status(404).json({ mensagem: "Fornecedor não encontrado." });
    registro.ativo = false;
    await registro.save();
    return res.status(200).json({
      mensagem: "Fornecedor inativado com sucesso.",
      fornecedor: registro,
    });
  } catch (error) {
    console.error(error);
    return res
      .status(500)
      .json({ mensagem: "Erro interno ao inativar fornecedor." });
  }
};
