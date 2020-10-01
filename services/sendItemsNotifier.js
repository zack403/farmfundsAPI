const cron = require("node-cron");
const { Op } = require("sequelize");
const {Purchase} = require('../models/purchases.model');
const {Subscribers} = require('../models/subscribers.model');
const config = require('config');
const sgMail = require('@sendgrid/mail');
sgMail.setApiKey(config.get('sendgrid_key'));


const isDues = [];
const messages = [];
const msg = {};


module.exports = async function()  { 

    try {

        // background services to remind users to send their items once its due
        cron.schedule("*/5 * * * *", async function() {
            
            let today = new Date();

            // first get all records in purchase table
            const purchases = await Purchase.findAll({where: {[Op.and]: [{ deliveredDate: {[Op.not]: null}}, {emailSent: {[Op.eq]: false}}]}});

            // iterate through the list get all purchases whose last deliveredDate has reach 2 weeks from today
            for (const item of purchases) {

                item.deliveredDate = new Date(item.deliveredDate.setDate(item.deliveredDate.getDate() + 2 * 7));

                if(today >= item.deliveredDate) {
                    isDues.push(item);
                }
            }

            if(isDues.length > 0) {
                for (const isd of isDues) {

                    const subAmount = await Subscribers.findByPk(isd.SubscriberId);

                    msg.to = isd.email;
                    msg.from = 'info@farmfundsafrica.com';
                    msg.subject = `Reminder to send us your items for your ${subAmount.amount} subscription`,
                    msg.html = `<p> Hi there, </p>
                        <p> This email is to remind you to send us your items for your ${subAmount.amount} subscription </p>`

                    messages.push(msg);
                }
            }
            
            try {
                if(messages.length > 0) {
                    await sgMail.send(messages);
                    for (const e of isDues) {
                        e.emailSent = true;
                    }

                    await Purchase.bulkCreate(isDues, {updateOnDuplicate: ["id"]})
                }

                isDues = [];
                messages = [];
                msg = {};
                
            } catch (error) {
                console.log(`error while sending reminder - ${error}`);
            }

        });
        
    } catch (error) {
        console.log(`error while running background task - ${error} `)
    }
  
}