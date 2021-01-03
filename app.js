const express = require('express');
require('express-async-errors');
const app = express();
const sequelize = require('./startup/database');
const winston = require('winston');
const config = require('config');
const {User} = require('./models/users.model');
const {Investment} = require('./models/investments.model');
const {Purchase} = require('./models/purchases.model');
const {PurchaseDetail} = require('./models/purchaseDetails.model');
const {seed} = require('./seed');
const bodyParser = require('body-parser');
const path = require('path');
const { Subscribers } = require('./models/subscribers.model');
const morgan = require('morgan');
require("./config/cloudinaryConfig");
const sendItemsNotifier = require('./services/sendItemsNotifier');



// app.use(morgan('combined', { stream: winston.stream.write }));

app.use(morgan('combined'));



app.use(bodyParser.urlencoded({ extended: false }))


app.use('/images', express.static(path.join(__dirname, 'images')));


require('./models/users.model');
require('./models/investments.model');
require('./models/purchases.model');
require('./models/packages.model');
require('./models/foodMarket.model');
require('./models/subscribers.model');
require('./models/passwordResetToken.model');
require('./models/notifications.model');
require('./startup/cors')(app);
require('./startup/config')();
require('./startup/routes')(app);
require('./startup/production')(app);
require('./startup/logging')();


const port = process.env.PORT || config.get("port");
let server;

//model relationships
Investment.belongsTo(User, {constraints: true, onDelete: 'CASCADE'});
Purchase.belongsTo(User, {constraints: true, onDelete: 'CASCADE'});
Subscribers.belongsTo(User, {constraints: true, onDelete: 'CASCADE'});
User.hasMany(Investment);
User.hasMany(Purchase);
User.hasMany(Subscribers);
PurchaseDetail.belongsTo(Purchase, {constraints: true, onDelete: 'CASCADE'})
Purchase.hasMany(PurchaseDetail);
Subscribers.hasOne(Purchase);
Purchase.belongsTo(Subscribers);


sequelize.sync({alter: {drop: false}}).then(s => {
    app.listen(port, () => winston.info(`Listening on port ${port}...`));
    seed();
    sendItemsNotifier();
}).catch(e => {
    console.log(e);
});

module.exports = server;