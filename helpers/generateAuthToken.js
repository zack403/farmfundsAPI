const jwt = require('jsonwebtoken');
const config = require('config');

module.exports = ({id, email, firstName, isAdmin}) => {
    const token = jwt.sign({id, firstName, email, isAdmin}, config.get('fm_key'), {expiresIn: '24h'});
    return token;
}