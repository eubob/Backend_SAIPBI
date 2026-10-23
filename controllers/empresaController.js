const { Empresa } = require("../models");

const buscarEmpresaAtual = async (req, res) => {
  try {
    const empresa = await Empresa.findOne({
      where: { id: req.auth.empresaId, ativo: true },
    });
    if (!empresa)
      return res.status(404).json({ mensagem: "Empresa não encontrada." });
    return res.status(200).json(empresa);
  } catch (error) {
    console.error("Erro ao buscar empresa:", error);
    return res.status(500).json({ mensagem: "Erro ao buscar empresa." });
  }
};

const atualizarEmpresaAtual = async (req, res) => {
  try {
    const empresa = await Empresa.findOne({
      where: { id: req.auth.empresaId, ativo: true },
    });
    if (!empresa)
      return res.status(404).json({ mensagem: "Empresa não encontrada." });

    const { razao_social, nome_fantasia, documento, email, telefone } =
      req.body;
    const dadosAtualizacao = {};
    if (razao_social !== undefined)
      dadosAtualizacao.razao_social = razao_social;
    if (nome_fantasia !== undefined)
      dadosAtualizacao.nome_fantasia = nome_fantasia;
    if (documento !== undefined) dadosAtualizacao.documento = documento;
    if (email !== undefined) dadosAtualizacao.email = email;
    if (telefone !== undefined) dadosAtualizacao.telefone = telefone;

    await empresa.update(dadosAtualizacao);
    return res
      .status(200)
      .json({ mensagem: "Empresa atualizada com sucesso.", empresa });
  } catch (error) {
    console.error("Erro ao atualizar empresa:", error);
    if (error.name === "SequelizeUniqueConstraintError") {
      return res
        .status(409)
        .json({ mensagem: "Já existe uma empresa com este documento." });
    }
    return res.status(500).json({ mensagem: "Erro ao atualizar empresa." });
  }
};

module.exports = { buscarEmpresaAtual, atualizarEmpresaAtual };
