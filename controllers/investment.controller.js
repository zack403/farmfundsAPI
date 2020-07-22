const express = require('express');
const router = express.Router();
const authorizedMiddleWare = require('../middlewares/auth');
const {Investment, IsValid} = require('../models/investments.model');
const errorHandler = require('../helpers/errorHandler');
const successHandler = require('../helpers/successHandler');
const getPagination = require('../helpers/getPagination');
const getPagingData = require('../helpers/getPagingData');
const {Sequelize, Op } = require("sequelize");
const sendMail = require('../services/emailService');



//get all
router.get('/', authorizedMiddleWare, async (req, res) => {
    const { page, size, search } = req.query;
    const condition = search ? { [Op.or]: [
                                    { investor: { [Op.iLike]: `%${search}%` } },
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

router.post('/', authorizedMiddleWare, async(req, res) => {
    const {error} = IsValid(req.body);
    if (error) return res.status(400).send(errorHandler(400, error.message));

    const {id, fullName} = req.user;
    req.body.UserId = id;
    req.body.amount = req.body.unit * req.body.amount;
    req.body.investor = fullName;
    const roi = (req.body.amount * req.body.profit) / 100;
    req.body.roi = req.body.amount + roi;
    req.body.startDate = Sequelize.Now;
    let end =  req.body.startDate.setDate(req.body.startDate.getDate() + parseInt(req.body.cycle));
    req.body.endDate = end;
    
    const isCreated = await Investment.create(req.body);

    const mailContent1 = {
        email: req.user.email,
        subject: `${req.body.package} Investment Notification`,
        body: 
            `<p>Hi ${req.user.fullName}</p>,<br>`
            + `<p>This email is confirmation that we got your investment to our <b>${req.body.package}</b> package</p><br>`
            + `<p>In the mean time, you can login to your account to keep up with your investment</p><br>`
            + `<p>due date and roi</p><br>`
            + `<a href="https://farmfunds.netlify.app/login">Login</a><br>`
            + `Thank you for choosing Farm Funds Africa`
    }

    const mailContent2 = {
        email: 'aminuzack7@gmail.com',
        subject: `Investment Notification Email`,
        body: 
            `<p>Hi there,</p>,<br>`
            + `<p>This is to inform you that ${req.user.fullName} Has successfully subscribed to ${req.body.package} package</p><br>`
            + `<p>Login to your admin and see details of the investment.</p><br>`
            + `<a href="https://farmfunds.netlify.app/admin/login">Login</a><br>`
    }

    const result = sendMail(mailContent1, mailContent2);
    if(isCreated && result) return res.status(201).send({status: 201, message: "Subscription Successful"});

});


router.delete('/:id', authorizedMiddleWare, async({params: { id: InvestmentId } }, res) => {
    if(!InvestmentId) return res.status(400).send(errorHandler(400, 'Missing id param'));

    const deleted = await Investment.destroy({where: {id: InvestmentId}});
    if(deleted == 1) return res.status(200).send(successHandler(200, "Successfully deleted"));

    return res.status(400).send(errorHandler(400, "Unable to delete"));


});

module.exports = router;