"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable(
      "compra",
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
        fornecedor_id: {
          type: Sequelize.INTEGER.UNSIGNED,
          allowNull: false,
          references: { model: "fornecedor", key: "id" },
          onUpdate: "CASCADE",
          onDelete: "RESTRICT",
        },
        data_pedido: { type: Sequelize.DATEONLY, allowNull: false },
        // Data prometida pelo fornecedor; base do cálculo de atraso.
        data_prevista: { type: Sequelize.DATEONLY, allowNull: false },
        // PEDIDA = em trânsito; só PEDIDA pode ser cancelada ou recebida.
        status: {
          type: Sequelize.ENUM("PEDIDA", "RECEBIDA", "CANCELADA"),
          allowNull: false,
          defaultValue: "PEDIDA",
        },
        observacao: { type: Sequelize.STRING(500), allowNull: true },
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

    await queryInterface.sequelize.query(`
      ALTER TABLE compra
        ADD CONSTRAINT ck_compra_data_prevista CHECK (data_prevista >= data_pedido)
    `);

    // "Compras em trânsito / atrasadas": WHERE status='PEDIDA' AND data_prevista < hoje.
    await queryInterface.addIndex("compra", ["status", "data_prevista"], {
      name: "idx_compra_status_prevista",
    });
    await queryInterface.addIndex("compra", ["data_pedido"], {
      name: "idx_compra_data_pedido",
    });
    // fornecedor_id: índice criado automaticamente pela FK.
    await queryInterface.addIndex("compra", ["empresa_id"], {
      name: "idx_compra_empresa",
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable("compra");
  },
};
