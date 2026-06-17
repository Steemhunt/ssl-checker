// Each entry is either a string (default options) or {host, expectTitle?}.
// expectTitle defaults to true. Pure client-rendered SPAs without a <title>
// in their SSR HTML should set expectTitle: false.
const DOMAINS = [
  // hunt.town family (mintpad)
  "hunt.town",
  "api.hunt.town",
  "token.hunt.town",
  // verify subdomain (newtown)
  "verify.hunt.town",
  // mintpad-hosted sebayaki subdomains
  "signet.sebayaki.com",
  "onchat.sebayaki.com",
  "splitfolio.sebayaki.com",
  // mintclub (jammy server, multiple legacy versions still served)
  "dixel.club",
  "v1.dixel.club",
  "v2.dixel.club",
  "mint.club",
  "v1.mint.club",
  // ac (Hetzner)
  "ac.800.works",
  "throne.800.works",
  "pumpclaw.com",
  // nomadtask (Rails)
  "nomadtask.com",
  "review.hunt.town",
  "neverlose.money",
  // steemhunt (SPA — title set by React Helmet at runtime)
  { host: "steemhunt.com", expectTitle: false },
  // tv (legacy)
  "lol.hunt.town",
  "barkapp.co",
  // personal / portfolio
  "sebayaki.com",
  "mfer.sebayaki.com",
  "800.works",
  "news.800.works",
];

// JSON API endpoints checked for valid JSON + expected key/value.
const API_ENDPOINTS = [
  {
    name: "fc.hunt.town (farcaster indexer)",
    url: "https://fc.hunt.town/",
    expectedKey: "message",
  },
  {
    name: "lol-api.hunt.town (tvhunt rails)",
    url: "https://lol-api.hunt.town/",
    expectedKey: "status",
    expectedValue: "ok",
  },
];

const WALLETS = [
  // {
  //   walletAddress: "0x6Bc50949F2b1301082Aa863A7C4869f49099Cd8b",
  //   monitoringToken: "0x37f0c2915CeCC7e977183B8543Fc0864d03E064C",
  //   lowBalanceThreshold: 1000,
  //   name: "Hunt Town Airdorp",
  // },
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

module.exports = { DOMAINS, API_ENDPOINTS, WALLETS, BASE_RPC_ENDPOINTS };
