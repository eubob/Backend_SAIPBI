const { Router } = require('express');

const perfilController = require('../controllers/perfilController');

const router = Router();

router.get('/', perfilController.listarPerfis);

module.exports = router;