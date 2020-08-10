const errorHandler = require('../helpers/errorHandler');

module.exports = (req, res, next) => {
  if (!req.user.isAdmin) {
    const error = errorHandler(403, "Access denied.");
    return res.status(403).send(error);
  } 
  next();
};
