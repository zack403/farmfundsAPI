const express = require('express');
const router = express.Router();
const authorizedMiddleWare = require('../middlewares/auth');
const {User} = require('../models/users.model');




let totalInvAmount = []; 
let totalInvRoi = [];

//userdahsboard
router.get('/:id', authorizedMiddleWare, async (req, res) => {
    if(!req.params.id) return res.status(400).send(errorHandler(400, 'Missing id param'));
   
    const result = await User.findOne({where: {id: req.params.id}, include: [{all: true, nested: true, separate: true, order: [['createdAt', 'DESC']]}]});
    
     let investments = {};
     let subscribers = {};
     const purchases = result.Purchases;

    for(const {amount, roi} of result.Investments) {
        totalInvAmount.push(amount);
        totalInvRoi.push(roi);
    }

    if(totalInvAmount.length > 0 && totalInvRoi.length > 0) {
        investments.totalInv = totalInvAmount.reduce(sumAmount);
        investments.totalRoi = totalInvRoi.reduce(sumRoi);
        investments.totalGain = investments.totalInv + investments.totalRoi;
    } 
    else {
        investments.totalInv = 0;
        investments.totalRoi = 0;
        investments.totalGain = 0;
    }
    investments.inv = result.Investments;
    if(result.Subscribers.length > 0) {
        subscribers.amount = result.Subscribers[0].amount;
        subscribers.roi = result.Subscribers[0].roi;
        subscribers.roc = result.Subscribers[0].roc;
    } else {
        subscribers.amount = 0;
        subscribers.roi = 0;
        subscribers.roc = 0;
    }
   
    subscribers.subs = result.Subscribers;


    
    
    return res.status(200).send({
        status : 200,
        investments,
        purchases,
        subscribers
    });
})

const sumAmount = (total, num) => {
    return parseInt(total) + parseInt(num);
}

const sumRoi = (total, num) => {
    return parseInt(total) + parseInt(num);
}

module.exports = router;