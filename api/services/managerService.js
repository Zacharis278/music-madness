const s3Client = require('../clients/s3Client');
const dynamoClient = require('../clients/dynamoClient');
const Tournament = require('../models/tournament');
const Vote = require('../models/vote');
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
    nextMatchup: nextMatchup,
    voteMatchup: voteMatchup,
    completeMatchup: completeMatchup,
};

function nextMatchup() {
    return dynamoClient.getTourneysByStatus('active').then((tourneys) => {
        if (tourneys.length !== 1) {
            console.log('Womp womp only expected 1 active tournament got ' + tourneys.length);
        }
        let bracket = tourneys[0].bracket;
        let roundNo = bracket.currentRound > -1 ? bracket.currentRound : 0;
        let matchNo = bracket.currentMatchup;

        // skip bye rounds
        do {
            matchNo++;
            if (matchNo >= bracket.rounds[roundNo].length) {
                matchNo = 0;
                roundNo++;
            }

            team1 = bracket.rounds[roundNo][matchNo][0];
            team2 = bracket.rounds[roundNo][matchNo][1];

            if (!team2.name) { // Nope we need a win function in bracket service to figure this logic out
                bracketService.addWinner(bracket, roundNo, team1)
            }
        } while (!team2.name)

        bracket.currentRound = roundNo;
        bracket.currentMatchup = matchNo;

        return dynamoClient.storeTourney(tourneys[0]).then(() => {
            return {
                team1: team1.name,
                team2: team2.name,
                roundTeams: bracket.rounds[roundNo].length,
                match: matchNo
            }
        })
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

function voteMatchup(userId, vote) {
    vote = new Vote(userId, vote);
    return dynamoClient.addVote(vote).then(() => {
        return dynamoClient.getVotes();
    });
}

function completeMatchup() {

    return Promise.all([
        dynamoClient.getVotes(),
        dynamoClient.getTourneysByStatus('active')
    ]).then(([votes, tourneys]) => {
        if (tourneys.length !== 1) { // This is a dumb way to query this now
            console.log('Womp womp only expected 1 active tournament got ' + tourneys.length);
        }
        // cleanup this jank ass shit
        let tourney = new Tournament(tourneys[0]);
        let bracket = tourney.bracket;

        let matchup = bracket.rounds[bracket.currentRound][bracket.currentMatchup];
        matchup[0].votes = votes[0];
        matchup[1].votes = votes[1];

        let winner, loser;
        if (votes[0] > votes[1]) {
            winner = matchup[0];
            loser = matchup[1];
        } else {
            winner = matchup[1];
            loser = matchup[0];
        }
        let result = {
            winner: winner,
            loser: loser,
            match: bracket.currentMatchup,
            roundTeams: bracket.rounds[bracket.currentRound].length
        }

        bracketService.addWinner(bracket, bracket.currentRound, winner);
        s3Client.uploadNomination(tourney);
        dynamoClient.clearVotes();
        return dynamoClient.storeTourney(tourney);
    });
}
