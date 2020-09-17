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

    const singleUser = await User.findByPk(userId, {include: [{all: true, nested: true}]});
    if(singleUser === null) return res.status(404).send(errorHandler(404, 'User not found'));

    delete singleUser.dataValues.password; 
    delete singleUser.dataValues.confirmPassword; 
    return res.status(200).send(successHandler(200, singleUser.dataValues));

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

module.exports = router;