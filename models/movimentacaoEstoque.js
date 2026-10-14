'use strict';
const { Model, DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  class MovimentacaoEstoque extends Model {
    static associate(models) {
      MovimentacaoEstoque.belongsTo(models.Produto, { foreignKey: 'produto_id', as: 'produto' });
      MovimentacaoEstoque.belongsTo(models.ItemEntrada, { foreignKey: 'item_entrada_id', as: 'item_entrada' });
      MovimentacaoEstoque.belongsTo(models.ItemSaida, { foreignKey: 'item_saida_id', as: 'item_saida' });
    }
  }

  // Razão do estoque (append-only): sem updated_at. Entradas > 0, saídas < 0.
  MovimentacaoEstoque.init({
    id: { type: DataTypes.BIGINT.UNSIGNED, primaryKey: true, autoIncrement: true },
    produto_id: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
    tipo: {
      type: DataTypes.ENUM('INVENTARIO_INICIAL', 'ENTRADA_COMPRA', 'SAIDA_VENDA', 'ESTORNO_VENDA', 'AJUSTE'),
      allowNull: false
    },
    quantidade: { type: DataTypes.INTEGER, allowNull: false },
    saldo_apos: { type: DataTypes.INTEGER, allowNull: false },
    data_hora: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
    item_entrada_id: { type: DataTypes.INTEGER.UNSIGNED },
    item_saida_id: { type: DataTypes.INTEGER.UNSIGNED },
    motivo: { type: DataTypes.STRING(255) }
  }, {
    sequelize,
    modelName: 'MovimentacaoEstoque',
    tableName: 'movimentacao_estoque',
    underscored: true,
    timestamps: true,
    updatedAt: false
  });

  return MovimentacaoEstoque;
};
