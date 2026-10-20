const express = require("express");

const fornecedorController = require("../controllers/fornecedorController");

const { authMiddleware, authorize } = require("../middlewares/auth");

const router = express.Router();

router.use(authMiddleware);

router.get("/", fornecedorController.listarFornecedores);
router.get("/:id", fornecedorController.buscarFornecedorPorId);

router.post("/", authorize("Administrador", "Gestor"), fornecedorController.criarFornecedor,);

router.put( "/:id", authorize("Administrador", "Gestor"), fornecedorController.atualizarFornecedor,);

router.delete("/:id", authorize("Administrador", "Gestor"), fornecedorController.deletarFornecedor,);

module.exports = router;
