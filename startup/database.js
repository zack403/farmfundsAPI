const { Sequelize } = require('sequelize');
const config = require('config');

const sequelize = new Sequelize(config.get('db'));

module.exports = sequelize;
