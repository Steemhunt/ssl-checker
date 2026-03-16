#!/usr/bin/env node

require("dotenv").config({ quiet: true });

const url = require("./checks/url");
const wallet = require("./checks/wallet");

async function main() {
  await url.run();
  await wallet.run();
  process.exit(0);
}

main().catch((e) => { console.error(e); process.exit(1); });
