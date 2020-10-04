const cron = require("node-cron");
const { Op } = require("sequelize");
const {Purchase} = require('../models/purchases.model');
const {Subscribers} = require('../models/subscribers.model');
const config = require('config');
const sgMail = require('@sendgrid/mail');
sgMail.setApiKey(config.get('sendgrid_key'));


let isDues = [];
let messages = [];
let msg = {};

const formatter = new Intl.NumberFormat('en-NI', {
    style: 'currency',
    currency: 'NGN',
    minimumFractionDigits: 2
})


module.exports = async function()  { 

    try {

        // background service to remind users to send their items once its due
        cron.schedule("0 4 * * *", async function() {
            
            isDues = [];
            messages = [];
            msg = {};

            let today = new Date();

            // first get all records in purchase table
            const purchases = await Purchase.findAll({where: {[Op.and]: [{ deliveredDate: {[Op.not]: null}}, {emailSent: {[Op.eq]: false}}]}});

            // iterate through the list get all purchases whose last deliveredDate has reach 2 weeks from today
            for (const item of purchases) {

                let deliveredDate = new Date(item.deliveredDate);
                deliveredDate = new Date(deliveredDate.setDate(deliveredDate.getDate() + 2 * 7));

                if(today >= deliveredDate) {
                    isDues.push(item);
                }
            }

            if(isDues.length > 0) {
                for (const isd of isDues) {

                    const subAmount = await Subscribers.findByPk(isd.SubscriberId);

                    msg.to = isd.email;
                    msg.from = 'info@farmfundsafrica.com';
                    msg.subject = `Reminder to send us your items for your ${formatter.format(subAmount.amount)} subscription`,
                    msg.html = `<p> Dear ${subAmount.name}, </p>
                        <p> Due to your busy schedule, this is a reminder email for you to send us your items for your <strong>${formatter.format(subAmount.amount)}</strong> subscription.</p>
                        <p> Please login to your dashboard and proceed to click on the Add Items button to send us your items for the new month.</p>
                        <p> Thank you for choosing <strong> Farm Funds Africa. </strong></p>`

                    messages.push(msg);

                }
            }
            
            try {
                if(messages.length > 0) {
                    const sent = await sgMail.send(messages);
                    if(sent) {
                        for (const e of isDues) {
                            await Purchase.update({emailSent: true}, {where: {id: e.id}})
                        }
                    }
                }


            } catch (error) {
                console.log(`error while sending reminder - ${error}`);
            }

        });
        
    } catch (error) {
        console.log(`error while running background task - ${error} `); 
    }
  
}