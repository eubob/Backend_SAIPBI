const { Perfil } = require("../models");

const listarPerfis = async (req, res) => {
  try {
    const perfis = await Perfil.findAll({
      attributes: ["id", "nome", "descricao"],
      order: [["nome", "ASC"]],
    });

    return res.status(200).json(perfis);
  } catch (error) {
    console.error("Erro ao listar perfis:", error);

    return res.status(500).json({
      mensagem: "Erro interno ao buscar perfis de acesso.",
    });
  }
};

module.exports = {
  listarPerfis,
};
