const {
  validateRequest,
  validateId,
} = require("../middlewares/validateRequest");
const express = require("express");
const controller = require("../controllers/clienteController");
const authorize = require("../middlewares/authorize");
const router = express.Router();
router.param("id", validateId);
router.get("/", controller.listarClientes);
router.get("/:id", controller.buscarClientePorId);
router.post(
  "/",
  authorize("Administrador", "Gestor"),
  validateRequest("cliente"),
  controller.criarCliente,
);
router.put(
  "/:id",
  authorize("Administrador", "Gestor"),
  validateRequest("cliente"),
  controller.atualizarCliente,
);
router.delete(
  "/:id",
  authorize("Administrador", "Gestor"),
  controller.deletarCliente,
);
module.exports = router;
