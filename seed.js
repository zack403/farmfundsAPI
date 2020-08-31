const {User} = require('./models/users.model');
const { uuid } = require('uuidv4');
const bcrypt = require('bcrypt');



const user = {
    id: uuid(),
    firstName: 'System',
    lastName: 'Administrator',
    bankName: 'FarmFundsAfricaBank',
    acctNo: '176278287822898',
    email: 'info@farmfundsafrica.com',
    phoneNo: '+234-906-238-9766',
    password: '!pass4sure',
    confirmPassword: '!pass4sure',
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