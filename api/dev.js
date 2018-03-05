let main = require('./functions/message');

let input = 'Dream Theater';

let event = {
    body: JSON.stringify({
        message: input
    })
};

main.handler(event, null, (err, res) => {
    console.log(res);
    console.log(res.length);
});