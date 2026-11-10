const { Perfil } = require("../models");

const listarPerfis = async (req, res, next) => {
  try {
    const perfis = await Perfil.findAll({
      attributes: ["id", "nome", "descricao"],

      order: [["id", "ASC"]],
    });

    return res.status(200).json(perfis);
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  listarPerfis,
};
