const { DataTypes } = require('sequelize');
const sequelize = require('../startup/database');

const Investment = sequelize.define('Investment', {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4, 
        allowNull: false,
        primaryKey: true
    },
    package: {
        type: DataTypes.STRING,
        allowNull: false
    },
    amount: {
        type: DataTypes.DOUBLE,
        allowNull : false
    },
    roi: {
        type: DataTypes.DOUBLE,
        allowNull : false
    },
    investor: {
        type: DataTypes.STRING,
        allowNull: false 
    },
    startDate: {
        type: DataTypes.DATE,
        allowNull : false
    },
    endDate: {
        type: DataTypes.DATE,
        allowNull : false
    },
    status: {
        type: DataTypes.STRING,
        allowNull: false,
        defaultValue: "Pending"
    }
})

module.exports.Investment = Investment;