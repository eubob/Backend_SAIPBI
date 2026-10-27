const express = require("express");
const produtoController = require("../controllers/produtoController");
const pf = require("../controllers/produtoFornecedorController");
const authorize = require("../middlewares/authorize");
const router = express.Router();
router.get("/", produtoController.listarProdutos);
router.get("/:id/fornecedores", pf.listarFornecedoresDoProduto);
router.post(
  "/:id/fornecedores",
  authorize("Administrador", "Gestor"),
  pf.vincularFornecedor,
);
router.put(
  "/:id/fornecedores/:vinculoId",
  authorize("Administrador", "Gestor"),
  pf.atualizarVinculo,
);
router.delete(
  "/:id/fornecedores/:vinculoId",
  authorize("Administrador", "Gestor"),
  pf.removerVinculo,
);
router.get("/:id", produtoController.buscarProdutoPorId);
router.post(
  "/",
  authorize("Administrador", "Gestor"),
  produtoController.criarProduto,
);
router.put(
  "/:id",
  authorize("Administrador", "Gestor"),
  produtoController.atualizarProduto,
);
router.delete(
  "/:id",
  authorize("Administrador", "Gestor"),
  produtoController.deletarProduto,
);
module.exports = router;
