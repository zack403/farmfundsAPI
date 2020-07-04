const { DataTypes } = require('sequelize');
const sequelize = require('../startup/database');
const Joi = require('@hapi/joi');


const User = sequelize.define('User', {
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
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
    email: {
        type: DataTypes.STRING,
        allowNull : false
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
        type: DataTypes.BOOLEAN
    },
    createdAt: {
        type: DataTypes.DATE
    }
})

const validateUser = user => {
    const schema =  Joi.object({
      firstName: Joi.string().required(),
      lastName: Joi.string().required(),
      email: Joi.string().required().email({ minDomainSegments: 2, tlds: { allow: ['com', 'net'] } }),
      password: Joi.string().pattern(new RegExp('^[a-zA-Z0-9]{3,30}$')).min(7).alphanum().max(255).required(),
      confirmPassword: Joi.ref('password'),
      PhoneNo : Joi.string().required(),
      createdAt : Joi.date()
    }).with('firstName', 'lastName')
    .with('password', 'confirmPassword');
    return schema.validate(user);
  }

module.exports.User = User;
module.exports.IsValid = validateUser;