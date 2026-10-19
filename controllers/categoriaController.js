const { Categoria } = require('../models');

// Listar todas as categorias
exports.listarCategorias = async (req, res) => {
  try {
    const categorias = await Categoria.findAll({
      order: [['nome', 'ASC']],
    });

    return res.status(200).json(categorias);
  } catch (error) {
    console.error('Erro ao listar categorias:', error);

    return res.status(500).json({
      mensagem: 'Erro interno ao listar categorias.',
    });
  }
};

// Buscar categoria por ID
exports.buscarCategoriaPorId = async (req, res) => {
  try {
    const { id } = req.params;

    const categoria = await Categoria.findByPk(id);

    if (!categoria) {
      return res.status(404).json({
        mensagem: 'Categoria não encontrada.',
      });
    }

    return res.status(200).json(categoria);
  } catch (error) {
    console.error('Erro ao buscar categoria:', error);

    return res.status(500).json({
      mensagem: 'Erro interno ao buscar categoria.',
    });
  }
};

// Criar categoria
exports.criarCategoria = async (req, res) => {
  try {
    const { nome, ativo = true } = req.body;

    if (!nome || !nome.trim()) {
      return res.status(400).json({
        mensagem: 'O nome da categoria é obrigatório.',
      });
    }

    const categoriaExistente = await Categoria.findOne({
      where: {
        nome: nome.trim(),
      },
    });

    if (categoriaExistente) {
      return res.status(409).json({
        mensagem: 'Já existe uma categoria com esse nome.',
      });
    }

    const categoria = await Categoria.create({
      nome: nome.trim(),
      ativo,
    });

    return res.status(201).json({
      mensagem: 'Categoria cadastrada com sucesso.',
      categoria,
    });
  } catch (error) {
    console.error('Erro ao criar categoria:', error);

    return res.status(500).json({
      mensagem: 'Erro interno ao criar categoria.',
    });
  }
};

// Atualizar categoria
exports.atualizarCategoria = async (req, res) => {
  try {
    const { id } = req.params;
    const { nome, ativo } = req.body;

    const categoria = await Categoria.findByPk(id);

    if (!categoria) {
      return res.status(404).json({
        mensagem: 'Categoria não encontrada.',
      });
    }

    if (nome !== undefined) {
      if (!nome.trim()) {
        return res.status(400).json({
          mensagem: 'O nome da categoria não pode ficar vazio.',
        });
      }

      const categoriaExistente = await Categoria.findOne({
        where: {
          nome: nome.trim(),
        },
      });

      if (
        categoriaExistente &&
        categoriaExistente.id !== categoria.id
      ) {
        return res.status(409).json({
          mensagem: 'Já existe uma categoria com esse nome.',
        });
      }

      categoria.nome = nome.trim();
    }

    if (ativo !== undefined) {
      categoria.ativo = ativo;
    }

    await categoria.save();

    return res.status(200).json({
      mensagem: 'Categoria atualizada com sucesso.',
      categoria,
    });
  } catch (error) {
    console.error('Erro ao atualizar categoria:', error);

    return res.status(500).json({
      mensagem: 'Erro interno ao atualizar categoria.',
    });
  }
};

// Excluir categoria
exports.deletarCategoria = async (req, res) => {
  try {
    const { id } = req.params;

    const categoria = await Categoria.findByPk(id);

    if (!categoria) {
      return res.status(404).json({
        mensagem: 'Categoria não encontrada.',
      });
    }

    await categoria.destroy();

    return res.status(200).json({
      mensagem: 'Categoria excluída com sucesso.',
    });
  } catch (error) {
    console.error('Erro ao excluir categoria:', error);

    return res.status(500).json({
      mensagem: 'Erro interno ao excluir categoria.',
    });
  }
};