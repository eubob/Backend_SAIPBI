const express = require("express");

const usuariosRoutes = require("./usuarios.js");
const perfisRoutes = require("./perfis.js");
const categoriasRoutes = require("./categorias.js");
const fornecedoresRoutes = require("./fornecedores.js");
const clientesRoutes = require("./clientes.js");
const produtosRoutes = require("./produtos.js");
const loginRoutes = require("./login.js");

const router = express.Router();

router.use("/usuarios", usuariosRoutes);
router.use("/perfis", perfisRoutes);
router.use("/categorias", categoriasRoutes);
router.use("/fornecedores", fornecedoresRoutes);
router.use("/clientes", clientesRoutes);
router.use("/produtos", produtosRoutes);

router.use("/", loginRoutes);

module.exports = router;
