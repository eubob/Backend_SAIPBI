'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('item_saida', {
      id: { type: Sequelize.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true, allowNull: false },
      saida_id: {
        type: Sequelize.INTEGER.UNSIGNED,
        allowNull: false,
        references: { model: 'saida', key: 'id' },
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
      // Preço praticado na venda (padrão = produto.preco_venda), preservado para o histórico.
      preco_unitario: { type: Sequelize.DECIMAL(12, 2), allowNull: false },
      created_at: { allowNull: false, type: Sequelize.DATE, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
      updated_at: { allowNull: false, type: Sequelize.DATE, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP') },
    }, { engine: 'InnoDB', charset: 'utf8mb4', collate: 'utf8mb4_unicode_ci' });

    // Um produto aparece uma única vez por venda.
    await queryInterface.addConstraint('item_saida', {
      fields: ['saida_id', 'produto_id'],
      type: 'unique',
      name: 'uq_item_saida_saida_produto',
    });

    await queryInterface.sequelize.query(`
      ALTER TABLE item_saida
        ADD CONSTRAINT ck_item_saida_quantidade CHECK (quantidade > 0),
        ADD CONSTRAINT ck_item_saida_preco CHECK (preco_unitario > 0)
    `);
    // produto_id: índice criado pela FK.
  },

  async down(queryInterface) {
    await queryInterface.dropTable('item_saida');
  },
};
