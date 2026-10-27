const express = require("express");
const controller = require("../controllers/clienteController");
const authorize = require("../middlewares/authorize");
const router = express.Router();
router.get("/", controller.listarClientes);
router.get("/:id", controller.buscarClientePorId);
router.post("/", authorize("Administrador", "Gestor"), controller.criarCliente);
router.put(
  "/:id",
  authorize("Administrador", "Gestor"),
  controller.atualizarCliente,
);
router.delete(
  "/:id",
  authorize("Administrador", "Gestor"),
  controller.deletarCliente,
);
module.exports = router;
