const bracketService = require('../services/bracketService');
const qs = require('querystring');
const { WebClient } = require('@slack/client');

const web = new WebClient(process.env.SLACK_TOKEN);

exports.handler = function(event, context, callback) {

  try {
      let slackEvent = qs.parse(event.body);
      let message = slackEvent.text;
      console.log(slackEvent);

      if (!slackEvent.isLocaldev) {
          setTimeout(() => { // cost saving measure for development.  save dem PENNIES $$$$
              process.exit(0);
          }, 2800);
      }

      bracketService.generateBracket(message).then((res) => {

          let response = JSON.stringify(res, null, 3);
          console.log(response);

          web.chat.postMessage(slackEvent.channel_id, `\`\`\`${response}\`\`\``)
          .then((res) => {
              // `res` contains information about the posted message
              console.log('Message sent: ', res.ts);
          })
          .catch((e) => {
              console.error(e);
          });

          if (slackEvent.isLocaldev) {
              callback(null, {
                  statusCode: '200',
                  body: JSON.stringify(res),
                  headers: {
                      'Content-Type': 'application/json',
                  }
              });
          }
      });

      // OK so in order for this to respond right away we will have to call the bracket functions as
      // a separate worker.
      //
      // technically there exists a header to set on the request X-Amz-Invocation-Type" = "Event" but that's
      // gonna be a pain to setup.

      // callback(null, {
      //     statusCode: '200',
      //     body: JSON.stringify({
      //         'response_type':'in_channel',
      //         'replace_original':false,
      //         'text': 'solving world hunger...'
      //     }),
      //     headers: {
      //         'Content-Type': 'application/json',
      //     }
      // });
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