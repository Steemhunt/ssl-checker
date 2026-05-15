const https = require("https");
const { API_ENDPOINTS } = require("../lib/config");
const { format, sleep, sendDiscord } = require("../lib/notify");

function fetchJson(url) {
  return new Promise((resolve, reject) => {
    const req = https.request(url, { method: "GET", timeout: 10_000 }, (res) => {
      const chunks = [];
      res.on("data", (c) => chunks.push(c));
      res.on("end", () => {
        const body = Buffer.concat(chunks).toString("utf8");
        resolve({ statusCode: res.statusCode, body, contentType: res.headers["content-type"] || "" });
      });
    });
    req.on("error", reject);
    req.on("timeout", () => { req.destroy(new Error("timeout 10s")); });
    req.end();
  });
}

async function checkEndpoint(ep, retryCount = 0) {
  const { url, expectedKey, expectedValue, name } = ep;
  const label = name || url;

  try {
    const { statusCode, body, contentType } = await fetchJson(url);

    if (statusCode !== 200) {
      if (retryCount < 1) {
        await sleep(5000);
        return checkEndpoint(ep, retryCount + 1);
      }
      const status = `ERROR - ${label} - Status: ${statusCode}`;
      console.log(`[API] ${status}`);
      await sendDiscord(`[API] ${status}`);
      return;
    }

    if (!/json/i.test(contentType)) {
      const status = `ERROR - ${label} - non-JSON content-type: ${contentType}`;
      console.log(`[API] ${status}`);
      await sendDiscord(`[API] ${status}`);
      return;
    }

    let parsed;
    try {
      parsed = JSON.parse(body);
    } catch (e) {
      const status = `ERROR - ${label} - JSON parse failed: ${e.message}`;
      console.log(`[API] ${status}`);
      await sendDiscord(`[API] ${status}`);
      return;
    }

    if (expectedKey && !(expectedKey in parsed)) {
      const status = `ERROR - ${label} - missing key "${expectedKey}" in response`;
      console.log(`[API] ${status}`);
      await sendDiscord(`[API] ${status}`);
      return;
    }

    if (expectedValue !== undefined && parsed[expectedKey] !== expectedValue) {
      const status = `ERROR - ${label} - ${expectedKey}="${parsed[expectedKey]}" (expected "${expectedValue}")`;
      console.log(`[API] ${status}`);
      await sendDiscord(`[API] ${status}`);
      return;
    }

    console.log(`[API] OK - ${label}${expectedKey ? ` | ${expectedKey}=${JSON.stringify(parsed[expectedKey]).slice(0, 60)}` : ""}`);
  } catch (err) {
    if (retryCount < 1) {
      await sleep(5000);
      return checkEndpoint(ep, retryCount + 1);
    }
    const status = `ERROR - ${label} - ${err.message}`;
    console.log(`[API] ${status}`);
    await sendDiscord(`[API] ${status}`);
  }
}

async function run() {
  console.log(`\n--- API check: ${format(new Date())} ---`);
  for (const ep of API_ENDPOINTS) {
    await checkEndpoint(ep);
  }
}

module.exports = { run };
