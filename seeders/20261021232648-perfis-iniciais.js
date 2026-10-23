"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface) {
    await queryInterface.bulkInsert("perfil_acesso", [
      {
        nome: "Administrador",
        descricao: "Acesso administrativo completo ao sistema.",
        created_at: new Date(),
        updated_at: new Date(),
        deleted_at: null,
      },
      {
        nome: "Gestor",
        descricao: "Acesso à gestão operacional, análises e decisões gerenciais.",
        created_at: new Date(),
        updated_at: new Date(),
        deleted_at: null,
      },
      {
        nome: "Operador",
        descricao: "Acesso às operações permitidas no sistema.",
        created_at: new Date(),
        updated_at: new Date(),
        deleted_at: null,
      },
    ]);
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete("perfil_acesso", {
      nome: ["Administrador", "Gestor", "Operador"],
    });
  },
};
