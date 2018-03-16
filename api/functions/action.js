const qs = require('querystring');
const messageService = require('../services/messageService');
const managerService = require('../services/managerService');

exports.handler = function (event, context, callback) {

    let slackEvent = qs.parse(event.body);
    let interactiveEvent = JSON.parse(slackEvent.payload);
    console.log(interactiveEvent);

    handleNominationAction(interactiveEvent);
};

function handleNominationAction(event) {
    let userId = event.user.id;
    let attachments = event.original_message.attachments;
    let vote = event.actions[0].value; // brittle.. but fuck it for now

    let submitter = event.original_message.text.match(/<@(\w*)>/)[1]; // janky but prevents DB call to get original submission

    event.original_message.text = event.original_message.text.replace('/>', ''); // remove slack's url escape
    event.original_message.text = event.original_message.text.replace('<http', 'http');

    if (userId === submitter) {

        if (vote === 'approve') {
            managerService.approveCurrentNomination().then((tourney) => {
                messageService.nominationApprove(event, tourney);
            });
        }
        else if (vote === 'shuffle') {
            managerService.randomizeNomination().then(() => {
                messageService.nominationShuffle(event);
            });
        }
        else if (vote === 'veto') {
            managerService.withdrawNomination().then(() => {
                messageService.nominationVeto(event);
            });
        }

    } else {
        messageService.nominationVote(event, userId, vote, attachments);
    }
}