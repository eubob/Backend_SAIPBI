const { validateRequest, validateId } = require("../middlewares/validateRequest");
const { Router } = require("express");
const userController = require("../controllers/userController");
const authorize = require("../middlewares/authorize");

const router = Router();
router.param("id", validateId);

router.use(authorize("Administrador"));
router.use(validateRequest("usuario"));
router.get("/", userController.listarUsuarios);
router.get("/:id", userController.buscarUsuarioPorId);
router.post("/", userController.criarUsuario);
router.put("/:id", userController.atualizarUsuario);
router.put("/:id/status", userController.alterarStatusUsuario);

module.exports = router;
