"use strict";

/**
 * Regras de estoque com herança produto → categoria → empresa.
 *
 * - NULL no produto ou na categoria significa "herdar do nível acima";
 *   zero é um valor explícito e prevalece.
 * - produto.estoque_minimo passa a aceitar NULL. Os valores já gravados são
 *   preservados (nenhum produto existente passa a herdar automaticamente).
 * - Não há máximo no nível da empresa: sem máximo no produto ou na categoria,
 *   o item não possui limite superior.
 * - produto_fornecedor ganha multiplo_compra (embalagem/caixa), padrão 1.
 *
 * Observação: DDL no MySQL faz commit implícito; por isso não há transação.
 */
module.exports = {
  async up(queryInterface, Sequelize) {
    const opcional = { type: Sequelize.INTEGER, allowNull: true, defaultValue: null };

    await queryInterface.changeColumn("produto", "estoque_minimo", opcional);
    await queryInterface.addColumn("produto", "estoque_maximo", opcional);
    await queryInterface.addColumn("produto", "estoque_seguranca", opcional);
    await queryInterface.sequelize.query(`
      ALTER TABLE produto
        ADD CONSTRAINT ck_produto_estoque_maximo CHECK (estoque_maximo >= 0),
        ADD CONSTRAINT ck_produto_estoque_seguranca CHECK (estoque_seguranca >= 0)
    `);

    await queryInterface.addColumn("categoria", "estoque_minimo_padrao", opcional);
    await queryInterface.addColumn("categoria", "estoque_maximo_padrao", opcional);
    await queryInterface.addColumn("categoria", "estoque_seguranca_padrao", opcional);
    await queryInterface.sequelize.query(`
      ALTER TABLE categoria
        ADD CONSTRAINT ck_categoria_estoque_minimo_padrao CHECK (estoque_minimo_padrao >= 0),
        ADD CONSTRAINT ck_categoria_estoque_maximo_padrao CHECK (estoque_maximo_padrao >= 0),
        ADD CONSTRAINT ck_categoria_estoque_seguranca_padrao CHECK (estoque_seguranca_padrao >= 0)
    `);

    await queryInterface.addColumn("produto_fornecedor", "multiplo_compra", {
      type: Sequelize.INTEGER.UNSIGNED,
      allowNull: false,
      defaultValue: 1,
    });
    await queryInterface.sequelize.query(`
      ALTER TABLE produto_fornecedor
        ADD CONSTRAINT ck_pf_multiplo_positivo CHECK (multiplo_compra > 0)
    `);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.sequelize.query(
      "ALTER TABLE produto_fornecedor DROP CHECK ck_pf_multiplo_positivo",
    );
    await queryInterface.removeColumn("produto_fornecedor", "multiplo_compra");

    await queryInterface.sequelize.query(`
      ALTER TABLE categoria
        DROP CHECK ck_categoria_estoque_minimo_padrao,
        DROP CHECK ck_categoria_estoque_maximo_padrao,
        DROP CHECK ck_categoria_estoque_seguranca_padrao
    `);
    await queryInterface.removeColumn("categoria", "estoque_seguranca_padrao");
    await queryInterface.removeColumn("categoria", "estoque_maximo_padrao");
    await queryInterface.removeColumn("categoria", "estoque_minimo_padrao");

    await queryInterface.sequelize.query(`
      ALTER TABLE produto
        DROP CHECK ck_produto_estoque_maximo,
        DROP CHECK ck_produto_estoque_seguranca
    `);
    await queryInterface.removeColumn("produto", "estoque_seguranca");
    await queryInterface.removeColumn("produto", "estoque_maximo");
    // Produtos que herdavam o mínimo voltam a ter 0 explícito.
    await queryInterface.sequelize.query(
      "UPDATE produto SET estoque_minimo = 0 WHERE estoque_minimo IS NULL",
    );
    await queryInterface.changeColumn("produto", "estoque_minimo", {
      type: Sequelize.INTEGER,
      allowNull: false,
      defaultValue: 0,
    });
  },
};
