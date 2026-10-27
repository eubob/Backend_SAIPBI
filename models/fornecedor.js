"use strict";
const { Model, DataTypes } = require("sequelize");

module.exports = (sequelize) => {
  class Fornecedor extends Model {
    static associate(models) {
      Fornecedor.belongsTo(models.Empresa, {
        foreignKey: "empresa_id",
        as: "empresa",
      });
      Fornecedor.belongsToMany(models.Produto, {
        through: models.ProdutoFornecedor,
        foreignKey: "fornecedor_id",
        otherKey: "produto_id",
        as: "produtos",
      });
      Fornecedor.hasMany(models.ProdutoFornecedor, {
        foreignKey: "fornecedor_id",
        as: "vinculos_produto",
      });
      Fornecedor.hasMany(models.Compra, {
        foreignKey: "fornecedor_id",
        as: "compras",
      });
    }
  }

  Fornecedor.init(
    {
      id: {
        type: DataTypes.INTEGER.UNSIGNED,
        primaryKey: true,
        autoIncrement: true,
      },
      empresa_id: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
      razao_social: { type: DataTypes.STRING(150), allowNull: false },
      documento: { type: DataTypes.STRING(20), allowNull: false },
      contato: { type: DataTypes.STRING(150) },
      ativo: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
    },
    {
      sequelize,
      modelName: "Fornecedor",
      tableName: "fornecedor",
      underscored: true,
      timestamps: true,
    },
  );

  return Fornecedor;
};
