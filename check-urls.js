#!/usr/bin/env node

const https = require("https");
const request = require("request");
const url = require("url");
require("dotenv").config();

function format(date) {
  return date.toLocaleString("sv-SE");
}

const LIST_OF_URLS = ["https://tip.hunt.town/allowance/stats/8151/{timestamp}"];
const DISCORD_WEBHOOK_URL = process.env.DISCORD_WEBHOOK_URL;
const port = 443;

console.log(`---\nCheck all urls: ${format(new Date())}\n---`);

function onError(url, msg) {
  const status = `ERROR - ${url} - ${msg}`;
  console.log(status);

  request.post(
    DISCORD_WEBHOOK_URL,
    {
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content: `${status}` }),
    },
    (error) => {
      if (error) {
        console.error(`Error sending to Discord: ${error}`);
      }
    }
  );
}

LIST_OF_URLS.forEach((urlString) => {
  const timestamp = Date.now();
  const parsedUrl = new URL(urlString.replace("{timestamp}", timestamp));

  const options = {
    host: parsedUrl.hostname, // Extract hostname
    path: parsedUrl.pathname, // Extract path with query
    port: port,
    method: "GET",
  };

  const req = https.request(options, (response) => {
    // Check URL returns 200
    if (response.statusCode === 200) {
      // Check response file size
      let data = [];
      response.on("data", (chunk) => {
        data.push(chunk);
      });

      response.on("end", () => {
        const fileSize = Buffer.concat(data).length;

        if (fileSize < 10) {
          onError(
            parsedUrl,
            `Status code: ${response.statusCode} | File size: ${fileSize}`
          );
        } else {
          console.log(`OK - ${parsedUrl} | size: ${fileSize}`);
        }
      });
    } else {
      onError(parsedUrl, `Status code: ${response.statusCode}`);
    }
  });

  req.on("error", (error) => {
    onError(parsedUrl, `Connection Error: ${error.message}`);
  });

  req.end();
});

// crontab
//* * * * * cd /home/updatebot/ssl-checker && node check-urls.js >> /home/updatebot/ssl-checker/cron-urls.log 2>&1
