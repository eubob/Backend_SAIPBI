const express = require("express");

const userController = require("../controllers/userController");

const { authMiddleware, authorize } = require("../middlewares/auth");

const router = express.Router();

router.use(authMiddleware);
router.use(authorize("Administrador"));

router.get("/", userController.listarUsuarios);
router.get("/:id", userController.buscarUsuarioPorId);

router.post("/", userController.criarUsuario);

router.put("/:id", userController.atualizarUsuario);
router.put("/:id/status", userController.alterarStatusUsuario);

module.exports = router;
