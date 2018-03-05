let bracketService = require('../services/bracketService');

exports.handler = function(event, context, callback) {

  try {
      let body = JSON.parse(event.body);
      let message = body.message;

      bracketService.generateBracket(message).then((res) => {
          console.log(res);
          console.log(res.length);
          callback(null, {
              statusCode: '200',
              body: JSON.stringify(res),
              headers: {
                  'Content-Type': 'application/json',
              },
          });
      });
  } catch (e) {
      console.log(e);
      callback(null, {
          statusCode: '500',
          body: JSON.stringify(e),
          headers: {
            'Content-Type': 'application/json',
          },
      });
  }
};