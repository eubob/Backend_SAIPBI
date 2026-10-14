'use strict';
const { Model, DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  class Compra extends Model {
    static associate(models) {
      Compra.belongsTo(models.Fornecedor, { foreignKey: 'fornecedor_id', as: 'fornecedor' });
      Compra.hasMany(models.ItemCompra, { foreignKey: 'compra_id', as: 'itens' });
      Compra.hasMany(models.Entrada, { foreignKey: 'compra_id', as: 'entradas' });
    }
  }

  Compra.init({
    id: { type: DataTypes.INTEGER.UNSIGNED, primaryKey: true, autoIncrement: true },
    fornecedor_id: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
    data_pedido: { type: DataTypes.DATEONLY, allowNull: false },
    data_prevista: { type: DataTypes.DATEONLY, allowNull: false },
    status: { type: DataTypes.ENUM('PEDIDA', 'RECEBIDA', 'CANCELADA'), allowNull: false, defaultValue: 'PEDIDA' },
    observacao: { type: DataTypes.STRING(500) }
  }, {
    sequelize,
    modelName: 'Compra',
    tableName: 'compra',
    underscored: true,
    timestamps: true
  });

  return Compra;
};
