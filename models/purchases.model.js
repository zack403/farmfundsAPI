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
    userId: {
        type: DataTypes.UUID,
        allowNull: true
    },
    status: {
        type: DataTypes.STRING,
        allowNull: false,
        defaultValue: "Pending"
    }
})

const validatePurchase = pur => {
    const schema =  Joi.object({
      name: Joi.string().required(),
      email: Joi.string().required(),
      phoneNo: Joi.string().required(),
      address: Joi.string().required(),
      product: Joi.string().required(),
      unit: Joi.number().integer().required(),
      type: Joi.string().required()
    })
    return schema.validate(pur);
  }


  module.exports.Purchase = Purchase;
  module.exports.IsValid = validatePurchase;