const express = require('express');
const router = express.Router();
const authorizedMiddleWare = require('../middlewares/auth');
const isAdmin = require('../middlewares/admin');
const {User} = require('../models/users.model');
const {Investment} = require('../models/investments.model');
const errorHandler = require('../helpers/errorHandler');
const successHandler = require('../helpers/successHandler');
const getPagination = require('../helpers/getPagination');
const getPagingData = require('../helpers/getPagingData');
const { Op } = require("sequelize");



let totalInvAmount = []; 
let totalInvRoi = [];

let totalSubAmount = []; 
let totalSubRoi = [];
let totalSubRoc = [];

let totalPurAmount = []; 

//get all
router.get('/', [authorizedMiddleWare, isAdmin], async (req, res) => {
    const { page, size, search } = req.query;
    const condition = search ? { 
        [Op.or]: [{ firstName: { [Op.iLike]: `%${search}%` } },{ lastName: { [Op.iLike]: `%${search}%` } }], 
        [Op.and]: [{isAdmin: false}]} : {isAdmin: false};

    const { limit, offset } = getPagination(page, size);
    const data = await User.findAndCountAll({ where: condition, limit, offset, include: Investment, distinct: true, attributes: { exclude: ['password', 'confirmPassword'] }, order: [['firstName', 'DESC']] });

    const users = getPagingData(data, page, limit);
    return res.status(200).send(users);
})

//getby id
router.get('/:id', authorizedMiddleWare, async ({params: { id: userId } }, res) => {
    if(!userId) return res.status(400).send(errorHandler(400, 'Missing id param'));

    totalInvAmount = [];
    totalInvRoi = [];
    totalSubAmount = []; 
    totalSubRoi = [];
    totalSubRoc = [];
    totalPurAmount = []; 

    let investments = {
        totalInv: 0,
        totalRoi: 0,
        totalGain: 0
    };
    let subscribers = {
        totalSub: 0,
        totalRoi: 0,
        totalRoc: 0
    };
    
    let purchases = {
        totalOrder: 0
    };


    const singleUser = await User.findByPk(userId, {include: [{all: true, nested: true}]});
    if(singleUser === null) return res.status(404).send(errorHandler(404, 'User not found'));

    delete singleUser.dataValues.password; 
    delete singleUser.dataValues.confirmPassword; 

    for(const {amount, roi} of singleUser.dataValues.Investments) {
        totalInvAmount.push(amount);
        totalInvRoi.push(roi);
    }

    for(const {amount, roi, roc} of singleUser.dataValues.Subscribers) {
        totalSubAmount.push(amount);
        totalSubRoi.push(roi);
        totalSubRoc.push(roc);
    }

    for(const {amount} of singleUser.dataValues.Purchases) {
        totalPurAmount.push(amount);
    }

    if(totalInvAmount.length > 0 && totalInvRoi.length > 0) {

        investments.totalInv = totalInvAmount.reduce(doSum);
        investments.totalRoi = totalInvRoi.reduce(doSum);
        investments.totalGain = investments.totalInv + investments.totalRoi;        
    } 
    if (totalSubAmount.length > 0 && totalSubRoc.length > 0 && totalSubRoi.length > 0) {

        subscribers.totalSub = totalSubAmount.reduce(doSum);
        subscribers.totalRoc = totalSubRoc.reduce(doSum);
        subscribers.totalRoi = totalSubRoi.reduce(doSum);

    } 
    if (totalPurAmount.length > 0) {

        purchases.totalOrder = totalPurAmount.reduce(doSum);
    }
    

    investments.inv = singleUser.dataValues.Investments;
    subscribers.subs = singleUser.dataValues.Subscribers;
    purchases.purchases = singleUser.dataValues.Purchases;

    const user = singleUser.middleName ? `${singleUser.firstName} ${singleUser.middleName} ${singleUser.lastName}` : `${singleUser.firstName} ${singleUser.lastName}` ;

    return res.status(200).send(successHandler(200, { user, investments, subscribers, purchases}));

})

router.put('/', authorizedMiddleWare, async(req, res) => {
    if(!req.body.id) return res.status(400).send(errorHandler(400, 'Missing id param'));
    
    const user = await User.findByPk(req.body.id);
    if(user && user.dataValues.email != req.body.email) {
        const userExist = await User.findOne({where: {email: { [Op.iLike]: req.body.email}}});
        if(userExist){
            return res.status(400).send(errorHandler(400, `This email ${req.body.email} is already in use`));
        }
    }

    const updated = await User.update(req.body, {where: { id: req.body.id }});
    if(updated == 1) return res.status(200).send(successHandler(200, "Profile successfully updated"));

    return res.status(400).send(errorHandler(400, "Unable to update"));

})

router.delete('/:id', [authorizedMiddleWare, isAdmin], async({params: { id: userId } }, res) => {
    if(!userId) return res.status(400).send(errorHandler(400, 'Missing id param'));

    const deleted = await User.destroy({where: {id: userId}});
    if(deleted == 1) return res.status(200).send(successHandler(200, "Successfully deactivated"));

    return res.status(400).send(errorHandler(400, "Unable to delete"));


});

const doSum = (total, num) => {
    return parseInt(total) + parseInt(num);
}

module.exports = router;