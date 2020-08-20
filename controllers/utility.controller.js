const express = require('express');
const router = express.Router();
const Joi = require('@hapi/joi');
const errorHandler = require('../helpers/errorHandler');
const config = require('config');
const sgMail = require('@sendgrid/mail');
sgMail.setApiKey(config.get('sendgrid_key'));
const upload = require('../middlewares/upload');
const authorizedMiddleWare = require('../middlewares/auth');






//contactus
router.get('/contactus', async (req, res) => {
    const {error} = ValidateContactUs(req.body);
    if (error) return res.status(400).send(errorHandler(400, error.message));

    const msg = {
            to: 'talk2malk@gmail.com',
            from: req.body.email,
            subject: req.body.subject,
            text: req.body.message,
            html: params1.body
        }

    const result = await sgMail.send(msg);
    if(result){
        res.status(200).send({status: 200, message: "We got your message, we will get back to you shortly!"});
    }
    else {
        res.status(500).send({status: 500, message: "Something failed, error while sending your message"});
    }
})

router.post('/proofofpayment', [authorizedMiddleWare, upload.single('proofofpayment')], (req, res) => {
    if (!req.file) return res.status(400).send(errorHandler(400, 'Proof of payment is required'));
    let {id} = req.user;
    const imageUrl = req.file.path;

});


const ValidateContactUs = req => {
    const schema = Joi.object({
      name: Joi.string().required(),
      email : Joi.string().required().email({ minDomainSegments: 2, tlds: { allow: ['com', 'net'] } }),
      subject: Joi.string().optional(),
      message: Joi.string().required()
  })
  return schema.validate(req);
}

module.exports = router;