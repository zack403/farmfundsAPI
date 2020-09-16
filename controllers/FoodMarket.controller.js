const express = require('express');
const router = express.Router();
const authorizedMiddleWare = require('../middlewares/auth');
const {FoodMarket, IsValid} = require('../models/foodMarket.model');
const errorHandler = require('../helpers/errorHandler');
const successHandler = require('../helpers/successHandler');
const getPagination = require('../helpers/getPagination');
const getPagingData = require('../helpers/getPagingData');
const { Op } = require("sequelize");
const upload = require('../middlewares/upload');
const isAdmin = require('../middlewares/admin');
const imageUpload = require('../helpers/imageUpload');
const deleteImage = require('../helpers/deleteImage');








//get all
router.get('/', authorizedMiddleWare, async (req, res) => {
    const { page, size, search } = req.query;
    const condition = search ? { productName: { [Op.iLike]: `%${search}%`}} : null;

    const { limit, offset } = getPagination(page, size);
    const data = await FoodMarket.findAndCountAll({ where: condition, limit, offset});

    const foodMarkets = getPagingData(data, page, limit);
    return res.status(200).send(foodMarkets);
})

//getby id
router.get('/:id', authorizedMiddleWare, async ({params: { id: foodMarketId } }, res) => {
    if(!foodMarketId) return res.status(400).send(errorHandler(400, 'Missing id param'));

    const singleFoodMarket = await FoodMarket.findByPk(foodMarketId);
    if(singleFoodMarket === null) return res.status(404).send(errorHandler(404, 'Product not found'));

    return res.status(200).send(successHandler(200, singleFoodMarket.dataValues));

})

router.post('/', [authorizedMiddleWare, isAdmin, upload.single('image')], async(req, res) => {
    if (!req.file) return res.status(400).send(errorHandler(400, 'Product image is required'));

    const {error} = IsValid(req.body);
    if (error) return res.status(400).send(errorHandler(400, error.message));
    
    const productExist = await FoodMarket.findOne({where: {productName: { [Op.iLike]: req.body.productName}}});
    if(productExist){
        //fs.unlinkSync(`./${req.file.path}`); // deletes the uploaded product image
        return res.status(400).send(errorHandler(400, `Product Name ${req.body.productName} already exist`));
    } 

    if (!req.body.price) {
        req.body.price = null;
    }

    try {
        const result = await imageUpload(req.file.path);
        if(result) {
            req.body.imageUrl = result.secure_url;
        }
        else {
            return res.status(500).send(errorHandler(500, "Error while trying to upload your image, try again..."));
        }
        
    } catch (error) {
        return res.status(500).send(errorHandler(500, `Internal Server Error - ${error.message}`));
    }

    const isFoodMarketCreated = await FoodMarket.create(req.body);
    if(isFoodMarketCreated) return res.status(201).send({status: 201, message: "Product successfully created"});

    await deleteImage(req.body.imageUrl.match(/([^\/]+)(?=\.\w+$)/)[0]);

});

router.patch('/:id', [authorizedMiddleWare, isAdmin, upload.single('image')], async(req, res) => {
    if(!req.params.id) return res.status(400).send(errorHandler(400, 'Missing id param'));

    let item = await FoodMarket.findByPk(req.params.id);
    if(item && item.dataValues.productName != req.body.productName) {
        const productExist = await FoodMarket.findOne({where: {productName: { [Op.iLike]: req.body.productName}}});
        if(productExist){
            //fs.unlinkSync(`./${req.file.path}`); // deletes the uploaded product image
            return res.status(400).send(errorHandler(400, `Product Name ${req.body.productName} already in use`));
        } 
    }

    if(req.file) {
        try {
            const result = await imageUpload(req.file.path);
            if(result) {
                req.body.imageUrl = result.secure_url;
            }
            else {
                return res.status(500).send(errorHandler(500, "Error while trying to upload your image, try again..."));
            }
            
        } catch (error) {
            return res.status(500).send(errorHandler(500, `Internal Server Error - ${error.message}`));
        }
    }

    const updated = await FoodMarket.update(req.body, {where: { id: req.params.id }});

    if(updated == 1) {

        if(req.file && (item && item.dataValues)){
            //fs.unlinkSync(`./${item.dataValues.imageUrl}`);
            //delete the previous image from cloud
           await deleteImage(item.dataValues.imageUrl.match(/([^\/]+)(?=\.\w+$)/)[0]);
        }
        return res.status(200).send(successHandler(200, "Product successfully updated"));
    }

    await deleteImage(req.body.imageUrl.match(/([^\/]+)(?=\.\w+$)/)[0]);
    
    return res.status(400).send(errorHandler(400, "Unable to update"));

})

router.delete('/:id', [authorizedMiddleWare, isAdmin], async({params: { id: FoodMarketId } }, res) => {
 
    if(!FoodMarketId) return res.status(400).send(errorHandler(400, 'Missing id param'));
    const item = await FoodMarket.findByPk(FoodMarketId);
   
    const deleted = await FoodMarket.destroy({where: {id: FoodMarketId}});

    if(deleted == 1){

        if(item && item.dataValues){
            //fs.unlinkSync(`./${item.dataValues.imageUrl}`);
            await deleteImage(item.dataValues.imageUrl.match(/([^\/]+)(?=\.\w+$)/)[0]);

        }
        return res.status(200).send(successHandler(200, "Product successfully deleted"));
    } 

    return res.status(400).send(errorHandler(400, "Unable to delete"));


});

module.exports = router;