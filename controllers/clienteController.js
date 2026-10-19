const { Cliente } = require('../models');

// Listar todos os clientes
exports.listarClientes = async (req, res) => {
  try {
    const clientes = await Cliente.findAll({
      order: [['nome', 'ASC']],
    });

    return res.status(200).json(clientes);
  } catch (error) {
    console.error('Erro ao listar clientes:', error);

    return res.status(500).json({
      mensagem: 'Erro interno ao listar clientes.',
    });
  }
};

// Buscar cliente por ID
exports.buscarClientePorId = async (req, res) => {
  try {
    const { id } = req.params;

    const cliente = await Cliente.findByPk(id);

    if (!cliente) {
      return res.status(404).json({
        mensagem: 'Cliente não encontrado.',
      });
    }

    return res.status(200).json(cliente);
  } catch (error) {
    console.error('Erro ao buscar cliente:', error);

    return res.status(500).json({
      mensagem: 'Erro interno ao buscar cliente.',
    });
  }
};

// Criar cliente
exports.criarCliente = async (req, res) => {
  try {
    const {
      nome,
      documento,
      contato,
      ativo = true,
    } = req.body;

    if (!nome || !nome.trim()) {
      return res.status(400).json({
        mensagem: 'O nome do cliente é obrigatório.',
      });
    }

    if (documento !== undefined && documento !== null && documento.trim()) {
      const clienteExistente = await Cliente.findOne({
        where: {
          documento: documento.trim(),
        },
      });

      if (clienteExistente) {
        return res.status(409).json({
          mensagem: 'Já existe um cliente com esse documento.',
        });
      }
    }

    const cliente = await Cliente.create({
      nome: nome.trim(),
      documento:
        documento && documento.trim()
          ? documento.trim()
          : null,
      contato:
        contato && contato.trim()
          ? contato.trim()
          : null,
      ativo,
    });

    return res.status(201).json({
      mensagem: 'Cliente cadastrado com sucesso.',
      cliente,
    });
  } catch (error) {
    console.error('Erro ao criar cliente:', error);

    return res.status(500).json({
      mensagem: 'Erro interno ao criar cliente.',
    });
  }
};

// Atualizar cliente
exports.atualizarCliente = async (req, res) => {
  try {
    const { id } = req.params;

    const {
      nome,
      documento,
      contato,
      ativo,
    } = req.body;

    const cliente = await Cliente.findByPk(id);

    if (!cliente) {
      return res.status(404).json({
        mensagem: 'Cliente não encontrado.',
      });
    }

    if (nome !== undefined) {
      if (!nome.trim()) {
        return res.status(400).json({
          mensagem: 'O nome do cliente não pode ficar vazio.',
        });
      }

      cliente.nome = nome.trim();
    }

    if (documento !== undefined) {
      const documentoTratado =
        documento && documento.trim()
          ? documento.trim()
          : null;

      if (documentoTratado) {
        const clienteExistente = await Cliente.findOne({
          where: {
            documento: documentoTratado,
          },
        });

        if (
          clienteExistente &&
          clienteExistente.id !== cliente.id
        ) {
          return res.status(409).json({
            mensagem: 'Já existe um cliente com esse documento.',
          });
        }
      }

      cliente.documento = documentoTratado;
    }

    if (contato !== undefined) {
      cliente.contato =
        contato && contato.trim()
          ? contato.trim()
          : null;
    }

    if (ativo !== undefined) {
      cliente.ativo = ativo;
    }

    await cliente.save();

    return res.status(200).json({
      mensagem: 'Cliente atualizado com sucesso.',
      cliente,
    });
  } catch (error) {
    console.error('Erro ao atualizar cliente:', error);

    return res.status(500).json({
      mensagem: 'Erro interno ao atualizar cliente.',
    });
  }
};

// Excluir cliente
exports.deletarCliente = async (req, res) => {
  try {
    const { id } = req.params;

    const cliente = await Cliente.findByPk(id);

    if (!cliente) {
      return res.status(404).json({
        mensagem: 'Cliente não encontrado.',
      });
    }

    await cliente.destroy();

    return res.status(200).json({
      mensagem: 'Cliente excluído com sucesso.',
    });
  } catch (error) {
    console.error('Erro ao excluir cliente:', error);

    return res.status(500).json({
      mensagem: 'Erro interno ao excluir cliente.',
    });
  }
};