'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('cliente', {
      id: { type: Sequelize.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true, allowNull: false },
      nome: { type: Sequelize.STRING(150), allowNull: false },
      // Opcional; quando informado, deve ser único (MySQL permite vários NULL em índice UNIQUE).
      documento: { type: Sequelize.STRING(20), allowNull: true, unique: true },
      contato: { type: Sequelize.STRING(150), allowNull: true },
      ativo: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: true },
      created_at: { allowNull: false, type: Sequelize.DATE, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
      updated_at: { allowNull: false, type: Sequelize.DATE, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP') },
    }, { engine: 'InnoDB', charset: 'utf8mb4', collate: 'utf8mb4_unicode_ci' });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('cliente');
  },
};
