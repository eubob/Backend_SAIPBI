const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { Usuario, Perfil } = require('../models');

module.exports = {
  async login(req, res) {
    try {
      const { email, senha } = req.body;

      if (!email || !senha) {
        return res.status(400).json({
          mensagem: 'E-mail e senha são obrigatórios.',
        });
      }

      const usuario = await Usuario.findOne({
        where: { email },
        include: [
          {
            model: Perfil,
            as: 'perfil',
          },
        ],
      });

      if (
        !usuario ||
        !(await bcrypt.compare(senha, usuario.senha))
      ) {
        return res.status(401).json({
          mensagem: 'E-mail ou senha incorretos.',
        });
      }

      if (!usuario.ativo) {
        return res.status(403).json({
          mensagem: 'Usuário inativo no sistema.',
        });
      }

      const token = jwt.sign(
        {
          id: usuario.id,
          perfil: usuario.perfil.nome,
        },
        process.env.JWT_SECRET,
        {
          expiresIn:
            process.env.JWT_EXPIRES_IN || '1d',
        }
      );

      return res.status(200).json({
        user: {
          id: usuario.id,
          nome: usuario.nome,
          email: usuario.email,
          perfil: usuario.perfil.nome,
        },
        token,
      });
    } catch (error) {
      console.error('Erro no login:', error);

      return res.status(500).json({
        mensagem: 'Erro interno ao realizar login.',
      });
    }
  },

  async me(req, res) {
    try {
      const usuario = await Usuario.findByPk(
        req.usuario.id,
        {
          attributes: {
            exclude: ['senha'],
          },
          include: [
            {
              model: Perfil,
              as: 'perfil',
              attributes: ['id', 'nome'],
            },
          ],
        }
      );

      if (!usuario) {
        return res.status(404).json({
          mensagem: 'Usuário não encontrado.',
        });
      }

      return res.status(200).json(usuario);
    } catch (error) {
      console.error(
        'Erro ao consultar usuário autenticado:',
        error
      );

      return res.status(500).json({
        mensagem:
          'Erro interno ao consultar usuário autenticado.',
      });
    }
  },
};