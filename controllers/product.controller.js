const express = require('express');
const router = express.Router();
const authorizedMiddleWare = require('../middlewares/auth');
const {Product, IsValid} = require('../models/products.model');
const errorHandler = require('../helpers/errorHandler');
const successHandler = require('../helpers/successHandler');
const getPagination = require('../helpers/getPagination');
const getPagingData = require('../helpers/getPagingData');
const { Op } = require("sequelize");
const upload = require('../middlewares/upload');





//get all
router.get('/', authorizedMiddleWare, async (req, res) => {
    const { page, size, search } = req.query;
    const condition = search ? { productName: { [Op.iLike]: `%${search}%`}} : null;

    const { limit, offset } = getPagination(page, size);
    const data = await Product.findAndCountAll({ where: condition, limit, offset});

    const products = getPagingData(data, page, limit);
    return res.status(200).send(products);
})

//getby id
router.get('/:id', authorizedMiddleWare, async ({params: { id: productId } }, res) => {
    if(!productId) return res.status(400).send(errorHandler(400, 'Missing id param'));

    const singleproduct = await Product.findByPk(productId);
    if(singleproduct === null) return res.status(404).send(errorHandler(404, 'product not found'));

    return res.status(200).send(successHandler(200, singleproduct.dataValues));

})

router.post('/', [authorizedMiddleWare, upload.single('image')], async(req, res) => {
    const image = req.file;
    if (!image) return res.status(400).send(errorHandler(400, 'Product image is required'));

    const {error} = IsValid(req.body);
    if (error) return res.status(400).send(errorHandler(400, error.message));

    const imageUrl = image.path;
    req.body.imageUrl = imageUrl;

    const isCreated = await Product.create(req.body);
    if(isCreated) return res.status(201).send({status: 201, message: "Product successfully created"});


});

router.put('/:id', [authorizedMiddleWare, upload.single('image')], async(req, res) => {
    const image = req.file;
    if(!req.params.id) return res.status(400).send(errorHandler(400, 'Missing id param'));

    if(image) {
        req.body.imageUrl = image.path;
    }

    const updated = await Product.update(req.body, {where: { id: req.params.id }});
    if(updated == 1) return res.status(200).send(successHandler(200, "Product successfully updated"));

    return res.status(400).send(errorHandler(400, "Unable to update"));

})

router.delete('/:id', authorizedMiddleWare, async({params: { id: productId } }, res) => {
    if(!productId) return res.status(400).send(errorHandler(400, 'Missing id param'));

    const deleted = await Product.destroy({where: {id: productId}});
    if(deleted == 1) return res.status(200).send(successHandler(200, "Product successfully deleted"));

    return res.status(400).send(errorHandler(400, "Unable to delete"));


});

module.exports = router;