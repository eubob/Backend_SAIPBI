"use strict";

const { Model, DataTypes } = require("sequelize");

module.exports = (sequelize) => {
  class Perfil extends Model {
    static associate(models) {
      Perfil.hasMany(models.Usuario, {
        foreignKey: "perfil_id",
        as: "usuarios",
      });
    }
  }

  Perfil.init(
    {
      id: {
        type: DataTypes.INTEGER.UNSIGNED,
        primaryKey: true,
        autoIncrement: true,
      },
      nome: {
        type: DataTypes.STRING(50),
        allowNull: false,
        unique: true,
      },
      descricao: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },
    },
    {
      sequelize,
      modelName: "Perfil",
      tableName: "perfil_acesso",
      underscored: true,
      timestamps: true,
      paranoid: true,
    },
  );

  return Perfil;
};
