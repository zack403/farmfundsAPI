const { DataTypes } = require('sequelize');
const sequelize = require('../startup/database');

const Package = sequelize.define('Package', {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4, 
        allowNull: false,
        primaryKey: true
    },
    packageName: {
        type: DataTypes.STRING,
        allowNull : false
    },
    profit: {
        type: DataTypes.STRING,
        allowNull : false
    },
    cycle: {
        type: DataTypes.STRING,
        allowNull: false 
    },
    location: {
        type: DataTypes.STRING,
        allowNull : false
    },
    unit: {
        type: DataTypes.INTEGER,
        allowNull : false
    },
    status: {
        type: DataTypes.STRING,
        allowNull: false,
    }
})

module.exports.Package = Package;