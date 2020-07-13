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


const path = require('path');


app.use(express.static(path.join(__dirname, 'images')));


require('./models/users.model');
require('./models/products.model');
require('./models/investments.model');
require('./models/purchases.model');
require('./models/packages.model');
require('./models/productPrice.model');
require('./startup/cors')(app);
require('./startup/config')();
require('./startup/routes')(app);
require('./startup/production')(app);
require('./startup/logging')();



const port = process.env.PORT || config.get("port");
let server;

//model relationships
Investment.belongsTo(User, {constraints: true, onDelete: 'CASCADE'});
User.hasMany(Investment);
ProductPrice.belongsTo(Product, {constraints: true, onDelete: 'CASCADE'});
Product.hasMany(ProductPrice);


sequelize.sync().then(s => {
    app.listen(port, () => winston.info(`Listening on port ${port}...`));
}).catch(e => {
    console.log(e)
});

module.exports = server;