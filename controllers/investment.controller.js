const express = require('express');
const router = express.Router();
const authorizedMiddleWare = require('../middlewares/auth');
const {Investment, IsValid} = require('../models/investments.model');
const errorHandler = require('../helpers/errorHandler');
const successHandler = require('../helpers/successHandler');
const getPagination = require('../helpers/getPagination');
const getPagingData = require('../helpers/getPagingData');
const {Op } = require("sequelize");
const upload = require('../middlewares/upload');
const imageUpload = require('../helpers/imageUpload');
const fs = require("fs");
const isAdmin = require('../middlewares/admin');
const { Package } = require('../models/packages.model');
const deleteImage = require('../helpers/deleteImage');
const config = require('config');
const sgMail = require('@sendgrid/mail');
sgMail.setApiKey(config.get('sendgrid_key'));





//get all
router.get('/', authorizedMiddleWare, async (req, res) => {
    const { page, size, search } = req.query;
    const condition = search ? { [Op.or]: [
                                    { investor: { [Op.iLike]: `%${search}%` } },
                                    { package: { [Op.iLike]: `%${search}%` } },
                                    { email: { [Op.iLike]: `%${search}%` } },
                                    { status: { [Op.iLike]: `%${search}%` } }
                                ]} : null;

    const { limit, offset } = getPagination(page, size);
    const data = await Investment.findAndCountAll({ where: condition, limit, offset});

    const Investments = getPagingData(data, page, limit);
    return res.status(200).send(Investments);
})

//getby id
router.get('/:id', authorizedMiddleWare, async (req, res) => {
    if(!req.params.id) return res.status(400).send(errorHandler(400, 'Missing id param'));

    const result = await Investment.findByPk(req.params.id);
    if(result === null) return res.status(404).send(errorHandler(404, 'not found'));

    return res.status(200).send(successHandler(200, result.dataValues));

})

router.post('/', [authorizedMiddleWare, upload.single('proofofpayment')], async(req, res) => {

    const {error} = IsValid(req.body);
    if (error) return res.status(400).send(errorHandler(400, error.message));

    const {id} = req.user;
    
    const isPckageExist = await Package.findByPk(req.body.packageId);
    if(!isPckageExist || !isPckageExist.dataValues) {
        return res.status(404).send(errorHandler(404, 'Package not found'));
    }

    if(isPckageExist.unit <= 0) return res.status(400).send(errorHandler(400, `Sorry, all units for ${isPckageExist.packageName} has been sold out.`));

    if(parseInt(isPckageExist.unit) < parseInt(req.body.unit)) {
        return res.status(400).send(errorHandler(400, `Sorry, the remaining unit for ${isPckageExist.packageName} is less than the your purchase unit`));
    }

    if(req.body.paymentType === 'Transfer') {

        if (!req.file) return res.status(400).send(errorHandler(400, 'Proof of payment is required'));
        try {
            const result = await imageUpload(req.file.path);
            if(result) {
                req.body.proofOfPayment  = result.secure_url;
            }
            else {
                return res.status(500).send(errorHandler(500, "Error while trying to upload your image, try again..."));
            }
            
        } catch (error) {
            return res.status(500).send(errorHandler(500, `Internal Server Error - ${error.message}`));
        }
    }

    if(req.body.paymentType === 'Card') {
        req.body.startDate = new Date().getTime();
        req.body.endDate = new Date(req.body.startDate + (parseInt(isPckageExist.cycle)*24*60*60*1000));
        req.body.status = 'Activated';
    }


    req.body.UserId = id;
    req.body.amount = isPckageExist.amountPerUnit * parseInt(req.body.unit);
    req.body.roi = (req.body.amount * isPckageExist.profit) / 100;
    req.body.email = req.user.email;

    const isCreated = await Investment.create(req.body);

    if(isCreated ){
        if(req.body.paymentType === 'Transfer') {
            // const pathToAttachment = req.body.proofOfPayment;
            const fileName = `${req.user.fullName}_proofofpayment.jpg`;
            const attachment = fs.readFileSync(req.file.path, {encoding: 'base64'});
            // const attachment = pathToAttachment.toString("base64");
    
                //send email about the proof of payment
            const message = {
                to: 'info@farmfundsafrica.com',
                from: 'info@farmfundsafrica.com',
                subject: `${req.body.package} Investment Proof of payment from ${req.user.fullName}`,
                html: `<p> Hi there, </p>
                    <p> ${req.user.fullName} uploaded a proof of payment for their ${req.body.package} Investment. </p>
                    <p> Attached is the proof of payment. </p>`,
                attachments: [
                        {
                            content: attachment,
                            filename: fileName,
                            type: 'image/jpg',
                            disposition: 'attachment',
                            contentId: fileName
                        },
                    ]
            }
                
    
            try {
                await sgMail.send(message);
            } catch (error) {
                //await sgMail.send(messages);
            }
        } else {
            //reduce from the package unit
            if(isPckageExist != null) {
                let remainingUnit = isPckageExist.unit - parseInt(req.body.unit);
                await isPckageExist.update({unit: remainingUnit});
            }

            const mail = {
                to: 'info@farmfundsafrica.com',
                from: 'info@farmfundsafrica.com',
                subject: `Investment Notification Email`,
                body: 
                    `<p> Hi there, </p><br>`
                    + `<p>This is to inform you that ${req.user.fullName} Has successfully subscribed to ${req.body.package} package</p><br>`
                    + `<p>Login to your admin and see details of the investment.</p><br>`
                    + `<a href="https://farmifyagroadmin.netlify.app/login"> Login </a><br>`
            }

            try {
                await sgMail.send(mail);
            } catch (error) {
                //await sgMail.send(messages);
            }
        }
        
    } 
    return res.status(201).send({status: 201, message: "Subscription Successful"});

});

