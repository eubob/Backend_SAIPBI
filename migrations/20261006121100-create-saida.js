"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable(
      "saida",
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
        cliente_id: {
          type: Sequelize.INTEGER.UNSIGNED,
          allowNull: true, // cliente é opcional na venda
          references: { model: "cliente", key: "id" },
          onUpdate: "CASCADE",
          onDelete: "RESTRICT",
        },
        // Especificação: "só vendas do tipo VENDA entram na demanda". Novos tipos (ex.: perda)
        // entram por migration, sem alterar o significado das saídas existentes.
        tipo: {
          type: Sequelize.ENUM("VENDA"),
          allowNull: false,
          defaultValue: "VENDA",
        },
        data_hora: {
          type: Sequelize.DATE,
          allowNull: false,
          defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
        },
        // Cancelar = mudar status + gerar estorno no razão; o registro original nunca é apagado.
        status: {
          type: Sequelize.ENUM("REGISTRADA", "CANCELADA"),
          allowNull: false,
          defaultValue: "REGISTRADA",
        },
        cancelada_em: { type: Sequelize.DATE, allowNull: true },
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
      ALTER TABLE saida
        ADD CONSTRAINT ck_saida_cancelamento_coerente CHECK (
          (status = 'CANCELADA' AND cancelada_em IS NOT NULL)
          OR (status = 'REGISTRADA' AND cancelada_em IS NULL)
        )
    `);

    // Consolidação diária e filtros por período/status.
    await queryInterface.addIndex("saida", ["status", "data_hora"], {
      name: "idx_saida_status_data",
    });
    // cliente_id: índice criado pela FK.
    await queryInterface.addIndex("saida", ["empresa_id"], {
      name: "idx_saida_empresa",
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable("saida");
  },
};
