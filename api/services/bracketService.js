let spotifyClient = require('../clients/spotifyClient');
let filterService = require('./filterService');

module.exports = {
    generateTeams: generateTeams,
    calculateRuntimeDays: calculateRuntimeDays,
    shuffleTeams: shuffleTeams
};

// TODO: WHAT IF WE SEED INITIAL MATCHUPS BY POPULARITY
function generateTeams(searchTerm, limit) {
    return spotifyClient.findArtist(searchTerm).then((artist) => {

        return spotifyClient.getAlbums(artist.id).then((albums) => {

            // go with simple bracket structure right now (no back reference)
            let teams = [];
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

            // limit to 64 initial matchups for now
            if (!limit) limit = Math.min(nearestPow2(bracketEntries.length), 128);

            if (bracketEntries.length > limit) {
                //cullLeastPopular(bracketEntries, limit);
                bracketEntries.sort((e1, e2) => {
                    return popularityMap[e2] - popularityMap[e1];
                });
                bracketEntries.length = limit;
            }

            shuffleTeams(bracketEntries);

            let numByes = limit - bracketEntries.length;
            for(let i = 0; i < bracketEntries.length;) {

                if (numByes > 0) {
                    teams.push([
                        bracketEntries[i],
                        null
                    ]);
                    i++;
                    numByes--;
                } else {
                    teams.push([
                        bracketEntries[i],
                        bracketEntries[i+1]
                    ]);
                    i+=2
                }
            }

            return teams;
        });
    });
}

function calculateRuntimeDays(numTeams) {

    // summation of powers of 2 up to 2^n is 2^(n+1)-1
    // QED cuz I say so, discrete math is in the past
    // also subtract an extra since 2^0 doesn't count in this case
    let n = Math.log(numTeams) / Math.log(2);
    let days = (Math.pow(2,n+1)-2)/2;

    n = Math.log(Math.min(numTeams, 16)) / Math.log(2);
    days += (Math.pow(2,n+1)-2)/2;
    return days;
}

function shuffleTeams(a) {
    let j, x, i;
    for (i = a.length - 1; i > 0; i--) {
        j = Math.floor(Math.random() * (i + 1));
        x = a[i];
        a[i] = a[j];
        a[j] = x;
    }
}



// Private
function nearestPow2(n) {
    let m = n;
    for(var i = 0; m > 1; i++) {
        m = m >>> 1;
    }
    // Round to nearest power
    if (n & 1 << i-1) { i++; }
    return 1 << i;
}

