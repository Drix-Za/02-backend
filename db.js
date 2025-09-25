require('dotenv').config();
const{Sequelize} = require('Sequelize');
const sequelize = new Sequelize (DB_NAME, DB_PASSWORD, {DB_HOST: 'localhost', dialect: 'postgres'})
module.exports = sequelize