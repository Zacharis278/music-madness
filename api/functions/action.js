const qs = require('querystring');
const messageService = require('../services/messageService');
const managerService = require('../services/managerService');

exports.handler = function (event, context, callback) {

    let slackEvent = qs.parse(event.body);
    let interactiveEvent = JSON.parse(slackEvent.payload);
    console.log(interactiveEvent);

    let userId = interactiveEvent.user.id;
    let attachments = interactiveEvent.original_message.attachments;
    let action = interactiveEvent.actions[0].value; // brittle.. but fuck it for now

    console.log('attachments');
    console.log(JSON.stringify(attachments));

    interactiveEvent.original_message.text = interactiveEvent.original_message.text.replace('/>', ''); // remove slack's url escape
    interactiveEvent.original_message.text = interactiveEvent.original_message.text.replace('<http', 'http');

    switch(interactiveEvent.callback_id) {
        case 'nomination_action':
            handleNominationAction(interactiveEvent, userId, action, attachments);
            break;
        case 'start_tourney_action':
            // only option is to veto right now
            vetoNewTournament(interactiveEvent, userId);
            break;
        case 'matchup_vote':
            managerService.voteMatchup(userId, action);
            break;
        default:
            console.log('got unknown action: ' + interactiveEvent.callback_id);
    }
        

};

function handleNominationAction(event, userId, vote, attachments) {

    let submitter = event.original_message.text.match(/<@(\w*)>/)[1]; // janky but prevents DB call to get original submission

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

function vetoNewTournament(event, userId, attachments) {

    try {
        managerService.addVeto(userId).then((vetoes) => {

            if (!vetoes) { // submission removed by community
                attachments[2] = null;
                attachments[1] = {
                    text: '*Bracket vetoed by channel members*\nnew bracket incoming...'
                };

                return messageService.updateMessage(event, attachments).then(() => {

                    return managerService.newTournament().then(messageService.postNewTourney,
                        (err) => {
                            if (err === 'ERR_EMPTY_QUEUE') {
                                messageService.queueEmptyError();
                                return Promise.resolve();
                            }
                    });
                });
            }

            let vetoTxt = 'vetoes: ';
            vetoes.forEach((user, i) => {
                if (i === 0) {
                    vetoTxt += `<@${user}>`
                } else {
                    vetoTxt += `, <@${user}>`;
                }
            });
            attachments[1].actions[0].text = `Veto (${vetoes.length})`;
            attachments[2] = {
                text: vetoTxt
            };
            return messageService.updateMessage(event, attachments);
        });
    } catch (e) {
        console.log(e);
    }

}