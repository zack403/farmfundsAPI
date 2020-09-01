const express = require('express');
const router = express.Router();
const authorizedMiddleWare = require('../middlewares/auth');
const {Purchase, IsValid} = require('../models/purchases.model');
const {PurchaseDetail} = require('../models/purchaseDetails.model');
const errorHandler = require('../helpers/errorHandler');
const successHandler = require('../helpers/successHandler');
const getPagination = require('../helpers/getPagination');
const getPagingData = require('../helpers/getPagingData');
const { Op } = require("sequelize");
const sendMail = require('../services/emailService');
const { uuid } = require('uuidv4');
const Excel = require('exceljs');
const fs = require("fs");
const isAdmin = require('../middlewares/admin');
const { Subscribers } = require('../models/subscribers.model');




let itemToSave = [];
let item = {};


//get all
router.get('/', authorizedMiddleWare, async (req, res) => {
    const { page, size, search } = req.query;
    const condition = search ? { [Op.or]: [
                                    { name: { [Op.iLike]: `%${search}%` } },
                                    { email: { [Op.iLike]: `%${search}%` } },
                                    { status: { [Op.iLike]: `%${search}%` } }
                                ]} : null;

    const { limit, offset } = getPagination(page, size);
    const data = await Purchase.findAndCountAll({ where: condition, limit, offset, include: PurchaseDetail, distinct: true, order: [['createdAt', 'DESC']]});

    const purchases = getPagingData(data, page, limit);
    return res.status(200).send(purchases);
});

//getby id
router.get('/:id', authorizedMiddleWare, async (req, res) => {
    if(!req.params.id) return res.status(400).send(errorHandler(400, 'Missing id param'));

    const result = await Purchase.findByPk(req.params.id, {include: PurchaseDetail});
    if(result === null) return res.status(404).send(errorHandler(404, 'not found'));

    return res.status(200).send(successHandler(200, result.dataValues));

})

router.post('/', authorizedMiddleWare, async(req, res) => {
    itemToSave = [];
    const {error} = IsValid(req.body);
    if (error) return res.status(400).send(errorHandler(400, error.message));

    req.body.id = uuid();

    try {
        for (const details of req.body.purchaseDetails) {
            item.PurchaseId = req.body.id;
            item.productName = details.productName;
            item.price = details.price;
            item.unit = details.unit;
            item.brand = details.brand;
            item.productId = details.productId;
            itemToSave.push(item);
            item = {};
        }
        
        const isCreated = await Purchase.create(req.body);
        const detailAdded = await PurchaseDetail.bulkCreate(itemToSave);
    
        const workbook = new Excel.Workbook();
    
        const worksheet = workbook.addWorksheet('Customer Order Data');
    
        let row = 0;
    
        worksheet.getCell(row + 2, 1).value = "Customer Info";
    
        //parent items
        worksheet.getCell(row + 3, 1).value = "Name";
        worksheet.getCell(row + 3, 1).font = {bold: true};
        worksheet.getCell(row + 3, 2).value = req.body.name;
    
        worksheet.getCell(row + 4, 1).value = "Phone No";
        worksheet.getCell(row + 4, 1).font = {bold: true};
        worksheet.getCell(row + 4, 2).value = req.body.phoneNo;
    
        worksheet.getCell(row + 5, 1).value = "Address";
        worksheet.getCell(row + 5, 1).font = {bold: true};
        worksheet.getCell(row + 5, 2).value = req.body.address;
    
        worksheet.getCell(row + 6, 1).value = "Email";
        worksheet.getCell(row + 6, 1).font = {bold: true};
        worksheet.getCell(row + 6, 2).value = req.body.email;
    
        worksheet.getCell(row + 7, 1).value = "Note";
        worksheet.getCell(row + 7, 1).font = {bold: true};
        worksheet.getCell(row + 7, 2).value = req.body.note;
    
        worksheet.getCell(row + 9, 1).value = "Customer Orders";
    
        //child items
        worksheet.getCell(row + 10, 1).value = "Product";
        worksheet.getCell(row + 10, 2).value = "Price";
        worksheet.getCell(row + 10, 3).value = "Quantity";
        worksheet.getCell(row + 10, 4).value = "Brand";
    
        worksheet.getRow(10).font = {bold: true};
    
        for(const item of req.body.purchaseDetails){
            worksheet.getCell(row + 11, 1).value = item.productName;
            worksheet.getCell(row + 11, 2).value = `NGN ${item.price}`;
            worksheet.getCell(row + 11, 3).value = item.unit;
            worksheet.getCell(row + 11, 4).value = item.brand;
            row++;
        }
        
    
        worksheet.getCell(row + 12, 1).value = "Total";
        worksheet.getCell(row + 12, 1).font = {bold: true};
        worksheet.getCell(row + 12, 2).value = `NGN ${req.body.cartTotal}`;
        
        
    
    
        worksheet.views = [
            { state: 'frozen', xSplit: 0, ySplit: 1, activeCell: 'B2' }
        ]
          
    
          const pathToAttachment = `./CustomerOrderExcel/Customer_Orders_${Date.now()}.xlsx`;
          const fileName = `${req.body.name}_Order.xlsx`;
    
          await workbook.xlsx.writeFile(pathToAttachment);
    
          const attachment = fs.readFileSync(pathToAttachment).toString("base64");
    
        //send email about this purchase
        const mailContent1 = {
            email: req.body.email ? req.body.email : req.user.email,
            subject: `Purchase Order Notification Email`,
            body: 
                `<p> Hi ${req.user.fullName}, </p>
                <p> Your purchase was successful. </p>
                 <p> We have your address, and we are working on delivering to you right away. </p>
                 <b>Thank you for choosing Farm Funds Africa. </b>`
        }
    
        const mailContent2 = {
            email: 'aminuzack7@gmail.com',
            subject: `Purchase Order Notification Email`,
            body: 
                `<p> Hi there, </p>
                 <p> This is to inform you that ${req.user.fullName} have successfully made purchase for some of your products. </p>
                 <p> Find in the excel sheet below the details of the purchase. </p>`
        }
    
        const parameters = {
            mailContent1,
            mailContent2,
            attachment,
            fileName
        };
        const result = await sendMail(parameters);
        if(isCreated && detailAdded && result) return res.status(201).send({status: 201, message: "Order successfully sent for processing."});    
    } catch (error) {
        return res.status(500).send({status: 500, error: 'Error while processing your request, please try again.'});
    }
    
});

