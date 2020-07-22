const helmet = require('helmet');
const compression = require('compression');
const hpp = require('hpp');

module.exports = app => {
    app.use(helmet());
    app.use(compression());
    app.disable('x-powered-by');
    app.use(hpp());
}