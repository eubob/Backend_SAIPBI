"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable(
      "movimentacao_estoque",
      {
        id: {
          type: Sequelize.BIGINT.UNSIGNED,
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
        tipo: {
          type: Sequelize.ENUM(
            "INVENTARIO_INICIAL",
            "ENTRADA_COMPRA",
            "SAIDA_VENDA",
            "ESTORNO_VENDA",
            "AJUSTE",
          ),
          allowNull: false,
        },
        quantidade: { type: Sequelize.INTEGER, allowNull: false },
        saldo_apos: { type: Sequelize.INTEGER, allowNull: false },
        data_hora: {
          type: Sequelize.DATE,
          allowNull: false,
          defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
        },
        // Origem como FK real (não texto livre). No máximo uma das duas é preenchida,
        // conforme o tipo (ver CHECK abaixo).
        item_entrada_id: {
          type: Sequelize.INTEGER.UNSIGNED,
          allowNull: true,
          references: { model: "item_entrada", key: "id" },
          onUpdate: "RESTRICT", // MySQL não permite CHECK em coluna com FK ON UPDATE CASCADE
          onDelete: "RESTRICT",
        },
        item_saida_id: {
          type: Sequelize.INTEGER.UNSIGNED,
          allowNull: true,
          references: { model: "item_saida", key: "id" },
          onUpdate: "RESTRICT", // MySQL não permite CHECK em coluna com FK ON UPDATE CASCADE
          onDelete: "RESTRICT",
        },
        motivo: { type: Sequelize.STRING(255), allowNull: true },
        created_at: {
          allowNull: false,
          type: Sequelize.DATE,
          defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
        },
      },
      { engine: "InnoDB", charset: "utf8mb4", collate: "utf8mb4_unicode_ci" },
    );

    // Coerência entre tipo, sinal, origem e motivo.
    await queryInterface.sequelize.query(`
      ALTER TABLE movimentacao_estoque
        ADD CONSTRAINT ck_mov_quantidade_nao_zero CHECK (quantidade <> 0),
        ADD CONSTRAINT ck_mov_sinal_por_tipo CHECK (
          (tipo IN ('INVENTARIO_INICIAL', 'ENTRADA_COMPRA', 'ESTORNO_VENDA') AND quantidade > 0)
          OR (tipo = 'SAIDA_VENDA' AND quantidade < 0)
          OR (tipo = 'AJUSTE')
        ),
        ADD CONSTRAINT ck_mov_origem_por_tipo CHECK (
          (tipo = 'ENTRADA_COMPRA' AND item_entrada_id IS NOT NULL AND item_saida_id IS NULL)
          OR (tipo IN ('SAIDA_VENDA', 'ESTORNO_VENDA') AND item_saida_id IS NOT NULL AND item_entrada_id IS NULL)
          OR (tipo IN ('INVENTARIO_INICIAL', 'AJUSTE') AND item_entrada_id IS NULL AND item_saida_id IS NULL)
        ),
        ADD CONSTRAINT ck_mov_ajuste_exige_motivo CHECK (
          tipo <> 'AJUSTE' OR (motivo IS NOT NULL AND CHAR_LENGTH(TRIM(motivo)) > 0)
        )
    `);

    // Um item recebido gera no máximo uma entrada no razão; um item vendido gera
    // no máximo uma saída e um estorno (impede estornar duas vezes).
    await queryInterface.addConstraint("movimentacao_estoque", {
      fields: ["item_entrada_id"],
      type: "unique",
      name: "uq_mov_item_entrada",
    });
    await queryInterface.addConstraint("movimentacao_estoque", {
      fields: ["item_saida_id", "tipo"],
      type: "unique",
      name: "uq_mov_item_saida_tipo",
    });

    // Extrato por produto e séries por período: o acesso dominante.
    await queryInterface.addIndex(
      "movimentacao_estoque",
      ["produto_id", "data_hora"],
      { name: "idx_mov_produto_data" },
    );
    await queryInterface.addIndex("movimentacao_estoque", ["empresa_id"], {
      name: "idx_movimentacao_estoque_empresa",
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable("movimentacao_estoque");
  },
};
