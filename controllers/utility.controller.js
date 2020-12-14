const express = require('express');
const router = express.Router();
const Joi = require('@hapi/joi');
const errorHandler = require('../helpers/errorHandler');
const config = require('config');
const sgMail = require('@sendgrid/mail');
sgMail.setApiKey(config.get('sendgrid_key'));
const upload = require('../middlewares/upload');
const authorizedMiddleWare = require('../middlewares/auth');
const {Subscribers, IsValid} = require('../models/subscribers.model');
const fs = require("fs");
const isAdmin = require('../middlewares/admin');
const getPagination = require('../helpers/getPagination');
const getPagingData = require('../helpers/getPagingData');
const successHandler = require('../helpers/successHandler');
const {  Op } = require("sequelize");
const imageUpload = require('../helpers/imageUpload');
const deleteImage = require('../helpers/deleteImage');
const readXlsxFile = require("read-excel-file/node");
const excelUpload = require("../middlewares/excelformat");
const { uuid } = require('uuidv4');
const {User} = require('../models/users.model');
const {Investment} = require('../models/investments.model');
const bcrypt = require('bcrypt');
const dateRangeFilter = require('../helpers/dateRangeFilter');
const {Notification} = require('../models/notifications.model');



const formatter = new Intl.NumberFormat('en-NI', {
    style: 'currency',
    currency: 'NGN',
    minimumFractionDigits: 2
})

let messages = [];
let msg = {};
let errors = [];


//contactus
router.post('/contactus', async (req, res) => {
    const {error} = ValidateContactUs(req.body);
    if (error) return res.status(400).send(errorHandler(400, error.message));

    const msg = {
            to: 'malik.ohida@netopconsult.com',
            from: req.body.email,
            subject: req.body.subject,
            text: req.body.message
        }

    const result = await sgMail.send(msg);
    if(result){
        res.status(200).send({status: 200, message: "We got your message, we will get back to you shortly!"});
    }
    else {
        res.status(500).send({status: 500, message: "Something failed, error while sending your message, please try again."});
    }
})

//feedback
router.post('/feedback', authorizedMiddleWare, async (req, res) => {
    const {error} = ValidateFeedback(req.body);
    if (error) return res.status(400).send(errorHandler(400, error.message));

    const {email, fullName} = req.user;

    const msg = {
            to: 'aminuzack7@gmail.com',
            from: email,
            subject: `Feedback from ${fullName}`,
            html: `<strong> Feedback Type: </strong><p>${req.body.feedbackType}</p>
            <strong> Feedback Description: </strong><p>${req.body.description}</p>`,
        }

    const result = await sgMail.send(msg);

    if(result){
        res.status(200).send({status: 200, message: "Thank you for sending us your feedback, we will act promptly!"});
    }
    else {
        res.status(500).send({status: 500, message: "Something failed, error while submitting your feedback, please try again."});
    }

})

//get all
router.get('/getsubscribers', authorizedMiddleWare, async (req, res) => {
    const { page, size, search } = req.query;
    const condition = search ? { [Op.or]: [
                                    { name: { [Op.iLike]: `%${search}%` } },
                                    { phoneNo: { [Op.iLike]: `%${search}%` } },
                                    { status: { [Op.iLike]: `%${search}%` } }
                                ]} : null;

    const { limit, offset } = getPagination(page, size);
    const data = await Subscribers.findAndCountAll({ where: condition, limit, offset, order: [['createdAt', 'DESC']]});

    const subscribers = getPagingData(data, page, limit);
    return res.status(200).send(subscribers);
});

router.put('/activatesubscriber/:id', [authorizedMiddleWare, isAdmin], async(req, res) => {
    if(!req.params.id) return res.status(400).send(errorHandler(400, 'Missing id param'));

    const item = await Subscribers.findOne({where: {id: req.params.id}});
    if(item != null){
        const start = new Date().getTime();
        const end = new Date(start + (364*24*60*60*1000))
        const updated = await item.update({status: "Activated", startDate: start, endDate: end});
        if(updated) {
                 //send email about the proof of payment
                 const mailContent =  {
                    to: item.email,
                    from: 'info@farmfundsafrica.com',
                    subject: `Confirmation of subscription`,
                    html: `<p> Hi there, </p>
                        <p> Your proof of payment has been confirmed and your subscription activated. </p>
                        <p> Please log in to your account and proceed to send us your items. </p>`
                }
        
                try {
                    await sgMail.send(mailContent);
                } catch (error) {
                    await sgMail.send(mailContent);
                }
            
            await deleteImage(item.proofOfPayment.match(/([^\/]+)(?=\.\w+$)/)[0]);
            //fs.unlinkSync(`./${item.proofOfPayment}`);
            return res.status(200).send(successHandler(200, "Successfully activated"));
            
        }
        return res.status(400).send(errorHandler(400, "Unable to update"));
    }
    return res.status(400).send(errorHandler(404, "Not found"));

});

