"use strict";

const { Model, DataTypes } = require("sequelize");

module.exports = (sequelize) => {
  class Empresa extends Model {
    static associate(models) {
      Empresa.hasMany(models.Usuario, {
        foreignKey: "empresa_id",
        as: "usuarios",
      });
      Empresa.hasMany(models.Categoria, {
        foreignKey: "empresa_id",
        as: "categorias",
      });
      Empresa.hasMany(models.Cliente, {
        foreignKey: "empresa_id",
        as: "clientes",
      });
      Empresa.hasMany(models.Fornecedor, {
        foreignKey: "empresa_id",
        as: "fornecedores",
      });
      Empresa.hasMany(models.Produto, {
        foreignKey: "empresa_id",
        as: "produtos",
      });
      Empresa.hasMany(models.ProdutoFornecedor, {
        foreignKey: "empresa_id",
        as: "produtos_fornecedores",
      });
      Empresa.hasMany(models.ParametroSistema, {
        foreignKey: "empresa_id",
        as: "parametros",
      });
      Empresa.hasMany(models.Compra, {
        foreignKey: "empresa_id",
        as: "compras",
      });
      Empresa.hasMany(models.Entrada, {
        foreignKey: "empresa_id",
        as: "entradas",
      });
      Empresa.hasMany(models.Saida, { foreignKey: "empresa_id", as: "saidas" });
      Empresa.hasMany(models.MovimentacaoEstoque, {
        foreignKey: "empresa_id",
        as: "movimentacoes_estoque",
      });
    }
  }

  Empresa.init(
    {
      id: {
        type: DataTypes.INTEGER.UNSIGNED,
        primaryKey: true,
        autoIncrement: true,
      },
      razao_social: { type: DataTypes.STRING(150), allowNull: false },
      nome_fantasia: { type: DataTypes.STRING(150), allowNull: false },
      documento: { type: DataTypes.STRING(20), allowNull: true, unique: true },
      email: {
        type: DataTypes.STRING(120),
        allowNull: true,
        validate: { isEmail: true },
      },
      telefone: { type: DataTypes.STRING(20), allowNull: true },
      ativo: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
    },
    {
      sequelize,
      modelName: "Empresa",
      tableName: "empresa",
      underscored: true,
      timestamps: true,
      paranoid: true,
    },
  );

  return Empresa;
};
