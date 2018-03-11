const moment = require('moment');
const bracketService = require('./bracketService');
const managerService = require('./managerService');
const { WebClient } = require('@slack/client');
const web = new WebClient(process.env.SLACK_TOKEN);

const nominateTemplate = require('../responseTemplates/nominate');

// configure this later
const BRACKET_URL = 'http://mm-www.s3-website-us-east-1.amazonaws.com/';

const CHANNEL_ID = 'C9K08UKHB';

module.exports = {
    nominateArtist: nominateArtist,
    handleNominationAction: handleNominationAction
};

function nominateArtist(searchTerm, userId) {

    console.log('NominateArtist: ' + searchTerm);
    return managerService.nominationsOpen()
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

function handleNominationAction(event) {

    let userId = event.user.id;
    let attachments = event.original_message.attachments;
    let vote = event.actions[0].value; // brittle.. but fuck it for now

    let submitter = event.original_message.text.match(/<@(\w*)>/)[1]; // janky but prevents DB call to get original submission

    if (userId === submitter) {

        if (vote === 'approve') {
            managerService.approveCurrentNomination().then((tourney) => {
                console.log('whats up');
                let runtimeMsg = `${tourney.teams.length} matchups over ${bracketService.calculateRuntimeDays(tourney.teams.length)} days`;
                let text = `New bracket has been added to the queue!\n*Artist* ${tourney.artist}\n*Added By* <@${tourney.user}>\n*Runtime* ${runtimeMsg}\n${BRACKET_URL}\n\n    _for queue details use \`/bot queue\`_`;
                return web.chat.postMessage(CHANNEL_ID, text).then(() => {
                    return web.chat.update(event.message_ts, CHANNEL_ID, event.original_message.text, {attachments: []});
                })
            });
        }
        else if (vote === 'shuffle') {
            managerService.randomizeNomination().then(() => {
                let now = moment();
                let text = `_shuffled at ${now.format('HH:MM:SS')} by submitter_`;
                return web.chat.update(event.message_ts, CHANNEL_ID, event.original_message.text + '\n' + text);
            });
        }
        else if (vote === 'veto') {
            managerService.withdrawNomination().then(() => {
                let text = `*nomination withdrawn by submitter*`;
                return web.chat.update(event.message_ts, CHANNEL_ID, event.original_message.text + '\n' + text, {attachments: []});
            });
        }

    } else {
        nominationVote(event, userId, vote, attachments);
    }
}


// Private

function nominationVote(event, userId, vote, attachments) {
    let updatedExisting = false;
    let alreadyVoted = false;
    attachments.forEach((attachment) => {

        // simple way to prevent double voting, eventually store votes in db
        if (attachment.text && attachment.text.includes(`<@${userId}>`)) {
            alreadyVoted = true;
        }

        if (attachment.callback_id === vote) {
            attachment.text += `,<@${userId}>`;
            updatedExisting = true;
        }
    });

    if (alreadyVoted) return new Promise.resolve();

    if (!updatedExisting) {
        let newAttachment = {
            callback_id: vote,
            text: `votes to ${vote}: <@${userId}>`
        };
        attachments.push(newAttachment);
    }

    return web.chat.update(event.message_ts, CHANNEL_ID, event.original_message.text, {attachments: attachments});
}

function magic(o, a) {
    let j = JSON.stringify(o);
    for (let k in a) {
        j = j.split('${'+k+'}').join(a[k]);
    }
    return JSON.parse(j);
}