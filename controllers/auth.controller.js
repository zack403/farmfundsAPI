const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const errorHandler = require('../helpers/errorHandler');
const {User, IsValid} = require('../models/users.model');
const Joi = require('@hapi/joi');
const generateAuthToken = require('../helpers/generateAuthToken');



//Authentication Controllers
router.post('/register', async (req, res) => {
    const {error} = IsValid(req.body);
    if (error) return res.status(400).send(errorHandler(400, error.message));

    const isExist = await User.findOne({where: {email: req.body.email}})
    if(isExist) return res.status(400).send(errorHandler(400, `An account with email ${req.body.email} already exist`));
    
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(req.body.password, salt);

    req.body.password = hashedPassword;
    req.body.confirmPassword = hashedPassword;

    const isCreated = await User.create(req.body);
    if (isCreated) return res.status(201).send({status: 201, message: "Account successfully created"});

  });

  router.post('/login', async (req, res) => {
    const {error} = isLoginDataValid(req.body);
    if (error) return res.status(400).send(errorHandler(400, error));

    const isValid = await User.findOne({where: {email: req.body.email}, attributes: { exclude: ['confirmPassword', 'createdAt', 'updatedAt'] }});
    if(!isValid) return res.status(400).send(errorHandler(400, 'Login Failed, invalid email or password.'));

    const userPassword = await bcrypt.compare(req.body.password, isValid.dataValues.password);
    delete isValid.dataValues.password;
    if (!userPassword) return res.status(400).send(errMessage = errorHandler(400, 'Login Failed, invalid email or password.'));
  
      isValid.dataValues.fullName = `${isValid.dataValues.firstName} ${isValid.dataValues.lastName}`
      const token = generateAuthToken(isValid.dataValues); // assing a token to the user here

      res.status(200).send({
        status : 200,
        data : isValid.dataValues,
        token: token
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
