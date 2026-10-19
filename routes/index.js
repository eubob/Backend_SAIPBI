const { Router } = require('express');

const routes = Router();

const userController = require('../controllers/userController');
const categoriaController = require('../controllers/categoriaController');
const fornecedorController = require('../controllers/fornecedorController');
const clienteController = require('../controllers/clienteController');
const produtoController = require('../controllers/produtoController');


const loginRoutes = require('./login');

// ==============================
// USUÁRIOS
// ==============================

routes.get('/usuarios', userController.listarUsuarios);
routes.get('/usuarios/:id', userController.buscarUsuarioPorId);
routes.post('/usuarios', userController.criarUsuario);
routes.put('/usuarios/:id', userController.atualizarUsuario);
routes.delete('/usuarios/:id', userController.deletarUsuario);

// ==============================
// CATEGORIAS
// ==============================

routes.get('/categorias', categoriaController.listarCategorias);
routes.get('/categorias/:id', categoriaController.buscarCategoriaPorId);
routes.post('/categorias', categoriaController.criarCategoria);
routes.put('/categorias/:id', categoriaController.atualizarCategoria);
routes.delete('/categorias/:id', categoriaController.deletarCategoria);

// ==============================
// FORNECEDORES
// ==============================

routes.get('/fornecedores', fornecedorController.listarFornecedores);
routes.get('/fornecedores/:id', fornecedorController.buscarFornecedorPorId);
routes.post('/fornecedores', fornecedorController.criarFornecedor);
routes.put('/fornecedores/:id', fornecedorController.atualizarFornecedor);
routes.delete('/fornecedores/:id', fornecedorController.deletarFornecedor);

// ==============================
// CLIENTES
// ==============================

routes.get('/clientes', clienteController.listarClientes);
routes.get('/clientes/:id', clienteController.buscarClientePorId);
routes.post('/clientes', clienteController.criarCliente);
routes.put('/clientes/:id', clienteController.atualizarCliente);
routes.delete('/clientes/:id', clienteController.deletarCliente);

// ==============================
// PRODUTOS
// ==============================

routes.get('/produtos', produtoController.listarProdutos);
routes.get('/produtos/:id', produtoController.buscarProdutoPorId);
routes.post('/produtos', produtoController.criarProduto);
routes.put('/produtos/:id', produtoController.atualizarProduto);
routes.delete('/produtos/:id', produtoController.deletarProduto);

// ==============================
// LOGIN
// ==============================

routes.use('/', loginRoutes);

module.exports = routes;