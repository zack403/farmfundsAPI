const { DataTypes } = require('sequelize');
const sequelize = require('../startup/database');

const Purchase = sequelize.define('Purchase', {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4, 
        allowNull: false,
        primaryKey: true
    },
    name: {
        type: DataTypes.STRING,
        allowNull : false
    },
    email: {
        type: DataTypes.STRING,
        allowNull : false
    },
    phoneNo: {
        type: DataTypes.STRING,
        allowNull: false 
    },
    Address: {
        type: DataTypes.STRING,
        allowNull : false
    },
    product: {
        type: DataTypes.STRING,
        allowNull : false
    },
    unit: {
        type: DataTypes.INTEGER,
        allowNull : false
    },
    amount: {
        type: DataTypes.DOUBLE,
        allowNull: false,
    },
    type: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    userID: {
        type: DataTypes.UUID,
        allowNull: true
    }
})

module.exports.Purchase = Purchase;