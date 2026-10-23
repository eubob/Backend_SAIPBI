"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface) {
    await queryInterface.bulkInsert("empresa", [
      {
        razao_social: "Coca-Cola Demo LTDA",
        nome_fantasia: "Coca-Cola",
        documento: "00000000000191",
        email: "contato@cocacola.demo",
        telefone: "(34) 3333-0000",
        ativo: true,
        created_at: new Date(),
        updated_at: new Date(),
        deleted_at: null,
      },
    ]);
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete("empresa", {
      documento: "00000000000191",
    });
  },
};
