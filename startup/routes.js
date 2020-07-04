const express = require('express');
const auth = require('../controllers/auth');
const errorHandler = require('../middlewares/error');

module.exports = app => {
  app.use(express.json());
  app.use('/api/v1/auth', auth);
  app.use('/api/v1/auth', auth);
  app.use(errorHandler);
}