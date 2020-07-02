const { Sequelize } = require('sequelize');

const sequelize = new Sequelize('postgres://user:pass@example.com:5432/dbname');
const sequelize = new Sequelize('farmfundsDB', 'postgres', '!Pass4sure', {
  host: 'localhost',
  dialect: 'postgres'
});

module.exports = sequelize;
