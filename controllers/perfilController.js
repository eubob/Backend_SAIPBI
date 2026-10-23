const { Perfil } = require("../models");

const listarPerfis = async (req, res) => {
  try {
    const perfis = await Perfil.findAll({
      attributes: ["id", "nome", "descricao"],

      order: [["id", "ASC"]],
    });

    return res.status(200).json(perfis);
  } catch (error) {
    console.error("Erro ao buscar perfis:", error);

    return res.status(500).json({
      mensagem: "Erro ao buscar perfis.",
    });
  }
};

module.exports = {
  listarPerfis,
};
