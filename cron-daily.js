#!/usr/bin/env node

require("dotenv").config({ quiet: true });

const ssl = require("./checks/ssl");
const wallet = require("./checks/wallet");

async function main() {
  await ssl.run();
  await wallet.run();
  process.exit(0);
}

main().catch((e) => { console.error(e); process.exit(1); });
