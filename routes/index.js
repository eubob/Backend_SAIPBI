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
const relatorioIARoutes = require("./relatorioIA");
const estoqueRoutes = require("./estoque");
const vendaRoutes = require("./vendas");

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
routes.use("/estoque", estoqueRoutes);
routes.use("/vendas", vendaRoutes);
routes.use("/ia", relatorioIARoutes);

module.exports = routes;
