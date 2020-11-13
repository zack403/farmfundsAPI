const express = require('express');
const router = express.Router();
const authorizedMiddleWare = require('../middlewares/auth');
const {User} = require('../models/users.model');
const { Sequelize, Op } = require("sequelize");
const {Investment} = require('../models//investments.model');
const {Purchase} = require('../models/purchases.model');
const {PurchaseDetail} = require('../models/purchaseDetails.model');
const {Subscribers} = require('../models/subscribers.model');
const errorHandler = require('../helpers/errorHandler');
const dateRangeFilter = require('../helpers/dateRangeFilter');







let totalInvAmount = []; 
let totalInvRoi = [];

//food dashboard start 

router.get('/fooddashboard', authorizedMiddleWare, async(req, res) => {
      const totalSubs = await Subscribers.sum('amount', {where: { status: 'Activated' } });
      const totalRocs = await Subscribers.sum('roc', {where: { status: 'Activated' } });
      const totalOrders = await Purchase.sum('amount');
      const totalSubscribers = await Subscribers.count({distinct: true, col: 'UserId'});
      res.json({totalSubs, totalOrders, totalSubscribers, totalRocs})
})

router.get('/fooddashboard/monthlysales', authorizedMiddleWare, async(req, res) => {
    try {
        const result = await Purchase.findAll({
            where: Sequelize.where(Sequelize.fn("date_part",'year', Sequelize.col('createdAt')), new Date().getFullYear()),
            attributes: [
                [ Sequelize.literal('to_char("createdAt",\'month\')'), 'monthName'],
                [Sequelize.fn('sum', Sequelize.col('amount')), 'totalAmount'],
              ],
            order: [[Sequelize.literal('"monthName"'), 'DESC']],
            group: 'monthName'
        });
    
         res.json(result);
        
    } catch (error) {
        console.log("err", error);
    }
})

router.get('/fooddashboard/yearlysales', authorizedMiddleWare, async(req, res) => {
    let m;
    const finalResult = [];
    try {
        for (m = 0; m < 3; m++) {
            let year = new Date().getFullYear() - m; 
            
            const result = await Purchase.findAll({
                where: Sequelize.where(Sequelize.fn("date_part",'year', Sequelize.col('createdAt')), year),
                attributes: [
                    [Sequelize.fn('sum', Sequelize.col('amount')), 'totalAmount'],
                  ]
            });

            const returnVal = result[0].dataValues;
            finalResult.push(returnVal.totalAmount ? returnVal.totalAmount : 0);
        }
        
         res.json(finalResult);

    } catch (error) {
        console.log("err", error);
    }
})

router.get('/fooddashboard/topfivecustomer/', authorizedMiddleWare, async(req, res) => {

    const {dateRange} = req.query;
    if(!dateRange) return res.status(400).send(errorHandler(400, 'Missing dateRange query'));
    
    const filter = dateRangeFilter(dateRange, 'Delivered');

    const result = await Purchase.findAll({
            where: filter, 
            attributes: [
                'name',
                [Sequelize.fn('sum', Sequelize.col('amount')), 'totalAmount'],
              ],
            group: 'name', 
            limit: 5
        })

    res.json(result); 
})

router.get('/fooddashboard/topfiveproducts', authorizedMiddleWare, async(req, res) => {
    
    const {dateRange} = req.query;
    if(!dateRange) return res.status(400).send(errorHandler(400, 'Missing dateRange query'));
    
    const filter = dateRangeFilter(dateRange, '');

    const result = await PurchaseDetail.findAll({
        where: filter,
        attributes: [
            'productName',
            [Sequelize.fn('sum', Sequelize.col('price')), 'totalPrice'],
          ],
        group: 'productName', 
        limit: 5
    })
    res.json(result);
})

