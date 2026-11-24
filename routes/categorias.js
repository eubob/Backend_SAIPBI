const { validateRequest, validateId } = require("../middlewares/validateRequest");
const express = require("express");
const controller = require("../controllers/categoriaController");
const authorize = require("../middlewares/authorize");
const router = express.Router();
router.param("id", validateId);
router.get("/", controller.listarCategorias);
router.get("/:id", controller.buscarCategoriaPorId);
router.post(
  "/",
  authorize("Administrador", "Gestor"),
  validateRequest("categoria"),
  controller.criarCategoria,
);
router.put(
  "/:id",
  authorize("Administrador", "Gestor"),
  validateRequest("categoria"),
  controller.atualizarCategoria,
);
router.delete(
  "/:id",
  authorize("Administrador", "Gestor"),
  controller.deletarCategoria,
);
module.exports = router;
