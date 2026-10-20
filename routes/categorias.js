const express = require("express");

const categoriaController = require("../controllers/categoriaController");

const { authMiddleware, authorize } = require("../middlewares/auth");

const router = express.Router();

router.use(authMiddleware);

router.get("/", categoriaController.listarCategorias);
router.get("/:id", categoriaController.buscarCategoriaPorId);

router.post("/", authorize("Administrador", "Gestor"),categoriaController.criarCategoria,);

router.put("/:id", authorize("Administrador", "Gestor"), categoriaController.atualizarCategoria,);

router.delete("/:id", authorize("Administrador", "Gestor"),categoriaController.deletarCategoria,);

module.exports = router;
