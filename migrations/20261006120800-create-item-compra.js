'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('item_compra', {
      id: { type: Sequelize.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true, allowNull: false },
      compra_id: {
        type: Sequelize.INTEGER.UNSIGNED,
        allowNull: false,
        references: { model: 'compra', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT',
      },
      produto_id: {
        type: Sequelize.INTEGER.UNSIGNED,
        allowNull: false,
        references: { model: 'produto', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT',
      },
      quantidade: { type: Sequelize.INTEGER.UNSIGNED, allowNull: false },
      custo_unitario: { type: Sequelize.DECIMAL(12, 2), allowNull: false },
      created_at: { allowNull: false, type: Sequelize.DATE, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
      updated_at: { allowNull: false, type: Sequelize.DATE, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP') },
    }, { engine: 'InnoDB', charset: 'utf8mb4', collate: 'utf8mb4_unicode_ci' });

    // Um produto aparece uma única vez por compra.
    await queryInterface.addConstraint('item_compra', {
      fields: ['compra_id', 'produto_id'],
      type: 'unique',
      name: 'uq_item_compra_compra_produto',
    });

    // Alvo da FK composta de item_entrada (garante que o produto recebido é o produto pedido).
    await queryInterface.addConstraint('item_compra', {
      fields: ['id', 'produto_id'],
      type: 'unique',
      name: 'uq_item_compra_id_produto',
    });

    await queryInterface.sequelize.query(`
      ALTER TABLE item_compra
        ADD CONSTRAINT ck_item_compra_quantidade CHECK (quantidade > 0),
        ADD CONSTRAINT ck_item_compra_custo CHECK (custo_unitario > 0)
    `);
    // Índice de produto_id (estoque em trânsito por produto) é criado pela FK.
  },

  async down(queryInterface) {
    await queryInterface.dropTable('item_compra');
  },
};
