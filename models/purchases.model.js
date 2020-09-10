const { DataTypes } = require('sequelize');
const sequelize = require('../startup/database');
const Joi = require('@hapi/joi');


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
    address: {
        type: DataTypes.STRING,
        allowNull : false
    },
    type: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    UserId: {
        type: DataTypes.UUID,
        allowNull: true
    },
    status: {
        type: DataTypes.STRING,
        allowNull: false,
        defaultValue: "Pending"
    },
    note: {
        type: DataTypes.STRING(1234),
        allowNull: true,
    },
    deliveredDate: {
        type: DataTypes.DATE,
        allowNull: true,
    },
    amount: {
        type: DataTypes.DOUBLE,
        allowNull: false,
    }
},
{
    indexes: [
        {
            unique: false,
            fields: ['id', 'name', 'email', 'status']
        }
    ]
}

)

const validatePurchase = pur => {
    const schema =  Joi.object({
      name: Joi.string().required(),
      email: Joi.string().required(),
      phoneNo: Joi.string().required(),
      address: Joi.string().required(),
      type: Joi.string().required()
    })
    return schema.validate(pur, {allowUnknown: true});
  }


  module.exports.Purchase = Purchase;
  module.exports.IsValid = validatePurchase;