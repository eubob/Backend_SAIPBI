"use strict";
const { Model, DataTypes } = require("sequelize");

module.exports = (sequelize) => {
  class Saida extends Model {
    static associate(models) {
      Saida.belongsTo(models.Empresa, {
        foreignKey: "empresa_id",
        as: "empresa",
      });
      Saida.belongsTo(models.Cliente, {
        foreignKey: "cliente_id",
        as: "cliente",
      });
      Saida.hasMany(models.ItemSaida, { foreignKey: "saida_id", as: "itens" });
    }
  }

  Saida.init(
    {
      id: {
        type: DataTypes.INTEGER.UNSIGNED,
        primaryKey: true,
        autoIncrement: true,
      },
      empresa_id: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
      cliente_id: { type: DataTypes.INTEGER.UNSIGNED },
      tipo: {
        type: DataTypes.ENUM("VENDA"),
        allowNull: false,
        defaultValue: "VENDA",
      },
      data_hora: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
      },
      status: {
        type: DataTypes.ENUM("REGISTRADA", "CANCELADA"),
        allowNull: false,
        defaultValue: "REGISTRADA",
      },
      cancelada_em: { type: DataTypes.DATE },
      observacao: { type: DataTypes.STRING(500) },
    },
    {
      sequelize,
      modelName: "Saida",
      tableName: "saida",
      underscored: true,
      timestamps: true,
    },
  );

  return Saida;
};
