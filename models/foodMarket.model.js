const { DataTypes } = require('sequelize');
const sequelize = require('../startup/database');
const Joi = require('@hapi/joi');


const FoodMarket = sequelize.define('FoodMarket', {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4, 
        allowNull: false,
        primaryKey: true,
    },
    productName: {
        type: DataTypes.STRING,
        allowNull : false,
        unique: true
    },
    price: {
        type: DataTypes.DOUBLE,
        allowNull: true
    },
    imageUrl: {
        type: DataTypes.STRING,
        allowNull: false 
    }
})

const validateFoodMarket = product => {
    const schema =  Joi.object({
      productName: Joi.string().required(),
      price: Joi.optional(),
    })

    return schema.validate(product);
  }


  module.exports.FoodMarket = FoodMarket;
  module.exports.IsValid = validateFoodMarket;