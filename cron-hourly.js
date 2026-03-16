#!/usr/bin/env node

require("dotenv").config();

const url = require("./checks/url");
const wallet = require("./checks/wallet");

async function main() {
  await url.run();
  await wallet.run();
}

main().catch(console.error);
