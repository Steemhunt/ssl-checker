const https = require("https");
const { DOMAINS } = require("../lib/config");
const { format, sleep, sendDiscord } = require("../lib/notify");

const MIN_SIZE = 200; // catches GoDaddy parking page (114B) + empty 200 responses

function analyze(body, { expectTitle = true } = {}) {
  const size = body.length;
  if (size === 0) return { ok: false, reason: "empty body" };
  if (size < MIN_SIZE) return { ok: false, reason: `body too small (${size}B)` };

  // Parking page heuristic: JS-redirect-only HTML (e.g. GoDaddy domain forwarding)
  if (/window\.location(\.href)?\s*=/.test(body) && size < 500) {
    return { ok: false, reason: `JS redirect-only page (${size}B) — likely parking` };
  }

  let title = null;
  const titleMatch = body.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  if (titleMatch) title = titleMatch[1].trim();

  if (expectTitle) {
    if (!title) return { ok: false, reason: `no/empty <title>, size=${size}B` };
  }

  return { ok: true, size, title };
}

function checkDomain(entry, retryCount = 0) {
  const opts = typeof entry === "string" ? { host: entry } : entry;
  const domain = opts.host;
  const urlString = `https://${domain}`;

  return new Promise((resolve) => {
    const req = https.request(
      { host: domain, path: "/", port: 443, method: "GET" },
      async (res) => {
        if (res.statusCode === 200) {
          const chunks = [];
          res.on("data", (chunk) => chunks.push(chunk));
          res.on("end", async () => {
            const body = Buffer.concat(chunks).toString("utf8");
            const result = analyze(body, opts);
            if (!result.ok) {
              const status = `ERROR - ${urlString} - ${result.reason}`;
              console.log(`[URL] ${status}`);
              await sendDiscord(`[URL] ${status}`);
            } else {
              const titlePart = result.title ? ` | title="${result.title.slice(0, 60)}"` : "";
              console.log(`[URL] OK - ${urlString} | size=${result.size}${titlePart}`);
            }
            resolve();
          });
        } else if ([301, 302, 307, 308].includes(res.statusCode) && retryCount < 1) {
          // follow one redirect (apex → www etc)
          const location = res.headers.location;
          if (location && location.startsWith("https://")) {
            const newDomain = new URL(location).host;
            console.log(`[URL] ${urlString} → ${res.statusCode} ${location}, following`);
            await sleep(200);
            resolve(checkDomain({ ...opts, host: newDomain }, retryCount + 1));
            return;
          }
          const status = `ERROR - ${urlString} - ${res.statusCode} redirect to non-https`;
          console.log(`[URL] ${status}`);
          await sendDiscord(`[URL] ${status}`);
          resolve();
        } else if (retryCount < 1) {
          console.log(`[URL] ${urlString} returned ${res.statusCode}, retrying in 5s...`);
          await sleep(5000);
          resolve(checkDomain(opts, retryCount + 1));
        } else {
          const status = `ERROR - ${urlString} - Status: ${res.statusCode}`;
          console.log(`[URL] ${status}`);
          await sendDiscord(`[URL] ${status}`);
          resolve();
        }
      },
    );

    req.on("error", async (err) => {
      const status = `ERROR - ${urlString} - ${err.message}`;
      console.log(`[URL] ${status}`);
      await sendDiscord(`[URL] ${status}`);
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