router.put('/activateinvestment/:id', [authorizedMiddleWare, isAdmin], async(req, res) => {
    if(!req.params.id) return res.status(400).send(errorHandler(400, 'Missing id param'));

    const item = await Investment.findOne({where: {id: req.params.id}});
    const package = await Package.findByPk(item.packageId);

    if(item != null){
        const start = new Date().getTime();
        const end = new Date(start + (parseInt(package.cycle)*24*60*60*1000))
        const updated = await item.update({status: "Activated", startDate: start, endDate: end});
        if(updated) {

                // deduct from balance
                if(package != null) {
                    let remainingUnit = package.unit - item.unit;
                    await package.update({unit: remainingUnit});   
                }

                 //send email about the proof of payment
                 const mailContent =  {
                    to: item.email,
                    from: 'info@farmfundsafrica.com',
                    subject: `Confirmation of ${item.package} Investment`,
                    html: `<p> Hi there, </p>
                        <p> Your proof of payment has been confirmed and your investment activated. </p>
                        <b> You can login to your account to monitor it. </b>
                        <b> Thank you for choosing Farm Funds Africa. </b>`
                }
        
                try {
                    await sgMail.send(mailContent);
                } catch (error) {
                    await sgMail.send(mailContent);
                }
            
            await deleteImage(item.proofOfPayment.match(/([^\/]+)(?=\.\w+$)/)[0]);
            //fs.unlinkSync(`./${item.proofOfPayment}`);
            return res.status(200).send(successHandler(200, "Successfully activated"));
            
        }
        return res.status(400).send(errorHandler(400, "Unable to update"));
    }
    return res.status(400).send(errorHandler(404, "Not found"));

});

router.delete('/:id', [authorizedMiddleWare, isAdmin], async({params: { id: InvestmentId } }, res) => {
    if(!InvestmentId) return res.status(400).send(errorHandler(400, 'Missing id param'));

    const item = await Investment.findOne({where: {id: InvestmentId}});

    if(item != null && item.status === 'Activated') {
        return res.status(400).send(errorHandler(400, "Bad request"));
    }
    else {
        const deleted = await Investment.destroy({where: {id: InvestmentId}});
        if(deleted == 1) {
            await deleteImage(item.proofOfPayment.match(/([^\/]+)(?=\.\w+$)/)[0]);
            return res.status(200).send(successHandler(200, "Successfully deleted"));
        } 
    }    
    return res.status(400).send(errorHandler(400, "Unable to delete"));

});

module.exports = router;