router.get('/fooddashboard/orderInfo', authorizedMiddleWare, async(req, res) => {    

    let today;
    let thisWeek;
    let lastWeek;

    const {dateRange} = req.query;
    if(!dateRange) return res.status(400).send(errorHandler(400, 'Missing dateRange query'));

    const TODAY_START = new Date(new Date().setHours(0, 0, 0, 0));
    const NOW = new Date();

    const thisWeekDate = firstDayOfWeek(new Date(), 0);

    const lastWeekDate = firstDayOfWeek(new Date(new Date().setDate(new Date().getDate() - 7)), 0);

    const lastWeekEndDate = new Date(firstDayOfWeek(new Date(new Date().setDate(new Date().getDate() - 7)), 0).getTime() + 6*24*60*60*1000);

    if(dateRange === "All") {
        today = await Purchase.count({
            where: {
                createdAt: { 
                        [Op.gte]: TODAY_START,
                        [Op.lte]: NOW
                }
            }
        });
    
        thisWeek = await Purchase.count({
            where: {
                    createdAt: { 
                        [Op.gte]: thisWeekDate,
                        [Op.lte]: NOW
                    }
            }
        });
    
        lastWeek = await Purchase.count({
            where: {
                    createdAt: { 
                        [Op.gte]: lastWeekDate,
                        [Op.lte]: lastWeekEndDate
                    }
            }
        });

    } else {
         today = await Purchase.count({
            where: {
                [Op.and]: [
                    {createdAt: { 
                        [Op.gte]: TODAY_START,
                        [Op.lte]: NOW
                      }
                    },
                    {status: dateRange}
                ]
                
            }
        });
    
        thisWeek = await Purchase.count({
            where: {
                [Op.and]: [
                    {createdAt: { 
                        [Op.gte]: thisWeekDate,
                        [Op.lte]: NOW
                      }
                    },
                    {status: dateRange}
                ]
                
            }
        });
    
        lastWeek = await Purchase.count({
            where: {
                [Op.and]: [
                    {createdAt: { 
                        [Op.gte]: lastWeekDate,
                        [Op.lte]: lastWeekEndDate
                      }
                    },
                    {status: dateRange}
                ]   
            }
        });
    }
 

    res.json({today, thisWeek, lastWeek});
})

//food dashboard end 



//farm investments dashboard start 
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

router.get('/farminvestmentdashboard/monthlyinvs', authorizedMiddleWare, async(req, res) => {
    try {
        const result = await Investment.findAll({
            where: Sequelize.where(Sequelize.fn("date_part",'year', Sequelize.col('createdAt')), new Date().getFullYear()),
            attributes: [
                [ Sequelize.literal('to_char("createdAt",\'month\')'), 'monthName'],
                [Sequelize.fn('sum', Sequelize.col('amount')), 'totalAmount'],
              ],
            order: [[Sequelize.literal('"monthName"'), 'DESC']],
            group: 'monthName'
        });
    
         res.json(result);
        
    } catch (error) {
        console.log("err", error);
    }
})

router.get('/farminvestmentdashboard/yearlyinvs', authorizedMiddleWare, async(req, res) => {
    let m;
    const finalResult = [];
    try {
        for (m = 0; m < 3; m++) {
            let year = new Date().getFullYear() - m; 
            
            const result = await Investment.findAll({
                where: Sequelize.where(Sequelize.fn("date_part",'year', Sequelize.col('createdAt')), year),
                attributes: [
                    [Sequelize.fn('sum', Sequelize.col('amount')), 'totalAmount'],
                  ]
            });

            const returnVal = result[0].dataValues;
            finalResult.push(returnVal.totalAmount ? returnVal.totalAmount : 0);
        }
        
         res.json(finalResult);

    } catch (error) {
        console.log("err", error);
    }
})


router.get('/farminvestmentdashboard/topfiveinvestors', authorizedMiddleWare, async(req, res) => {
    
    const {dateRange} = req.query;
    if(!dateRange) return res.status(400).send(errorHandler(400, 'Missing dateRange query'));
    
    const filter = dateRangeFilter(dateRange, 'Activated');

    const result = await Investment.findAll({
        where: filter, 
        attributes: [
            'investor',
            [Sequelize.fn('sum', Sequelize.col('amount')), 'totalAmount'],
          ],
        group: 'investor', 
        limit: 5
    })
    res.json(result);
})

router.get('/farminvestmentdashboard/topfivefarms', authorizedMiddleWare, async(req, res) => {
    
    const {dateRange} = req.query;
    if(!dateRange) return res.status(400).send(errorHandler(400, 'Missing dateRange query'));
    
    const filter = dateRangeFilter(dateRange, '');

    const result = await Investment.findAll({
        where: filter,
        attributes: [
            'package',
            [Sequelize.fn('sum', Sequelize.col('amount')), 'totalAmount'],
          ],
        group: 'package', 
        limit: 5
    })
    res.json(result);
})
//farm investments dashboard end

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
        user: { id: result.dataValues.id, firstName: result.dataValues.firstName,
                middleName:  result.dataValues.middleName,
                lastName:result.dataValues.lastName,
                email: result.dataValues.email,
                phoneNo: result.dataValues.phoneNo
            },
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