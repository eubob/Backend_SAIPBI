"use strict";

const AppError = require("../utils/AppError");

module.exports = (error, req, res, next) => {
  if (res.headersSent) return next(error);

  let status = 500;
  let mensagem = "Erro interno do servidor.";

  // Apenas AppError (mensagem escrita pelo próprio SAIPBI) é exposto ao cliente.
  // 502/503/504 representam falhas de serviços externos (ex.: provedor de IA).
  if (
    error instanceof AppError &&
    [400, 401, 403, 404, 409, 502, 503, 504].includes(error.status)
  ) {
    status = error.status;
    mensagem = error.message;
  } else if (error.type === "entity.parse.failed") {
    status = 400;
    mensagem = "JSON inválido.";
  } else if (error.type === "entity.too.large") {
    status = 413;
    mensagem = "Corpo da requisição excede o limite permitido.";
  } else if (error instanceof URIError && error.status === 400) {
    status = 400;
    mensagem = "Caminho da requisição inválido.";
  } else if (error.name === "SequelizeUniqueConstraintError") {
    status = 409;
    mensagem = "Já existe um registro com esses dados.";
  } else if (error.name === "SequelizeForeignKeyConstraintError") {
    status = 409;
    mensagem = "Operação incompatível com os vínculos do registro.";
  } else if (error.name === "SequelizeValidationError") {
    status = 400;
    mensagem = "Dados inválidos. Verifique os campos informados.";
  } else if (
    error.name === "SequelizeDatabaseError" &&
    [
      "ER_CHECK_CONSTRAINT_VIOLATED",
      "ER_CONSTRAINT_FAILED",
      "ER_DATA_TOO_LONG",
      "ER_WARN_DATA_OUT_OF_RANGE",
    ].includes(error.original?.code)
  ) {
    status = 400;
    mensagem = "Dados incompatíveis com as regras do cadastro.";
  }

  // Não registrar error, SQL, valores, headers, body ou credenciais.
  if (status === 500) console.error("Falha interna ao processar requisição.");
  return res.status(status).json({ mensagem });
};
