"use strict";

const { PARAMETROS_PADRAO } = require("../config/parametros");

module.exports = {
  async up(queryInterface) {
    const [empresas] = await queryInterface.sequelize.query(
      `
          SELECT id
          FROM empresa
          WHERE ativo = 1
            AND deleted_at IS NULL
        `,
    );

    if (!empresas.length) {
      console.log(
        "Nenhuma empresa ativa encontrada. Parâmetros não foram criados.",
      );

      return;
    }

    const agora = new Date();

    const registros = [];

    for (const empresa of empresas) {
      for (const parametro of PARAMETROS_PADRAO) {
        registros.push({
          empresa_id: empresa.id,
          chave: parametro.chave,
          valor: parametro.valor,
          tipo: parametro.tipo,
          grupo: parametro.grupo,
          descricao: parametro.descricao,
          created_at: agora,
          updated_at: agora,
        });
      }
    }

    await queryInterface.bulkInsert("parametro_sistema", registros);
  },

  async down(queryInterface) {
    const chaves = PARAMETROS_PADRAO.map((parametro) => parametro.chave);

    await queryInterface.bulkDelete("parametro_sistema", {
      chave: chaves,
    });
  },
};
