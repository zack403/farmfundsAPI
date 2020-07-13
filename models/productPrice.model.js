const { DataTypes } = require('sequelize');
const sequelize = require('../startup/database');

const ProductPrice = sequelize.define('ProductPrice', {
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
    priceDescription: {
        type: DataTypes.STRING,
        allowNull : false
    },
    amount: {
        type: DataTypes.DOUBLE,
        allowNull: false 
    }
})

const validateProductPrice = product => {
    const schema =  Joi.object({
      productName: Joi.string().required(),
      amount: Joi.string().required(),
      priceDescription: Joi.string().required()
    })

    return schema.validate(product);
  }


  module.exports.ProductPrice = ProductPrice;
  module.exports.IsValid = validateProductPrice;