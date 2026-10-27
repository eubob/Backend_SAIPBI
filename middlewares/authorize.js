module.exports =
  (...perfisPermitidos) =>
  (req, res, next) => {
    if (!req.auth)
      return res.status(401).json({ mensagem: "Não autenticado." });
    if (!perfisPermitidos.includes(req.auth.perfil))
      return res
        .status(403)
        .json({ mensagem: "Você não possui permissão para esta operação." });
    return next();
  };
