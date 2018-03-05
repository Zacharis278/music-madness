module.exports = {
    filterAlbums: filterAlbums
};

function filterAlbums(albums) {

    let purgedAlbums = [];

    // do more than 50% of the tracks contain 'live'? probably not a studio album
    for(let i = 0; i < albums.length; i++) {
        let liveCount = 0;
        let album = albums[i];
        album.tracks.forEach((track) => {
            if (track.name.toLowerCase().includes('live')) {
                liveCount++;
            }
        });

        if (liveCount > album.tracks.length*.5) {
            purgedAlbums.push(album.name);
            albums.splice(i, 1);
            i--;
        } else {
            album.wordMap = album.name.replace(/[()]/g, '').split(' ');  // map words for comparing titles next
        }
    }

    // remove duplicate titles (remasters, re-releases, etc)
    for(let i = 0; i < albums.length-1; i++) {
        for(let j = i+1; j < albums.length-1; j++) {
            let album1 = albums[i];
            let album2 = albums[j];
            if (isSimilar(album1, album2)) {
                if (album1.name.length > album2.name.length) {
                    purgedAlbums.push(album1.name);
                    albums.splice(i, 1);
                    i--;
                    break;
                } else {
                    purgedAlbums.push(album2.name);
                    albums.splice(j, 1);
                    j--;
                }
            }
        }
    }

    console.log('Purged Similar and Live Albums:');
    console.log(purgedAlbums);
    console.log('\n Remaining Albums');
    albums.forEach((a) => console.log(a.name));
    return albums;
}

function isSimilar(album1, album2) {
    let matches = [];
    let minLength = Math.min(album1.wordMap.length, album2.wordMap.length);

    album1.wordMap.forEach((w1) => {
        if (album2.wordMap.includes(w1)) {
            matches.push(w1);
        }
    });

    return matches.length === minLength;
}