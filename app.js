const express = require('express');
require('express-async-errors');
const app = express();
const sequelize = require('./startup/database');
const winston = require('winston');
const config = require('config');
const {User} = require('./models/users');
const Product = require('./models/products');






require('./models/users');
require('./models/products');
require('./startup/cors')(app);
require('./startup/config')();
require('./startup/routes')(app);

const port = process.env.PORT || config.get("port");
let server;

Product.belongsTo(User, {constraints: true, onDelete: 'CASCADE'});
User.hasMany(Product);

sequelize.sync().then(s => {
    app.listen(port, () => winston.info(`Listening on port ${port}...`));
}).catch(e => {
    console.log(e)
});

module.exports = server;