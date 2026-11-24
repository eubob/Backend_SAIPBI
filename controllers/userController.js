"use strict";

const bcrypt = require("bcryptjs");
const AppError = require("../utils/AppError");
const { Usuario, Perfil, Empresa, sequelize } = require("../models");

const PERFIS_FIXOS = ["Administrador", "Gestor", "Operador"];
const ADMINISTRADOR = "Administrador";

const incluirRelacionamentos = [
  { model: Perfil, as: "perfil", attributes: ["id", "nome"] },
  { model: Empresa, as: "empresa", attributes: ["id", "nome_fantasia"] },
];

const hashSenha = (senha) =>
  bcrypt.hash(senha, Number(process.env.BCRYPT_ROUNDS) || 10);

function buscarUsuarioSeguro(id, empresaId, transaction) {
  return Usuario.findOne({
    where: { id, empresa_id: empresaId },
    attributes: { exclude: ["senha"] },
    include: incluirRelacionamentos,
    transaction,
  });
}

/** Perfis são fixos: só aceita um dos três perfis conhecidos do sistema. */
async function buscarPerfilValido(perfilId, transaction) {
  const perfil = await Perfil.findByPk(perfilId, { transaction });
  if (!perfil || !PERFIS_FIXOS.includes(perfil.nome))
    throw new AppError(400, "Perfil inválido.");
  return perfil;
}

async function garantirEmailDisponivel(email, transaction) {
  if (await Usuario.findOne({ where: { email }, transaction }))
    throw new AppError(409, "E-mail já está em uso.");
}

/**
 * Impede que a empresa fique sem Administrador ativo. Os administradores ativos
 * são bloqueados (FOR UPDATE) para que duas alterações concorrentes não removam
 * ambos ao mesmo tempo.
 */
async function garantirOutroAdministradorAtivo(usuario, transaction) {
  const administradores = await Usuario.findAll({
    attributes: ["id"],
    where: { empresa_id: usuario.empresa_id, ativo: true },
    include: [
      {
        model: Perfil,
        as: "perfil",
        attributes: [],
        where: { nome: ADMINISTRADOR },
        required: true,
      },
    ],
    lock: transaction.LOCK.UPDATE,
    transaction,
  });
  if (!administradores.some((admin) => admin.id !== usuario.id))
    throw new AppError(
      409,
      "A empresa precisa manter ao menos um Administrador ativo.",
    );
}

/** Carrega o usuário da empresa com bloqueio de linha e o perfil atual. */
async function carregarParaAlteracao(id, empresaId, transaction) {
  const usuario = await Usuario.findOne({
    where: { id, empresa_id: empresaId },
    include: [{ model: Perfil, as: "perfil", attributes: ["id", "nome"] }],
    lock: transaction.LOCK.UPDATE,
    transaction,
  });
  if (!usuario) throw new AppError(404, "Usuário não encontrado.");
  return usuario;
}

const listarUsuarios = async (req, res, next) => {
  try {
    const usuarios = await Usuario.findAll({
      where: { empresa_id: req.auth.empresaId },
      attributes: { exclude: ["senha"] },
      include: incluirRelacionamentos,
      order: [["nome", "ASC"]],
    });
    return res.status(200).json(usuarios);
  } catch (error) {
    return next(error);
  }
};

const buscarUsuarioPorId = async (req, res, next) => {
  try {
    const usuario = await buscarUsuarioSeguro(req.params.id, req.auth.empresaId);
    if (!usuario)
      return res.status(404).json({ mensagem: "Usuário não encontrado." });
    return res.status(200).json(usuario);
  } catch (error) {
    return next(error);
  }
};

const criarUsuario = async (req, res, next) => {
  try {
    const { nome, email, senha, perfil_id, ativo = true } = req.body;
    await buscarPerfilValido(perfil_id);
    await garantirEmailDisponivel(email);

    const novoUsuario = await Usuario.create({
      empresa_id: req.auth.empresaId,
      perfil_id,
      nome,
      email,
      senha: await hashSenha(senha),
      ativo,
    });

    return res
      .status(201)
      .json(await buscarUsuarioSeguro(novoUsuario.id, req.auth.empresaId));
  } catch (error) {
    return next(error);
  }
};

const atualizarUsuario = async (req, res, next) => {
  try {
    const { nome, email, senha, perfil_id } = req.body;
    const senhaHash = senha ? await hashSenha(senha) : undefined;

    const atualizado = await sequelize.transaction(async (transaction) => {
      const usuario = await carregarParaAlteracao(
        req.params.id,
        req.auth.empresaId,
        transaction,
      );

      const dados = {};
      if (perfil_id !== undefined && Number(perfil_id) !== usuario.perfil_id) {
        const novoPerfil = await buscarPerfilValido(perfil_id, transaction);
        if (
          usuario.ativo &&
          usuario.perfil?.nome === ADMINISTRADOR &&
          novoPerfil.nome !== ADMINISTRADOR
        )
          await garantirOutroAdministradorAtivo(usuario, transaction);
        dados.perfil_id = novoPerfil.id;
      }
      if (email !== undefined && email !== usuario.email) {
        await garantirEmailDisponivel(email, transaction);
        dados.email = email;
      }
      if (nome !== undefined) dados.nome = nome;
      if (senhaHash) dados.senha = senhaHash;

      await usuario.update(dados, { transaction });
      return buscarUsuarioSeguro(usuario.id, req.auth.empresaId, transaction);
    });

    return res.status(200).json(atualizado);
  } catch (error) {
    return next(error);
  }
};

const alterarStatusUsuario = async (req, res, next) => {
  try {
    const { ativo } = req.body;
    if (typeof ativo !== "boolean")
      throw new AppError(400, "O campo ativo deve ser true ou false.");

    const usuario = await sequelize.transaction(async (transaction) => {
      const registro = await carregarParaAlteracao(
        req.params.id,
        req.auth.empresaId,
        transaction,
      );
      if (ativo === false) {
        if (registro.id === req.auth.usuarioId)
          throw new AppError(400, "Você não pode inativar o próprio usuário.");
        if (registro.ativo && registro.perfil?.nome === ADMINISTRADOR)
          await garantirOutroAdministradorAtivo(registro, transaction);
      }
      await registro.update({ ativo }, { transaction });
      return registro;
    });

    return res.status(200).json({
      mensagem: ativo
        ? "Usuário ativado com sucesso."
        : "Usuário inativado com sucesso.",
      usuario: { id: usuario.id, ativo: usuario.ativo },
    });
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  listarUsuarios,
  buscarUsuarioPorId,
  criarUsuario,
  atualizarUsuario,
  alterarStatusUsuario,
};
