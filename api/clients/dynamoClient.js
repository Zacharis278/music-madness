const AWS = require('aws-sdk');
AWS.config.update({
    region: "us-east-1",
    endpoint: process.env.DYNAMO_ENDPOINT || "http://localhost:8000"
});

const docClient = new AWS.DynamoDB.DocumentClient();

const Tournament = require('../models/tournament');

module.exports = {
    storeTourney: storeTourney,
    getTourneyById: getTourneyById,
    deleteTourneyById: deleteTourneyById,
    getQueuedTournys: getQueuedTournys,
    getTourneysByStatus: getTourneysByStatus,
    addVeto: addVeto,
    addVote: addVote,
    getVotes: getVotes,
    clearVotes: clearVotes
};

function getVotes() {
    let params = {
        TableName: 'Votes',
        ProjectionExpression: 'vote',
    };

    return scan(params).then((data) => {
        return data.Items.reduce((acc, curr) => {
            acc[curr.vote]++;
            return acc;
        }, [0,0]);
    });
}

function addVote(vote) {
    let params = {
        TableName: 'Votes',
        Item: vote
    }

    return put(params).then(() => {
        return vote;
    })
}

function clearVotes() {
    let params = {
        TableName: 'Votes',
        ProjectionExpression: 'id',
    };

    return scan(params).then((data) => {

        let deleteRequests = data.Items.map((vote) => {
            return {
                DeleteRequest: {
                    Key: {
                        id: vote.id
                    },
                }
            }
        });

        params = {
            RequestItems: {
                "Votes": deleteRequests
            }
        }

        return new Promise((resolve, reject) => {
            docClient.batchWrite(params, function(err, data) {
                if (err) {
                    console.error("Unable to delete item. Error JSON:", JSON.stringify(err, null, 2));
                    reject(err);
                } else {
                    console.log("Deleted item:", JSON.stringify(data, null, 2));
                    resolve();
                }
            });
        });
    });
}

function storeTourney(tourney) {
    let params = {
        TableName: 'Tournaments',
        Item: {
            "id": tourney.id,
            "type": 'artist',
            "status": tourney.status,
            "user": tourney.user,
            "artist": tourney.artist,
            "name": tourney.artist,
            "bracket": tourney.bracket,
            "vetoes": tourney.vetoes,
            "created": tourney.created
        }
    };

    return put(params).then(() => {
        return tourney;
    });
}

function addVeto(tourneyId, user) {
    const params = {
        TableName: 'Tournaments',
        Key:{
            "id": tourneyId
        },
        UpdateExpression: "SET vetoes = list_append(vetoes, :usr)",
        ExpressionAttributeValues:{
            ":usr": [user]
        },
        ReturnValues:"UPDATED_NEW"
    };

    return update(params).then((res) => {
        return res.Attributes.vetoes;
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

function deleteTourneyById(id) {

    let params = {
        TableName: 'Tournaments',
        Key: {
            "id": id
        }
    };

    return new Promise((resolve, reject) => {
        console.log("DynamoClient deleteItem: " + JSON.stringify(params));
        docClient.delete(params, function(err) {
            if (err) {
                console.error("Unable to delete item. Error JSON:", JSON.stringify(err, null, 2));
                reject(err);
            } else {
                console.log("DeleteItem succeeded");
                resolve();
            }
        });
    })
}

function getQueuedTournys() {

    let params = {
        TableName: 'Tournaments',
        ProjectionExpression: "id, artist, #usr",
        FilterExpression: "id <> :active_nomination",
        ExpressionAttributeNames: {
            "#usr": "user",
        },
        ExpressionAttributeValues: {
            ':active_nomination': 'CURRENT_NOMINATION'
        }
    };

    return scan(params).then((data) => {
        return data.Items;
    });
}

function getTourneysByStatus(status) {
    let params = {
        TableName: 'Tournaments',
        ProjectionExpression: "id, #stus, bracket",
        FilterExpression: "#stus = :by_status",
        ExpressionAttributeNames: {
            "#stus": "status"
        },
        ExpressionAttributeValues: {
            ':by_status': status
        }
    };

    return scan(params).then((data) => {
        return data.Items;
    });
}

function update(params) {
    return new Promise((resolve, reject) => {
        console.log("DynamoClient update: " + JSON.stringify(params));
        docClient.update(params, function(err, data) {
            if (err) {
                console.error("Unable to update. Error JSON:", JSON.stringify(err, null, 2));
                reject(err);
            } else {
                console.log("update succeeded:", JSON.stringify(data, null, 2));
                resolve(data);
            }
        });
    });
}

function scan(params) {
    return new Promise((resolve, reject) => {
        console.log("DynamoClient scan: " + JSON.stringify(params));
        docClient.scan(params, function(err, data) {
            if (err) {
                console.error("Unable to scan. Error JSON:", JSON.stringify(err, null, 2));
                reject(err);
            } else {
                console.log("scan succeeded:", JSON.stringify(data, null, 2));
                resolve(data);
            }
        });
    })
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
    });
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