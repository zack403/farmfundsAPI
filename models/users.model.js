const { DataTypes } = require('sequelize');
const sequelize = require('../startup/database');
const Joi = require('@hapi/joi');


const User = sequelize.define('User', {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        allowNull: false,
        primaryKey: true
    },
    firstName: {
        type: DataTypes.STRING,
        allowNull : false
    },
    lastName: {
        type: DataTypes.STRING,
        allowNull : false
    },
    middleName : {
        type: DataTypes.STRING,
        allowNull: true
    },
    bankName: {
        type: DataTypes.STRING,
        allowNull: false
    },
    acctNo: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true
    },
    email: {
        type: DataTypes.STRING,
        allowNull : false,
        unique: true
    },
    phoneNo: {
        type: DataTypes.STRING,
        allowNull : false
    },
    password: {
        type: DataTypes.STRING,
        allowNull : false
    },
    confirmPassword: {
        type: DataTypes.STRING,
        allowNull : false
    },
    isAdmin: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false
    }
})

const validateUser = user => {
    const schema =  Joi.object({
      firstName: Joi.string().required(),
      lastName: Joi.string().required(),
      middleName: Joi.string().optional(),
      bankName: Joi.string().required(),
      isAdmin: Joi.boolean().optional(),
      acctNo: Joi.string().required(),
      email: Joi.string().required().email({ minDomainSegments: 2, tlds: { allow: ['com', 'net'] } }),
      password: Joi.string().min(7).alphanum().max(255).required(),
      confirmPassword: Joi.ref('password'),
      phoneNo : Joi.string().required()
    }).with('firstName', 'lastName')
    .with('password', 'confirmPassword');
    return schema.validate(user);
  }

module.exports.User = User;
module.exports.IsValid = validateUser;