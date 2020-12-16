const { DataTypes } = require('sequelize');
const sequelize = require('../startup/database');


const Notifications = sequelize.define('Notifications', {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        allowNull: false,
        primaryKey: true
    },
    userId: {
        type: DataTypes.UUID,
        allowNull : true
    },
    message: {
        type: DataTypes.STRING(1234),
        allowNull : false
    },
    serviceId: {
        type: DataTypes.STRING,
        allowNull : true
    },
    forWho: {
        type: DataTypes.STRING,
        allowNull : false
    },
    isViewed: {
        type: DataTypes.BOOLEAN,
        allowNull : false,
        defaultValue: false
    }
},
{
    indexes: [
        {
            unique: false,
            fields: [{
                name: 'id',
                order: 'DESC'
            },
            {
                name: 'userId',
                order: 'DESC'
            },
            {
                name: 'serviceId',
                order: 'DESC'
            },
            {
                name: 'isViewed',
                order: 'DESC'
            }
         ]
        }
    ]
}
)

module.exports.Notification = Notifications;
