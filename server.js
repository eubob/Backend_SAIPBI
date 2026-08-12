const express = require("express");
const app = express();
const cors = require('cors');
const config = require("./config/app");
const { sequelize } = require("./models"); 

async function startServer() {
    try {
        await sequelize.authenticate();

        app.use(cors(config.cors));
        app.use(express.json()); 

        app.listen(config.port, () => {
            console.log(`Servidor rodando na porta ${config.port}`);
        });

    } catch (err) {
        console.error("Erro ao conectar com o banco:", err);
        process.exit(1);
    }
}

startServer();