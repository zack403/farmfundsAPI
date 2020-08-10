const config = require('config');
const sgMail = require('@sendgrid/mail');
sgMail.setApiKey(config.get('sendgrid_key'));




module.exports = async function({mailContent1, mailContent2, attachment, fileName})  {
    const messages = [
        {
            to: mailContent1.email,
            from: 'info@farmfundsafrica.com',
            subject: mailContent1.subject,
            html: mailContent1.body
        },
        {
            to: mailContent2.email,
            from: 'info@farmfundsafrica.com',
            subject: mailContent2.subject,
            html: mailContent2.body,
            attachments: [
                {
                  content: attachment,
                  filename: fileName,
                  type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                  disposition: 'attachment',
                  contentId: fileName
                },
              ],
        }
    ];
    try {
        return await sgMail.send(messages);
    } catch (error) {
        console.log(error);
        return await sgMail.send(messages);
    }
}