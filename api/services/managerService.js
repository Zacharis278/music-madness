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
    getBacklog: getBacklog,
    newTournament: newTournament,
    addVeto: addVeto,
    nextMatchup: nextMatchup
};

function nextMatchup() {
    return dynamoClient.getTourneysByStatus('active').then((tourneys) => {
        if (tourneys.length !== 1) {
            console.log('Womp womp only expected 1 active tournament got ' + tourneys.length);
        }
        let bracket = tourneys[0].bracket;
        let roundNo = bracket.currentRound > -1 ? bracket.currentRound : 0;
        let matchNo = bracket.currentMatchup;

        if (++matchNo > bracket.rounds[roundNo].length) {
            matchNo = 0;
            roundNo++;
        }

        return {
            team1: bracket.rounds[roundNo][matchNo][0].name,
            team2: bracket.rounds[roundNo][matchNo][1].name,
            roundTeams: bracket.rounds[roundNo].length,
            match: matchNo
        }
    });
}

function nominationsOpen() {

    return dynamoClient.getTourneyById(CURRENT_NOMINATION_ID).then((tourney) => {
        if (tourney) {
            return tourney.isNominationExpired();
        } else {
            return dynamoClient.deleteTourneyById(CURRENT_NOMINATION_ID).then(() => {
                return true;
            });
        }
    });
}

function createNomination(user, artist, bracket) {

    let tourney = new Tournament({
        id: CURRENT_NOMINATION_ID,
        user: user,
        artist: artist,
        bracket: bracket
    });

    return dynamoClient.storeTourney(tourney).then(s3Client.uploadNomination).then(() => {
        return tourney;
    });
}

function approveCurrentNomination() {

    let result;
    return dynamoClient.getTourneyById(CURRENT_NOMINATION_ID).then((tourney) => {

        tourney.approve();
        result = tourney;

        return dynamoClient.storeTourney(tourney).then(() => {
            return dynamoClient.deleteTourneyById(CURRENT_NOMINATION_ID);
        });
    }).then(() => {
        return result;
    });
}

function randomizeNomination() {
    return dynamoClient.getTourneyById(CURRENT_NOMINATION_ID).then((tourney) => {

        bracketService.shuffleTeams(tourney.bracket.rounds[0]);
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

function newTournament() {
    return dynamoClient.getQueuedTournys()
        .then((tournys) => { // pick random
            if (tournys.length < 1) {
                return Promise.reject('ERR_EMPTY_QUEUE');
            }
            let pick = Math.floor(Math.random() * Math.floor(tournys.length));
            return(tournys[pick].id);
        })
        .then(dynamoClient.getTourneyById)
        .then((tourney) => {
            tourney.generateName();
            tourney.setStatus('active');
            return dynamoClient.storeTourney(tourney)
                .then(s3Client.uploadNomination)
                .then(() => {
                    return tourney;
                });
        });
}

function addVeto(userId) {

    return dynamoClient.getTourneysByStatus('active').then((tourneys) => {
        if (tourneys.length !== 1) {
            console.log('Womp womp only expected 1 active tournament got ' + tourneys.length);
        }
        let tourney = tourneys[0];

        return dynamoClient.addVeto(tourney.id, userId).then((vetoes) => {

            if (vetoes.length > 5) {
                dynamoClient.deleteTourneyById(tourney.id).then(() => {
                    return; // TODO
                })
            } else {
                return vetoes;
            }
        });
    });
}
