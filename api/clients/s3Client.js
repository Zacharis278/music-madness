const AWS = require('aws-sdk');
const s3 = new AWS.S3();

module.exports = {
    uploadNomination: uploadNomination
};

function uploadNomination(tourney) {

    let params = {
        Body: JSON.stringify({teams:tourney.getTeamsList()}),
        Bucket: "mm-www",
        Key: "bracket.json"
    };

    if (process.env.DISABLE_S3_UPLOAD) return Promise.resolve();

    return new Promise((resolve, reject) => {
    
        console.log('saving to s3');
        s3.putObject(params, function(err) {
            if (err) {
                console.log(err, err.stack);
                reject(err);
            }
            else {
                resolve();
            }
        });
    });
}