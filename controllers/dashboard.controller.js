const express = require('express');
const router = express.Router();
const authorizedMiddleWare = require('../middlewares/auth');
const {Investment} = require('../models/investments.model');
const { Purchase } = require('../models/purchases.model');



//userdahsboard
router.get('/user', authorizedMiddleWare, async (req, res) => {
    const {id} = req.user;
    const investments = await Investment.findAndCountAll({where: {UserId: id}});
    const purchases = await Purchase.findAndCountAll({where: {UserId: id}})

    return res.status(200).send({
        status : 200,
        investments,
        purchases
    });
})

module.exports = router;