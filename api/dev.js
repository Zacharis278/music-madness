const message = require('./functions/message');
const action = require('./functions/action');
const trigger = require('./functions/trigger');

let input = 'tvote';

let tokens = input.split(' ');

if (tokens[0] === 'nominate' || tokens[0] === 'queue') {
    message.handler({
        body: `user_id=U9JP7GWQK&text=${input}`
    });
}
else if (tokens[0] === 'nvote') {
    action.handler({
        body: `user_id=U9JP7GWQK&payload=${JSON.stringify({
            callback_id: 'nomination_action',
            original_message: { 
                text: 'PLACEHOLDER FOR ORIGINAL MSG by <@U9JP7GWQK>',
                attachments: []
            },
            user: { id: 'U9JP7GWQK' },
            actions: [{
                value: tokens[1]
            }],
            message_ts: null
        })}`
    });
}
else if (tokens[0] === 'tvote') {
    action.handler({
        body: `user_id=U9JP7GWQK&payload=${JSON.stringify({
            callback_id: 'start_tourney_action',
            original_message: {
                text: 'PLACEHOLDER FOR ORIGINAL MSG by <@U9JP7GWQK>',
                attachments: []
            },
            user: { id: 'U9JP7GWQK' },
            actions: [{
                value: 'veto'
            }],
            message_ts: null
        })}`
    });
}
else if (tokens[0] === 'trigger') {
    trigger.handler();
}

let event = {
    body: `user_id=U9JP7GWQK&text=${input}`
};