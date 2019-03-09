// convert my to ES6 plz
var crypto = require('crypto');

module.exports = class Vote {
  constructor(user, vote) {
    this.id = crypto.createHash('md5').update(user).digest('hex');
    this.vote = vote;
  }
};