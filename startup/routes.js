const express = require('express');
const auth = require('../controllers/auth.controller');
const user = require('../controllers/user.controller');
const product = require('../controllers/product.controller');
const package = require('../controllers/package.controller');
const investment = require('../controllers/investment.controller');
const purchase = require('../controllers/purchase.controller');
const dashboard = require('../controllers/dashboard.controller');
const errorHandler = require('../middlewares/error');

module.exports = app => {
  app.use(express.json());
  app.use('/api/v1/auth', auth);
  app.use('/api/v1/auth', auth);
  app.use('/api/v1/users', user);
  app.use('/api/v1/product', product);
  app.use('/api/v1/package', package);
  app.use('/api/v1/purchase', purchase);
  app.use('/api/v1/investment', investment);
  app.use('/api/v1/dashboard', dashboard);
  app.use(errorHandler);
}