const { DataTypes } = require('sequelize');
const sequelize = require('../startup/database');

const Product = sequelize.define('Product', {
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        allowNull: false,
        primaryKey: true
    },
    title: {
        type: DataTypes.STRING,
        allowNull : false
    },
    price: {
        type: DataTypes.DOUBLE,
        allowNull : false
    },
    description: {
        type: DataTypes.STRING,
        allowNull : true
    },
    specification: {
        type: DataTypes.STRING,
        allowNull : true
    }
})

module.exports = Product;