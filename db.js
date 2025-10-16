require("dotenv").config({path: 'backend/.env'});
const{Sequelize} = require('sequelize');

const sequelize = new Sequelize (
  process.env.DB_NAME, 
  process.env.DB_USER, 
  process.env.DB_PASSWORD, 
  {
    host: 'localhost',
    port: 5432,
    dialect: 'postgres',
    logging: false, 
  }
);

async function testConnection() {
  try {
    await sequelize.authenticate();
    console.log('¡Te conectaste!');
  } catch (error) {
    console.error('Intenta otra vez:', error);
  }
}

module.exports = {sequelize, testConnection};