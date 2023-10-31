#!/usr/bin/env node

const https = require('https');
const request = require('request');
require('dotenv').config();

const LIST_OF_DOMAINS = [
  'hunt.town',
  'nomadtask.com',
  'steemhunt.com',
  'dixel.club',
  'dixelclub.com',
  'mint.club'
];
const DISCORD_WEBHOOK_URL = process.env.DISCORD_WEBHOOK_URL;
const port = 443;
const gracetime_days = 14;

LIST_OF_DOMAINS.forEach(domain => {
  const options = {
    host: domain,
    port: port,
    method: 'GET'
  };

  const req = https.request(options, (response) => {
    const cert = response.connection.getPeerCertificate();
    if (cert.valid_to) {
      const now = new Date();
      const valid_to = new Date(cert.valid_to);
      const remaining = Math.floor((valid_to - now) / (1000 * 60 * 60 * 24)); // remaining days
      let status = `OK - ${domain} - valid for ${remaining} days (until ${valid_to.toISOString()})`;

      if (remaining < 0) {
        status = `CRITICAL - ${domain} - expired ${-remaining} days ago (on ${valid_to.toISOString()})`;
      } else if (remaining < gracetime_days) {
        status = `WARNING - ${domain} - expires in ${remaining} days (on ${valid_to.toISOString()})`;
      }

      if (remaining > gracetime_days) { // Discord message will be sent for warning and critical status.
        const payload = { content: status };

        request.post(DISCORD_WEBHOOK_URL, {
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        }, (error, response, body) => {
          if (error) {
            console.error(`Error sending to Discord: ${error}`);
          }
        });
      }

      console.log(status); // print status
    }
  });

  req.on('error', (error) => {
    console.log(`Connection error: ${domain}`);
  });

  req.end();
});
