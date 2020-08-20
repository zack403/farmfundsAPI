const express = require('express');
const router = express.Router();
const authorizedMiddleWare = require('../middlewares/auth');
const {Investment} = require('../models/investments.model');
const { Purchase } = require('../models/purchases.model');


let totalInvAmount = []; 
let totalInvRoi = [];

//userdahsboard
router.get('/:id', authorizedMiddleWare, async (req, res) => {
    if(!req.params.id) return res.status(400).send(errorHandler(400, 'Missing id param'));
   
    const investments = await Investment.findAndCountAll({where: {UserId: req.params.id}});
    const purchases = await Purchase.findAndCountAll({where: {UserId: req.params.id}});

    for(const {amount, roi} of investments.rows){
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
    
    
    return res.status(200).send({
        status : 200,
        investments,
        purchases
    });
})

const sumAmount = (total, num) => {
    return parseInt(total) + parseInt(num);
}

const sumRoi = (total, num) => {
    return parseInt(total) + parseInt(num);
}

module.exports = router;