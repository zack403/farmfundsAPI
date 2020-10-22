const express = require('express');
const router = express.Router();
const authorizedMiddleWare = require('../middlewares/auth');
const {Package, IsValid} = require('../models/packages.model');
const errorHandler = require('../helpers/errorHandler');
const successHandler = require('../helpers/successHandler');
const getPagination = require('../helpers/getPagination');
const getPagingData = require('../helpers/getPagingData');
const { Op } = require("sequelize");
const upload = require('../middlewares/upload');
const imageUpload = require('../helpers/imageUpload');
const deleteImage = require('../helpers/deleteImage');




//get all
router.get('/', async (req, res) => {
    const { page, size, search } = req.query;
    const condition = search ? { packageName: { [Op.iLike]: `%${search}%`}} : null;

    const { limit, offset } = getPagination(page, size);
    const data = await Package.findAndCountAll({ where: condition, limit, offset});

    const Packages = getPagingData(data, page, limit);
    return res.status(200).send(Packages);
})

//getby id
router.get('/:id', authorizedMiddleWare, async ({params: { id: PackageId } }, res) => {
    if(!PackageId) return res.status(400).send(errorHandler(400, 'Missing id param'));

    const singlePackage = await Package.findByPk(PackageId);
    if(singlePackage === null) return res.status(404).send(errorHandler(404, 'Package not found'));

    return res.status(200).send(successHandler(200, singlePackage.dataValues));

})

router.post('/', [authorizedMiddleWare, upload.single('image')], async(req, res) => {
    if (!req.file) return res.status(400).send(errorHandler(400, 'Package image is required'));

    const {error} = IsValid(req.body);
    if (error) return res.status(400).send(errorHandler(400, error.message));

    const packageExist = await Package.findOne({where: {packageName: { [Op.iLike]: req.body.packageName}}});
    if(packageExist){
        return res.status(400).send(errorHandler(400, `Package Name ${req.body.packageName} already exist`));
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
    
    try {
        const isPackageCreated = await Package.create(req.body);
        if(isPackageCreated) return res.status(201).send({status: 201, message: "Package successfully created"});
    } catch (error) {
        await deleteImage(req.body.imageUrl.match(/([^\/]+)(?=\.\w+$)/)[0]);   
    }

});

router.patch('/:id', [authorizedMiddleWare, upload.single('image')], async(req, res) => {
    if(!req.params.id) return res.status(400).send(errorHandler(400, 'Missing id param'));

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

    const updated = await Package.update(req.body, {where: { id: req.params.id }});
    if(updated == 1) {
        let item = await Package.findByPk(req.params.id);
        if(req.file && (item && item.dataValues)){
            //delete the previous image from cloud
           await deleteImage(item.dataValues.imageUrl.match(/([^\/]+)(?=\.\w+$)/)[0]);
        }
        return res.status(200).send(successHandler(200, "Package successfully updated"));
    }

    await deleteImage(req.body.imageUrl.match(/([^\/]+)(?=\.\w+$)/)[0]);
    
    return res.status(400).send(errorHandler(400, "Unable to update"));


})

router.delete('/:id', authorizedMiddleWare, async({params: { id: PackageId } }, res) => {
    if(!PackageId) return res.status(400).send(errorHandler(400, 'Missing id param'));

    const item = await Package.findByPk(PackageId);

    const deleted = await Package.destroy({where: {id: PackageId}});
    if(deleted == 1) {

        if(item && item.dataValues){
            //fs.unlinkSync(`./${item.dataValues.imageUrl}`);
            await deleteImage(item.dataValues.imageUrl.match(/([^\/]+)(?=\.\w+$)/)[0]);

        }

        return res.status(200).send(successHandler(200, "Package successfully deleted"));
    } 

    return res.status(400).send(errorHandler(400, "Unable to delete"));
});

module.exports = router;