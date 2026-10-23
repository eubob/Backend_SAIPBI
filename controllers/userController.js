const bcrypt = require("bcryptjs");
const { Usuario, Perfil, Empresa } = require("../models");

const incluirRelacionamentos = [
  { model: Perfil, as: "perfil", attributes: ["id", "nome"] },
  { model: Empresa, as: "empresa", attributes: ["id", "nome_fantasia"] },
];

const listarUsuarios = async (req, res) => {
  try {
    const usuarios = await Usuario.findAll({
      where: { empresa_id: req.auth.empresaId },
      attributes: { exclude: ["senha"] },
      include: incluirRelacionamentos,
      order: [["nome", "ASC"]],
    });
    return res.status(200).json(usuarios);
  } catch (error) {
    console.error("Erro ao buscar usuários:", error);
    return res.status(500).json({ mensagem: "Erro ao buscar usuários." });
  }
};

const buscarUsuarioPorId = async (req, res) => {
  try {
    const usuario = await Usuario.findOne({
      where: { id: req.params.id, empresa_id: req.auth.empresaId },
      attributes: { exclude: ["senha"] },
      include: incluirRelacionamentos,
    });
    if (!usuario)
      return res.status(404).json({ mensagem: "Usuário não encontrado." });
    return res.status(200).json(usuario);
  } catch (error) {
    console.error("Erro ao buscar usuário:", error);
    return res.status(500).json({ mensagem: "Erro ao buscar usuário." });
  }
};

const criarUsuario = async (req, res) => {
  try {
    const { nome, email, senha, perfil_id, ativo = true } = req.body;
    if (!nome || !email || !senha || !perfil_id) {
      return res
        .status(400)
        .json({ mensagem: "Nome, e-mail, senha e perfil são obrigatórios." });
    }

    const perfil = await Perfil.findByPk(perfil_id);
    if (!perfil) return res.status(400).json({ mensagem: "Perfil inválido." });

    const usuarioExistente = await Usuario.findOne({ where: { email } });
    if (usuarioExistente)
      return res.status(409).json({ mensagem: "E-mail já está em uso." });

    const senhaHash = await bcrypt.hash(
      senha,
      Number(process.env.BCRYPT_ROUNDS) || 10,
    );
    const novoUsuario = await Usuario.create({
      empresa_id: req.auth.empresaId,
      perfil_id,
      nome,
      email,
      senha: senhaHash,
      ativo: Boolean(ativo),
    });

    const usuarioCriado = await Usuario.findOne({
      where: { id: novoUsuario.id, empresa_id: req.auth.empresaId },
      attributes: { exclude: ["senha"] },
      include: incluirRelacionamentos,
    });
    return res.status(201).json(usuarioCriado);
  } catch (error) {
    console.error("Erro ao criar usuário:", error);
    return res.status(500).json({ mensagem: "Erro ao criar usuário." });
  }
};

const atualizarUsuario = async (req, res) => {
  try {
    const { nome, email, senha, perfil_id } = req.body;
    const usuario = await Usuario.findOne({
      where: { id: req.params.id, empresa_id: req.auth.empresaId },
    });
    if (!usuario)
      return res.status(404).json({ mensagem: "Usuário não encontrado." });

    if (perfil_id !== undefined) {
      const perfil = await Perfil.findByPk(perfil_id);
      if (!perfil)
        return res.status(400).json({ mensagem: "Perfil inválido." });
    }

    if (email !== undefined && email !== usuario.email) {
      const usuarioComEmail = await Usuario.findOne({ where: { email } });
      if (usuarioComEmail)
        return res.status(409).json({ mensagem: "E-mail já está em uso." });
    }

    const dadosAtualizacao = {};
    if (nome !== undefined) dadosAtualizacao.nome = nome;
    if (email !== undefined) dadosAtualizacao.email = email;
    if (perfil_id !== undefined) dadosAtualizacao.perfil_id = perfil_id;
    if (senha)
      dadosAtualizacao.senha = await bcrypt.hash(
        senha,
        Number(process.env.BCRYPT_ROUNDS) || 10,
      );

    await usuario.update(dadosAtualizacao);
    const usuarioAtualizado = await Usuario.findOne({
      where: { id: usuario.id, empresa_id: req.auth.empresaId },
      attributes: { exclude: ["senha"] },
      include: incluirRelacionamentos,
    });
    return res.status(200).json(usuarioAtualizado);
  } catch (error) {
    console.error("Erro ao atualizar usuário:", error);
    return res.status(500).json({ mensagem: "Erro ao atualizar usuário." });
  }
};

const alterarStatusUsuario = async (req, res) => {
  try {
    const { ativo } = req.body;
    if (typeof ativo !== "boolean") {
      return res
        .status(400)
        .json({ mensagem: "O campo ativo deve ser true ou false." });
    }

    const usuario = await Usuario.findOne({
      where: { id: req.params.id, empresa_id: req.auth.empresaId },
    });
    if (!usuario)
      return res.status(404).json({ mensagem: "Usuário não encontrado." });

    if (usuario.id === req.auth.usuarioId && ativo === false) {
      return res
        .status(400)
        .json({ mensagem: "Você não pode inativar o próprio usuário." });
    }

    await usuario.update({ ativo });
    return res.status(200).json({
      mensagem: ativo
        ? "Usuário ativado com sucesso."
        : "Usuário inativado com sucesso.",
      usuario: { id: usuario.id, ativo: usuario.ativo },
    });
  } catch (error) {
    console.error("Erro ao alterar status do usuário:", error);
    return res
      .status(500)
      .json({ mensagem: "Erro ao alterar status do usuário." });
  }
};

module.exports = {
  listarUsuarios,
  buscarUsuarioPorId,
  criarUsuario,
  atualizarUsuario,
  alterarStatusUsuario,
};
