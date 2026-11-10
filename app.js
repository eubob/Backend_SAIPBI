"use strict";

const express = require("express");
const cors = require("cors");
const config = require("./config/app");
const routes = require("./routes");
const errorHandler = require("./middlewares/errorHandler");

const app = express();
app.use(cors(config.cors));
app.use(express.json({ limit: "100kb" }));
app.use("/api/v1", routes);
app.use("/", routes);
app.use((req, res) =>
  res.status(404).json({ mensagem: "Rota não encontrada." }),
);
app.use(errorHandler);

module.exports = app;
