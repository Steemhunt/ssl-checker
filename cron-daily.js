#!/usr/bin/env node

require("dotenv").config();

const ssl = require("./checks/ssl");
const wallet = require("./checks/wallet");

async function main() {
  await ssl.run();
  await wallet.run();
}

main().catch(console.error);
