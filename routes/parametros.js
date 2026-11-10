"use strict";

const { Router } = require("express");
const parametroController = require("../controllers/parametroController");
const authorize = require("../middlewares/authorize");
const { validateParametros } = require("../middlewares/validateRequest");

const router = Router();

router.get(
  "/",
  authorize("Administrador"),
  parametroController.listarParametros,
);

router.get(
  "/:chave",
  authorize("Administrador"),
  parametroController.buscarParametro,
);

router.put(
  "/",
  authorize("Administrador"),
  validateParametros,
  parametroController.atualizarParametros,
);

router.put(
  "/:chave",
  authorize("Administrador"),
  validateParametros,
  parametroController.atualizarParametro,
);

module.exports = router;
