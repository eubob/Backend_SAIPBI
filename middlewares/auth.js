const jwt = require("jsonwebtoken");

const PERFIS_VALIDOS = ["Administrador", "Gestor", "Operador"];

const authMiddleware = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return res.status(401).json({
      mensagem: "Token não fornecido. Faça login.",
    });
  }

  const [tipo, token] = authHeader.split(" ");

  if (tipo !== "Bearer" || !token) {
    return res.status(401).json({
      mensagem: "Formato do token inválido.",
    });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const perfil = String(decoded.perfil || "").trim();

    if (!PERFIS_VALIDOS.includes(perfil)) {
      return res.status(403).json({
        mensagem: "Perfil de acesso inválido.",
      });
    }

    req.usuario = {
      id: decoded.id,
      perfil,
    };

    req.userId = decoded.id;

    return next();
  } catch (error) {
    return res.status(401).json({
      mensagem: "Token inválido ou expirado.",
    });
  }
};

const authorize = (...perfisPermitidos) => {
  return (req, res, next) => {
    if (!req.usuario) {
      return res.status(401).json({
        mensagem: "Usuário não autenticado.",
      });
    }

    if (!perfisPermitidos.includes(req.usuario.perfil)) {
      return res.status(403).json({
        mensagem: "Você não possui permissão para realizar esta operação.",
      });
    }

    return next();
  };
};

module.exports = {
  authMiddleware,
  authorize,
};
