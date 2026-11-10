const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const { Usuario, Perfil, Empresa } = require("../models");
const authConfig = require("../config/auth");

module.exports = {
  async login(req, res, next) {
    try {
      const { email, senha } = req.body;
      if (!email || !senha)
        return res
          .status(400)
          .json({ mensagem: "E-mail e senha são obrigatórios." });

      const usuario = await Usuario.findOne({
        where: { email },
        include: [
          { model: Perfil, as: "perfil", attributes: ["id", "nome"] },
          {
            model: Empresa,
            as: "empresa",
            attributes: ["id", "razao_social", "nome_fantasia", "ativo"],
          },
        ],
      });

      if (!usuario || !(await bcrypt.compare(senha, usuario.senha))) {
        return res
          .status(401)
          .json({ mensagem: "E-mail ou senha incorretos." });
      }
      if (!usuario.ativo)
        return res
          .status(403)
          .json({ mensagem: "Usuário inativo no sistema." });
      if (!usuario.empresa)
        return res
          .status(403)
          .json({ mensagem: "Usuário não possui empresa vinculada." });
      if (!usuario.empresa.ativo)
        return res
          .status(403)
          .json({ mensagem: "Empresa inativa no sistema." });

      const token = jwt.sign({ id: usuario.id }, authConfig.jwt.secret, {
        expiresIn: authConfig.jwt.expiresIn,
      });

      return res.status(200).json({
        usuario: {
          id: usuario.id,
          nome: usuario.nome,
          email: usuario.email,
          ativo: usuario.ativo,
          perfil: { id: usuario.perfil.id, nome: usuario.perfil.nome },
          empresa: {
            id: usuario.empresa.id,
            razao_social: usuario.empresa.razao_social,
            nome_fantasia: usuario.empresa.nome_fantasia,
          },
        },
        token,
      });
    } catch (error) {
      return next(error);
    }
  },

  async me(req, res, next) {
    try {
      const usuario = await Usuario.findOne({
        where: {
          id: req.auth.usuarioId,
          empresa_id: req.auth.empresaId,
          ativo: true,
        },
        attributes: { exclude: ["senha"] },
        include: [
          { model: Perfil, as: "perfil", attributes: ["id", "nome"] },
          {
            model: Empresa,
            as: "empresa",
            attributes: [
              "id",
              "razao_social",
              "nome_fantasia",
              "documento",
              "email",
              "telefone",
              "ativo",
            ],
          },
        ],
      });

      if (!usuario)
        return res.status(404).json({ mensagem: "Usuário não encontrado." });
      return res.status(200).json({
        usuario: {
          id: usuario.id,
          nome: usuario.nome,
          email: usuario.email,
          ativo: usuario.ativo,
        },
        perfil: usuario.perfil,
        empresa: usuario.empresa,
      });
    } catch (error) {
      return next(error);
    }
  },
};
