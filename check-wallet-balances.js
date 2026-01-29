#!/usr/bin/env node

const {
  createPublicClient,
  http,
  fallback,
  formatEther,
  formatUnits,
} = require("viem");
const { base } = require("viem/chains");
const request = require("request");
require("dotenv").config();

function format(date) {
  return date.toLocaleString("sv-SE");
}

// RPC endpoints for Base mainnet (prioritized by reliability)
const BASE_RPC_ENDPOINTS = [
  "https://base-rpc.publicnode.com",
  "https://base.drpc.org",
  "https://base.llamarpc.com",
  "https://base.meowrpc.com",
  "https://mainnet.base.org",
  "https://developer-access-mainnet.base.org",
  "https://base-mainnet.public.blastapi.io",
  "https://base-public.nodies.app",
  "https://rpc.poolz.finance/base",
  "https://api.zan.top/base-mainnet",
  "https://1rpc.io/base",
  "https://endpoints.omniatech.io/v1/base/mainnet/public",
  "https://rpc.owlracle.info/base/70d38ce1826c4a60bb2a8e05a6c8b20f",
  "https://base.public.blockpi.network/v1/rpc/public",
];

// Wallets to monitor
// monitoringToken: "ETH" for native balance, or ERC20 contract address
const WALLETS_TO_MONITOR = [
  {
    walletAddress: "0x6Bc50949F2b1301082Aa863A7C4869f49099Cd8b",
    monitoringToken: "0x37f0c2915CeCC7e977183B8543Fc0864d03E064C",
    lowBalanceThreshold: 1000, // 1000 HUNT
    name: "Hunt Town Airdorp",
  },
  {
    walletAddress: "0xfb51D2120c27bB56D91221042cb2dd2866a647fE",
    monitoringToken: "0x37f0c2915CeCC7e977183B8543Fc0864d03E064C",
    lowBalanceThreshold: 50000, // 50000 HUNT
    name: "Mintpad Co-op Rewards",
  },
  {
    walletAddress: "0x78981Ca2f04F97975EaA5b2d69Bc1db50459bDe5",
    monitoringToken: "0xDF2B673Ec06d210C8A8Be89441F8de60B5C679c9",
    lowBalanceThreshold: 2000, // 2000 SIGNET
    name: "Signet Airdrop",
  },
];

const DISCORD_WEBHOOK_URL = process.env.DISCORD_WEBHOOK_URL;

// ERC20 ABI (minimal for balance check)
const ERC20_ABI = [
  {
    inputs: [{ name: "account", type: "address" }],
    name: "balanceOf",
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "decimals",
    outputs: [{ name: "", type: "uint8" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "symbol",
    outputs: [{ name: "", type: "string" }],
    stateMutability: "view",
    type: "function",
  },
];

// Create public client with fallback RPCs
const publicClient = createPublicClient({
  chain: base,
  transport: fallback(
    BASE_RPC_ENDPOINTS.map((url) =>
      http(url, {
        timeout: 10_000,
        retryCount: 1,
      }),
    ),
  ),
});

async function checkNativeBalance(wallet) {
  const balance = await publicClient.getBalance({
    address: wallet.walletAddress,
  });
  const balanceInEth = parseFloat(formatEther(balance));
  return { balance: balanceInEth, symbol: "ETH" };
}

async function checkERC20Balance(wallet) {
  const [balance, decimals, symbol] = await Promise.all([
    publicClient.readContract({
      address: wallet.monitoringToken,
      abi: ERC20_ABI,
      functionName: "balanceOf",
      args: [wallet.walletAddress],
    }),
    wallet.tokenDecimals
      ? Promise.resolve(wallet.tokenDecimals)
      : publicClient.readContract({
          address: wallet.monitoringToken,
          abi: ERC20_ABI,
          functionName: "decimals",
        }),
    wallet.tokenSymbol
      ? Promise.resolve(wallet.tokenSymbol)
      : publicClient.readContract({
          address: wallet.monitoringToken,
          abi: ERC20_ABI,
          functionName: "symbol",
        }),
  ]);

  const balanceFormatted = parseFloat(formatUnits(balance, decimals));
  return { balance: balanceFormatted, symbol };
}

async function sendDiscordNotification(message) {
  return new Promise((resolve, reject) => {
    request.post(
      DISCORD_WEBHOOK_URL,
      {
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: message }),
      },
      (error, response, body) => {
        if (error) {
          console.error(`Error sending to Discord: ${error}`);
          reject(error);
        } else {
          resolve();
        }
      },
    );
  });
}

async function checkWallet(wallet) {
  const walletName = wallet.name || wallet.walletAddress.slice(0, 10) + "...";

  try {
    const isNative = wallet.monitoringToken === "ETH";
    const { balance, symbol } = isNative
      ? await checkNativeBalance(wallet)
      : await checkERC20Balance(wallet);

    let status;
    let shouldNotify = false;

    if (balance < wallet.lowBalanceThreshold) {
      status = `⚠️ LOW BALANCE - ${walletName} - ${balance.toFixed(6)} ${symbol} (threshold: ${wallet.lowBalanceThreshold} ${symbol})`;
      shouldNotify = true;
    } else {
      status = `OK - ${walletName} - ${balance.toFixed(6)} ${symbol}`;
    }

    console.log(status);

    if (shouldNotify && DISCORD_WEBHOOK_URL) {
      await sendDiscordNotification(status);
    }
  } catch (error) {
    const errorStatus = `ERROR - ${walletName} - Failed to check balance: ${error.message}`;
    console.error(errorStatus);

    if (DISCORD_WEBHOOK_URL) {
      await sendDiscordNotification(errorStatus);
    }
  }
}

async function main() {
  console.log(`---\nCheck wallet balances: ${format(new Date())}\n---`);

  if (!DISCORD_WEBHOOK_URL) {
    console.warn(
      "Warning: DISCORD_WEBHOOK_URL not set. Notifications will be skipped.",
    );
  }

  for (const wallet of WALLETS_TO_MONITOR) {
    await checkWallet(wallet);
  }
}

main().catch(console.error);
