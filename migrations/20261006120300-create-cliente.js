"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable(
      "cliente",
      {
        id: {
          type: Sequelize.INTEGER.UNSIGNED,
          autoIncrement: true,
          primaryKey: true,
          allowNull: false,
        },
        empresa_id: {
          type: Sequelize.INTEGER.UNSIGNED,
          allowNull: false,
          references: { model: "empresa", key: "id" },
          onUpdate: "CASCADE",
          onDelete: "RESTRICT",
        },
        nome: { type: Sequelize.STRING(150), allowNull: false },
        documento: { type: Sequelize.STRING(20), allowNull: true },
        contato: { type: Sequelize.STRING(150), allowNull: true },
        ativo: {
          type: Sequelize.BOOLEAN,
          allowNull: false,
          defaultValue: true,
        },
        created_at: {
          allowNull: false,
          type: Sequelize.DATE,
          defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
        },
        updated_at: {
          allowNull: false,
          type: Sequelize.DATE,
          defaultValue: Sequelize.literal(
            "CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP",
          ),
        },
      },
      { engine: "InnoDB", charset: "utf8mb4", collate: "utf8mb4_unicode_ci" },
    );

    await queryInterface.addConstraint("cliente", {
      fields: ["empresa_id", "documento"],
      type: "unique",
      name: "uq_cliente_empresa_documento",
    });
    await queryInterface.addIndex("cliente", ["empresa_id"], {
      name: "idx_cliente_empresa",
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable("cliente");
  },
};
