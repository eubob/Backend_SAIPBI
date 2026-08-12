require("dotenv").config();

const commonConfig = {
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: Number(process.env.DB_PORT),
  dialect: "mysql",
};

module.exports = {
  development: { ...commonConfig },
  production: { ...commonConfig },
};
