const botService = require('./botService');
const managerService = require('./managerService');

module.exports = {
    update: update
};


function update() {

    // do we have results to report?

    // is there an active tourney?

    // start a new
    managerService.newTournament().then((tourney) => {
        botService.postNewTourney(tourney);
    });
}