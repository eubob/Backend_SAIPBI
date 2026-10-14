'use strict';
const { Model, DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  class Entrada extends Model {
    static associate(models) {
      Entrada.belongsTo(models.Compra, { foreignKey: 'compra_id', as: 'compra' });
      Entrada.hasMany(models.ItemEntrada, { foreignKey: 'entrada_id', as: 'itens' });
    }
  }

  Entrada.init({
    id: { type: DataTypes.INTEGER.UNSIGNED, primaryKey: true, autoIncrement: true },
    compra_id: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
    data_recebimento: { type: DataTypes.DATEONLY, allowNull: false },
    observacao: { type: DataTypes.STRING(500) }
  }, {
    sequelize,
    modelName: 'Entrada',
    tableName: 'entrada',
    underscored: true,
    timestamps: true
  });

  return Entrada;
};
