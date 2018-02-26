let request = require('request-promise-native');
let moment = require('moment');

const CLIENT_ID = process.env.SPOTIFY_CLIENT_ID;
const SECRET = process.env.SPOTIFY_SECRET;

let token = {
    value: null,
    expires: null
};

function authorize() {
    let options = {
        url: 'https://accounts.spotify.com/api/token',
        form: {
            grant_type: 'client_credentials'
        },
        headers: {
            'Authorization': 'Basic ' + (new Buffer(CLIENT_ID + ':' + SECRET).toString('base64'))
        },
        json: true
    };

    return request.post(options).then((res) =>  {
        token.value = res.access_token;

        let now = new moment();
        token.expires = now.subtract(res.expires_in, 'seconds');
    }, (error) => {
        console.log('Spotify Auth Failed: ' + error);
    });
}

function findArtist(term) {

    return authorize().then(() => {

        let options = {
            url: 'https://api.spotify.com/v1/search',
            headers: {
                'Authorization': 'Bearer ' + token.value
            },
            qs: {
                q: term,
                type: 'artist',
                limit: 1            // I'm feeling lucky
            }
        };


        return request.get(options).then((res) => {
            let data = JSON.parse(res);

            if (data.artists.items && data.artists.items.length > 0) {
                let foundArtist = data.artists.items[0];
                return {
                    name: foundArtist.name,
                    id: foundArtist.id
                }
            }
        }, (err) => {
            console.log('Artist Search Failed: ' + err);
        });
    })

}

module.exports = {
    findArtist: findArtist
};