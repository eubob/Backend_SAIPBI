'use strict';
const { Model, DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  class Perfil extends Model {
    static associate(models) {
      Perfil.hasMany(models.Usuario, { foreignKey: 'perfil_id', as: 'usuarios' });
    }
  }

  Perfil.init({
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      primaryKey: true,
      autoIncrement: true
    },
    // Perfis de acesso do sistema: Administrador | Gestor | Operador (usado no JWT e na autorização)
    nome: {
      type: DataTypes.STRING(50),
      allowNull: false,
      unique: true
    },
    descricao: {
      type: DataTypes.STRING(255)
    }
  }, {
    sequelize,
    modelName: 'Perfil',
    tableName: 'perfil_acesso',
    underscored: true,
    timestamps: true,
    paranoid: true
  });

  return Perfil;
};
