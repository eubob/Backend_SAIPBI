const express = require("express");
const cors = require("cors");

const config = require("./config/app");
const { sequelize } = require("./models");
const routes = require("./routes");

const app = express();

async function startServer() {
  try {
    await sequelize.authenticate();

    console.log("Conexão com o banco realizada com sucesso.");

    app.use(cors(config.cors));

    app.use(express.json());

    app.use("/", routes);

    app.listen(config.port, () => {
      console.log(`Servidor rodando na porta ${config.port}`);
    });
  } catch (err) {
    console.error("Erro ao conectar com o banco:", err);

    process.exit(1);
  }
}

startServer();