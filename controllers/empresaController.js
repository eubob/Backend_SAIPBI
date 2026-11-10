const { Empresa } = require("../models");

const buscarEmpresaAtual = async (req, res, next) => {
  try {
    const empresa = await Empresa.findOne({
      where: { id: req.auth.empresaId, ativo: true },
    });
    if (!empresa)
      return res.status(404).json({ mensagem: "Empresa não encontrada." });
    return res.status(200).json(empresa);
  } catch (error) {
    return next(error);
  }
};

const atualizarEmpresaAtual = async (req, res, next) => {
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
    return next(error);
  }
};

module.exports = { buscarEmpresaAtual, atualizarEmpresaAtual };
