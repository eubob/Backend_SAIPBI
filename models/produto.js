"use strict";
const { Model, DataTypes } = require("sequelize");

module.exports = (sequelize) => {
  class Produto extends Model {
    static associate(models) {
      Produto.belongsTo(models.Empresa, {
        foreignKey: "empresa_id",
        as: "empresa",
      });
      Produto.belongsTo(models.Categoria, {
        foreignKey: "categoria_id",
        as: "categoria",
      });

      // N:N com Fornecedor via produto_fornecedor (prazo, lote mínimo, custo, principal)
      Produto.belongsToMany(models.Fornecedor, {
        through: models.ProdutoFornecedor,
        foreignKey: "produto_id",
        otherKey: "fornecedor_id",
        as: "fornecedores",
      });
      Produto.hasMany(models.ProdutoFornecedor, {
        foreignKey: "produto_id",
        as: "vinculos_fornecedor",
      });

      Produto.hasMany(models.ItemCompra, {
        foreignKey: "produto_id",
        as: "itens_compra",
      });
      Produto.hasMany(models.ItemEntrada, {
        foreignKey: "produto_id",
        as: "itens_entrada",
      });
      Produto.hasMany(models.ItemSaida, {
        foreignKey: "produto_id",
        as: "itens_saida",
      });
      Produto.hasMany(models.MovimentacaoEstoque, {
        foreignKey: "produto_id",
        as: "movimentacoes",
      });
    }
  }

  Produto.init(
    {
      id: {
        type: DataTypes.INTEGER.UNSIGNED,
        primaryKey: true,
        autoIncrement: true,
      },
      empresa_id: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
      categoria_id: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
      nome: { type: DataTypes.STRING(150), allowNull: false },
      sku: { type: DataTypes.STRING(50), allowNull: false },
      unidade: {
        type: DataTypes.STRING(10),
        allowNull: false,
        defaultValue: "un",
      },
      // DECIMAL é devolvido como string pelo mysql2 (preserva a precisão monetária).
      preco_venda: {
        type: DataTypes.DECIMAL(12, 2),
        allowNull: false,
        validate: { min: 0.01 },
      },
      custo: {
        type: DataTypes.DECIMAL(12, 2),
        allowNull: false,
        validate: { min: 0.01 },
      },
      estoque_minimo: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
        validate: { min: 0 },
      },
      // Cache do saldo. Fonte de verdade = soma de movimentacao_estoque.
      estoque_atual: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
      },
      ativo: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
    },
    {
      sequelize,
      modelName: "Produto",
      tableName: "produto",
      underscored: true,
      timestamps: true,
    },
  );

  return Produto;
};
