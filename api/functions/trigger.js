const messageService = require('../services/messageService');
const managerService = require('../services/managerService');

exports.handler = function (event, context, callback) {

    if (event.name === 'RESULTS') {

    }
    else if (event.name === 'MATCHUP') {

        managerService.nextMatchup().then((matchup) => {

            return messageService.postMatchup(matchup);

        }).then(() => {
            callback();
        });

    }
    else if (event.name === 'BRACKETS') {

        managerService.newTournament().then((tourney) => {
            return messageService.postNewTourney(tourney);
        }, (err) => {
            if (err === 'ERR_EMPTY_QUEUE') {
                messageService.queueEmptyError();
                return Promise.resolve();
            }
        }).then(() => {
            callback()
        });
    }

    // do we have results to report?

    // is there an active tourney?

    // start a new

};