"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable(
      "produto",
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
        categoria_id: {
          type: Sequelize.INTEGER.UNSIGNED,
          allowNull: false,
          references: { model: "categoria", key: "id" },
          onUpdate: "CASCADE",
          onDelete: "RESTRICT",
        },
        nome: { type: Sequelize.STRING(150), allowNull: false },
        sku: { type: Sequelize.STRING(50), allowNull: false },
        unidade: {
          type: Sequelize.STRING(10),
          allowNull: false,
          defaultValue: "un",
        },
        preco_venda: { type: Sequelize.DECIMAL(12, 2), allowNull: false },
        // Custo de referência do produto. O custo de compra por fornecedor fica em produto_fornecedor.
        custo: { type: Sequelize.DECIMAL(12, 2), allowNull: false },
        estoque_minimo: {
          type: Sequelize.INTEGER,
          allowNull: false,
          defaultValue: 0,
        },
        // Saldo em cache: deve ser sempre igual à soma de movimentacao_estoque.quantidade.
        estoque_atual: {
          type: Sequelize.INTEGER,
          allowNull: false,
          defaultValue: 0,
        },
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

    await queryInterface.addConstraint("produto", {
      fields: ["empresa_id", "sku"],
      type: "unique",
      name: "uq_produto_empresa_sku",
    });
    await queryInterface.addIndex("produto", ["empresa_id"], {
      name: "idx_produto_empresa",
    });

    // Índice em categoria_id é criado automaticamente pela FK; sku já é UNIQUE.
    await queryInterface.sequelize.query(`
      ALTER TABLE produto
        ADD CONSTRAINT ck_produto_preco_venda_positivo CHECK (preco_venda > 0),
        ADD CONSTRAINT ck_produto_custo_positivo CHECK (custo > 0),
        ADD CONSTRAINT ck_produto_estoque_minimo CHECK (estoque_minimo >= 0)
    `);
  },

  async down(queryInterface) {
    await queryInterface.dropTable("produto");
  },
};
