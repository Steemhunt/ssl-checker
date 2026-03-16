const request = require("request");

function format(date) {
  return date.toLocaleString("sv-SE");
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function sendDiscord(message) {
  const url = process.env.DISCORD_WEBHOOK_URL;
  if (!url) return Promise.resolve();

  return new Promise((resolve) => {
    request.post(
      url,
      {
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: message }),
      },
      (error) => {
        if (error) console.error(`Discord error: ${error}`);
        resolve();
      },
    );
  });
}

module.exports = { format, sleep, sendDiscord };
