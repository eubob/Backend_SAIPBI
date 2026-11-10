const { validateRequest } = require("../middlewares/validateRequest");
const express = require("express");
const authController = require("../controllers/authController");
const authMiddleware = require("../middlewares/auth");

const router = express.Router();
router.post("/login", validateRequest("login"), authController.login);
router.get("/me", authMiddleware, authController.me);

module.exports = router;
