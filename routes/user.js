const { Router } = require("express");
const userController = require("../controllers/userController");

const router = Router();
router.get("/", userController.listarUsuarios);
router.get("/:id", userController.buscarUsuarioPorId);
router.post("/", userController.criarUsuario);
router.put("/:id", userController.atualizarUsuario);
router.put("/:id/status", userController.alterarStatusUsuario);

module.exports = router;
