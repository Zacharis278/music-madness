const qs = require('querystring');
const messageService = require('../services/messageService');
const bracketService = require('../services/bracketService');
const managerService = require('../services/managerService');

exports.handler = function(event, context, callback) {

    try {
        let slackEvent = qs.parse(event.body);
        console.log(slackEvent);

        let tokens = slackEvent.text.split(' ');
        let promise;

        switch (tokens.shift()) {
            case 'nominate':
                promise = nominateArtist(tokens.join(' '), slackEvent.user_id);
                break;
            case 'standings':
                break;
            case 'queue':
                promise = messageService.postQueue();
                break;
            default:
                // help
        }

        promise.then(() => {
            callback(null, '200 OK');
        }).catch((e) => {
            console.log(e);
        });

        // OK so in order for this to respond right away we will have to call the bracket functions as
        // a separate worker.
        //
        // technically there exists a header to set on the request X-Amz-Invocation-Type" = "Event" but that's
        // gonna be a pain to setup.

        // callback(null, {
        //     statusCode: '200',
        //     body: JSON.stringify({
        //         'response_type':'in_channel',
        //         'replace_original':false,
        //         'text': 'solving world hunger...'
        //     }),
        //     headers: {
        //         'Content-Type': 'application/json',
        //     }
        // });
    } catch (e) {
        console.log(e);
        callback(null, {
            statusCode: '500',
            body: JSON.stringify(e),
            headers: {
              'Content-Type': 'application/json',
            },
        });
    }
};

function nominateArtist(searchTerm, userId) {
    console.log('NominateArtist: ' + searchTerm);
    return managerService.nominationsOpen()
        .then((nominationsOpen) => {
            if (!nominationsOpen) {
                return messageService.nominationsClosed(userId);
            }
        })
        .then(() => {
            return bracketService.generateTeams(searchTerm)
        })
        .then((teams) => {
            return managerService.createNomination(userId, searchTerm, teams);
        })
        .then((tourney) => {
            return messageService.postNomination(tourney);
        }).catch((e) => {
            console.log('BotService Error: ' + JSON.stringify(e));
        });
}