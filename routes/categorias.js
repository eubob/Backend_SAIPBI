const express = require("express");
const controller = require("../controllers/categoriaController");
const authorize = require("../middlewares/authorize");
const router = express.Router();
router.get("/", controller.listarCategorias);
router.get("/:id", controller.buscarCategoriaPorId);
router.post(
  "/",
  authorize("Administrador", "Gestor"),
  controller.criarCategoria,
);
router.put(
  "/:id",
  authorize("Administrador", "Gestor"),
  controller.atualizarCategoria,
);
router.delete(
  "/:id",
  authorize("Administrador", "Gestor"),
  controller.deletarCategoria,
);
module.exports = router;
