const { DataTypes } = require('sequelize');
const sequelize = require('../startup/database');


const PurchaseDetail = sequelize.define('PurchaseDetail', {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4, 
        allowNull: false,
        primaryKey: true
    },
    productName: {
        type: DataTypes.STRING,
        allowNull : false
    },
    productId: {
        type: DataTypes.STRING,
        allowNull : false
    },
    unit: {
        type: DataTypes.INTEGER,
        allowNull : false
    },
    price: {
        type: DataTypes.DOUBLE,
        allowNull: false,
    },
    brand: {
        type: DataTypes.STRING,
        allowNull: true,
    }
},
{
    indexes: [
        {
            unique: false,
            fields: ['id', 'productName']
        }
    ]
}
)


module.exports.PurchaseDetail = PurchaseDetail;