router.delete('/deletesubscriber/:id', [authorizedMiddleWare, isAdmin], async({params: { id: subscriberId } }, res) => {
    if(!subscriberId) return res.status(400).send(errorHandler(400, 'Missing id param'));

    const item = await Subscribers.findOne({where: {id: subscriberId}});

    if(item != null && item.status === 'Activated') {
        return res.status(400).send(errorHandler(400, "Bad request"));
    }
    else {
        const deleted = await Subscribers.destroy({where: {id: subscriberId}});
        if(deleted == 1) {
            await deleteImage(item.proofOfPayment.match(/([^\/]+)(?=\.\w+$)/)[0]);
            return res.status(200).send(successHandler(200, "Successfully deleted"));
        } 
    
        return res.status(400).send(errorHandler(400, "Unable to delete"));
    }
});

router.post('/proofofpayment', [authorizedMiddleWare, upload.single('proofofpayment')], async (req, res) => {
    const {error} = IsValid(req.body);
    if (error) return res.status(400).send(errorHandler(400, error.message));

    if(req.body.paymentType === 'Transfer') {

        if (!req.file) return res.status(400).send(errorHandler(400, 'Proof of payment is required'));
        try {
            const result = await imageUpload(req.file.path);
            if(result) {
                req.body.proofOfPayment  = result.secure_url;
            }
            else {
                return res.status(500).send(errorHandler(500, "Error while trying to upload your image, try again..."));
            }
            
        } catch (error) {
            return res.status(500).send(errorHandler(500, `Internal Server Error - ${error.message}`));
        }
    }

    if(req.body.paymentType === 'Card') {
        req.body.status = 'Activated';
        req.body.startDate = new Date().getTime();
        req.body.endDate = new Date(req.body.startDate + (364*24*60*60*1000));
    }

    req.body.amount = req.body.unit * 100000;
    req.body.roc = (req.body.amount * 70) / 100;
    req.body.roi = (req.body.amount * 60) / 100;

    const created = await Subscribers.create(req.body);
    if(created) {
        if(req.body.paymentType === 'Transfer') {
            // const pathToAttachment = req.body.proofOfPayment;
            const fileName = `${req.body.name}_proofofpayment.jpg`;
            const attachment = fs.readFileSync(req.file.path, {encoding: 'base64'});
            // const attachment = pathToAttachment.toString("base64");
    
            

                //send email about the proof of payment
        const messages = [
             {
                to: 'malik.ohida@netopconsult.com',
                from: 'info@farmfundsafrica.com',
                subject: `Farmify Market Proof of payment from ${req.body.name}`,
                html: `<p> Hi there, </p>
                    <p> ${req.body.name} uploaded a proof of payment for their subscription. </p>
                    <p> Attached is the proof of payment. </p>`,
                attachments: [
                        {
                            content: attachment,
                            filename: fileName,
                            type: 'image/jpg',
                            disposition: 'attachment',
                            contentId: fileName
                        },
                    ],
                }
                // {
                //     to: req.body.email,
                //     from: 'info@farmfundsafrica.com',
                //     subject: `Proof of payment recieved`,
                //     html: `<p> Hi ${req.body.name}, </p>
                //         <p> We recieve your proof of payment. </p>
                //         <p> You will be notified when your subscription has been confirmed and activated. </p>`
                //         `<b> Thank you for choosing Farm Funds Africa. </b>`

                // }
            ]
    
            try {
                await sgMail.send(messages);
            } catch (error) {
                //await sgMail.send(messages);
            }
        }
        return res.status(200).send({status: 200, message: created.dataValues.id});
    } 

    await deleteImage(req.body.proofOfPayment.match(/([^\/]+)(?=\.\w+$)/)[0]);


});

