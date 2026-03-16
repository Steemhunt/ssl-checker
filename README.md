# SSL Checker

Monitors SSL certificates, URL availability, and wallet balances. Sends alerts to Discord.

## Structure

```
checks/
  ssl.js       - SSL certificate expiration check
  url.js       - URL availability check (status + response size)
  wallet.js    - ERC20/ETH wallet balance check (Base chain)
lib/
  config.js    - Domains, wallets, RPC endpoints
  notify.js    - Discord notification + helpers
deploy/
  deploy.sh    - Deploy to newtown server

cron-daily.js  - SSL + wallet (run daily)
cron-hourly.js - URL + wallet (run hourly)
```

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
