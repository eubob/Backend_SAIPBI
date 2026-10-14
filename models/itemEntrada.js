'use strict';
const { Model, DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  class ItemEntrada extends Model {
    static associate(models) {
      ItemEntrada.belongsTo(models.Entrada, { foreignKey: 'entrada_id', as: 'entrada' });
      ItemEntrada.belongsTo(models.ItemCompra, { foreignKey: 'item_compra_id', as: 'item_compra' });
      ItemEntrada.belongsTo(models.Produto, { foreignKey: 'produto_id', as: 'produto' });
      ItemEntrada.hasMany(models.MovimentacaoEstoque, { foreignKey: 'item_entrada_id', as: 'movimentacoes' });
    }
  }

  ItemEntrada.init({
    id: { type: DataTypes.INTEGER.UNSIGNED, primaryKey: true, autoIncrement: true },
    entrada_id: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
    item_compra_id: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
    produto_id: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
    quantidade_recebida: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false, validate: { min: 1 } }
  }, {
    sequelize,
    modelName: 'ItemEntrada',
    tableName: 'item_entrada',
    underscored: true,
    timestamps: true
  });

  return ItemEntrada;
};
