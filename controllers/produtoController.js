const { Produto, Categoria } = require('../models');

// Listar todos os produtos
exports.listarProdutos = async (req, res) => {
  try {
    const produtos = await Produto.findAll({
      include: [
        {
          model: Categoria,
          as: 'categoria',
          attributes: ['id', 'nome'],
        },
      ],
      order: [['nome', 'ASC']],
    });

    return res.status(200).json(produtos);
  } catch (error) {
    console.error('Erro ao listar produtos:', error);

    return res.status(500).json({
      mensagem: 'Erro interno ao listar produtos.',
    });
  }
};

// Buscar produto por ID
exports.buscarProdutoPorId = async (req, res) => {
  try {
    const { id } = req.params;

    const produto = await Produto.findByPk(id, {
      include: [
        {
          model: Categoria,
          as: 'categoria',
          attributes: ['id', 'nome'],
        },
      ],
    });

    if (!produto) {
      return res.status(404).json({
        mensagem: 'Produto não encontrado.',
      });
    }

    return res.status(200).json(produto);
  } catch (error) {
    console.error('Erro ao buscar produto:', error);

    return res.status(500).json({
      mensagem: 'Erro interno ao buscar produto.',
    });
  }
};

// Criar produto
exports.criarProduto = async (req, res) => {
  try {
    const {
      categoria_id,
      nome,
      sku,
      unidade = 'un',
      preco_venda,
      custo,
      estoque_minimo = 0,
      estoque_atual = 0,
      ativo = true,
    } = req.body;

    if (!categoria_id) {
      return res.status(400).json({
        mensagem: 'A categoria é obrigatória.',
      });
    }

    if (!nome || !nome.trim()) {
      return res.status(400).json({
        mensagem: 'O nome do produto é obrigatório.',
      });
    }

    if (!sku || !sku.trim()) {
      return res.status(400).json({
        mensagem: 'O SKU é obrigatório.',
      });
    }

    if (preco_venda === undefined || Number(preco_venda) <= 0) {
      return res.status(400).json({
        mensagem: 'O preço de venda deve ser maior que zero.',
      });
    }

    if (custo === undefined || Number(custo) <= 0) {
      return res.status(400).json({
        mensagem: 'O custo deve ser maior que zero.',
      });
    }

    if (Number(estoque_minimo) < 0) {
      return res.status(400).json({
        mensagem: 'O estoque mínimo não pode ser negativo.',
      });
    }

    const categoria = await Categoria.findByPk(categoria_id);

    if (!categoria) {
      return res.status(404).json({
        mensagem: 'Categoria não encontrada.',
      });
    }

    const produtoExistente = await Produto.findOne({
      where: {
        sku: sku.trim(),
      },
    });

    if (produtoExistente) {
      return res.status(409).json({
        mensagem: 'Já existe um produto com esse SKU.',
      });
    }

    const produto = await Produto.create({
      categoria_id,
      nome: nome.trim(),
      sku: sku.trim(),
      unidade: unidade ? unidade.trim() : 'un',
      preco_venda,
      custo,
      estoque_minimo,
      estoque_atual,
      ativo,
    });

    const produtoCompleto = await Produto.findByPk(produto.id, {
      include: [
        {
          model: Categoria,
          as: 'categoria',
          attributes: ['id', 'nome'],
        },
      ],
    });

    return res.status(201).json({
      mensagem: 'Produto cadastrado com sucesso.',
      produto: produtoCompleto,
    });
  } catch (error) {
    console.error('Erro ao criar produto:', error);

    return res.status(500).json({
      mensagem: 'Erro interno ao criar produto.',
    });
  }
};

// Atualizar produto
exports.atualizarProduto = async (req, res) => {
  try {
    const { id } = req.params;

    const {
      categoria_id,
      nome,
      sku,
      unidade,
      preco_venda,
      custo,
      estoque_minimo,
      estoque_atual,
      ativo,
    } = req.body;

    const produto = await Produto.findByPk(id);

    if (!produto) {
      return res.status(404).json({
        mensagem: 'Produto não encontrado.',
      });
    }

    if (categoria_id !== undefined) {
      const categoria = await Categoria.findByPk(categoria_id);

      if (!categoria) {
        return res.status(404).json({
          mensagem: 'Categoria não encontrada.',
        });
      }

      produto.categoria_id = categoria_id;
    }

    if (nome !== undefined) {
      if (!nome.trim()) {
        return res.status(400).json({
          mensagem: 'O nome do produto não pode ficar vazio.',
        });
      }

      produto.nome = nome.trim();
    }

    if (sku !== undefined) {
      if (!sku.trim()) {
        return res.status(400).json({
          mensagem: 'O SKU não pode ficar vazio.',
        });
      }

      const produtoExistente = await Produto.findOne({
        where: {
          sku: sku.trim(),
        },
      });

      if (
        produtoExistente &&
        produtoExistente.id !== produto.id
      ) {
        return res.status(409).json({
          mensagem: 'Já existe um produto com esse SKU.',
        });
      }

      produto.sku = sku.trim();
    }

    if (unidade !== undefined) {
      if (!unidade.trim()) {
        return res.status(400).json({
          mensagem: 'A unidade não pode ficar vazia.',
        });
      }

      produto.unidade = unidade.trim();
    }

    if (preco_venda !== undefined) {
      if (Number(preco_venda) <= 0) {
        return res.status(400).json({
          mensagem: 'O preço de venda deve ser maior que zero.',
        });
      }

      produto.preco_venda = preco_venda;
    }

    if (custo !== undefined) {
      if (Number(custo) <= 0) {
        return res.status(400).json({
          mensagem: 'O custo deve ser maior que zero.',
        });
      }

      produto.custo = custo;
    }

    if (estoque_minimo !== undefined) {
      if (Number(estoque_minimo) < 0) {
        return res.status(400).json({
          mensagem: 'O estoque mínimo não pode ser negativo.',
        });
      }

      produto.estoque_minimo = estoque_minimo;
    }

    if (estoque_atual !== undefined) {
      produto.estoque_atual = estoque_atual;
    }

    if (ativo !== undefined) {
      produto.ativo = ativo;
    }

    await produto.save();

    const produtoAtualizado = await Produto.findByPk(produto.id, {
      include: [
        {
          model: Categoria,
          as: 'categoria',
          attributes: ['id', 'nome'],
        },
      ],
    });

    return res.status(200).json({
      mensagem: 'Produto atualizado com sucesso.',
      produto: produtoAtualizado,
    });
  } catch (error) {
    console.error('Erro ao atualizar produto:', error);

    return res.status(500).json({
      mensagem: 'Erro interno ao atualizar produto.',
    });
  }
};

// Excluir produto
exports.deletarProduto = async (req, res) => {
  try {
    const { id } = req.params;

    const produto = await Produto.findByPk(id);

    if (!produto) {
      return res.status(404).json({
        mensagem: 'Produto não encontrado.',
      });
    }

    await produto.destroy();

    return res.status(200).json({
      mensagem: 'Produto excluído com sucesso.',
    });
  } catch (error) {
    console.error('Erro ao excluir produto:', error);

    return res.status(500).json({
      mensagem: 'Erro interno ao excluir produto.',
    });
  }
};