const config = require('config');

module.exports = () => {
  if (!config.get('fm_key')) {
    throw new Error('FATAL ERROR: app secret is not defined.');
  }
}