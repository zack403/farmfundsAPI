const { DataTypes } = require('sequelize');
const sequelize = require('../startup/database');
const Joi = require('@hapi/joi');


const Product = sequelize.define('Product', {
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
    imageUrl: {
        type: DataTypes.STRING,
        allowNull: false 
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

const validateProduct = product => {
    const schema =  Joi.object({
      productName: Joi.string().required(),
      description: Joi.string(),
      specification: Joi.string()
    })

    return schema.validate(product);
  }


  module.exports.Product = Product;
  module.exports.IsValid = validateProduct;