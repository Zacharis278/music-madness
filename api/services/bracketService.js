let spotifyClient = require('../clients/spotifyClient');

module.exports = {

    generateBracket: function(term) {
        return spotifyClient.findArtist(term).then((artist) => {
            return artist;
        });
    }
};