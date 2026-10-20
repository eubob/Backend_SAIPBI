const express = require('express');

const clienteController = require('../controllers/clienteController');

const {
  authMiddleware,
  authorize,
} = require('../middlewares/auth');

const router = express.Router();

router.use(authMiddleware);

router.get('/', clienteController.listarClientes);
router.get('/:id', clienteController.buscarClientePorId);

router.post('/', authorize('Administrador', 'Gestor'), clienteController.criarCliente);

router.put('/:id', authorize('Administrador', 'Gestor'), clienteController.atualizarCliente);

router.delete('/:id', authorize('Administrador', 'Gestor'), clienteController.deletarCliente);

module.exports = router;