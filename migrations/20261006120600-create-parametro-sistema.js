"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable(
      "parametro_sistema",
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
        // Estrutura chave/valor: novos parâmetros entram como linhas, sem migration de schema.
        chave: { type: Sequelize.STRING(100), allowNull: false },
        valor: { type: Sequelize.STRING(255), allowNull: false },
        // Tipo declarado do valor, para validação e conversão na camada de serviço.
        tipo: {
          type: Sequelize.ENUM(
            "INTEIRO",
            "DECIMAL",
            "TEXTO",
            "BOOLEANO",
            "HORA",
          ),
          allowNull: false,
        },
        grupo: { type: Sequelize.STRING(50), allowNull: false },
        descricao: { type: Sequelize.STRING(255), allowNull: true },
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

    await queryInterface.addConstraint("parametro_sistema", {
      fields: ["empresa_id", "chave"],
      type: "unique",
      name: "uq_parametro_empresa_chave",
    });
    await queryInterface.addIndex("parametro_sistema", ["empresa_id"], {
      name: "idx_parametro_sistema_empresa",
    });

    await queryInterface.addIndex("parametro_sistema", ["grupo"], {
      name: "idx_parametro_grupo",
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable("parametro_sistema");
  },
};
