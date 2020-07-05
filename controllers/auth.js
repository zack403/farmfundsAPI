const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const errorHandler = require('../helpers/errorHandler');
const {User, IsValid} = require('../models/users');
const Joi = require('@hapi/joi');
const generateAuthToken = require('../helpers/generateAuthToken');



//Authentication Controllers
router.post('/register', async (req, res) => {
    const {error} = IsValid(req.body);
    if (error) return res.status(400).send(errorHandler(400, error.message));

    const isExist = await User.findAll({where: {email: req.body.email}})
    if(isExist.length > 0) return res.status(400).send(errorHandler(400, `An account with email ${req.body.email} already exist`));
    
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(req.body.password, salt);

    req.body.password = hashedPassword;
    req.body.confirmPassword = hashedPassword;

    const isCreated = await User.create(req.body);
    if (isCreated) {
        res.status(201).send({status: 201, message: "Account successfully created"});
    }

  });

  router.post('/login', async (req, res) => {
    const {error} = isLoginDataValid(req.body);
    if (error) return res.status(400).send(errorHandler(400, error));

    const isValid = await User.findAll({where: {email: req.body.email}, attributes: { exclude: ['confirmPassword', 'createdAt', 'updatedAt'] }});
    if(isValid.length === 0) return res.status(400).send(errorHandler(400, 'Login Failed, invalid email or password.'));

    const userPassword = await bcrypt.compare(req.body.password, isValid[0].dataValues.password);
    delete isValid[0].dataValues.password;
    if (!userPassword) return res.status(400).send(errMessage = errorHandler(400, 'Login Failed, invalid email or password.'));
  
      const token = generateAuthToken(isValid[0].dataValues); // assing a token to the ser here
      isValid[0].dataValues.token = token;

      res.status(200).send({
        status : 200,
        data : isValid[0].dataValues
      });
  });

  const isLoginDataValid = req => {
        const schema = Joi.object({
          email : Joi.string().required().email({ minDomainSegments: 2, tlds: { allow: ['com', 'net'] } }),
          password: Joi.string().required().min(7).max(255)
      })
      return schema.validate(req);
  }

  module.exports = router;
