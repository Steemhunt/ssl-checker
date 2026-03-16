const https = require("https");
const { DOMAINS } = require("../lib/config");
const { format, sendDiscord } = require("../lib/notify");

const GRACETIME_DAYS = 10;

function checkDomain(domain) {
  return new Promise((resolve) => {
    const req = https.request(
      { host: domain, port: 443, method: "GET" },
      (res) => {
        const cert = res.connection.getPeerCertificate();
        if (!cert.valid_to) return resolve();

        const validTo = new Date(cert.valid_to);
        const remaining = Math.floor((validTo - new Date()) / 86400000);

        let status;
        if (remaining < 0) {
          status = `CRITICAL - ${domain} - expired ${-remaining} days ago (${format(validTo)})`;
        } else if (remaining < GRACETIME_DAYS) {
          status = `WARNING - ${domain} - expires in ${remaining} days (${format(validTo)})`;
        } else {
          status = `OK - ${domain} - valid for ${remaining} days (until ${format(validTo)})`;
        }

        console.log(`[SSL] ${status}`);
        if (remaining < GRACETIME_DAYS) sendDiscord(`[SSL] ${status}`);
        resolve();
      },
    );

    req.on("error", (err) => {
      const status = `ERROR - ${domain} - ${err.message}`;
      console.log(`[SSL] ${status}`);
      sendDiscord(`[SSL] ${status}`);
      resolve();
    });

    req.end();
  });
}

async function run() {
  console.log(`\n--- SSL check: ${format(new Date())} ---`);
  for (const domain of DOMAINS) {
    await checkDomain(domain);
  }
}

module.exports = { run };