router.put('/markasdelivered/:id', [authorizedMiddleWare, isAdmin], async(req, res) => {
    if(!req.params.id) return res.status(400).send(errorHandler(400, 'Missing id param'));

    const item = await Purchase.findOne({where: {id: req.params.id}})
    if(item != null){
        const updated = await item.update({status: "Delivered", deliveredDate: new Date()});
        if(updated)
        {
            const sub = await Subscribers.findOne({where: {UserId: item.UserId}, order: [['createdAt', 'DESC']]});
            if(sub != null) {
                let r = (sub.amount * 5) / 100;
                r = sub.roi - r;
                await sub.update({roi: r});
            }
            return res.status(200).send(successHandler(200, "Successfully marked as delivered"));
        } 
        return res.status(400).send(errorHandler(400, "Unable to update"));
    }
    return res.status(400).send(errorHandler(404, "Not found"));

});

router.patch('/:id', authorizedMiddleWare, async(req, res) => {
    if(!req.params.id) return res.status(400).send(errorHandler(400, 'Missing id param'));

    const itemToUpdate = await Purchase.findOne({where: {id: req.params.id}, include: PurchaseDetail});

    if(itemToUpdate != null) {
        try {
            for(const details of req.body.PurchaseDetails) {
                await PurchaseDetail.update(details, {where: {id: details.id}});
            }
            return res.status(200).send(successHandler(200, "Successfully updated"));
        } catch (error) {
            return res.status(400).send(errorHandler(400, "Unable to update"));        
        }        
    };
    return res.status(400).send(errorHandler(404, "Not found"));
})

router.delete('/:id', [authorizedMiddleWare, isAdmin], async({params: { id: purchaseId } }, res) => {
    if(!purchaseId) return res.status(400).send(errorHandler(400, 'Missing id param'));

    const deleted = await Purchase.destroy({where: {id: purchaseId}});
    if(deleted == 1) return res.status(200).send(successHandler(200, "Successfully deleted"));

    return res.status(400).send(errorHandler(400, "Unable to delete"));


});

module.exports = router;