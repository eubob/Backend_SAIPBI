const jwt = require("jsonwebtoken");

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

    req.usuario = {
      id: decoded.id,
      perfil: decoded.perfil,
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
