let spotifyClient = require('../clients/spotifyClient');
let filterService = require('./filterService');

module.exports = {
    generateBracket: generateBracket,
    shuffleTeams: shuffleTeams,
    addWinner: addWinner
};

// TODO: WHAT IF WE SEED INITIAL MATCHUPS BY POPULARITY
function generateBracket(searchTerm, limit) {
    return spotifyClient.findArtist(searchTerm).then((artist) => {

        return spotifyClient.getAlbums(artist.id).then((albums) => {

            let bracket = {
                entries: [],
                rounds: [
                    []
                ],
                currentRound: -1,
                currentMatchup: -1
            };


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
            bracket.totalEntries = bracketEntries.length;
            bracket.runtimeDays = calculateRuntimeDays(limit, numByes);

            for(let i = 0; i < bracketEntries.length;) {

                if (numByes > 0) {

                    bracket.rounds[0].push([
                        { name: bracketEntries[i], votes: null},
                        { name: null, votes: null},
                    ]);

                    i++;
                    numByes--;
                } else {

                    bracket.rounds[0].push([
                        { name: bracketEntries[i], votes: null},
                        { name: bracketEntries[i+1], votes: null},
                    ]);

                    i+=2
                }
            }

            return bracket;
        });
    });
}

function addWinner(bracket, roundNumber, winner) {
    
    roundNumber++;

    if (!bracket.rounds[roundNumber])
        bracket.rounds[roundNumber] = [];
    round = bracket.rounds[roundNumber];

    if (round[round.length-1] && !round[round.length-1][1].name) {
        round[round.length-1][1].name = winner.name;
    } else {
        round.push([
            {
                "name": winner.name,
                "votes": null
            },
            {
                "name": null,
                "votes": null
            }
        ])
    }

    return bracket;
}

function calculateRuntimeDays(numTeams, numByes) {

    // summation of powers of 2 up to 2^n is 2^(n+1)-1
    // also subtract an extra since 2^0 doesn't count in this case
    let n = Math.log(numTeams) / Math.log(2);
    let days = (Math.pow(2,n+1)-2)/2;

    n = Math.log(Math.min(numTeams, 16)) / Math.log(2);
    days += (Math.pow(2,n+1)-2)/2;

    // subtract bye rounds
    // teams.forEach((team) => {
    //     if (team[1] === null) // dangerously assuming I only set bye on second entry
    //         days -= numTeams.length >= 16 ? 2 : 1;
    // });

    if (numByes) {
        days -= numTeams >= 16 ? Math.round(numByes/2) : numByes;
    }

    return days;
}

function numberOfEntries(teams) {
    return teams.reduce((acc, t) => t[1] ? acc+2 : acc+1, 0);
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

