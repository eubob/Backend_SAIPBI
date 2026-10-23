"use strict";

require("dotenv").config();
const bcrypt = require("bcryptjs");

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface) {
    const [empresas] = await queryInterface.sequelize.query(`
      SELECT id
      FROM empresa
      WHERE documento = '00000000000191'
        AND deleted_at IS NULL
      LIMIT 1;
    `);

    if (!empresas.length) {
      throw new Error(
        "Empresa Coca-Cola Demo não encontrada. Execute primeiro o seeder de empresa.",
      );
    }

    const empresaId = empresas[0].id;

    const [perfis] = await queryInterface.sequelize.query(`
      SELECT id, nome
      FROM perfil_acesso
      WHERE nome IN ('Administrador', 'Gestor', 'Operador')
        AND deleted_at IS NULL;
    `);

    const administrador = perfis.find(
      (perfil) => perfil.nome === "Administrador",
    );
    const gestor = perfis.find((perfil) => perfil.nome === "Gestor");
    const operador = perfis.find((perfil) => perfil.nome === "Operador");

    if (!administrador || !gestor || !operador) {
      throw new Error(
        "Perfis iniciais não encontrados. Execute primeiro o seeder de perfis.",
      );
    }

    const rounds = Number(process.env.BCRYPT_ROUNDS) || 10;
    const senhaHash = await bcrypt.hash("1234", rounds);

    await queryInterface.bulkInsert("usuario", [
      {
        empresa_id: empresaId,
        perfil_id: administrador.id,
        nome: "Administrador SAIPBI",
        email: "admin@saipbi.local",
        senha: senhaHash,
        ativo: true,
        created_at: new Date(),
        updated_at: new Date(),
        deleted_at: null,
      },
      {
        empresa_id: empresaId,
        perfil_id: gestor.id,
        nome: "Gestor SAIPBI",
        email: "gestor@saipbi.local",
        senha: senhaHash,
        ativo: true,
        created_at: new Date(),
        updated_at: new Date(),
        deleted_at: null,
      },
      {
        empresa_id: empresaId,
        perfil_id: operador.id,
        nome: "Operador SAIPBI",
        email: "operador@saipbi.local",
        senha: senhaHash,
        ativo: true,
        created_at: new Date(),
        updated_at: new Date(),
        deleted_at: null,
      },
    ]);
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete("usuario", {
      email: [
        "admin@saipbi.local",
        "gestor@saipbi.local",
        "operador@saipbi.local",
      ],
    });
  },
};
