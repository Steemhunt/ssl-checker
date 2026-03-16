const {
  createPublicClient,
  http,
  fallback,
  formatEther,
  formatUnits,
} = require("viem");
const { base } = require("viem/chains");
const { WALLETS, BASE_RPC_ENDPOINTS } = require("../lib/config");
const { format, sendDiscord } = require("../lib/notify");

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

const client = createPublicClient({
  chain: base,
  transport: fallback(
    BASE_RPC_ENDPOINTS.map((url) => http(url, { timeout: 10_000, retryCount: 1 })),
  ),
});

async function getBalance(wallet) {
  if (wallet.monitoringToken === "ETH") {
    const balance = await client.getBalance({ address: wallet.walletAddress });
    return { balance: parseFloat(formatEther(balance)), symbol: "ETH" };
  }

  const [balance, decimals, symbol] = await Promise.all([
    client.readContract({
      address: wallet.monitoringToken,
      abi: ERC20_ABI,
      functionName: "balanceOf",
      args: [wallet.walletAddress],
    }),
    client.readContract({
      address: wallet.monitoringToken,
      abi: ERC20_ABI,
      functionName: "decimals",
    }),
    client.readContract({
      address: wallet.monitoringToken,
      abi: ERC20_ABI,
      functionName: "symbol",
    }),
  ]);

  return { balance: parseFloat(formatUnits(balance, decimals)), symbol };
}

async function checkWallet(wallet) {
  const name = wallet.name || wallet.walletAddress.slice(0, 10) + "...";

  try {
    const { balance, symbol } = await getBalance(wallet);
    const isLow = balance < wallet.lowBalanceThreshold;
    const status = isLow
      ? `⚠️ LOW - ${name} - ${balance.toFixed(4)} ${symbol} (threshold: ${wallet.lowBalanceThreshold})`
      : `OK - ${name} - ${balance.toFixed(4)} ${symbol}`;

    console.log(`[WALLET] ${status}`);
    if (isLow) await sendDiscord(`[WALLET] ${status}`);
  } catch (err) {
    const status = `ERROR - ${name} - ${err.message}`;
    console.error(`[WALLET] ${status}`);
    await sendDiscord(`[WALLET] ${status}`);
  }
}

async function run() {
  console.log(`\n--- Wallet check: ${format(new Date())} ---`);
  for (const wallet of WALLETS) {
    await checkWallet(wallet);
  }
}

module.exports = { run };
