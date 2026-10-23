'use strict';

const { Model, DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  class Usuario extends Model {
    static associate(models) {
      Usuario.belongsTo(models.Empresa, { foreignKey: 'empresa_id', as: 'empresa' });
      Usuario.belongsTo(models.Perfil, { foreignKey: 'perfil_id', as: 'perfil' });
    }
  }

  Usuario.init({
    id: { type: DataTypes.INTEGER.UNSIGNED, primaryKey: true, autoIncrement: true },
    empresa_id: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
    perfil_id: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
    nome: { type: DataTypes.STRING(100), allowNull: false },
    email: { type: DataTypes.STRING(100), allowNull: false, unique: true, validate: { isEmail: true } },
    senha: { type: DataTypes.STRING(255), allowNull: false },
    ativo: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
  }, {
    sequelize,
    modelName: 'Usuario',
    tableName: 'usuario',
    underscored: true,
    timestamps: true,
    paranoid: true,
  });

  return Usuario;
};
