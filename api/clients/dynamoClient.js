const AWS = require('aws-sdk');
AWS.config.update({
    region: "us-east-1",
    endpoint: process.env.DYNAMO_ENDPOINT || "http://localhost:8000"
});

const docClient = new AWS.DynamoDB.DocumentClient();

const Tournament = require('../models/tournament');

module.exports = {
    storeTourney: storeTourney,
    getTourneyById: getTourneyById
};

function storeTourney(tourney) {
    let params = {
        TableName: 'Tournaments',
        Item: {
            "id": tourney.id,
            "type": tourney.artist,
            "user": tourney.user,
            "name": tourney.artist,
            "teams": tourney.teams,
            "created": tourney.created
        }
    };

    return put(params).then(() => {
        return tourney;
    });
}

function getTourneyById(id) {
    let params = {
        TableName: 'Tournaments',
        Key: {
            "id": id
        }
    };

    return get(params).then((data) => {
        if (data && data.Item) {
            return new Tournament(data.Item);
        }
    });
}

function get(params) {
    return new Promise((resolve, reject) => {
        console.log("DynamoClient getItem: " + JSON.stringify(params));
        docClient.get(params, function(err, data) {
            if (err) {
                console.error("Unable to read item. Error JSON:", JSON.stringify(err, null, 2));
                reject(err);
            } else {
                console.log("GetItem succeeded:", JSON.stringify(data, null, 2));
                resolve(data);
            }
        });
    })
}

function put(params) {
    console.log("DynamoClient Adding a new item: " + JSON.stringify(params));

    return new Promise((resolve, reject) => {
         docClient.put(params, function(err, data) {
            if (err) {
                console.error("Unable to add item. Error JSON:", JSON.stringify(err, null, 2));
                reject(err);
            } else {
                console.log("Added item:", JSON.stringify(data, null, 2));
                resolve();
            }
        });
    });
}