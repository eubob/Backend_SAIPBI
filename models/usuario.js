'use strict';
const { Model, DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  class Usuario extends Model {
    static associate(models) {
      Usuario.belongsTo(models.Perfil, { foreignKey: 'perfil_id', as: 'perfil' });
    }
  }

  Usuario.init({
    id: { 
      type: DataTypes.INTEGER, 
      primaryKey: true, 
      autoIncrement: true 
    },
    perfil_id: { 
      type: DataTypes.INTEGER, 
      allowNull: false 
    },
    nome: { 
      type: DataTypes.STRING(100), 
      allowNull: false 
    },
    email: { 
      type: DataTypes.STRING(100), 
      allowNull: false, 
      unique: true,
      validate: {
        isEmail: true
      }
    },
    senha: { 
      type: DataTypes.STRING(255), 
      allowNull: false 
    },
    ativo: { 
      type: DataTypes.BOOLEAN, 
      defaultValue: true 
    }
  }, {
    sequelize,
    modelName: 'Usuario',
    tableName: 'tb_usuarios',
    underscored: true, 
    timestamps: true,
    paranoid: true      
  });

  return Usuario;
};