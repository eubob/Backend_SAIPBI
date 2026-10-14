'use strict';
const { Model, DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  class ParametroSistema extends Model {}

  ParametroSistema.init({
    id: { type: DataTypes.INTEGER.UNSIGNED, primaryKey: true, autoIncrement: true },
    chave: { type: DataTypes.STRING(100), allowNull: false, unique: true },
    // Valor serializado como texto; interpretar conforme `tipo`.
    valor: { type: DataTypes.STRING(255), allowNull: false },
    tipo: { type: DataTypes.ENUM('INTEIRO', 'DECIMAL', 'TEXTO', 'BOOLEANO', 'HORA'), allowNull: false },
    grupo: { type: DataTypes.STRING(50), allowNull: false },
    descricao: { type: DataTypes.STRING(255) }
  }, {
    sequelize,
    modelName: 'ParametroSistema',
    tableName: 'parametro_sistema',
    underscored: true,
    timestamps: true
  });

  return ParametroSistema;
};
