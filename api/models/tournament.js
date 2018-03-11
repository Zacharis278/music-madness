const moment = require('moment');
const uuidv4 = require('uuid/v4');

const NOMINATION_EXPIRES_MINUTES = 5;

module.exports = class Tournament {

    constructor(obj) {
        this.id = obj.id || uuidv4();
        this.user = obj.user;
        this.artist = obj.artist;
        this.name = obj.name || obj.artist; // for now
        this.teams = obj.teams;
        this.created = obj.created || moment().toISOString()
    }

    isNominationExpired() {
        let now = moment();
        return now.isAfter(moment(this.created).add(NOMINATION_EXPIRES_MINUTES, 'minutes'));
    }
};