const qs = require('querystring');
const botService = require('../services/botService');
const updateService = require('../services/updateService');

exports.handler = function(event, context, callback) {

    try {
        if (event.trigger) {
            updateService.update();
            return;
        }

        let slackEvent = qs.parse(event.body);
        console.log(slackEvent);

        if (slackEvent.payload) {
            let interactiveEvent = JSON.parse(slackEvent.payload);
            console.log(interactiveEvent);
            botService.handleNominationAction(interactiveEvent);
            return;
        }

        let tokens = slackEvent.text.split(' ');
        let promise;

        switch (tokens.shift()) {
            case 'nominate':
                promise = botService.nominateArtist(tokens.join(' '), slackEvent.user_id);
                break;
            case 'standings':
                break;
            case 'queue':
                promise = botService.postQueue();
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