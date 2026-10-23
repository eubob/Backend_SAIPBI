const { Router } = require("express");

const authMiddleware = require("../middlewares/auth");

const authRoutes = require("./login");
const userRoutes = require("./user");
const perfilRoutes = require("./perfil");
const empresaRoutes = require("./empresa");

const routes = Router();

routes.use("/auth", authRoutes);
routes.use(authMiddleware);
routes.use("/usuarios", userRoutes);
routes.use("/perfis", perfilRoutes);
routes.use("/empresa", empresaRoutes);

module.exports = routes;
