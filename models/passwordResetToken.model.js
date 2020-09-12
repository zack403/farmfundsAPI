const { DataTypes } = require('sequelize');
const sequelize = require('../startup/database');


const PasswordResetToken = sequelize.define('PasswordResetToken', {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        allowNull: false,
        primaryKey: true
    },
    UserId: {
        type: DataTypes.UUID,
        allowNull : false
    },
    resetToken: {
        type: DataTypes.STRING,
        allowNull : false
    }
})

module.exports.PasswordResetToken = PasswordResetToken;
