"use strict";

const { Router } = require("express");
const controller = require("../controllers/vendaController");

// Somente leitura; o registro de vendas (com baixa de estoque) entra na F03.
const router = Router();
router.get("/", controller.listarVendas);
router.get("/indicadores", controller.indicadores);

module.exports = router;
