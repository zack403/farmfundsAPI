const jwt = require("jsonwebtoken");
const config = require("config");
const errorHandler = require('../helpers/errorHandler');

module.exports = (req, res, next) => {
  let token = req.header("Authorization");
  token = token.replace("Bearer ", "")
  if (!token){
    const tokenError = errorHandler(403,"Access denied. No token provided.");
    return res.status(403).send(tokenError);
  } 
  try {
    const decoded = jwt.verify(token, config.get("fm_key"));
    req.user = decoded;
    next();
  } catch (ex) {
    const decodedError = errorHandler(401, "Unauthorized!");
    res.status(401).send(decodedError);
  }
};
