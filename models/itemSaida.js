'use strict';
const { Model, DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  class ItemSaida extends Model {
    static associate(models) {
      ItemSaida.belongsTo(models.Saida, { foreignKey: 'saida_id', as: 'saida' });
      ItemSaida.belongsTo(models.Produto, { foreignKey: 'produto_id', as: 'produto' });
      ItemSaida.hasMany(models.MovimentacaoEstoque, { foreignKey: 'item_saida_id', as: 'movimentacoes' });
    }
  }

  ItemSaida.init({
    id: { type: DataTypes.INTEGER.UNSIGNED, primaryKey: true, autoIncrement: true },
    saida_id: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
    produto_id: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
    quantidade: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false, validate: { min: 1 } },
    preco_unitario: { type: DataTypes.DECIMAL(12, 2), allowNull: false, validate: { min: 0.01 } }
  }, {
    sequelize,
    modelName: 'ItemSaida',
    tableName: 'item_saida',
    underscored: true,
    timestamps: true
  });

  return ItemSaida;
};
