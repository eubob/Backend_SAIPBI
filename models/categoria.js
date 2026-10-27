"use strict";
const { Model, DataTypes } = require("sequelize");

module.exports = (sequelize) => {
  class Categoria extends Model {
    static associate(models) {
      Categoria.belongsTo(models.Empresa, {
        foreignKey: "empresa_id",
        as: "empresa",
      });
      Categoria.hasMany(models.Produto, {
        foreignKey: "categoria_id",
        as: "produtos",
      });
    }
  }

  Categoria.init(
    {
      id: {
        type: DataTypes.INTEGER.UNSIGNED,
        primaryKey: true,
        autoIncrement: true,
      },
      empresa_id: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
      nome: { type: DataTypes.STRING(100), allowNull: false },
      ativo: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
    },
    {
      sequelize,
      modelName: "Categoria",
      tableName: "categoria",
      underscored: true,
      timestamps: true,
    },
  );

  return Categoria;
};
