const DOMAINS = [
  "hunt.town",
  "nomadtask.com",
  "steemhunt.com",
  "dixel.club",
  "mint.club",
  "barkapp.co",
  "neverlose.money",
  "sebayaki.com",
  "signet.sebayaki.com",
  "onchat.sebayaki.com",
  "800.works",
  "news.800.works",
  "pumpclaw.com",
];

const WALLETS = [
  {
    walletAddress: "0x6Bc50949F2b1301082Aa863A7C4869f49099Cd8b",
    monitoringToken: "0x37f0c2915CeCC7e977183B8543Fc0864d03E064C",
    lowBalanceThreshold: 1000,
    name: "Hunt Town Airdorp",
  },
  {
    walletAddress: "0xfb51D2120c27bB56D91221042cb2dd2866a647fE",
    monitoringToken: "0x37f0c2915CeCC7e977183B8543Fc0864d03E064C",
    lowBalanceThreshold: 30000,
    name: "Mintpad Co-op Rewards",
  }
];

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

module.exports = { DOMAINS, WALLETS, BASE_RPC_ENDPOINTS };
