const AWS = require('aws-sdk');
var s3 = new AWS.S3();

module.exports = {
    saveNomination: saveNomination
};

function saveNomination(bracket, user) {
    let params = {
        Body: JSON.stringify(bracket),
        Bucket: "mm-www",
        Key: "bracket.json"
    };

    return new Promise((reject, resolve) => {

        console.log('saving to s3');
        s3.putObject(params, function(err, data) {
            if (err) {
                console.log(err, err.stack);
                reject(err);
            }
            else {
                resolve();
            }
        });
    })
}