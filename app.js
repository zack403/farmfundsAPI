const express = require('express');
require('express-async-errors');
const app = express();
const sequelize = require('./startup/database');
const winston = require('winston');
const config = require('config');
const {User} = require('./models/users.model');
const {Investment} = require('./models/investments.model');
const {ProductPrice} = require('./models/productPrice.model');
const {Product} = require('./models/products.model');
const {Purchase} = require('./models/purchases.model');
const {PurchaseDetail} = require('./models/purchaseDetails.model');

const bodyParser = require('body-parser');


const path = require('path');

app.use(bodyParser.urlencoded({ extended: false }))


app.use('/images', express.static(path.join(__dirname, 'images')));


require('./models/users.model');
require('./models/products.model');
require('./models/investments.model');
require('./models/purchases.model');
require('./models/packages.model');
require('./models/productPrice.model');
require('./models/foodMarket.model');
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
User.hasMany(Investment);
User.hasMany(Purchase);
ProductPrice.belongsTo(Product, {constraints: true, onDelete: 'CASCADE'});
Product.hasMany(ProductPrice);
PurchaseDetail.belongsTo(Purchase, {constraints: true, onDelete: 'CASCADE'})
Purchase.hasMany(PurchaseDetail);



sequelize.sync({alter: true}).then(s => {
    app.listen(port, () => winston.info(`Listening on port ${port}...`));
}).catch(e => {
    console.log(e);
});

module.exports = server;