'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('empresa', {
      id: { type: Sequelize.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true, allowNull: false },
      razao_social: { type: Sequelize.STRING(150), allowNull: false },
      nome_fantasia: { type: Sequelize.STRING(150), allowNull: false },
      documento: { type: Sequelize.STRING(20), allowNull: true, unique: true },
      email: { type: Sequelize.STRING(120), allowNull: true },
      telefone: { type: Sequelize.STRING(20), allowNull: true },
      ativo: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: true },
      created_at: { allowNull: false, type: Sequelize.DATE, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
      updated_at: { allowNull: false, type: Sequelize.DATE, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP') },
      deleted_at: { allowNull: true, type: Sequelize.DATE, defaultValue: null },
    }, {
      engine: 'InnoDB',
      charset: 'utf8mb4',
      collate: 'utf8mb4_unicode_ci',
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('empresa');
  },
};
