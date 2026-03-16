const https = require("https");
const { DOMAINS } = require("../lib/config");
const { format, sleep, sendDiscord } = require("../lib/notify");

function checkDomain(domain, retryCount = 0) {
  const urlString = `https://${domain}`;

  return new Promise((resolve) => {
    const req = https.request(
      { host: domain, path: "/", port: 443, method: "GET" },
      async (res) => {
        if (res.statusCode === 200) {
          const chunks = [];
          res.on("data", (chunk) => chunks.push(chunk));
          res.on("end", () => {
            const size = Buffer.concat(chunks).length;
            if (size < 10) {
              const status = `ERROR - ${urlString} - Status: ${res.statusCode} | Size: ${size}`;
              console.log(`[URL] ${status}`);
              sendDiscord(`[URL] ${status}`);
            } else {
              console.log(`[URL] OK - ${urlString} | size: ${size}`);
            }
            resolve();
          });
        } else if (retryCount < 1) {
          console.log(
            `[URL] ${urlString} returned ${res.statusCode}, retrying in 5s...`,
          );
          await sleep(5000);
          resolve(checkDomain(domain, retryCount + 1));
        } else {
          const status = `ERROR - ${urlString} - Status: ${res.statusCode}`;
          console.log(`[URL] ${status}`);
          sendDiscord(`[URL] ${status}`);
          resolve();
        }
      },
    );

    req.on("error", (err) => {
      const status = `ERROR - ${urlString} - ${err.message}`;
      console.log(`[URL] ${status}`);
      sendDiscord(`[URL] ${status}`);
      resolve();
    });

    req.end();
  });
}

async function run() {
  console.log(`\n--- URL check: ${format(new Date())} ---`);
  for (const domain of DOMAINS) {
    await checkDomain(domain);
  }
}

module.exports = { run };
