const app = require("./app");
const config = require("./config/app");
const { sequelize } = require("./models");

async function startServer() {
  try {
    await sequelize.authenticate();

    console.log("Conexão com o banco realizada com sucesso.");

    app.listen(config.port, () => {
      console.log(`Servidor rodando na porta ${config.port}`);
    });
  } catch {
    console.error("Não foi possível conectar ao banco e iniciar o servidor.");

    process.exit(1);
  }
}

startServer();
