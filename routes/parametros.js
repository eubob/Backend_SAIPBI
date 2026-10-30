"use strict";

const { Router } = require("express");
const parametroController = require("../controllers/parametroController");
const authorize = require("../middlewares/authorize");

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
  parametroController.atualizarParametros,
);

router.put(
  "/:chave",
  authorize("Administrador"),
  parametroController.atualizarParametro,
);

module.exports = router;
