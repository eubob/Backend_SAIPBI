const jwt = require("jsonwebtoken");
const { Usuario, Perfil, Empresa } = require("../models");
const authConfig = require("../config/auth");

module.exports = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      return res
        .status(401)
        .json({ mensagem: "Token não fornecido. Faça login." });
    }

    const [scheme, token] = authHeader.split(" ");
    if (scheme !== "Bearer" || !token) {
      return res.status(401).json({ mensagem: "Formato de token inválido." });
    }

    const decoded = jwt.verify(token, authConfig.jwt.secret);
    const usuario = await Usuario.findOne({
      where: { id: decoded.id, ativo: true },
      include: [
        { model: Perfil, as: "perfil", attributes: ["id", "nome"] },
        {
          model: Empresa,
          as: "empresa",
          attributes: ["id", "razao_social", "nome_fantasia", "ativo"],
        },
      ],
    });

    if (!usuario) {
      return res.status(401).json({ mensagem: "Usuário inválido ou inativo." });
    }

    if (!usuario.empresa || !usuario.empresa.ativo) {
      return res
        .status(403)
        .json({ mensagem: "Empresa inativa ou não encontrada." });
    }

    req.auth = {
      usuarioId: usuario.id,
      empresaId: usuario.empresa_id,
      perfilId: usuario.perfil_id,
      perfil: usuario.perfil.nome,
    };

    return next();
  } catch (error) {
    if (
      error.name === "JsonWebTokenError" ||
      error.name === "TokenExpiredError"
    ) {
      return res.status(401).json({ mensagem: "Token inválido ou expirado." });
    }

    console.error("Erro no middleware de autenticação:", error);
    return res
      .status(500)
      .json({ mensagem: "Erro interno ao validar autenticação." });
  }
};
