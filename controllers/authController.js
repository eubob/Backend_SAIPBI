const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { Usuario, Perfil } = require('../models');

module.exports = {
  async login(req, res) {
    const { email, senha } = req.body;

    const usuario = await Usuario.findOne({ 
      where: { email },
      include: [{ model: Perfil, as: 'perfil' }]
    });

    if (!usuario || !(await bcrypt.compare(senha, usuario.senha))) {
      return res.status(401).json({ error: 'E-mail ou senha incorretos.' });
    }

    if (!usuario.ativo) {
      return res.status(403).json({ error: 'Usuário inativo no sistema.' });
    }

    // Gera o token
    const token = jwt.sign(
      { id: usuario.id, perfil: usuario.perfil.nome },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '1d' }
    );

    return res.json({
      user: {
        id: usuario.id,
        nome: usuario.nome,
        email: usuario.email,
        perfil: usuario.perfil.nome
      },
      token
    });
  }
};