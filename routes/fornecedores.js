const { validateRequest, validateId } = require("../middlewares/validateRequest");
const express = require("express");
const controller = require("../controllers/fornecedorController");
const authorize = require("../middlewares/authorize");
const router = express.Router();
router.param("id", validateId);
router.get("/", controller.listarFornecedores);
router.get("/:id", controller.buscarFornecedorPorId);
router.post(
  "/",
  authorize("Administrador", "Gestor"),
  validateRequest("fornecedor"),
  controller.criarFornecedor,
);
router.put(
  "/:id",
  authorize("Administrador", "Gestor"),
  validateRequest("fornecedor"),
  controller.atualizarFornecedor,
);
router.delete(
  "/:id",
  authorize("Administrador", "Gestor"),
  controller.deletarFornecedor,
);
module.exports = router;
