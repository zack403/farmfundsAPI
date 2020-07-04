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
    if (error) return res.status(400).send(errorHandler(400, error));

    const isExist = await User.findAll({where: {email: req.body.email}})
    if(isExist) return res.status(400).send(errorHandler(400, `An account with email ${email} already exist`));
    
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(req.body.password, salt);

    req.body.password = hashedPassword;

    const isCreated = await User.Create(req.body);
        if (isCreated) {
            res.status(201).send({
              status : 201,
              data : {
                  message: "Account successfully created",
                  data: isCreated
              }
            });
        }
  });

  router.post('/login', async (req, res) => {
    const {error} = isLoginDataValid(req.body);
    if (error) return res.status(400).send(errorHandler(400, error));

    const isExist = await User.findAll({where: {email: req.body.email}});
    if(!isExist){
        const userError = errorHandler(400, 'Login Failed, invalid email or password.');
        return res.status(400).send(userError);
     }

    const userPassword = await bcrypt.compare(req.body.password, isExist.password);
    if (!userPassword) return res.status(400).send(errMessage = errorHandler(400, 'Login Failed, invalid email or password.'));
  
      const token = generateAuthToken(isExist); // assing a token to the ser here
      isExist.token = token;
      res.status(200).send({
        status : 200,
        data : {isExist}
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
