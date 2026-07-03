const { Sequelize } = require('sequelize');
const path = require('path');
require('dotenv').config();

const databaseUrl = process.env.DATABASE_URL;
let sequelize;

if (databaseUrl) {
  console.log('Connecting to PostgreSQL database...');
  sequelize = new Sequelize(databaseUrl, {
    dialect: 'postgres',
    logging: false,
    dialectOptions: {
      ssl: databaseUrl.includes('localhost') ? false : {
        rejectUnauthorized: false
      }
    }
  });
} else {
  const dbPath = path.join(process.cwd(), 'database.sqlite');
  console.log(`Connecting to SQLite database at: ${dbPath}`);
  sequelize = new Sequelize({
    dialect: 'sqlite',
    storage: dbPath,
    logging: false
  });
}

module.exports = sequelize;
