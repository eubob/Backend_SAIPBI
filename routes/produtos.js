const express = require("express");

const produtoController = require("../controllers/produtoController");

const { authMiddleware, authorize } = require("../middlewares/auth");

const router = express.Router();

router.use(authMiddleware);

router.get("/", produtoController.listarProdutos);
router.get("/:id", produtoController.buscarProdutoPorId);

router.post("/", authorize("Administrador", "Gestor"), produtoController.criarProduto,);

router.put("/:id", authorize("Administrador", "Gestor"), produtoController.atualizarProduto,);

router.delete("/:id", authorize("Administrador", "Gestor"), produtoController.deletarProduto,);

module.exports = router;
