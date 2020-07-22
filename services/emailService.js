const config = require('config');
const sgMail = require('@sendgrid/mail');
sgMail.setApiKey(config.get('sendgrid_key'));



module.exports = async function(params1, params2)  {
    const messages = [
        {
            to: params1.email,
            from: 'Farm-Funds Africa',
            subject: params1.subject,
            text: '',
            html: params1.body
        },
        {
            to: params2.email,
            from: 'Farm-Funds Africa',
            subject: params2.subject,
            text: '',
            html: params2.body 
        }
    ];
    return await sgMail.send(messages);
}