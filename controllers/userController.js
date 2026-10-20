const { Op } = require("sequelize");
const bcrypt = require("bcryptjs");

const { Usuario, Perfil } = require("../models");

const BCRYPT_ROUNDS = Number(process.env.BCRYPT_ROUNDS);

const usuarioInclude = [
  {
    model: Perfil,
    as: "perfil",
    attributes: ["id", "nome", "descricao"],
  },
];

const formatarUsuario = (usuario) => {
  if (!usuario) {
    return null;
  }

  const dados = usuario.toJSON ? usuario.toJSON() : usuario;

  delete dados.senha;

  return dados;
};

// GET /usuarios
const listarUsuarios = async (req, res) => {
  try {
    const { busca, perfil_id, ativo } = req.query;

    const where = {};

    if (busca) {
      where[Op.or] = [
        {
          nome: {
            [Op.like]: `%${busca}%`,
          },
        },
        {
          email: {
            [Op.like]: `%${busca}%`,
          },
        },
      ];
    }

    if (perfil_id) {
      where.perfil_id = perfil_id;
    }

    if (ativo !== undefined && ativo !== "") {
      where.ativo = ativo === "true" || ativo === "1";
    }

    const usuarios = await Usuario.findAll({
      where,
      attributes: {
        exclude: ["senha"],
      },
      include: usuarioInclude,
      order: [["nome", "ASC"]],
    });

    return res.status(200).json(usuarios);
  } catch (error) {
    console.error("Erro ao listar usuários:", error);

    return res.status(500).json({
      mensagem: "Erro ao buscar usuários.",
    });
  }
};

// GET /usuarios/:id
const buscarUsuarioPorId = async (req, res) => {
  try {
    const { id } = req.params;

    const usuario = await Usuario.findByPk(id, {
      attributes: {
        exclude: ["senha"],
      },
      include: usuarioInclude,
    });

    if (!usuario) {
      return res.status(404).json({
        mensagem: "Usuário não encontrado.",
      });
    }

    return res.status(200).json(usuario);
  } catch (error) {
    console.error("Erro ao buscar usuário:", error);

    return res.status(500).json({
      mensagem: "Erro ao buscar usuário.",
    });
  }
};

// POST /usuarios
const criarUsuario = async (req, res) => {
  try {
    const { nome, email, senha, perfil_id, ativo = true } = req.body;

    if (!nome || !email || !senha || !perfil_id) {
      return res.status(400).json({
        mensagem: "Nome, e-mail, senha e perfil são obrigatórios.",
      });
    }

    const nomeTratado = nome.trim();
    const emailTratado = email.trim().toLowerCase();

    if (!nomeTratado) {
      return res.status(400).json({
        mensagem: "O nome do usuário é obrigatório.",
      });
    }

    if (senha.length < 4) {
      return res.status(400).json({
        mensagem: "A senha deve possuir pelo menos 4 caracteres.",
      });
    }

    const perfil = await Perfil.findByPk(perfil_id);

    if (!perfil) {
      return res.status(400).json({
        mensagem: "O perfil informado não existe.",
      });
    }

    const usuarioExistente = await Usuario.findOne({
      where: {
        email: emailTratado,
      },
      paranoid: false,
    });

    if (usuarioExistente) {
      return res.status(409).json({
        mensagem: "Já existe um usuário cadastrado com este e-mail.",
      });
    }

    const senhaHash = await bcrypt.hash(senha, BCRYPT_ROUNDS);

    const novoUsuario = await Usuario.create({
      nome: nomeTratado,
      email: emailTratado,
      senha: senhaHash,
      perfil_id,
      ativo: Boolean(ativo),
    });

    const usuarioCriado = await Usuario.findByPk(novoUsuario.id, {
      attributes: {
        exclude: ["senha"],
      },
      include: usuarioInclude,
    });

    return res.status(201).json({
      mensagem: "Usuário cadastrado com sucesso.",
      usuario: usuarioCriado,
    });
  } catch (error) {
    console.error("Erro ao criar usuário:", error);

    if (error.name === "SequelizeValidationError") {
      return res.status(400).json({
        mensagem: "Dados do usuário inválidos.",
        erros: error.errors.map((item) => item.message),
      });
    }

    return res.status(500).json({
      mensagem: "Erro interno ao criar usuário.",
    });
  }
};

