const { DataTypes } = require('sequelize');
const sequelize = require('../startup/database');
const Joi = require('@hapi/joi');


const Subscribers = sequelize.define('Subscribers', {
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
    phoneNo: {
        type: DataTypes.STRING,
        allowNull: false 
    },
    email: {
        type: DataTypes.STRING,
        allowNull: true 
    },
    paymentType: {
        type: DataTypes.STRING,
        allowNull : false
    },
    status: {
        type: DataTypes.STRING,
        allowNull: false,
        defaultValue: "Pending"
    },
    startDate: {
        type: DataTypes.DATE,
        allowNull: true,
    },
    endDate: {
        type: DataTypes.DATE,
        allowNull: true,
    },
    amount: {
        type: DataTypes.DOUBLE,
        allowNull: false,
    },
    roi: {
        type: DataTypes.DOUBLE,
        allowNull: false,
    },
    roc: {
        type: DataTypes.DOUBLE,
        allowNull: false,
    },
    proofOfPayment: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    unit: {
        type: DataTypes.INTEGER,
        allowNull: false,
    }
},
{
    indexes: [
        {
            unique: false,
            fields: ['id', 'createdAt', 'UserId', 'name', 'email', 'status']
        }
    ]
}

)

const validateSubscribers = sub => {
    const schema =  Joi.object({
      name: Joi.string().required(),
      phoneNo: Joi.string().required(),
      paymentType: Joi.string().required(),
      unit: Joi.number().required(),
      UserId: Joi.string().required(),
      email: Joi.string().required()
    })
    return schema.validate(sub);
  }


  module.exports.Subscribers = Subscribers;
  module.exports.IsValid = validateSubscribers;