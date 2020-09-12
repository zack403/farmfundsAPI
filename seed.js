const {User} = require('./models/users.model');
const { uuid } = require('uuidv4');
const bcrypt = require('bcrypt');
const config = require('config');



const user = {
    id: uuid(),
    firstName: 'System',
    lastName: 'Administrator',
    bankName: 'FarmFundsAfricaBank',
    acctNo: '176278287822898',
    email: config.get('adminEmail'),
    phoneNo: '+234-906-238-9766',
    password: config.get('adminPassword'),
    confirmPassword: config.get('adminPassword'),
    isAdmin: true,
}

const seed = async () => {
  const isExist = await User.findOne({where: {email: user.email}});
  if(isExist != null) return;
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(user.password, salt);

  user.password = hashedPassword;
  user.confirmPassword = hashedPassword;

  return await User.create(user);
}

module.exports.seed = seed;