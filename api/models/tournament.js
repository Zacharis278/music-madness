const moment = require('moment');
const uuidv4 = require('uuid/v4');

const NOMINATION_EXPIRES_MINUTES = 5;

module.exports = class Tournament {

    constructor(obj) {
        this.id = obj.id || uuidv4();
        this.user = obj.user;
        this.artist = obj.artist;
        this.status = obj.status || 'nominated';
        this.name = obj.name || obj.artist; // for now
        this.bracket = obj.bracket;
        this.vetoes = this.vetoes || [];
        this.created = obj.created || moment().toISOString()
    }

    setStatus(status) {
        this.status = status; // who needs enums... (no really you should add that)
    }

    getExpiry() {
        return moment(this.created).add(NOMINATION_EXPIRES_MINUTES, 'minutes');
    }

    getTeamsList() {
        return this.bracket.rounds[0].map((teams) => {
            return [teams[0].name, teams[1].name];
        });
    }

    getScores() {
        return this.bracket.rounds.map((round) => {
            return round.map((matchup) => {
                return [matchup[0].votes, matchup[1].votes];
            });
        });
    }

    isNominationExpired() {
        let now = moment();
        return now.isAfter(this.getExpiry());
    }

    approve() {
        this.id = uuidv4();
        this.status = 'approved';
        this.vetoes = [];
    }

    generateName() {
        this.name = `The Arby's ${this.artist} Showdown`;
    }
};