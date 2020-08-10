const { DataTypes } = require('sequelize');
const sequelize = require('../startup/database');


const PurchaseDetail = sequelize.define('PurchaseDetail', {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4, 
        allowNull: false,
        primaryKey: true
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
    }
})


module.exports.PurchaseDetail = PurchaseDetail;
