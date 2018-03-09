const main = require('./functions/message');
const fs = require('fs');

let input = 'Relic of Apollo';

// let event = {
//     body: JSON.stringify({
//         message: input
//     })
// };

let event = {
    body: `isLocaldev=true&token=Mxa4nubiaxGPm2nr1uXFxJN7&team_id=T9J9W20TT&team_domain=zach-testbed&channel_id=C9K08UKHB&channel_name=random&user_id=U9JP7GWQK&user_name=zhancock278&command=%2Ftest&text=${input}&response_url=https%3A%2F%2Fhooks.slack.com%2Fcommands%2FT9J9W20TT%2F324360485201%2FvsubSaZlRKnqErto4ypgvKC4&trigger_id=324888507844.324336068945.a3a8536c2083b88c84bd951f1e0caece`
};

main.handler(event, null, (err, res) => {
    let data = JSON.parse(res.body);
    fs.writeFile('../bracket/bracket.json', JSON.stringify({teams: data}, null, 3), 'utf8');
});