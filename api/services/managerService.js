const s3Client = require('../clients/s3Client');
const dynamoClient = require('../clients/dynamoClient');
const Tournament = require('../models/tournament');

const CURRENT_NOMINATION_ID = 'CURRENT_NOMINATION';

module.exports = {
    nominationsOpen: nominationsOpen,
    createNomination: createNomination
};

function nominationsOpen() {

    return dynamoClient.getTourneyById(CURRENT_NOMINATION_ID).then((tourney) => {
        if (tourney) {
            return tourney.isNominationExpired();
        } else {
            return true;
        }
    });
}

function createNomination(user, artist, teams) {

    let tourney = new Tournament({
        id: CURRENT_NOMINATION_ID,
        user: user,
        artist: artist,
        teams: teams
    });

    return dynamoClient.storeTourney(tourney).then(s3Client.uploadNomination);

}