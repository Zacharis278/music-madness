const messageService = require('../services/messageService');
const managerService = require('../services/managerService');

exports.handler = function (event, context, callback) {

    // do we have results to report?

    // is there an active tourney?

    // start a new
    managerService.newTournament().then((tourney) => {
        return messageService.postNewTourney(tourney);
    }).then(() => {
        callback()
    });
};