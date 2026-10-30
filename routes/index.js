const { Router } = require("express");

const authMiddleware = require("../middlewares/auth");

const authRoutes = require("./login");
const userRoutes = require("./user");
const perfilRoutes = require("./perfil");
const empresaRoutes = require("./empresa");
const categoriaRoutes = require("./categorias");
const clienteRoutes = require("./clientes");
const fornecedorRoutes = require("./fornecedores");
const produtoRoutes = require("./produtos");
const parametroRoutes = require("./parametros");

const routes = Router();

routes.use("/auth", authRoutes);
routes.use(authMiddleware);
routes.use("/usuarios", userRoutes);
routes.use("/perfis", perfilRoutes);
routes.use("/empresa", empresaRoutes);
routes.use("/categorias", categoriaRoutes);
routes.use("/clientes", clienteRoutes);
routes.use("/fornecedores", fornecedorRoutes);
routes.use("/produtos", produtoRoutes);
routes.use("/parametros", parametroRoutes);

module.exports = routes;
