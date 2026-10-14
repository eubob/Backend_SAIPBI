'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('item_entrada', {
      id: { type: Sequelize.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true, allowNull: false },
      entrada_id: {
        type: Sequelize.INTEGER.UNSIGNED,
        allowNull: false,
        references: { model: 'entrada', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT',
      },
      // Liga o que foi recebido ao que foi pedido (conferência "Pedido: 74 / Recebido: 74").
      item_compra_id: { type: Sequelize.INTEGER.UNSIGNED, allowNull: false },
      produto_id: {
        type: Sequelize.INTEGER.UNSIGNED,
        allowNull: false,
        references: { model: 'produto', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT',
      },
      quantidade_recebida: { type: Sequelize.INTEGER.UNSIGNED, allowNull: false },
      created_at: { allowNull: false, type: Sequelize.DATE, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
      updated_at: { allowNull: false, type: Sequelize.DATE, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP') },
    }, { engine: 'InnoDB', charset: 'utf8mb4', collate: 'utf8mb4_unicode_ci' });

    // FK composta: (item_compra_id, produto_id) deve existir em item_compra, então o
    // produto recebido nunca diverge do produto pedido.
    await queryInterface.sequelize.query(`
      ALTER TABLE item_entrada
        ADD CONSTRAINT fk_item_entrada_item_compra
          FOREIGN KEY (item_compra_id, produto_id)
          REFERENCES item_compra (id, produto_id)
          ON UPDATE CASCADE ON DELETE RESTRICT
    `);

    // Cada item pedido é conferido no máximo uma vez por entrada.
    await queryInterface.addConstraint('item_entrada', {
      fields: ['entrada_id', 'item_compra_id'],
      type: 'unique',
      name: 'uq_item_entrada_entrada_item_compra',
    });

    await queryInterface.sequelize.query(`
      ALTER TABLE item_entrada
        ADD CONSTRAINT ck_item_entrada_quantidade CHECK (quantidade_recebida > 0)
    `);
  },

  async down(queryInterface) {
    await queryInterface.dropTable('item_entrada');
  },
};
