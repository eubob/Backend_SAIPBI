const express = require("express");

const userController = require("../controllers/userController");

const { authMiddleware, authorize } = require("../middlewares/auth");

const router = express.Router();

router.use(authMiddleware);

router.get("/", authorize("Administrador"), userController.listarUsuarios);
router.get("/:id", authorize("Administrador"), userController.buscarUsuarioPorId,);

router.post("/", authorize("Administrador"), userController.criarUsuario);

router.put("/:id", authorize("Administrador"), userController.atualizarUsuario);

router.delete("/:id", authorize("Administrador"), userController.deletarUsuario,);

module.exports = router;
