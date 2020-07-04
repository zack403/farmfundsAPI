const express = require('express');
const app = express();
const sequelize = require('./startup/database');
const winston = require('winston');
const config = require('config');






require('./models/users');
require('./models/products');
require('./startup/cors')(app);
require('./startup/config')();
require('./startup/routes')(app);

const port = process.env.PORT || config.get("port");
let server;

sequelize.sync().then(s => {
    app.listen(port, () => winston.info(`Listening on port ${port}...`));
}).catch(e => {
    console.log(e)
});

module.exports = server;