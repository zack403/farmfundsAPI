const express = require('express');
const router = express.Router();
const Joi = require('@hapi/joi');
const errorHandler = require('../helpers/errorHandler');
const config = require('config');
const sgMail = require('@sendgrid/mail');
sgMail.setApiKey(config.get('sendgrid_key'));
const upload = require('../middlewares/upload');
const authorizedMiddleWare = require('../middlewares/auth');
const {Subscribers, IsValid} = require('../models/subscribers.model');
const fs = require("fs");
const isAdmin = require('../middlewares/admin');
const getPagination = require('../helpers/getPagination');
const getPagingData = require('../helpers/getPagingData');
const successHandler = require('../helpers/successHandler');



//contactus
router.get('/contactus', async (req, res) => {
    const {error} = ValidateContactUs(req.body);
    if (error) return res.status(400).send(errorHandler(400, error.message));

    const msg = {
            to: 'info@farmfundsafrica.com',
            from: req.body.email,
            subject: req.body.subject,
            text: req.body.message
        }

    const result = await sgMail.send(msg);
    if(result){
        res.status(200).send({status: 200, message: "We got your message, we will get back to you shortly!"});
    }
    else {
        res.status(500).send({status: 500, message: "Something failed, error while sending your message"});
    }
})

//get all
router.get('/getsubscribers', authorizedMiddleWare, async (req, res) => {
    const { page, size, search } = req.query;
    const condition = search ? { [Op.or]: [
                                    { name: { [Op.iLike]: `%${search}%` } },
                                    { phoneNo: { [Op.iLike]: `%${search}%` } },
                                    { status: { [Op.iLike]: `%${search}%` } }
                                ]} : null;

    const { limit, offset } = getPagination(page, size);
    const data = await Subscribers.findAndCountAll({ where: condition, limit, offset});

    const subscribers = getPagingData(data, page, limit);
    return res.status(200).send(subscribers);
});

router.put('/activatesubscriber/:id', [authorizedMiddleWare, isAdmin], async(req, res) => {
    if(!req.params.id) return res.status(400).send(errorHandler(400, 'Missing id param'));

    const item = await Subscribers.findOne({where: {id: req.params.id}});
    if(item != null){
        const updated = await item.update({status: "Activated"});
        if(updated) {
                 //send email about the proof of payment
                 const mailContent =  {
                    to: item.email,
                    from: 'info@farmfundsafrica.com',
                    subject: `Confirmation of subscription`,
                    html: `<p> Hi there, </p>
                        <p> Your proof of payment has been confirmed and your subscription activated. </p>
                        <p> Please log in to your account and proceed to send us your items. </p>`
                }
        
                try {
                    await sgMail.send(mailContent);
                } catch (error) {
                    console.log(error);
                    return await sgMail.send(mailContent);
                }
            
            fs.unlinkSync(`./${item.proofOfPayment}`);
            return res.status(200).send(successHandler(200, "Successfully activated"));
            
        }
        return res.status(400).send(errorHandler(400, "Unable to update"));
    }
    return res.status(400).send(errorHandler(404, "Not found"));

});

router.delete('/deletesubscriber/:id', [authorizedMiddleWare, isAdmin], async({params: { id: subscriberId } }, res) => {
    if(!subscriberId) return res.status(400).send(errorHandler(400, 'Missing id param'));

    const item = await Subscribers.findOne({where: {id: subscriberId}});

    if(item != null && item.status === 'Activated') {
        return res.status(400).send(errorHandler(400, "Bad request"));
    }
    else {
        const deleted = await Subscribers.destroy({where: {id: subscriberId}});
        if(deleted == 1) return res.status(200).send(successHandler(200, "Successfully deleted"));
    
        return res.status(400).send(errorHandler(400, "Unable to delete"));
    }
});

router.post('/proofofpayment', [authorizedMiddleWare, upload.single('proofofpayment')], async (req, res) => {
    const {error} = IsValid(req.body);
    if (error) return res.status(400).send(errorHandler(400, error.message));

    if(req.body.paymentType === 'Transfer') {
        if (!req.file) return res.status(400).send(errorHandler(400, 'Proof of payment is required'));
        req.body.proofOfPayment = req.file.path;
    }

    if(req.body.paymentType === 'Card') {
        req.body.status = 'Activated';
    }

    req.body.amount = req.body.unit * 100000;
    req.body.roc = (req.body.amount * 70) / 100;
    req.body.roi = (req.body.amount * 60) / 100;
    req.body.startDate = new Date().getTime();
    req.body.endDate = new Date(req.body.startDate + (364*24*60*60*1000));

    const created = await Subscribers.create(req.body);
    if(created) {
        if(req.body.paymentType === 'Transfer') {
            const pathToAttachment = req.file.path;
            const fileName = `${req.body.name}_proofofpayment.jpg`;
            const attachment = fs.readFileSync(pathToAttachment).toString("base64");
    
                //send email about the proof of payment
            const mailContent =  {
                to: 'aminuzack7@gmail.com',
                from: 'info@farmfundsafrica.com',
                subject: `Farmify Market Proof of payment from ${req.body.name}`,
                html: `<p> Hi there, </p>
                    <p> ${req.body.name} uploaded a proof of payment for their subscription. </p>
                    <p> Attached is the proof of payment. </p>`,
                attachments: [
                    {
                        content: attachment,
                        filename: fileName,
                        type: 'image/jpg',
                        disposition: 'attachment',
                        contentId: fileName
                    },
                ],
            }
    
            try {
                await sgMail.send(mailContent);
            } catch (error) {
                console.log(error);
                return await sgMail.send(mailContent);
            }
        }
        return res.status(200).send({status: 200, message: "Your file has been uploaded successfully, please hold on while we confirm and activate your subscription. Thanks"});
    } 
    fs.unlinkSync(`./${req.body.proofOfPayment}`);

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