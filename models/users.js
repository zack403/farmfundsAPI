const { DataTypes } = require('sequelize');
const sequelize = require('../startup/database');

const User = sequelize.define('User', {
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        allowNull: false,
        primaryKey: true
    },
    firstName: {
        type: DataTypes.STRING,
        allowNull : false
    },
    lastName: {
        type: DataTypes.STRING,
        allowNull : false
    },
    email: {
        type: DataTypes.STRING,
        allowNull : false
    },
    phoneNo: {
        type: DataTypes.STRING,
        allowNull : false
    },
    password: {
        type: DataTypes.STRING,
        allowNull : false
    },
    confirmPassword: {
        type: DataTypes.STRING,
        allowNull : false
    }
})

module.exports = User;