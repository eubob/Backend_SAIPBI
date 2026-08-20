const { Router } = require('express');
const userController = require('../controllers/userController');

const userRoutes = Router();

userRoutes.get('/', userController.listarUsuarios);
userRoutes.get('/:id', userController.buscarUsuarioPorId);
userRoutes.post('/', userController.criarUsuario);
userRoutes.put('/:id', userController.atualizarUsuario);
userRoutes.delete('/:id', userController.deletarUsuario);

module.exports = userRoutes;