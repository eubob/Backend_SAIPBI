'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('entrada', {
      id: { type: Sequelize.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true, allowNull: false },
      // 1 compra : N entradas (MVP faz recebimento total; recebimento parcial é F25).
      compra_id: {
        type: Sequelize.INTEGER.UNSIGNED,
        allowNull: false,
        references: { model: 'compra', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT',
      },
      // Prazo real = data_recebimento - compra.data_pedido; atraso = data_recebimento - compra.data_prevista.
      // São derivados, por isso NÃO são armazenados aqui (evita redundância/inconsistência).
      data_recebimento: { type: Sequelize.DATEONLY, allowNull: false },
      observacao: { type: Sequelize.STRING(500), allowNull: true },
      created_at: { allowNull: false, type: Sequelize.DATE, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
      updated_at: { allowNull: false, type: Sequelize.DATE, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP') },
    }, { engine: 'InnoDB', charset: 'utf8mb4', collate: 'utf8mb4_unicode_ci' });

    await queryInterface.addIndex('entrada', ['data_recebimento'], { name: 'idx_entrada_data_recebimento' });
    // compra_id: índice criado pela FK.
  },

  async down(queryInterface) {
    await queryInterface.dropTable('entrada');
  },
};
