let request = require('request-promise-native');
let moment = require('moment');
let qs = require('querystring');

const CLIENT_ID = process.env.SPOTIFY_CLIENT_ID;
const SECRET = process.env.SPOTIFY_SECRET;

module.exports = {
    findArtist: findArtist,
    getAlbums: getAlbums
};

let token = {
    value: null,
    expires: null
};

function authorize() {

    let now = moment();
    if (token.value && now.isAfter(token.expires.subtract(30, 'seconds'))) {
        return Promise.resolve();
    }

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

    console.log('SpotifyClient Authorizing');
    return request.post(options).then((res) =>  {
        token.value = res.access_token;

        let now = new moment();
        token.expires = now.subtract(res.expires_in, 'seconds');
    }, (error) => {
        console.log('Spotify Auth Failed: ' + error);
    });
}

function getAlbums(artistId) {
    return authorize().then(() => { // get albums for artist
        let options = {
            url: `https://api.spotify.com/v1/artists/${artistId}/albums`,
            headers: {
                'Authorization': 'Bearer ' + token.value
            },
            qs: {
                album_type: 'album',    // ignore singles, collections, contributions
                market: 'US',
                limit: 50               // hard limit for now. who has 50+ albums anyway
            }
        };

        console.log('SpotifyClient getAlbums: ' + JSON.stringify(options));
        return request.get(options).then((res) => {
            let data = JSON.parse(res);

            if( data.items.length ) {
                return data.items;
            } else {
                console.log('Nothing returned for albums where artist='+artistId);
                return Promise.reject('No Albums Found');
            }
        }, (err) => {
            console.log('Get Albums Failed: ' + err);
        });
    }).then((albums) => {  // get tracks on each album
        let futures = albums.map((album) => {

            let options = {
                url: `https://api.spotify.com/v1/albums/${album.id}/tracks`,
                headers: {
                    'Authorization': 'Bearer ' + token.value
                },
                qs: {
                    album_type: 'album',    // ignore singles, collections, contributions
                    market: 'US',
                    limit: 50               // hard limit for now. who has 50+ albums anyway
                }
            };

            console.log('SpotifyClient getTracks: ' + JSON.stringify(options));
            return request.get(options).then((res) => {
                return {
                    id: album.id,
                    name: album.name,
                    tracks: JSON.parse(res).items
                }
            });
        });

        return Promise.all(futures);
    }).then((albums) => {   // get details for each track (popularity value)

        let futures = albums.map((album) => {

            let options = {
                url: `https://api.spotify.com/v1/tracks`,
                headers: {
                    'Authorization': 'Bearer ' + token.value
                },
                qs: {
                    ids: album.tracks.map((t) => t.id).join(',')
                }
            };

            console.log('SpotifyClient getTracksDetails: ' + JSON.stringify(options));
            return request.get(options).then((res) => {
                return {
                    id: album.id,
                    name: album.name,
                    tracks: JSON.parse(res).tracks
                }
            });
        });

        return Promise.all(futures);
    }).catch((e) => {
        console.log(e);
    });
}

function findArtist(term) {

    return authorize().then(() => { // TODO: be less shitty

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

        console.log('SpotifyClient searchArtist: ' + JSON.stringify(options));
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
    });
}