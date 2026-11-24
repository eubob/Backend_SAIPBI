"use strict";

const { Router } = require("express");
const controller = require("../controllers/estoqueController");

// Somente leitura: todos os perfis autenticados acessam o módulo de estoque.
// Entradas e saídas são consultadas no razão (/movimentacoes?direcao=...).
const router = Router();
router.get("/resumo", controller.resumo);
router.get("/posicao", controller.posicao);
router.get("/movimentacoes", controller.movimentacoes);

module.exports = router;
