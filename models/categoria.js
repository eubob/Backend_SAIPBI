'use strict';
const { Model, DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  class Categoria extends Model {
    static associate(models) {
      Categoria.hasMany(models.Produto, { foreignKey: 'categoria_id', as: 'produtos' });
    }
  }

  Categoria.init({
    id: { type: DataTypes.INTEGER.UNSIGNED, primaryKey: true, autoIncrement: true },
    nome: { type: DataTypes.STRING(100), allowNull: false, unique: true },
    ativo: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true }
  }, {
    sequelize,
    modelName: 'Categoria',
    tableName: 'categoria',
    underscored: true,
    timestamps: true
  });

  return Categoria;
};
