const { Router } = require("express");
const userController = require("../controllers/userController");
const authorize = require("../middlewares/authorize");

const router = Router();

router.use(authorize("Administrador"));
router.get("/", userController.listarUsuarios);
router.get("/:id", userController.buscarUsuarioPorId);
router.post("/", userController.criarUsuario);
router.put("/:id", userController.atualizarUsuario);
router.put("/:id/status", userController.alterarStatusUsuario);

module.exports = router;