// PUT /usuarios/:id
const atualizarUsuario = async (req, res) => {
  try {
    const { id } = req.params;

    const { nome, email, senha, perfil_id, ativo } = req.body;

    const usuario = await Usuario.findByPk(id);

    if (!usuario) {
      return res.status(404).json({
        mensagem: "Usuário não encontrado.",
      });
    }

    if (Number(req.usuario.id) === Number(id) && ativo === false) {
      return res.status(400).json({
        mensagem: "Você não pode inativar o seu próprio usuário.",
      });
    }

    const dadosAtualizacao = {};

    if (nome !== undefined) {
      const nomeTratado = nome.trim();

      if (!nomeTratado) {
        return res.status(400).json({
          mensagem: "O nome não pode ficar vazio.",
        });
      }

      dadosAtualizacao.nome = nomeTratado;
    }

    if (email !== undefined) {
      const emailTratado = email.trim().toLowerCase();

      if (!emailTratado) {
        return res.status(400).json({
          mensagem: "O e-mail não pode ficar vazio.",
        });
      }

      const emailEmUso = await Usuario.findOne({
        where: {
          email: emailTratado,
          id: {
            [Op.ne]: id,
          },
        },
        paranoid: false,
      });

      if (emailEmUso) {
        return res.status(409).json({
          mensagem: "Já existe outro usuário cadastrado com este e-mail.",
        });
      }

      dadosAtualizacao.email = emailTratado;
    }

    if (perfil_id !== undefined) {
      const perfil = await Perfil.findByPk(perfil_id);

      if (!perfil) {
        return res.status(400).json({
          mensagem: "O perfil informado não existe.",
        });
      }

      dadosAtualizacao.perfil_id = perfil_id;
    }

    if (senha) {
      if (senha.length < 4) {
        return res.status(400).json({
          mensagem: "A senha deve possuir pelo menos 4 caracteres.",
        });
      }

      dadosAtualizacao.senha = await bcrypt.hash(senha, BCRYPT_ROUNDS);
    }

    if (ativo !== undefined) {
      dadosAtualizacao.ativo = Boolean(ativo);
    }

    await usuario.update(dadosAtualizacao);

    const usuarioAtualizado = await Usuario.findByPk(id, {
      attributes: {
        exclude: ["senha"],
      },
      include: usuarioInclude,
    });

    return res.status(200).json({
      mensagem: "Usuário atualizado com sucesso.",
      usuario: usuarioAtualizado,
    });
  } catch (error) {
    console.error("Erro ao atualizar usuário:", error);

    if (error.name === "SequelizeValidationError") {
      return res.status(400).json({
        mensagem: "Dados do usuário inválidos.",
        erros: error.errors.map((item) => item.message),
      });
    }

    return res.status(500).json({
      mensagem: "Erro interno ao atualizar usuário.",
    });
  }
};

// PUT /usuarios/:id/status
const alterarStatusUsuario = async (req, res) => {
  try {
    const { id } = req.params;
    const { ativo } = req.body;

    if (typeof ativo !== "boolean") {
      return res.status(400).json({
        mensagem: "O campo ativo deve ser true ou false.",
      });
    }

    const usuario = await Usuario.findByPk(id);

    if (!usuario) {
      return res.status(404).json({
        mensagem: "Usuário não encontrado.",
      });
    }

    if (Number(req.usuario.id) === Number(id) && ativo === false) {
      return res.status(400).json({
        mensagem: "Você não pode inativar o seu próprio usuário.",
      });
    }

    await usuario.update({
      ativo,
    });

    return res.status(200).json({
      mensagem: ativo
        ? "Usuário ativado com sucesso."
        : "Usuário inativado com sucesso.",
    });
  } catch (error) {
    console.error("Erro ao alterar status do usuário:", error);

    return res.status(500).json({
      mensagem: "Erro interno ao alterar o status do usuário.",
    });
  }
};

// DELETE /usuarios/:id
const deletarUsuario = async (req, res) => {
  try {
    const { id } = req.params;

    if (Number(req.usuario.id) === Number(id)) {
      return res.status(400).json({
        mensagem: "Você não pode excluir o seu próprio usuário.",
      });
    }

    const usuario = await Usuario.findByPk(id);

    if (!usuario) {
      return res.status(404).json({
        mensagem: "Usuário não encontrado.",
      });
    }

    await usuario.destroy();

    return res.status(200).json({
      mensagem: "Usuário removido com sucesso.",
    });
  } catch (error) {
    console.error("Erro ao remover usuário:", error);

    return res.status(500).json({
      mensagem: "Erro interno ao remover usuário.",
    });
  }
};

module.exports = {
  listarUsuarios,
  buscarUsuarioPorId,
  criarUsuario,
  atualizarUsuario,
  alterarStatusUsuario,
  deletarUsuario,
};
