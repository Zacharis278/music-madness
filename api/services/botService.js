const bracketService = require('./bracketService');
const managerService = require('./managerService');
const { WebClient } = require('@slack/client');
const web = new WebClient(process.env.SLACK_TOKEN);

const nominateTemplate = require('../responseTemplates/nominate');

// configure this later
const BRACKET_URL = 'http://mm-www.s3-website-us-east-1.amazonaws.com/';

const CHANNEL_ID = 'C9K08UKHB';

module.exports = {
    nominateArtist: nominateArtist
};

function nominateArtist(searchTerm, userId) {

    console.log('NominateArtist: ' + searchTerm);
    managerService.nominationsOpen()
    .then((nominationsOpen) => {
        console.log('Nominations: ' + nominationsOpen);
        if (!nominationsOpen) {

            let message = "Why don't you calm down and have a seat over there.\nThere's an active nomination, wait your goddamn turn";
            return web.chat.postEphemeral(CHANNEL_ID, message, userId).then(() => Promise.reject('Nominations Closed'));
        }
    })
    .then(() => {
        return bracketService.generateTeams(searchTerm)
    })
    .then((teams) => {
        return managerService.createNomination(userId, searchTerm, teams);
    })
    .then((tourney) => {

        let runtimeMsg = `${tourney.teams.length} matchups over ${bracketService.calculateRuntimeDays(tourney.teams.length)} days`;

        let params = {
            artist: searchTerm, //WRONG
            runtime: runtimeMsg,
            user: `<@${userId}>`,
            link: BRACKET_URL
        };
        let response = magic(nominateTemplate, params);

        return web.chat.postMessage(CHANNEL_ID, response.text, {attachments: response.attachments});
    }).catch((e) => {
        console.log('BotService Error: ' + JSON.stringify(e));
    });

}

function magic(o, a) {
    let j = JSON.stringify(o);
    for (let k in a) {
        j = j.split('${'+k+'}').join(a[k]);
    }
    return JSON.parse(j);
}