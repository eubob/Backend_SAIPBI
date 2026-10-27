"use strict";
const { Model, DataTypes } = require("sequelize");

module.exports = (sequelize) => {
  class Cliente extends Model {
    static associate(models) {
      Cliente.belongsTo(models.Empresa, {
        foreignKey: "empresa_id",
        as: "empresa",
      });
      Cliente.hasMany(models.Saida, { foreignKey: "cliente_id", as: "vendas" });
    }
  }

  Cliente.init(
    {
      id: {
        type: DataTypes.INTEGER.UNSIGNED,
        primaryKey: true,
        autoIncrement: true,
      },
      empresa_id: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
      nome: { type: DataTypes.STRING(150), allowNull: false },
      documento: { type: DataTypes.STRING(20) },
      contato: { type: DataTypes.STRING(150) },
      ativo: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
    },
    {
      sequelize,
      modelName: "Cliente",
      tableName: "cliente",
      underscored: true,
      timestamps: true,
    },
  );

  return Cliente;
};
