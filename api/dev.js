let main = require('./functions/message');

let input = 'Dream Theater';

let event = {
    body: JSON.stringify({
        message: input
    })
};

main.handler(event, null, (err, res) => {
    let data = JSON.parse(res.body);
    fs.writeFile('../bracket/bracket.json', JSON.stringify({teams: data}, null, 3), 'utf8');
});