const AWS = require('aws-sdk');
AWS.config.update({region: 'us-east-1'});


// Create CloudWatch service object
const cw = new AWS.CloudWatch({apiVersion: '2010-08-01'});

//https://docs.aws.amazon.com/AmazonCloudWatch/latest/events/ScheduledEvents.html
const params = {
    Description: "Test Rule",
    EventPattern: "string",
    Name: "string",
    RoleArn: "string",
    ScheduleExpression: "string",
    State: "string"
};

cw.putRule(params, function(err, data) {
    if (err) {
        console.log("Error", err);
    } else {
        console.log("Success", data);
    }
});