const express = require('express');
const router = express.Router();
const authorizedMiddleWare = require('../middlewares/auth');
const {Purchase, IsValid} = require('../models/purchases.model');
const errorHandler = require('../helpers/errorHandler');
const successHandler = require('../helpers/successHandler');
const getPagination = require('../helpers/getPagination');
const getPagingData = require('../helpers/getPagingData');
const { Op } = require("sequelize");
const sendMail = require('../services/emailService');





//get all
router.get('/', authorizedMiddleWare, async (req, res) => {
    const { page, size, search } = req.query;
    const condition = search ? { [Op.or]: [
                                    { name: { [Op.iLike]: `%${search}%` } },
                                    { email: { [Op.iLike]: `%${search}%` } },
                                    { status: { [Op.iLike]: `%${search}%` } }
                                ]} : null;

    const { limit, offset } = getPagination(page, size);
    const data = await Purchase.findAndCountAll({ where: condition, limit, offset});

    const purchases = getPagingData(data, page, limit);
    return res.status(200).send(purchases);
})

//getby id
router.get('/:id', authorizedMiddleWare, async (req, res) => {
    if(!req.params.id) return res.status(400).send(errorHandler(400, 'Missing id param'));

    const result = await Purchase.findByPk(req.params.id);
    if(result === null) return res.status(404).send(errorHandler(404, 'not found'));

    return res.status(200).send(successHandler(200, result.dataValues));

})

router.post('/', authorizedMiddleWare, async(req, res) => {
    const {error} = IsValid(req.body);
    if (error) return res.status(400).send(errorHandler(400, error.message));
    
    const isCreated = await Purchase.create(req.body);

    //send email about this purchase
    const mailContent1 = {
        email: req.user.email,
        subject: `Purchase Order Notification Email`,
        body: 
            `<p>Hi ${req.user.fullName}</p>,<br>`
            + `<p>You have successfully purchase ${req.body.product}</p><br>`
            + `<p>We have your address, and we are working on delivering to you right away.</p><br>`
            + `Thank you for choosing Farm Funds Africa`
    }

    const mailContent2 = {
        email: 'aminuzack7@gmail.com',
        subject: `Purchase Order Notification Email`,
        body: 
            `<p>Hi there,</p><br>`
            + `<p>This is to inform you that ${req.user.fullName} have successfully purchase ${req.body.product}</p><br>`
            + `<p>Here are the details of the customer purchase: </p><br>`
            + `<p>Product:</p> <strong>${req.body.product}</strong><br>`
            + `<p>Unit:</p> <strong>${req.body.unit}</strong><br>`
            + `<p>Amount:</p> <strong>${req.body.amount}</strong><br>`
            + `<p>Type:</p> <strong>${req.body.type}</strong><br>`
            + `<p>Address:</p> <strong>${req.body.address}</strong><br>`
            + `<p>Email:</p> <strong>${req.body.email}</strong><br>`
            + `<p>Phone No:</p> <strong>${req.body.phoneNo}</strong><br>`
    }


    const result = sendMail(mailContent1, mailContent2);
    if(isCreated && result) return res.status(201).send({status: 201, message: "Successfully created"});

});


router.delete('/:id', authorizedMiddleWare, async({params: { id: purchaseId } }, res) => {
    if(!purchaseId) return res.status(400).send(errorHandler(400, 'Missing id param'));

    const deleted = await Purchase.destroy({where: {id: purchaseId}});
    if(deleted == 1) return res.status(200).send(successHandler(200, "Successfully deleted"));

    return res.status(400).send(errorHandler(400, "Unable to delete"));


});

module.exports = router;