const express = require("express");
const controller = require("../controllers/fornecedorController");
const authorize = require("../middlewares/authorize");
const router = express.Router();
router.get("/", controller.listarFornecedors);
router.get("/:id", controller.buscarFornecedorPorId);
router.post(
  "/",
  authorize("Administrador", "Gestor"),
  controller.criarFornecedor,
);
router.put(
  "/:id",
  authorize("Administrador", "Gestor"),
  controller.atualizarFornecedor,
);
router.delete(
  "/:id",
  authorize("Administrador", "Gestor"),
  controller.deletarFornecedor,
);
module.exports = router;
