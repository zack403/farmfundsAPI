const { DataTypes } = require('sequelize');
const sequelize = require('../startup/database');
const Joi = require('@hapi/joi');


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
    amountPerUnit: {
        type: DataTypes.INTEGER,
        allowNull : false
    },
    profit: {
        type: DataTypes.DOUBLE,
        allowNull : false
    },
    cycle: {
        type: DataTypes.INTEGER,
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
    imageUrl: {
        type: DataTypes.STRING,
        allowNull: false 
    }
},
{
    indexes: [
        {
            unique: false,
            fields: ['id', 'packageName', 'location']
        }
    ]
}
)

const validatePackage = pack => {
    const schema =  Joi.object({
      packageName: Joi.string().required(),
      profit: Joi.number().required(),
      cycle: Joi.number().required(),
      location: Joi.string().required(),
      unit: Joi.number().integer().required(),
      amountPerUnit: Joi.string().required()
    })
    return schema.validate(pack);
  }


  module.exports.Package = Package;
  module.exports.IsValid = validatePackage;