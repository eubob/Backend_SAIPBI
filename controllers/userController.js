const { Usuario, Perfil } = require('../models');
const bcrypt = require('bcryptjs');

// Listar os usuários
const listarUsuarios = async (req, res) => {
  try {
    const usuarios = await Usuario.findAll({
      attributes: { exclude: ['senha'] },
      include: [{ model: Perfil, as: 'perfil', attributes: ['id', 'nome'] }]
    });

    return res.status(200).json(usuarios);
  } catch (error) {
    return res.status(500).json({
      mensagem: 'Erro ao buscar usuários.',
      erro: error.message
    });
  }
};

// Buscar um único usuário pelo ID
const buscarUsuarioPorId = async (req, res) => {
  try {
    const { id } = req.params;

    const usuario = await Usuario.findByPk(id, {
      attributes: { exclude: ['senha'] },
      include: [{ model: Perfil, as: 'perfil', attributes: ['id', 'nome'] }]
    });

    if (!usuario) {
      return res.status(404).json({ mensagem: 'Usuário não encontrado.' });
    }

    return res.status(200).json(usuario);
  } catch (error) {
    return res.status(500).json({
      mensagem: 'Erro ao buscar usuário.',
      erro: error.message
    });
  }
};

// Criar um novo usuário
const criarUsuario = async (req, res) => {
  try {
    const { nome, email, senha, perfil_id } = req.body;

    if (!nome || !email || !senha) {
      return res.status(400).json({ mensagem: 'Nome, e-mail e senha são obrigatórios.' });
    }

    const usuarioExistente = await Usuario.findOne({ where: { email } });
    if (usuarioExistente) {
      return res.status(400).json({ mensagem: 'E-mail já está em uso.' });
    }

    const senhaHash = await bcrypt.hash(senha, 8);

    const novoUsuario = await Usuario.create({
      nome,
      email,
      senha: senhaHash,
      perfil_id
    });

    const usuarioResposta = novoUsuario.toJSON();
    delete usuarioResposta.senha;

    return res.status(201).json(usuarioResposta);
  } catch (error) {
    return res.status(500).json({
      mensagem: 'Erro ao criar usuário.',
      erro: error.message
    });
  }
};

// Atualizar um usuário existente
const atualizarUsuario = async (req, res) => {
  try {
    const { id } = req.params;
    const { nome, email, senha, perfil_id } = req.body;

    const usuario = await Usuario.findByPk(id);
    if (!usuario) {
      return res.status(404).json({ mensagem: 'Usuário não encontrado.' });
    }

    const dadosAtualizacao = { nome, email, perfil_id };

    if (senha) {
      dadosAtualizacao.senha = await bcrypt.hash(senha, 8);
    }

    await usuario.update(dadosAtualizacao);

    const usuarioResposta = usuario.toJSON();
    delete usuarioResposta.senha;

    return res.status(200).json(usuarioResposta);
  } catch (error) {
    return res.status(500).json({
      mensagem: 'Erro ao atualizar usuário.',
      erro: error.message
    });
  }
};

// Deletar um usuário
const deletarUsuario = async (req, res) => {
  try {
    const { id } = req.params;

    const usuario = await Usuario.findByPk(id);
    if (!usuario) {
      return res.status(404).json({ mensagem: 'Usuário não encontrado.' });
    }

    await usuario.destroy();

    return res.status(200).json({ mensagem: 'Usuário removido com sucesso.' });
  } catch (error) {
    return res.status(500).json({
      mensagem: 'Erro ao deletar usuário.',
      erro: error.message
    });
  }
};

module.exports = {
  listarUsuarios,
  buscarUsuarioPorId,
  criarUsuario,
  atualizarUsuario,
  deletarUsuario
};