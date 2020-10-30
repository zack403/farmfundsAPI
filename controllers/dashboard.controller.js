const express = require('express');
const router = express.Router();
const authorizedMiddleWare = require('../middlewares/auth');
const {User} = require('../models/users.model');
const { Sequelize, Op } = require("sequelize");
const {Investment} = require('../models//investments.model');
const {Purchase} = require('../models/purchases.model');
const {PurchaseDetail} = require('../models/purchaseDetails.model');
const {Subscribers} = require('../models/subscribers.model');







let totalInvAmount = []; 
let totalInvRoi = [];

//userdahsboard

router.get('/fooddashboard', authorizedMiddleWare, async(req, res) => {
      const totalSubs = await Subscribers.sum('amount', {where: { status: 'Activated' } });
      const totalRocs = await Subscribers.sum('roc', {where: { status: 'Activated' } });
      const totalOrders = await Purchase.sum('amount');
      const totalSubscribers = await Subscribers.count({distinct: true, col: 'UserId'});
      res.json({totalSubs, totalOrders, totalSubscribers, totalRocs})
})

router.get('/fooddashboard/monthlysales', authorizedMiddleWare, async(req, res) => {
    // const result = await Purchase
     res.json({})
})

router.get('/fooddashboard/yearlysales', authorizedMiddleWare, async(req, res) => {
    // const result = await Purchase
     res.json({})
})

router.get('/fooddashboard/topfivecustomer', authorizedMiddleWare, async(req, res) => {
    
    const result = await Purchase.findAll({
        where: {status: 'Delivered'}, 
        attributes: [
            'name',
            [Sequelize.fn('sum', Sequelize.col('amount')), 'totalAmount'],
          ],
        group: 'name', 
        limit: 5
    })
    res.json(result);
})

router.get('/fooddashboard/orderInfo', authorizedMiddleWare, async(req, res) => {    
    const TODAY_START = new Date(new Date().setHours(0, 0, 0, 0));
    const NOW = new Date();

    const thisWeekDate = firstDayOfWeek(new Date(), 0);

    const lastWeekDate = firstDayOfWeek(new Date(new Date().setDate(new Date().getDate() - 7)), 0);

    const lastWeekEndDate = new Date(firstDayOfWeek(new Date(new Date().setDate(new Date().getDate() - 7)), 0).getTime() + 6*24*60*60*1000);

    const today = await Purchase.count({
        where: {
            createdAt: { 
              [Op.gte]: TODAY_START,
              [Op.lte]: NOW
            }
        }
    });

    const thisWeek = await Purchase.count({
        where: {
            createdAt: { 
              [Op.gte]: thisWeekDate,
              [Op.lte]: NOW
            }
        }
    });

    const lastWeek = await Purchase.count({
        where: {
            createdAt: { 
              [Op.gte]: lastWeekDate,
              [Op.lte]: lastWeekEndDate
            }
        }
    });

    res.json({today, thisWeek, lastWeek});
})

router.get('/farminvestmentdashboard', authorizedMiddleWare, async(req, res) => {
    const totalInvs = await Investment.sum('amount',  {where: { status: 'Activated' } });
    const totalRois = await Investment.sum('roi', {where: { status: 'Activated' } });
    const totalGains = totalInvs + totalRois;

    const totalInvestors = await Investment.count({distinct: true, col: 'UserId'})

    res.json({totalInvs, totalInvestors, totalGains});
})


router.get('/farminvestmentdashboard/invInfo', authorizedMiddleWare, async(req, res) => {
    const pendingInv = await Investment.count({where: {status: 'Pending'}});
    const activeInv = await Investment.count({where: {status: 'Activated'}});

    res.json({pendingInv, activeInv});
})

router.get('/farminvestmentdashboard/invSummary', authorizedMiddleWare, async(req, res) => {
    const invSummary = await Investment.findAll();
    res.json({invSummary});
})

router.get('/:id', authorizedMiddleWare, async (req, res) => {
    if(!req.params.id) return res.status(400).send(errorHandler(400, 'Missing id param'));
   
    totalInvAmount = [];
    totalInvRoi = [];
    filteredInv = [];


    // const result = await User.findOne({where: {id: req.params.id}, include: [{all: true,  nested: true, order: [['createdAt', 'DESC']]}]});
    
    const result = await User.findOne({where: {id: req.params.id}, order: [['createdAt', 'DESC']],
        include: [
            {
                model: Investment, 
                separate: true,
                order: [['createdAt', 'DESC']],
                where: {amount: {[Op.gt]: 0}},
                required: false
            },
            {
                model: Purchase, 
                separate: true,
                order: [['createdAt', 'DESC']],
                where: {amount: {[Op.gt]: 0}},
                required: false,
                include: [
                    {
                        all: true,
                        order: [['createdAt', 'DESC']],

                    }
                ]
            },
            {
                model: Subscribers,
                separate: true,
                order: [['createdAt', 'DESC']],
                required: false,
                where: {amount: {[Op.gt]: 0}},
                include: [
                    {all: true, order: [['createdAt', 'DESC']] }
                ]
            }
        ]
    });


    

     let investments = {};
     let subscribers = {};
     const purchases = result.Purchases;

    filteredInv = result.Investments.filter(x => x.status === 'Activated');

    for(const {amount, roi} of filteredInv) {
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


const firstDayOfWeek = (dateObject, firstDayOfWeekIndex) => {
    const dayOfWeek = dateObject.getDay(),
        firstDayOfWeek = new Date(dateObject),
        diff = dayOfWeek >= firstDayOfWeekIndex ?
            dayOfWeek - firstDayOfWeekIndex :
            6 - dayOfWeek

    firstDayOfWeek.setDate(dateObject.getDate() - diff)
    firstDayOfWeek.setHours(0,0,0,0)

    return firstDayOfWeek
}

module.exports = router;