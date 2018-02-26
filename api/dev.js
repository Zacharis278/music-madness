let main = require('./functions/message');

let input = 'Rush';

let event = {
    body: JSON.stringify({
        message: input
    })
};

main.handler(event, null, (err, res) => {
    console.log(res);
});