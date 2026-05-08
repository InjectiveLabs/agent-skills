// Chain configs for the CCTP V2 CLI.
//
// CCTP V2 contracts are deterministic across every V2-enabled EVM chain — the
// same TokenMessengerV2, MessageTransmitterV2, and TokenMinterV2 addresses
// work on Ethereum, Arbitrum, Base, OP, Polygon, Avalanche, and Injective EVM.
// Source: https://developers.circle.com/cctp/references/contract-addresses

export const CCTP_V2 = {
  tokenMessenger: '0x28b5a0e9C621a5BadaA536219b3a228C8168cf5d',
  messageTransmitter: '0x81D40F21F12A8F0E3252Bccb954D722d4c464B64',
  tokenMinter: '0xfd78EE919681417d192449715b2594ab58f5D002',
};

export const ATTESTATION_API = 'https://iris-api.circle.com';

// Standard-transfer parameters. Injective doesn't support Fast Transfer.
export const STANDARD_FINALITY = 2000;
export const STANDARD_MAX_FEE = 0n;
export const ZERO_BYTES32 =
  '0x0000000000000000000000000000000000000000000000000000000000000000';

// Each chain key (lowercase string) maps to one entry. The CLI accepts the
// key as `--from` / `--to`. Add chains here as Circle expands V2 support.
//
// `domain`: Circle's CCTP domain id (NOT the EVM chain id).
// `usdc`:   the chain's native, Circle-issued USDC contract.
// `rpcs`:   ordered list of public RPCs; viem's `fallback` transport rotates
//           through them on failure. publicnode.com first because it's CORS-
//           friendly and rate-tolerant.
export const CHAINS = {
  ethereum: {
    id: 1,
    domain: 0,
    name: 'Ethereum',
    rpcs: [
      'https://ethereum-rpc.publicnode.com',
      'https://eth.llamarpc.com',
      'https://eth.drpc.org',
    ],
    explorer: 'https://etherscan.io',
    nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
    usdc: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
    cctp: CCTP_V2,
    finalityHint: '~13 min for V2 standard transfer',
  },
  arbitrum: {
    id: 42161,
    domain: 3,
    name: 'Arbitrum One',
    rpcs: [
      'https://arbitrum-one-rpc.publicnode.com',
      'https://arb1.arbitrum.io/rpc',
      'https://arbitrum.drpc.org',
    ],
    explorer: 'https://arbiscan.io',
    nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
    usdc: '0xaf88d065e77c8cC2239327C5EDb3A432268e5831',
    cctp: CCTP_V2,
    finalityHint: '~1 min',
  },
  base: {
    id: 8453,
    domain: 6,
    name: 'Base',
    rpcs: [
      'https://base-rpc.publicnode.com',
      'https://mainnet.base.org',
      'https://base.drpc.org',
    ],
    explorer: 'https://basescan.org',
    nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
    usdc: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
    cctp: CCTP_V2,
    finalityHint: '~1 min',
  },
  optimism: {
    id: 10,
    domain: 2,
    name: 'OP Mainnet',
    rpcs: [
      'https://optimism-rpc.publicnode.com',
      'https://mainnet.optimism.io',
      'https://optimism.drpc.org',
    ],
    explorer: 'https://optimistic.etherscan.io',
    nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
    usdc: '0x0b2C639c533813f4Aa9D7837CAf62653d097Ff85',
    cctp: CCTP_V2,
    finalityHint: '~1 min',
  },
  polygon: {
    id: 137,
    domain: 7,
    name: 'Polygon',
    rpcs: [
      'https://polygon-bor-rpc.publicnode.com',
      'https://polygon-rpc.com',
      'https://polygon.drpc.org',
    ],
    explorer: 'https://polygonscan.com',
    nativeCurrency: { name: 'POL', symbol: 'POL', decimals: 18 },
    usdc: '0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359',
    cctp: CCTP_V2,
    finalityHint: '~5 min',
  },
  avalanche: {
    id: 43114,
    domain: 1,
    name: 'Avalanche',
    rpcs: [
      'https://avalanche-c-chain-rpc.publicnode.com',
      'https://api.avax.network/ext/bc/C/rpc',
      'https://avalanche.drpc.org',
    ],
    explorer: 'https://snowtrace.io',
    nativeCurrency: { name: 'AVAX', symbol: 'AVAX', decimals: 18 },
    usdc: '0xB97EF9Ef8734C71904D8002F8b6Bc66Dd9c48a6E',
    cctp: CCTP_V2,
    finalityHint: '~1 min',
  },
  injective: {
    id: 1776,
    domain: 29,
    name: 'Injective EVM',
    rpcs: ['https://sentry.evm-rpc.injective.network'],
    explorer: 'https://blockscout.injective.network',
    nativeCurrency: { name: 'INJ', symbol: 'INJ', decimals: 18 },
    // USDC ERC-20 on Injective EVM. Cosmos bank denom: erc20:0xa00C59fF...
    usdc: '0xa00C59fF5a080D2b954d0c75e46E22a0c371235a',
    cctp: CCTP_V2,
    finalityHint: 'standard finality',
  },
};

// ─── Testnet entries ──────────────────────────────────────────────────────────
// Domain ids match mainnet (testnets share the family domain — per Circle:
// "If a mainnet is listed, its official testnet is also supported."). Chain
// ids and USDC contracts differ. V2 contract addresses on testnets are NOT
// the same deterministic mainnet addresses — look them up at
// https://developers.circle.com/cctp/references/contract-addresses before use.
//
// To enable a testnet, copy a mainnet entry, swap in: chain id, RPC, USDC
// address, V2 contract addresses (separate testnet set), and add it under a
// distinct key like `injective-testnet`. The CLI is chain-agnostic over CHAINS
// so no other code changes are needed.
//
// Reference (from references/domains.md):
//   ethereum-sepolia    chainId 11155111  domain 0
//   avalanche-fuji      chainId 43113     domain 1
//   optimism-sepolia    chainId 11155420  domain 2
//   arbitrum-sepolia    chainId 421614    domain 3
//   base-sepolia        chainId 84532     domain 6
//   polygon-amoy        chainId 80002     domain 7
//   injective-testnet   chainId 1439      domain 29

// Build a viem-compatible chain object from one of the entries above.
export function viemChain(c) {
  return {
    id: c.id,
    name: c.name,
    nativeCurrency: c.nativeCurrency,
    rpcUrls: {
      default: { http: c.rpcs },
      public: { http: c.rpcs },
    },
    blockExplorers: {
      default: { name: 'Explorer', url: c.explorer },
    },
  };
}
