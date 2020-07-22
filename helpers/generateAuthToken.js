const jwt = require('jsonwebtoken');
const config = require('config');

module.exports = ({id, email, fullName, isAdmin}) => {
    const token = jwt.sign({id, fullName, email, isAdmin}, config.get('fm_key'), {expiresIn: '24h'});
    return token;
}