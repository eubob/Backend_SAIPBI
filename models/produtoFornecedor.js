"use strict";
const { Model, DataTypes } = require("sequelize");

module.exports = (sequelize) => {
  class ProdutoFornecedor extends Model {
    static associate(models) {
      ProdutoFornecedor.belongsTo(models.Empresa, {
        foreignKey: "empresa_id",
        as: "empresa",
      });
      ProdutoFornecedor.belongsTo(models.Produto, {
        foreignKey: "produto_id",
        as: "produto",
      });
      ProdutoFornecedor.belongsTo(models.Fornecedor, {
        foreignKey: "fornecedor_id",
        as: "fornecedor",
      });
    }
  }

  // A coluna gerada produto_principal_id (apoio à unicidade do fornecedor principal)
  // existe só no banco e não é mapeada aqui de propósito.
  ProdutoFornecedor.init(
    {
      id: {
        type: DataTypes.INTEGER.UNSIGNED,
        primaryKey: true,
        autoIncrement: true,
      },
      empresa_id: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
      produto_id: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
      fornecedor_id: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
      prazo_padrao_dias: {
        type: DataTypes.INTEGER.UNSIGNED,
        allowNull: false,
        validate: { min: 1 },
      },
      lote_minimo: {
        type: DataTypes.INTEGER.UNSIGNED,
        allowNull: false,
        defaultValue: 1,
        validate: { min: 1 },
      },
      custo: {
        type: DataTypes.DECIMAL(12, 2),
        allowNull: false,
        validate: { min: 0.01 },
      },
      principal: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
    },
    {
      sequelize,
      modelName: "ProdutoFornecedor",
      tableName: "produto_fornecedor",
      underscored: true,
      timestamps: true,
    },
  );

  return ProdutoFornecedor;
};
