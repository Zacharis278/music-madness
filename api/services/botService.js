const bracketService = require('./bracketService');
const tournyService = require('./tourneyService');
const { WebClient } = require('@slack/client');
const web = new WebClient(process.env.SLACK_TOKEN);

const nominateTemplate = require('../responseTemplates/nominate');

// configure this later
const BRACKET_URL = 'http://mm-www.s3-website-us-east-1.amazonaws.com/';

const CHANNEL_ID = 'C9K08UKHB';

module.exports = {
    nominateArtist: nominateArtist
};

function nominateArtist(searchTerm, userId) {

    bracketService.generateBracket(searchTerm).then((res) => {

        //let response = JSON.stringify(res, null, 3);
        //console.log(response);

        tournyService.saveNomination(res, 'testuser');

        let params = {
            artist: searchTerm, //WRONG
            runtime: '36 days',
            user: `<@${userId}>`,
            link: BRACKET_URL
        };
        console.log('1');
        let response = magic(nominateTemplate, params);
        console.log('2');

        web.chat.postMessage(CHANNEL_ID, response.text, {attachments: response.attachments})
            .then((res) => {
                // `res` contains information about the posted message
                console.log('Message sent: ', res.ts);
            })
            .catch((e) => {
                console.error(e);
            });
    });
}

function magic(o, a) {
    let j = JSON.stringify(o);
    for (let k in a) {
        j = j.split('${'+k+'}').join(a[k]);
    }
    return JSON.parse(j);
}