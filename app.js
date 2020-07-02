const express = require('express');
const app = express();
const database = require('./startup/database');
const winston = require('winston');
const config = require('config');




database.sync();


require("./startup/cors")(app);
require("./startup/routes")(app);

const port = process.env.PORT || config.get("port");
const server = app.listen(port, () =>
   winston.info(`Listening on port ${port}...`)
);

module.exports = server;