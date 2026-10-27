const { Cliente } = require("../models");

exports.listarClientes = async (req, res) => {
  try {
    const registros = await Cliente.findAll({
      where: { empresa_id: req.auth.empresaId },
      order: [["nome", "ASC"]],
    });
    return res.status(200).json(registros);
  } catch (error) {
    console.error(error);
    return res
      .status(500)
      .json({ mensagem: "Erro interno ao listar clientes." });
  }
};

exports.buscarClientePorId = async (req, res) => {
  try {
    const registro = await Cliente.findOne({
      where: { id: req.params.id, empresa_id: req.auth.empresaId },
    });
    if (!registro)
      return res.status(404).json({ mensagem: "Cliente não encontrado." });
    return res.status(200).json(registro);
  } catch (error) {
    console.error(error);
    return res
      .status(500)
      .json({ mensagem: "Erro interno ao buscar cliente." });
  }
};

exports.criarCliente = async (req, res) => {
  try {
    const dados = {};
    dados.nome =
      req.body.nome !== undefined && req.body.nome !== null
        ? String(req.body.nome).trim() || null
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
    if (!dados.nome)
      return res.status(400).json({ mensagem: "nome é obrigatório." });
    if (dados.documento) {
      const existe = await Cliente.findOne({
        where: { empresa_id: req.auth.empresaId, documento: dados.documento },
      });
      if (existe)
        return res
          .status(409)
          .json({
            mensagem: "Já existe registro com esse documento nesta empresa.",
          });
    }
    const registro = await Cliente.create({
      ...dados,
      empresa_id: req.auth.empresaId,
    });
    return res
      .status(201)
      .json({ mensagem: "Cliente cadastrado com sucesso.", cliente: registro });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ mensagem: "Erro interno ao criar cliente." });
  }
};

exports.atualizarCliente = async (req, res) => {
  try {
    const registro = await Cliente.findOne({
      where: { id: req.params.id, empresa_id: req.auth.empresaId },
    });
    if (!registro)
      return res.status(404).json({ mensagem: "Cliente não encontrado." });
    if (req.body.nome !== undefined)
      registro.nome =
        req.body.nome === null ? null : String(req.body.nome).trim() || null;
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
      const existe = await Cliente.findOne({
        where: {
          empresa_id: req.auth.empresaId,
          documento: registro.documento,
        },
      });
      if (existe && existe.id !== registro.id)
        return res
          .status(409)
          .json({
            mensagem: "Já existe registro com esse documento nesta empresa.",
          });
    }
    await registro.save();
    return res
      .status(200)
      .json({ mensagem: "Cliente atualizado com sucesso.", cliente: registro });
  } catch (error) {
    console.error(error);
    return res
      .status(500)
      .json({ mensagem: "Erro interno ao atualizar cliente." });
  }
};

exports.deletarCliente = async (req, res) => {
  try {
    const registro = await Cliente.findOne({
      where: { id: req.params.id, empresa_id: req.auth.empresaId },
    });
    if (!registro)
      return res.status(404).json({ mensagem: "Cliente não encontrado." });
    registro.ativo = false;
    await registro.save();
    return res
      .status(200)
      .json({ mensagem: "Cliente inativado com sucesso.", cliente: registro });
  } catch (error) {
    console.error(error);
    return res
      .status(500)
      .json({ mensagem: "Erro interno ao inativar cliente." });
  }
};
