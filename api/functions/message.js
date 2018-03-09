const qs = require('querystring');
const botService = require('../services/botService');

exports.handler = function(event, context, callback) {

    try {
        let slackEvent = qs.parse(event.body);
        console.log(slackEvent);

        // cost saving measure for development.  save dem PENNIES $$$$
        // if (!slackEvent.isLocaldev) {
        //     setTimeout(() => {
        //         process.exit(0);
        //     }, 2800);
        // }

        let tokens = slackEvent.text.split(' ');

        switch (tokens[0]) {
            case 'nominate':
                botService.nominateArtist(tokens[1], slackEvent.user_id);
                break;
            case 'standings':
                break;
            case 'queue':
                break;
            default:
                // help
        }

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