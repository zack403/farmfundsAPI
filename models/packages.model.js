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
},
{
    indexes: [
        {
            unique: false,
            fields: ['id', 'packageName', 'status', 'location']
        }
    ]
}
)

const validatePackage = pack => {
    const schema =  Joi.object({
      packageName: Joi.string().required(),
      profit: Joi.string().required(),
      cycle: Joi.string().required(),
      location: Joi.string().required(),
      status: Joi.string().required(),
      unit: Joi.number().integer().required(),
      amountPerUnit: Joi.number().integer().required()
    })
    return schema.validate(pack);
  }


  module.exports.Package = Package;
  module.exports.IsValid = validatePackage;