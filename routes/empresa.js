const { Router } = require("express");
const empresaController = require("../controllers/empresaController");

const router = Router();
router.get("/", empresaController.buscarEmpresaAtual);
router.put("/", empresaController.atualizarEmpresaAtual);

module.exports = router;
