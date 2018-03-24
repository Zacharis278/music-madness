const moment = require('moment');
const managerService = require('./managerService');
const { WebClient } = require('@slack/client');
const web = new WebClient(process.env.SLACK_TOKEN);

const nominateTemplate = require('../responseTemplates/nominate');
const newTournamentTemplate = require('../responseTemplates/newTournament');

// configure this later
const BRACKET_URL = 'http://mm-www.s3-website-us-east-1.amazonaws.com/';

const CHANNEL_ID = 'C9K08UKHB';

module.exports = {
    postQueue: postQueue,
    postNewTourney: postNewTourney,
    postNomination: postNomination,
    nominationsClosed: nominationsClosed,
    nominationApprove: nominationApprove,
    nominationShuffle: nominationShuffle,
    nominationVeto: nominationVeto,
    nominationVote: nominationVote,
    updateMessage: updateMessage,
    queueEmptyError: queueEmptyError
};

function postQueue() {
    return managerService.getBacklog().then((tournys) => {

        let message = `*Tournament Backlog*\n${tournys.length} items`;
        let discogMessage = "_Discographies_\n";

        if (tournys && tournys.length) {
            tournys.forEach((t) => discogMessage += `${t.artist}  • created by <@${t.user}>\n`);

            var attachments =  [
                {
                    "text": discogMessage,
                    "mrkdwn_in": ["text"]
                }
            ];
        }


        return web.chat.postMessage(CHANNEL_ID, message, {attachments: attachments});
    });
}

function postNewTourney(tourney) {
    let params = {
        name: tourney.name,
        tracks: tourney.bracket.totalEntries,
        days: tourney.bracket.runtimeDays,
        user: `<@${tourney.user}>`,
        link: BRACKET_URL
    };
    let response = interpolateJSON(newTournamentTemplate, params);

    return web.chat.postMessage(CHANNEL_ID, response.text, {attachments: response.attachments});
}

function queueEmptyError() {
    return web.chat.postMessage(CHANNEL_ID, 'Nothing is queue to post!  Add a new bracket with \'nominate\'');
}

function updateMessage(event, attachments) {
    return web.chat.update(event.message_ts, CHANNEL_ID, event.original_message.text, {attachments: attachments});
}

function postNomination(tourney) {
    let runtimeMsg = `${tourney.bracket.totalEntries} tracks over ${tourney.bracket.runtimeDays} days`;

    let params = {
        artist: tourney.artist,
        runtime: runtimeMsg,
        user: `<@${tourney.user}>`,
        link: BRACKET_URL,
        timestamp: tourney.getExpiry().unix(),
        dateFallback: tourney.getExpiry().toISOString()
    };
    let response = interpolateJSON(nominateTemplate, params);

    return web.chat.postMessage(CHANNEL_ID, response.text, {attachments: response.attachments});
}

function nominationApprove(event, tourney) {
    let runtimeMsg = `${tourney.bracket.totalEntries} tracks over ${tourney.bracket.runtimeDays} days`;
    let text = `New bracket has been added to the queue!\n*Artist* ${tourney.artist}\n*Added By* <@${tourney.user}>\n*Runtime* ${runtimeMsg}\n${BRACKET_URL}\n\n    _for queue details use \`/bot queue\`_`;
    return web.chat.postMessage(CHANNEL_ID, text).then(() => {
        return web.chat.update(event.message_ts, CHANNEL_ID, event.original_message.text, {attachments: []});
    })
}

function nominationShuffle(event) {
    let now = moment();
    let text = `_shuffled at ${now.format('HH:MM:SS')} by submitter_`;
    return web.chat.update(event.message_ts, CHANNEL_ID, event.original_message.text + '\n' + text);
}

function nominationVeto(event) {
    let text = `*nomination withdrawn by submitter*`;
    return web.chat.update(event.message_ts, CHANNEL_ID, event.original_message.text + '\n' + text, {attachments: []});
}

function nominationsClosed(userId) {
    let message = "Why don't you calm down and have a seat over there.\nThere's an active nomination, wait your goddamn turn";
    return web.chat.postEphemeral(CHANNEL_ID, message, userId).then(() => Promise.reject('Nominations Closed'));
}

function nominationVote(event, userId, vote, attachments) {
    let updatedExisting = false;
    let alreadyVoted = false;
    attachments.forEach((attachment, i) => {

        if (i < 1) return; // getting real hacky up in here

        // simple way to prevent double voting, eventually store votes in db
        if (attachment.text && attachment.text.includes(`<@${userId}>`)) {
            alreadyVoted = true;
        }

        if (attachment.callback_id === vote) {
            attachment.text += `,<@${userId}>`;
            updatedExisting = true;
        }
    });

    if (alreadyVoted) return Promise.resolve();

    if (!updatedExisting) {
        let newAttachment = {
            callback_id: vote,
            text: `votes to ${vote}: <@${userId}>`
        };
        attachments.push(newAttachment);
    }

    return web.chat.update(event.message_ts, CHANNEL_ID, event.original_message.text, {attachments: attachments});
}

// Private

function interpolateJSON(o, a) {
    let j = JSON.stringify(o);
    for (let k in a) {
        j = j.split('${'+k+'}').join(a[k]);
    }
    return JSON.parse(j);
}