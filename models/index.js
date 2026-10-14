'use strict';

require('dotenv').config();
const fs = require('node:fs');
const path = require('node:path');
const Sequelize = require('sequelize');
const databaseConfigs = require('../config/database');

const basename = path.basename(__filename);
const env = process.env.NODE_ENV || 'development';
const databaseConfig = databaseConfigs[env] || databaseConfigs.development;

const sequelize = new Sequelize(databaseConfig.database, databaseConfig.username, databaseConfig.password, {
  host: databaseConfig.host,
  port: databaseConfig.port,
  dialect: databaseConfig.dialect,
  logging: databaseConfig.logging,
  timezone: '+00:00',
  define: {
    freezeTableName: true,
    charset: 'utf8mb4',
    collate: 'utf8mb4_unicode_ci',
  },
  pool: {
    max: Number(process.env.DB_POOL_MAX) || 5,
    min: 0,
    acquire: 30000,
    idle: 10000,
  },
});

const db = {};
for (const file of fs.readdirSync(__dirname).filter((name) =>
  name.endsWith('.js') && name !== basename && !name.startsWith('.')
)) {
  const initializeModel = require(path.join(__dirname, file));
  const model = initializeModel(sequelize, Sequelize.DataTypes);
  db[model.name] = model;
}

for (const model of Object.values(db)) {
  if (typeof model.associate === 'function') model.associate(db);
}

db.sequelize = sequelize;
db.Sequelize = Sequelize;
db.env = env;

module.exports = db;
