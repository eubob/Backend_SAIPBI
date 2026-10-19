const { Fornecedor } = require('../models');

// Listar todos os fornecedores
exports.listarFornecedores = async (req, res) => {
  try {
    const fornecedores = await Fornecedor.findAll({
      order: [['razao_social', 'ASC']],
    });

    return res.status(200).json(fornecedores);
  } catch (error) {
    console.error('Erro ao listar fornecedores:', error);

    return res.status(500).json({
      mensagem: 'Erro interno ao listar fornecedores.',
    });
  }
};

// Buscar fornecedor por ID
exports.buscarFornecedorPorId = async (req, res) => {
  try {
    const { id } = req.params;

    const fornecedor = await Fornecedor.findByPk(id);

    if (!fornecedor) {
      return res.status(404).json({
        mensagem: 'Fornecedor não encontrado.',
      });
    }

    return res.status(200).json(fornecedor);
  } catch (error) {
    console.error('Erro ao buscar fornecedor:', error);

    return res.status(500).json({
      mensagem: 'Erro interno ao buscar fornecedor.',
    });
  }
};

// Criar fornecedor
exports.criarFornecedor = async (req, res) => {
  try {
    const {
      razao_social,
      documento,
      contato,
      ativo = true,
    } = req.body;

    if (!razao_social || !razao_social.trim()) {
      return res.status(400).json({
        mensagem: 'A razão social é obrigatória.',
      });
    }

    if (!documento || !documento.trim()) {
      return res.status(400).json({
        mensagem: 'O documento é obrigatório.',
      });
    }

    const fornecedorExistente = await Fornecedor.findOne({
      where: {
        documento: documento.trim(),
      },
    });

    if (fornecedorExistente) {
      return res.status(409).json({
        mensagem: 'Já existe um fornecedor com esse documento.',
      });
    }

    const fornecedor = await Fornecedor.create({
      razao_social: razao_social.trim(),
      documento: documento.trim(),
      contato: contato ? contato.trim() : null,
      ativo,
    });

    return res.status(201).json({
      mensagem: 'Fornecedor cadastrado com sucesso.',
      fornecedor,
    });
  } catch (error) {
    console.error('Erro ao criar fornecedor:', error);

    return res.status(500).json({
      mensagem: 'Erro interno ao criar fornecedor.',
    });
  }
};

// Atualizar fornecedor
exports.atualizarFornecedor = async (req, res) => {
  try {
    const { id } = req.params;

    const {
      razao_social,
      documento,
      contato,
      ativo,
    } = req.body;

    const fornecedor = await Fornecedor.findByPk(id);

    if (!fornecedor) {
      return res.status(404).json({
        mensagem: 'Fornecedor não encontrado.',
      });
    }

    if (razao_social !== undefined) {
      if (!razao_social.trim()) {
        return res.status(400).json({
          mensagem: 'A razão social não pode ficar vazia.',
        });
      }

      fornecedor.razao_social = razao_social.trim();
    }

    if (documento !== undefined) {
      if (!documento.trim()) {
        return res.status(400).json({
          mensagem: 'O documento não pode ficar vazio.',
        });
      }

      const fornecedorExistente = await Fornecedor.findOne({
        where: {
          documento: documento.trim(),
        },
      });

      if (
        fornecedorExistente &&
        fornecedorExistente.id !== fornecedor.id
      ) {
        return res.status(409).json({
          mensagem: 'Já existe um fornecedor com esse documento.',
        });
      }

      fornecedor.documento = documento.trim();
    }

    if (contato !== undefined) {
      fornecedor.contato = contato ? contato.trim() : null;
    }

    if (ativo !== undefined) {
      fornecedor.ativo = ativo;
    }

    await fornecedor.save();

    return res.status(200).json({
      mensagem: 'Fornecedor atualizado com sucesso.',
      fornecedor,
    });
  } catch (error) {
    console.error('Erro ao atualizar fornecedor:', error);

    return res.status(500).json({
      mensagem: 'Erro interno ao atualizar fornecedor.',
    });
  }
};

// Excluir fornecedor
exports.deletarFornecedor = async (req, res) => {
  try {
    const { id } = req.params;

    const fornecedor = await Fornecedor.findByPk(id);

    if (!fornecedor) {
      return res.status(404).json({
        mensagem: 'Fornecedor não encontrado.',
      });
    }

    await fornecedor.destroy();

    return res.status(200).json({
      mensagem: 'Fornecedor excluído com sucesso.',
    });
  } catch (error) {
    console.error('Erro ao excluir fornecedor:', error);

    return res.status(500).json({
      mensagem: 'Erro interno ao excluir fornecedor.',
    });
  }
};