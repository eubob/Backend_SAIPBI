const { Router } = require('express');
const routes = Router();
const userController = require('../controllers/userController');
const loginRoutes = require('./login'); 


routes.get('/usuarios', userController.listarUsuarios);
routes.get('/usuarios/:id', userController.buscarUsuarioPorId);
routes.post('/usuarios', userController.criarUsuario);
routes.put('/usuarios/:id', userController.atualizarUsuario);
routes.delete('/usuarios/:id', userController.deletarUsuario);


routes.use('/', loginRoutes);

module.exports = routes;