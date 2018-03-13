const main = require('./functions/message');
const fs = require('fs');

let input = 'queue';

// let event = {
//     body: JSON.stringify({
//         message: input
//     })
// };

let nominateEvent = {
    body: `user_id=U9JP7GWQK&text=${input}`
};

main.handler(nominateEvent, null, (err, res) => {
    //let data = JSON.parse(res.body);
    //fs.writeFile('../bracket/bracket.json', JSON.stringify({teams: data}, null, 3), 'utf8');
});