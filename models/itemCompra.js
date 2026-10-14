'use strict';
const { Model, DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  class ItemCompra extends Model {
    static associate(models) {
      ItemCompra.belongsTo(models.Compra, { foreignKey: 'compra_id', as: 'compra' });
      ItemCompra.belongsTo(models.Produto, { foreignKey: 'produto_id', as: 'produto' });
      ItemCompra.hasMany(models.ItemEntrada, { foreignKey: 'item_compra_id', as: 'itens_entrada' });
    }
  }

  ItemCompra.init({
    id: { type: DataTypes.INTEGER.UNSIGNED, primaryKey: true, autoIncrement: true },
    compra_id: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
    produto_id: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
    quantidade: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false, validate: { min: 1 } },
    custo_unitario: { type: DataTypes.DECIMAL(12, 2), allowNull: false, validate: { min: 0.01 } }
  }, {
    sequelize,
    modelName: 'ItemCompra',
    tableName: 'item_compra',
    underscored: true,
    timestamps: true
  });

  return ItemCompra;
};
