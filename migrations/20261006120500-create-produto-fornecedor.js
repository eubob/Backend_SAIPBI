"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable(
      "produto_fornecedor",
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
        produto_id: {
          type: Sequelize.INTEGER.UNSIGNED,
          allowNull: false,
          references: { model: "produto", key: "id" },
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
        prazo_padrao_dias: {
          type: Sequelize.INTEGER.UNSIGNED,
          allowNull: false,
        },
        lote_minimo: {
          type: Sequelize.INTEGER.UNSIGNED,
          allowNull: false,
          defaultValue: 1,
        },
        custo: { type: Sequelize.DECIMAL(12, 2), allowNull: false },
        principal: {
          type: Sequelize.BOOLEAN,
          allowNull: false,
          defaultValue: false,
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

    // Um fornecedor só pode aparecer uma vez por produto.
    await queryInterface.addConstraint("produto_fornecedor", {
      fields: ["empresa_id", "produto_id", "fornecedor_id"],
      type: "unique",
      name: "uq_produto_fornecedor",
    });

    await queryInterface.sequelize.query(`
      ALTER TABLE produto_fornecedor
        ADD CONSTRAINT ck_pf_prazo_positivo CHECK (prazo_padrao_dias > 0),
        ADD CONSTRAINT ck_pf_lote_positivo CHECK (lote_minimo > 0),
        ADD CONSTRAINT ck_pf_custo_positivo CHECK (custo > 0)
    `);

    // No máximo UM fornecedor principal por produto.
    // MySQL não tem índice único parcial; a coluna gerada vale produto_id quando principal=1
    // e NULL caso contrário (NULLs não colidem em índice UNIQUE).
    await queryInterface.sequelize.query(`
      ALTER TABLE produto_fornecedor
        ADD COLUMN produto_principal_id INT UNSIGNED
          GENERATED ALWAYS AS (CASE WHEN principal = 1 THEN produto_id ELSE NULL END) VIRTUAL,
        ADD CONSTRAINT uq_pf_um_principal_por_produto UNIQUE (produto_principal_id)
    `);
    // O índice em produto_id é coberto pelo UNIQUE (produto_id, fornecedor_id);
    // o índice em fornecedor_id é criado automaticamente pela FK.
    await queryInterface.addIndex("produto_fornecedor", ["empresa_id"], {
      name: "idx_produto_fornecedor_empresa",
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable("produto_fornecedor");
  },
};
