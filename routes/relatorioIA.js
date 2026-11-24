"use strict";

const { Router } = require("express");
const authorize = require("../middlewares/authorize");
const controller = require("../controllers/relatorioIAController");

const router = Router();
router.use(authorize("Administrador", "Gestor"));
router.get("/comercial/contexto", controller.contexto);
router.post("/comercial/relatorio", controller.relatorio);

module.exports = router;
