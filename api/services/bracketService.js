let spotifyClient = require('../clients/spotifyClient');
let filterService = require('./filterService');

module.exports = {
    generateBracket: generateBracket
};

function generateBracket(searchTerm, limit) {
    return spotifyClient.findArtist(searchTerm).then((artist) => {

        return spotifyClient.getAlbums(artist.id).then((albums) => {

            // go with simple bracket structure right now (no back reference)
            let bracket = [];
            let bracketEntries = [];
            let popularityMap = {};
            filterService.filterAlbums(albums).forEach((album) => {
                let albumName = album.name;
                album.tracks.forEach((track) => {
                    let entry = `${track.name} - ${albumName}`;
                    bracketEntries.push(entry);
                    popularityMap[entry] = track.popularity;
                });
            });


            if (!limit) limit = nearestPow2(bracketEntries.length);


            if (bracketEntries.length > limit) {
                //cullLeastPopular(bracketEntries, limit);
                bracketEntries.sort((e1, e2) => {
                    return popularityMap[e2] - popularityMap[e1];
                });
                bracketEntries.length = limit;
            }

            shuffle(bracketEntries);

            let numByes = limit - bracketEntries.length;
            for(let i = 0; i < bracketEntries.length;) {

                if (numByes > 0) {
                    bracket.push([
                        bracketEntries[i],
                        null
                    ]);
                    i++;
                    numByes--;
                } else {
                    bracket.push([
                        bracketEntries[i],
                        bracketEntries[i+1]
                    ]);
                    i+=2
                }
            }

            return bracket;
        });
    });
}

function shuffle(a) {
    let j, x, i;
    for (i = a.length - 1; i > 0; i--) {
        j = Math.floor(Math.random() * (i + 1));
        x = a[i];
        a[i] = a[j];
        a[j] = x;
    }
}

function nearestPow2(n) {
    let m = n;
    for(var i = 0; m > 1; i++) {
        m = m >>> 1;
    }
    // Round to nearest power
    if (n & 1 << i-1) { i++; }
    return 1 << i;
}

function nextPow2(n) {
    if (n === 0) return 1;
    n--;
    n |= n >> 1;
    n |= n >> 2;
    n |= n >> 4;
    n |= n >> 8;
    n |= n >> 16;
    return n+1
}

