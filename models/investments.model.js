const { DataTypes } = require('sequelize');
const sequelize = require('../startup/database');

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
    amount: {
        type: DataTypes.DOUBLE,
        allowNull : false
    },
    roi: {
        type: DataTypes.DOUBLE,
        allowNull : false
    },
    investor: {
        type: DataTypes.STRING,
        allowNull: false 
    },
    unit: {
        type: DataTypes.INTEGER,
        allowNull: false 
    },
    profit: {
        type: DataTypes.INTEGER,
        allowNull: false 
    },
    startDate: {
        type: DataTypes.DATE,
        allowNull : false
    },
    endDate: {
        type: DataTypes.DATE,
        allowNull : false
    },
    status: {
        type: DataTypes.STRING,
        allowNull: false,
        defaultValue: "Pending"
    }
})

const validateInvestment = inv => {
    const schema =  Joi.object({
      package: Joi.string().required(),
      amount: Joi.string().required(),
      cycle: Joi.string().required(),
      location: Joi.string().required(),
      startDate: Joi.date().required(),
      endDate: Joi.date().required(),
      unit: Joi.number().integer().required(),
      profit: Joi.number().integer().required()
    })
    return schema.validate(inv);
  }


  module.exports.Investment = Investment;
  module.exports.IsValid = validateInvestment;