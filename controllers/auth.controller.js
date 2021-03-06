const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const errorHandler = require('../helpers/errorHandler');
const {User, IsValid} = require('../models/users.model');
const {PasswordResetToken} = require('../models/passwordResetToken.model');
const Joi = require('@hapi/joi');
const generateAuthToken = require('../helpers/generateAuthToken');
const jwt = require("jsonwebtoken");
const config = require('config');
const sgMail = require('@sendgrid/mail');
sgMail.setApiKey(config.get('sendgrid_key'));
const { Op } = require("sequelize");
const authorizedMiddleWare = require('../middlewares/auth');
const {Notification} = require('../models/notifications.model');





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
    req.body.isAdmin = false;

    const isCreated = await User.create(req.body);
    if (isCreated) {
      const msg = {
        to: req.body.email,
        from: 'info@farmfundsafrica.com',
        subject: `Welcome to farmfunds africa`,
        html: `<p> Welcome to farmfunds africa, </p>
            <p> Where you can eat your cake and have it back. </p>
            <p>
            <a href="https://farmfunds.netlify.app/login" style="text-decoration:none;
                width: 200px; padding: 15px; box-shadow: 6px 6px 5px; 
                font-weight: MEDIUM; background: green; color: white; 
                cursor: pointer; margin-top:20px; border: 1px solid #D9D9D9; 
                font-size: 110%;">GET STARTED</a>
            </p>`

    }
    try {
        await sgMail.send(msg);
    } catch (error) {
        console.log(error);
        return await sgMail.send(msg);
    }

    if(isCreated.dataValues.id) {
      const request = {
          userId: isCreated.dataValues.id,
          forWho: 'user',
          message: `Welcome to farmfunds africa, Do make use of the help guidelines to start off easily.`
      }
  
      await Notification.create(request);
    }
    
      return res.status(201).send({status: 201, message: "Account successfully created"});
    }

  });

  router.post('/login', async (req, res) => {
    const {error} = isLoginDataValid(req.body);
    if (error) return res.status(400).send(errorHandler(400, error.message));

    const isValid = await User.findOne({where: {email: req.body.email}, attributes: { exclude: ['confirmPassword', 'createdAt', 'updatedAt'] }});
    if(!isValid) return res.status(400).send(errorHandler(400, 'Login Failed, invalid email or password.'));

    const userPassword = await bcrypt.compare(req.body.password, isValid.dataValues.password);
    delete isValid.dataValues.password;
    if (!userPassword) return res.status(400).send(errMessage = errorHandler(400, 'Login Failed, invalid email or password.'));
  
      isValid.dataValues.fullName = isValid.dataValues.middleName ? `${isValid.dataValues.firstName} ${isValid.dataValues.middleName} ${isValid.dataValues.lastName}` 
      : `${isValid.dataValues.firstName} ${isValid.dataValues.lastName}`
      const token = generateAuthToken(isValid.dataValues); // assing a token to the user here

      res.status(200).send({
        status : 200,
        data : isValid.dataValues,
        token: token
      });
  });

  router.post('/req-reset-password', async (req, res) => {
    if (!req.body.email) {
      return res.status(400).send(errorHandler(400, 'Email is required' ));
    }

    const user =  await User.findOne({where: {email: req.body.email}});
    if (!user) {
      return res.status(400).send(errorHandler(400, 'Email does not exist' ));
    }

    const token = generateAuthToken(user.dataValues); // assing a token to the user here

    const request = {
      UserId: user.dataValues.id,
      resetToken: token
    }

    const created = await PasswordResetToken.create(request);
    if(created) {
      res.status(200).send({message: 'Reset Password successful.'});

      // delete all previous user request reset password data
      await PasswordResetToken.destroy({where: {[Op.and]: [
        {UserId: user.id},
        {resetToken: {[Op.ne]: token}}
       ]
      }});

      let mailOptions = {
        to: user.dataValues.email,
        from: 'info@farmfundsafrica.com',
        subject: 'Farmfunds Africa Account Password Reset',
        text: 'You are receiving this because you (or someone else) have requested the reset of the password for your account.\n\n' +
        'Please click on the following link, or paste this into your browser to complete the process:\n\n' +
        'http://localhost:4200/response-reset-password/' + token + '\n\n' +
        'If you did not request this, please ignore this email and your password will remain unchanged.\n'
        }
     
        try {
            await sgMail.send(mailOptions);
        } catch (error) {
            console.log(error);
            return await sgMail.send(mailOptions);
        }
    } else {
      return res.status(500).send(errorHandler(500, 'failed')); 
    }


  });

  router.post('/new-password', async (req, res) => {

    const userToken = await PasswordResetToken.findOne({where: {resetToken: req.body.resettoken}});

    if (!userToken) {
      return res.status(400).send(errorHandler(400, 'Token has expired'));
    }
     
    const userEmail = await User.findOne({where: {id: userToken.UserId}});
    if(!userEmail){
      return res.status(400).send(errorHandler(400, 'User does not exist'));
    }

    const isPreviousPassword = await bcrypt.compare(req.body.newPassword, userEmail.dataValues.password);
    if(isPreviousPassword) {
      return res.status(400).send(errorHandler(400, 'New password cannot be one of previous password.'));
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(req.body.newPassword, salt);

    userEmail.dataValues.password = hashedPassword;
    userEmail.dataValues.confirmPassword = hashedPassword;

    const updated = await User.update(userEmail.dataValues, {where: {id: userEmail.id}});
    if(updated) {
      return res.status(200).send({ message: 'Password reset successful. Kindly login to your account' });
    }
    return res.status(500).send(errorHandler(500, 'Password reset failed'));

  });

  router.post('/valid-password-token', async (req, res) => {
    if (!req.body.resettoken) {
      return res.status(400).send(errorHandler(400, 'Token is required'));
    }

    const user = await PasswordResetToken.findOne({where: {resetToken: req.body.resettoken}});
    if (!user) {
      return res.status(400).send(errorHandler(400, 'Invalid URL'));
    }

    //check if token has expired
    try {
       jwt.verify(token, config.get("fm_key"));
    } catch (ex) {
      const decodedError = errorHandler(401, "Token expired!");
      return res.status(401).send(decodedError);
    }

    const updated = await User.update(user, { where: {id: user.UserId }});

    if(updated) {
      return res.status(200).send({ message: 'Token verified successfully.' });
    } else {
      return res.status(500).send(errorHandler(500, err.message));
    } 

  });

  router.post('/change-password', authorizedMiddleWare, async (req, res) => { 

    if(isEmpty(req.body)) {
      return res.status(400).send(errorHandler(400, 'Invalid payload'));
    }

    const {oldPassword, newPassword, confirmNewP} = req.body;

    if(oldPassword && newPassword && confirmNewP) {
      if(newPassword != confirmNewP) {
        return res.status(400).send(errorHandler(400, 'Confirm password must match new password.'));
      }
  
      const user = await User.findOne({where: {id: req.user.id}});
      if(!user){
        return res.status(400).send(errorHandler(400, 'User does not exist'));
      }
  
      const isOldPasswordCorrect = await bcrypt.compare(oldPassword, user.password);
      if(!isOldPasswordCorrect) {
        return res.status(400).send(errorHandler(400, 'Old password is not correct.'));
      }  

      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(newPassword, salt);

      user.dataValues.password = hashedPassword;
      user.dataValues.confirmPassword = hashedPassword;
      user.dataValues.passwordChanged = true;

      const updated = await User.update(user.dataValues, {where: {id: user.id}});

      if(updated) {
        return res.status(200).send({ message: 'Password change successful. Kindly login again.' });
      }
      return res.status(500).send(errorHandler(500, 'Password change failed'));

    }
    else {
      return res.status(400).send(errorHandler(400, 'Please check your payload.'));

    }
       

  })

  const isEmpty = (obj) => {
    for(var key in obj) {
        if(obj.hasOwnProperty(key))
            return false;
    }
    return true;
  }

  const isLoginDataValid = req => {
        const schema = Joi.object({
          email : Joi.string().required().email({ minDomainSegments: 2, tlds: { allow: ['com', 'net'] } }),
          password: Joi.string().required().min(7).max(255)
      })
      return schema.validate(req);
  }

  module.exports = router;
