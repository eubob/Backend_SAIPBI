'use strict';

const { Model, DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  class Empresa extends Model {
    static associate(models) {
      Empresa.hasMany(models.Usuario, { foreignKey: 'empresa_id', as: 'usuarios' });
    }
  }

  Empresa.init({
    id: { type: DataTypes.INTEGER.UNSIGNED, primaryKey: true, autoIncrement: true },
    razao_social: { type: DataTypes.STRING(150), allowNull: false },
    nome_fantasia: { type: DataTypes.STRING(150), allowNull: false },
    documento: { type: DataTypes.STRING(20), allowNull: true, unique: true },
    email: { type: DataTypes.STRING(120), allowNull: true, validate: { isEmail: true } },
    telefone: { type: DataTypes.STRING(20), allowNull: true },
    ativo: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
  }, {
    sequelize,
    modelName: 'Empresa',
    tableName: 'empresa',
    underscored: true,
    timestamps: true,
    paranoid: true,
  });

  return Empresa;
};
