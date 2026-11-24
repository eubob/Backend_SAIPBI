"use strict";

const { Router } = require("express");
const { validateRequest } = require("../middlewares/validateRequest");
const empresaController = require("../controllers/empresaController");
const authorize = require("../middlewares/authorize");

// Dados cadastrais completos da empresa são exclusivos do Administrador.
// Os demais perfis recebem nome/razão social pela sessão (GET /auth/me).
const router = Router();
router.use(authorize("Administrador"));
router.get("/", empresaController.buscarEmpresaAtual);
router.put("/", validateRequest("empresa"), empresaController.atualizarEmpresaAtual);

module.exports = router;
