const { Sequelize } = require('sequelize');

const sequelize = new Sequelize('postgres://postgres:!Pass4sure@localhost:5432/farmfundsDB');
// const sequelize = new Sequelize('farmfundsDB', 'postgres', '!Pass4sure', {
//   host: 'localhost',
//   dialect: 'postgres'
// });

module.exports = sequelize;
