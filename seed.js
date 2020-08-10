const {User} = require('./models/users.model');
const { uuid } = require('uuidv4');


const user = {
    id: uuid(),
    firstName: 'Farmfunds',
    lastName: 'Africa',
    bankName: 'FarmFundsAfricaBank',
    acctNo: '176278287822898',
    email: 'info@farmfundsafrica.com',
    phoneNo: '+234-906-238-9766',
    password: '!Pass4sure',
    confirmPassword: '!Pass4sure',
    isAdmin: true,

}

 module.exports = async function() {
    return await User.create(user);
 }