router.post('/migration', excelUpload.single("file"), async (req, res) => {

    messages = [];
    msg = {};
    errors = []

    try {
        if (!req.file) {
          return res.status(400).send(errorHandler(400, "Please upload an excel file!"));
        }
    
        let path = "./CustomerOrderExcel/" + req.file.filename;
    
        readXlsxFile(path).then( async (rows) => {
          // skip header
          rows.shift();
    
          if(req.body.migrationType === 'customers') {

            let existingUsers = [];

            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash(config.get('userPassword'), salt);
    
            rows.forEach((row) => {
              let user = {
                id: uuid(),
                firstName: row[0],
                lastName: row[1],
                middleName: row[2],
                bankName: row[3],
                acctNo: row[4],
                email: row[5],
                phoneNo: row[6],
                password: hashedPassword,
                confirmPassword: hashedPassword,
                isAdmin: false,
                isMigrated: true
              };
      
              existingUsers.push(user);
              
              //construct a welcome email
              msg.to = row[5];
              msg.from = 'info@farmfundsafrica.com';
              msg.subject = `Welcome to the new Farmfunds Africa platform`,
              msg.html = `<p> Dear <strong>${row[0]} ${row[1]}</strong>, welcome aboard! </p>
                  <p> In order to get started, you will need to login first and change your default password.</p>
                  <p> your default password is <strong>'password'</strong>. </p>
                  <p> Please login to your account and proceed to change your password before doing anything else.</p>
                  <p> Click on the following link to login:\n\n
                   http://localhost:4200/login</p>
                  <p> Thank you for choosing <strong> Farm Funds Africa. </strong></p>`

              messages.push(msg);
              msg = {};

            });
      
            try {
                const created = await User.bulkCreate(existingUsers);
                if(created) {
                    await sgMail.send(messages);
                    res.status(200).send({
                        message: "Uploaded the file successfully: " + req.file.originalname,
                    });
                }
                    
            } catch (error) {
                res.status(500).send(errorHandler(500, `Fail to import data into database!- ${error.message}`));
            }
           
          } else {
            let existingInvs = [];
    

            for (const [i, row] of rows.entries()) {
                const result = await User.findOne({attributes: [ 'id'
                    ], where: {email: row[8]}});

                if(!result || !result.id) {
                    errors.push(`Please make sure the investment at line number ${i + 1} with name "${row[0]}" and amount "${row[1]}" belongs to a valid "Customer" by making sure the email "${row[8]}" on the excel matches the system customer email.`);
                    continue;
                }

                let investment = {
                    id: uuid(),
                    package: row[0],
                    amount: row[1],
                    roi: row[2],
                    investor: row[3],
                    unit: row[4],
                    startDate: new Date(row[5]),
                    endDate: new Date(row[6]),
                    status: row[7],
                    email: row[8],
                    UserId: result.id,
                    paymentType: 'Transfer',
                    packageId: uuid()
                };
        
                existingInvs.push(investment);
            }
      
            try {
                const created = await Investment.bulkCreate(existingInvs);
                if(created) {
                    res.status(200).send({
                        message: "Uploaded the file successfully: " + req.file.originalname,
                        errors: errors.length > 0 ? errors : []
                    });
                }
            } catch (error) {
                res.status(500).send(errorHandler(500, `Fail to import data into database!- ${error.message}`));
            }   
        }
        });
      } catch (error) {
        console.log(error);
        res.status(500).send(errorHandler(500, "Could not upload the file: " + req.file.originalnam));
      }
})


router.get('/deposits', authorizedMiddleWare, async (req, res) => {
    const {id, dateRange} = req.query;
    if(!id) return res.status(400).send(errorHandler(400, 'Missing id param'));

    if(!dateRange) return res.status(400).send(errorHandler(400, 'Missing dateRange query'));
    
    const filter = dateRangeFilter(dateRange, 'Activated', 'amount');


    const isExist = await User.findOne({where: {id: id}, attributes: ['id'], order: [['createdAt', 'DESC']],
                include: [
                    {
                        model: Investment,
                        where: filter,
                        attributes: [
                            'amount',
                            'package',
                            'startDate'
                        ], 
                        separate: true,
                        order: [['createdAt', 'DESC']],
                        required: false
                    },
                    {
                        model: Subscribers,
                        where: filter,
                        attributes: [
                            'amount',
                            ['name', 'package'],
                            'startDate'
                        ],
                        separate: true,
                        order: [['createdAt', 'DESC']],
                        required: false,
                    }
                ]
            });

    if(isExist === null) return res.status(404).send(errorHandler(404, 'User not found'));

    res.json(isExist);


});

