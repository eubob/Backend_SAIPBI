const { validateRequest } = require("../middlewares/validateRequest");
const { Router } = require("express");
const empresaController = require("../controllers/empresaController");
const authorize = require("../middlewares/authorize");

const router = Router();
router.get("/", empresaController.buscarEmpresaAtual);
router.put("/", authorize("Administrador"), validateRequest("empresa"), empresaController.atualizarEmpresaAtual);

module.exports = router;
