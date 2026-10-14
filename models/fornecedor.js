'use strict';
const { Model, DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  class Fornecedor extends Model {
    static associate(models) {
      Fornecedor.belongsToMany(models.Produto, {
        through: models.ProdutoFornecedor,
        foreignKey: 'fornecedor_id',
        otherKey: 'produto_id',
        as: 'produtos'
      });
      Fornecedor.hasMany(models.ProdutoFornecedor, { foreignKey: 'fornecedor_id', as: 'vinculos_produto' });
      Fornecedor.hasMany(models.Compra, { foreignKey: 'fornecedor_id', as: 'compras' });
    }
  }

  Fornecedor.init({
    id: { type: DataTypes.INTEGER.UNSIGNED, primaryKey: true, autoIncrement: true },
    razao_social: { type: DataTypes.STRING(150), allowNull: false },
    documento: { type: DataTypes.STRING(20), allowNull: false, unique: true },
    contato: { type: DataTypes.STRING(150) },
    ativo: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true }
  }, {
    sequelize,
    modelName: 'Fornecedor',
    tableName: 'fornecedor',
    underscored: true,
    timestamps: true
  });

  return Fornecedor;
};