router.get('/withdrawals', authorizedMiddleWare, async (req, res) => {
    const {id, dateRange} = req.query;
    if(!id) return res.status(400).send(errorHandler(400, 'Missing id param'));

    if(!dateRange) return res.status(400).send(errorHandler(400, 'Missing dateRange query'));
    
    const filter = dateRangeFilter(dateRange, 'Activated', 'amount');
    

    const result = await User.findOne({where: {id: id}, attributes: ['id'], order: [['createdAt', 'DESC']],
                 include: [
                     {
                         model: Investment,
                         where: filter,
                         attributes: [
                             'id',
                             ['roi', 'amount'],
                             'package',
                             'endDate'
                         ], 
                         separate: true,
                         order: [['createdAt', 'DESC']],
                         required: false
                     },
                     {
                         model: Subscribers,
                         where: filter,
                         attributes: [
                             'id',
                             ['roc', 'amount'],
                             ['name', 'package'],
                             'endDate'
                         ],
                         separate: true,
                         order: [['createdAt', 'DESC']],
                         required: false,
                     }
                 ],
             });

        res.json(result);
});


router.post('/request', authorizedMiddleWare, async (req, res) => {
    if(!req.body || !req.body.id || !req.body.userId) return res.status(400).send(errorHandler(400, 'Bad request'));
    req.body.endDate = new Date(req.body.endDate);
    let isInvsExist;

    const {id, userId, package, endDate, amount} = req.body;

    if(package.includes('Food Bank')) {
        const isSubExist = await Subscribers.findByPk(id);
        if(isSubExist === null) return res.status(404).send(errorHandler(404, 'Invalid request'));
    } else {
        isInvsExist = await Investment.findByPk(id);
        if(isInvsExist === null) return res.status(404).send(errorHandler(404, 'Invalid request'));
    }

    let currentDate = new Date();
    if(currentDate < endDate) {
        let diffInTime = endDate.getTime() - currentDate.getTime();
        let waitTime = diffInTime / (1000 * 3600 * 24);
        return res.status(400).send(errorHandler(400, `You cannot request for a withdrawal at this time. Due date is "${waitTime.toFixed(0)} days" from now.`));
    }


    //process user withdrawal request here
    const {fullName} = req.user;
    if(!fullName) return res.status(401).send(errorHandler(404, 'Unauthorized'));

    const msg =  {
        to: 'info@farmfundsafrica.com',
        from: `${email}`,
        subject: `Withdrawal request from ${req.body.name}`,
        html: `<p> Hi there, </p>
            <p> ${fullName} has requested for the withdrawal of ${formatter.format(amount)} from his/her ${package} ${isInvsExist ? 'Investment' : ''}.</p>
            <p> Login to your admin app and confirm if payment is due for the customer. </p>`
        }

    const request = {
        userId,
        serviceId: id,
        message: `Hi there, customer ${fullName} has requested for the withdrawal of ${formatter.format(amount)} from his/her ${package} ${isInvsExist ? 'Investment' : ''}. Please respond asap.`
    }

    const created = await Notification.create(request);
    if(created) {
        try {
            await sgMail.send(msg);
        } catch (error) {
            //await sgMail.send(messages);
        }
        return res.status(200).send(successHandler(200, "Withdrawwal request successful, we will get back to you."));

    } else {
        return res.status(500).send(errorHandler(500, "Sorry, we are unable to process your request at this time, try again."));

    }

});

router.get('/notifications/:id', authorizedMiddleWare, async (req, res) => {
    if(!req.params.id) {
        return res.status(400).send(errorHandler(400, 'Missing id param'));
    }

    const hasNotification = await Notification.findAll({where: {userId: req.params.id}});
    if(hasNotification === null) {
        return res.status(404).send(errorHandler(404, 'Not found'));
    }


    return res.status(200).send(successHandler(200, hasNotification));

})


const ValidateContactUs = req => {
    const schema = Joi.object({
      name: Joi.string().required(),
      email : Joi.string().required().email({ minDomainSegments: 2, tlds: { allow: ['com', 'net'] } }),
      message: Joi.string().required()
  })
  return schema.validate(req);
}

const ValidateFeedback = req => {
    const schema = Joi.object({
      feedbackType: Joi.string().required(),
      description: Joi.string().required()
  })
  return schema.validate(req);
}



module.exports = router;