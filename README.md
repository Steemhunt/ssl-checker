# SSL Checker

Monitors SSL certificates, URL availability, JSON API endpoints, and wallet balances. Sends alerts to Discord.

## Structure

```
checks/
  ssl.js       - SSL certificate expiration (alerts < 10 days)
  url.js       - HTTPS GET: 200 + size threshold + <title> + parking-page heuristic
  api.js       - JSON endpoint health: 200 + JSON parse + expected key/value
  wallet.js    - ERC20/ETH wallet balance check (Base chain)
lib/
  config.js    - DOMAINS, API_ENDPOINTS, WALLETS, RPC endpoints
  notify.js    - Discord notification + helpers
deploy/
  deploy.sh    - Deploy to newtown server

cron-daily.js  - SSL (run daily)
cron-hourly.js - URL + API + wallet (run hourly)
```

## Config

`lib/config.js`:

- **DOMAINS** — array of strings or `{ host, expectTitle? }` objects. Pure SPAs without server-rendered `<title>` (e.g. steemhunt.com) set `expectTitle: false`.
- **API_ENDPOINTS** — array of `{ name, url, expectedKey, expectedValue? }`. JSON endpoint is healthy when content-type is JSON, body parses, and `expectedKey` exists (and matches `expectedValue` if given).

## Setup

```bash
cp .env.example .env   # add DISCORD_WEBHOOK_URL
npm install
```

## Run locally

```bash
npm run daily
npm run hourly
```

## Deploy

```bash
npm run deploy
```

Clones/pulls repo on `newtown:~/ssl-checker`, installs deps, copies `.env`, and sets up cron jobs:
- **Daily (11:00 UTC)**: `cron-daily.js` - SSL certs + wallet balances
- **Hourly**: `cron-hourly.js` - URL availability + wallet balances
