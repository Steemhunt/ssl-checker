#!/usr/bin/env node

const https = require("https");
const request = require("request");
require("dotenv").config();

function format(date) {
  return date.toLocaleString("sv-SE");
}

const LIST_OF_DOMAINS = [
  "hunt.town",
  "nomadtask.com",
  "steemhunt.com",
  "dixel.club",
  "mint.club",
  "hrl.sh",
  "barkapp.co",
  "neverlose.money",
  "sebayaki.com",
  "signet.sebayaki.com",
  "onchat.sebayaki.com",
];
const DISCORD_WEBHOOK_URL = process.env.DISCORD_WEBHOOK_URL;
const port = 443;
const gracetime_days = 10;

console.log(`---\nCheck all domains: ${format(new Date())}\n---`);

LIST_OF_DOMAINS.forEach((domain) => {
  const options = {
    host: domain,
    port: port,
    method: "GET",
  };

  const req = https.request(options, (response) => {
    const cert = response.connection.getPeerCertificate();
    if (cert.valid_to) {
      const now = new Date();
      const valid_to = new Date(cert.valid_to);
      const remaining = Math.floor((valid_to - now) / (1000 * 60 * 60 * 24)); // remaining days
      let status = `OK - ${domain} - valid for ${remaining} days (until ${format(valid_to)})`;

      if (remaining < 0) {
        status = `CRITICAL - ${domain} - expired ${-remaining} days ago (on ${format(valid_to)})`;
      } else if (remaining < gracetime_days) {
        status = `WARNING - ${domain} - expires in ${remaining} days (on ${format(valid_to)})`;
      }

      if (remaining < gracetime_days) {
        // Discord message will be sent for warning and critical status.
        const payload = { content: status };

        request.post(
          DISCORD_WEBHOOK_URL,
          {
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          },
          (error, response, body) => {
            if (error) {
              console.error(`Error sending to Discord: ${error}`);
            }
          },
        );
      }

      console.log(status); // print status
    }
  });

  req.on("error", (error) => {
    console.log(`Connection error: ${domain}`);
  });

  req.end();
});
