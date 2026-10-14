'use strict';

/**
 * Alinha os nomes das tabelas criadas nas primeiras migrations (tb_perfis, tb_usuarios)
 * com a especificação funcional (perfil_acesso, usuario).
 *
 * É uma migration NOVA (e não a edição das antigas) para funcionar tanto em bancos
 * onde as migrations anteriores já foram executadas quanto em um banco vazio.
 * RENAME TABLE preserva dados, índices e chaves estrangeiras.
 */
module.exports = {
  async up(queryInterface) {
    await queryInterface.renameTable('tb_perfis', 'perfil_acesso');
    await queryInterface.renameTable('tb_usuarios', 'usuario');
  },

  async down(queryInterface) {
    await queryInterface.renameTable('usuario', 'tb_usuarios');
    await queryInterface.renameTable('perfil_acesso', 'tb_perfis');
  },
};
