const { DataTypes } = require('sequelize');
const sequelize = require('../startup/database');
const Joi = require('@hapi/joi');


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
    packageId: {
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
    email : {
        type: DataTypes.STRING,
        allowNull: false
    },
    investor: {
        type: DataTypes.STRING,
        allowNull: false 
    },
    unit: {
        type: DataTypes.INTEGER,
        allowNull: false 
    },
    startDate: {
        type: DataTypes.DATE,
        allowNull : true
    },
    endDate: {
        type: DataTypes.DATE,
        allowNull : true
    },
    proofOfPayment: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    paymentType: {
        type: DataTypes.STRING,
        allowNull : false
    },
    status: {
        type: DataTypes.STRING,
        allowNull: false,
        defaultValue: "Pending"
    }
},
{
    indexes: [
        {
            unique: false,
            fields: ['id', 'investor', 'status']
        }
    ]
}
)

const validateInvestment = inv => {
    const schema =  Joi.object({
      package: Joi.string().required(),
      packageId: Joi.string().required(),
      unit: Joi.number().integer().required(),
      paymentType: Joi.string().required(),
      investor: Joi.string().required()
    })
    return schema.validate(inv);
  }


  module.exports.Investment = Investment;
  module.exports.IsValid = validateInvestment;