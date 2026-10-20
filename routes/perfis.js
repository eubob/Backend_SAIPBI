const express = require("express");

const perfilController = require("../controllers/perfilController");

const { authMiddleware, authorize } = require("../middlewares/auth");

const router = express.Router();

router.use(authMiddleware);

router.get("/", authorize("ADMINISTRADOR"), perfilController.listarPerfis);

module.exports = router;
