const s3Client = require('../clients/s3Client');
const dynamoClient = require('../clients/dynamoClient');
const Tournament = require('../models/tournament');
const bracketService = require('./bracketService');

const CURRENT_NOMINATION_ID = 'CURRENT_NOMINATION';

module.exports = {
    nominationsOpen: nominationsOpen,
    createNomination: createNomination,
    approveCurrentNomination: approveCurrentNomination,
    randomizeNomination: randomizeNomination,
    withdrawNomination: withdrawNomination,
    getBacklog: getBacklog
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

    return dynamoClient.storeTourney(tourney).then(s3Client.uploadNomination).then(() => {
        return tourney;
    });
}

function approveCurrentNomination() {
    return dynamoClient.getTourneyById(CURRENT_NOMINATION_ID).then((tourney) => {

        tourney.approve();

        return dynamoClient.storeTourney(tourney).then(() => {
            return dynamoClient.deleteTourneyById(CURRENT_NOMINATION_ID);
        }).then(() => {
            console.log('here');
            return tourney;
        });
    });
}

function randomizeNomination() {
    return dynamoClient.getTourneyById(CURRENT_NOMINATION_ID).then((tourney) => {

        bracketService.shuffleTeams(tourney.teams);
        dynamoClient.storeTourney(tourney).then(s3Client.uploadNomination).then(() => {
            return tourney;
        });
    });
}

function withdrawNomination() {
    return dynamoClient.deleteTourneyById(CURRENT_NOMINATION_ID).then(() => {
        // upload a "nothing in progress" view to s3?
    });
}

function getBacklog() {
    return dynamoClient.getQueuedTournys((tournys) => {
        return tournys;
    });
}