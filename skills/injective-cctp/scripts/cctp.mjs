#!/usr/bin/env node
// Headless CCTP V2 transfer CLI.
//
// Usage:
//   export CCTP_PRIVATE_KEY=0x...
//   node cctp.mjs --from ethereum --amount 100                   # → Injective
//   node cctp.mjs --from injective --to base --amount 50         # ← from Injective
//   node cctp.mjs --resume 0x<burnTxHash> --from arbitrum        # finish stuck transfer
//
// FUTURE: when @circle-fin/bridge-kit (https://www.npmjs.com/package/@circle-fin/bridge-kit)
// adds Injective configurations, the burn / poll / mint stages below collapse
// into a few SDK calls. Tracked in references/domains.md → "Future: bridge-kit
// migration". Until then this CLI implements the V2 flow directly so it can
// run today.

import {
  createPublicClient,
  createWalletClient,
  http,
  fallback,
  parseUnits,
  formatUnits,
  pad,
  getAddress,
  isAddress,
} from 'viem';
import { privateKeyToAccount } from 'viem/accounts';

import {
  CHAINS,
  ATTESTATION_API,
  STANDARD_FINALITY,
  STANDARD_MAX_FEE,
  ZERO_BYTES32,
  viemChain,
} from './chains.mjs';
import {
  TOKEN_MESSENGER_V2_ABI,
  MESSAGE_TRANSMITTER_V2_ABI,
  ERC20_ABI,
} from './abis.mjs';

// ─── Logging ──────────────────────────────────────────────────────────────────
const log  = (...a) => console.log('[cctp]', ...a);
const warn = (...a) => console.warn('[cctp]', ...a);
const err  = (...a) => console.error('[cctp]', ...a);

// ─── Helpers ──────────────────────────────────────────────────────────────────
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function publicClient(chain) {
  return createPublicClient({
    chain: viemChain(chain),
    transport: fallback(chain.rpcs.map((url) => http(url, { timeout: 8000 }))),
  });
}

function walletClient(chain, account) {
  return createWalletClient({
    account,
    chain: viemChain(chain),
    transport: fallback(chain.rpcs.map((url) => http(url, { timeout: 12_000 }))),
  });
}

// ─── Args ─────────────────────────────────────────────────────────────────────
function parseArgs(argv) {
  const out = { positional: [] };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a.startsWith('--')) {
      const key = a.slice(2);
      const next = argv[i + 1];
      if (next === undefined || next.startsWith('--')) {
        out[key] = true;
      } else {
        out[key] = next;
        i++;
      }
    } else {
      out.positional.push(a);
    }
  }
  return out;
}

function help() {
  console.log(`
injective-cctp — bridge native USDC to/from Injective EVM via CCTP V2

USAGE
  node cctp.mjs --from <chain> [--to <chain>] --amount <usdc>
  node cctp.mjs --resume <burnTxHash> --from <chain>

ARGUMENTS
  --from <chain>        Source chain key (one of: ${Object.keys(CHAINS).join(', ')})
  --to <chain>          Destination chain key (default: injective if --from is something
                        else, or required if --from injective)
  --amount <decimal>    USDC amount (e.g. 100 or 12.5). 6-decimal token; we parse it.
  --recipient <0x...>   Destination address (default: signer's own address)
  --resume <txHash>     Skip approve+burn; pick up from attestation poll for this tx hash
  --help, -h            Show this help

ENVIRONMENT
  CCTP_PRIVATE_KEY      0x-prefixed signer private key (REQUIRED). Same key is used on
                        both source and destination — viem builds two wallet clients.

EXAMPLES
  CCTP_PRIVATE_KEY=0xabc... node cctp.mjs --from ethereum --amount 100
  CCTP_PRIVATE_KEY=0xabc... node cctp.mjs --from injective --to base --amount 50
  CCTP_PRIVATE_KEY=0xabc... node cctp.mjs --resume 0xdead... --from ethereum

NOTES
  • Standard CCTP V2 transfer only — Injective doesn't need Fast Transfer
    (~600ms blocks, instant finality). See references/domains.md.
  • Anyone can submit the destination receiveMessage — if your tab/process dies
    after the burn, just re-run with --resume <burnTxHash> and the script will
    skip ahead to the attestation poll + mint.
`);
}

// ─── Stage 1: parse + validate ────────────────────────────────────────────────
function setUp(argv) {
  const args = parseArgs(argv);
  if (args.help || args.h) { help(); process.exit(0); }

  const pk = process.env.CCTP_PRIVATE_KEY;
  if (!pk) throw new Error('CCTP_PRIVATE_KEY env var is required');
  if (!pk.startsWith('0x')) throw new Error('CCTP_PRIVATE_KEY must be 0x-prefixed');
  const account = privateKeyToAccount(pk);

  const fromKey = (args.from || '').toLowerCase();
  if (!fromKey || !CHAINS[fromKey]) {
    throw new Error(`--from must be one of: ${Object.keys(CHAINS).join(', ')}`);
  }
  const src = CHAINS[fromKey];

  let toKey = (args.to || '').toLowerCase();
  if (!toKey) toKey = fromKey === 'injective' ? '' : 'injective';
  if (!toKey || !CHAINS[toKey]) {
    throw new Error(`--to must be one of: ${Object.keys(CHAINS).join(', ')}`);
  }
  if (fromKey === toKey) throw new Error('--from and --to must differ');
  if (fromKey !== 'injective' && toKey !== 'injective') {
    throw new Error('one side must be "injective" — this skill only handles Injective ↔ EVM transfers');
  }
  const dst = CHAINS[toKey];

  const recipientArg = (args.recipient || '').trim() || account.address;
  if (!isAddress(recipientArg)) throw new Error(`invalid --recipient: ${recipientArg}`);
  const recipient = getAddress(recipientArg);
  const mintRecipient = pad(recipient, { size: 32 });

  let amount = null;
  if (!args.resume) {
    const amountArg = String(args.amount || '');
    if (!amountArg) throw new Error('--amount is required (or use --resume)');
    try {
      amount = parseUnits(amountArg, 6);
    } catch {
      throw new Error(`invalid --amount: ${amountArg}`);
    }
    if (amount === 0n) throw new Error('--amount must be > 0');
  }

  return {
    account,
    src,
    dst,
    amount,
    recipient,
    mintRecipient,
    resumeBurnHash: args.resume || null,
  };
}

// ─── Stage 2: approve (skipped if allowance is sufficient) ────────────────────
async function approveIfNeeded({ srcPub, srcWal, src, account, amount }) {
  const allowance = await srcPub.readContract({
    address: src.usdc,
    abi: ERC20_ABI,
    functionName: 'allowance',
    args: [account.address, src.cctp.tokenMessenger],
  });
  log(`allowance: ${formatUnits(allowance, 6)} USDC ${allowance >= amount ? '(sufficient — skipping approve)' : '(short — approving)'}`);
  if (allowance >= amount) return null;

  const approveHash = await srcWal.writeContract({
    address: src.usdc,
    abi: ERC20_ABI,
    functionName: 'approve',
    args: [src.cctp.tokenMessenger, amount],
  });
  log(`approve tx: ${approveHash} → ${src.explorer}/tx/${approveHash}`);
  await srcPub.waitForTransactionReceipt({ hash: approveHash });
  log('approve confirmed');
  return approveHash;
}

// ─── Stage 3: burn on the source chain ────────────────────────────────────────
async function burn({ srcPub, srcWal, src, dst, amount, mintRecipient }) {
  log(`calling depositForBurn on ${src.name}…`);
  const burnHash = await srcWal.writeContract({
    address: src.cctp.tokenMessenger,
    abi: TOKEN_MESSENGER_V2_ABI,
    functionName: 'depositForBurn',
    args: [
      amount,
      dst.domain,
      mintRecipient,
      src.usdc,
      ZERO_BYTES32,
      STANDARD_MAX_FEE,
      STANDARD_FINALITY,
    ],
  });
  log(`burn tx: ${burnHash} → ${src.explorer}/tx/${burnHash}`);
  await srcPub.waitForTransactionReceipt({ hash: burnHash });
  log('burn confirmed');
  return burnHash;
}

// ─── Stage 4: poll Circle's attestation API ───────────────────────────────────
//
// Each iteration falls into exactly one of:
//   • complete                 → return the attestation, exit the loop
//   • pending (200, no msg yet OR status:pending_confirmations OR PENDING attestation)
//                              → re-poll silently, log only when status changes
//   • transient (404 / 5xx)    → log once with status code, re-poll
//   • throttled (429)          → log + back off
//   • network error            → log the error message, re-poll
//   • timeout (>30 min)        → throw
//
// The previous version wrapped everything in a single try/catch that swallowed
// non-2xx responses and network failures alike, so a 30-min stalled poll could
// produce zero output. Now each path is logged distinctly.
async function pollAttestation(srcDomain, txHash) {
  const url = `${ATTESTATION_API}/v2/messages/${srcDomain}?transactionHash=${txHash}`;
  log(`polling ${url}`);

  const start = Date.now();
  const TIMEOUT_MS = 30 * 60 * 1000;
  const POLL_MS = 5_000;
  const BACKOFF_MS = 30_000;
  let lastStatus = null;
  let backoffUntil = 0;

  while (true) {
    const elapsed = Date.now() - start;
    if (elapsed > TIMEOUT_MS) {
      throw new Error(`attestation timed out after ${(TIMEOUT_MS / 60000).toFixed(0)} minutes`);
    }

    if (Date.now() < backoffUntil) {
      await sleep(backoffUntil - Date.now());
      continue;
    }

    let res;
    try {
      res = await fetch(url);
    } catch (e) {
      // Network-level failure (DNS, connection refused, etc.) — distinct from
      // an HTTP error. Log and retry on the same poll cadence.
      warn(`network error after ${(elapsed / 1000).toFixed(0)}s: ${e.message} — retrying in ${POLL_MS / 1000}s`);
      await sleep(POLL_MS);
      continue;
    }

    if (res.status === 429) {
      warn(`rate-limited (429) after ${(elapsed / 1000).toFixed(0)}s — backing off ${BACKOFF_MS / 1000}s`);
      backoffUntil = Date.now() + BACKOFF_MS;
      continue;
    }
    if (res.status === 404) {
      // 404 is normal for the first poll or two — Circle hasn't observed the
      // tx yet. Only log once per status transition.
      if (lastStatus !== '404') {
        log(`  no message yet (${(elapsed / 1000).toFixed(0)}s elapsed) — Circle hasn't seen the burn yet, will keep polling`);
        lastStatus = '404';
      }
      await sleep(POLL_MS);
      continue;
    }
    if (res.status >= 500) {
      warn(`Circle API ${res.status} after ${(elapsed / 1000).toFixed(0)}s — retrying in ${POLL_MS / 1000}s`);
      await sleep(POLL_MS);
      continue;
    }
    if (!res.ok) {
      warn(`unexpected ${res.status} ${res.statusText} after ${(elapsed / 1000).toFixed(0)}s — retrying`);
      await sleep(POLL_MS);
      continue;
    }

    let data;
    try {
      data = await res.json();
    } catch (e) {
      warn(`malformed JSON from Circle: ${e.message} — retrying`);
      await sleep(POLL_MS);
      continue;
    }

    const msg = data?.messages?.[0];
    const status = msg?.status || 'no_message';

    if (status !== lastStatus) {
      log(`  attestation status: ${status} (${(elapsed / 1000).toFixed(0)}s elapsed)`);
      lastStatus = status;
    }

    if (msg && status === 'complete' && msg.attestation && msg.attestation !== 'PENDING') {
      return { message: msg.message, attestation: msg.attestation };
    }
    await sleep(POLL_MS);
  }
}

// ─── Stage 5: mint on the destination chain ───────────────────────────────────
async function mint({ dstPub, dstWal, dst, message, attestation, recipient }) {
  log(`calling receiveMessage on ${dst.name}…`);
  const mintHash = await dstWal.writeContract({
    address: dst.cctp.messageTransmitter,
    abi: MESSAGE_TRANSMITTER_V2_ABI,
    functionName: 'receiveMessage',
    args: [message, attestation],
  });
  log(`mint tx: ${mintHash} → ${dst.explorer}/tx/${mintHash}`);
  await dstPub.waitForTransactionReceipt({ hash: mintHash });
  log(`mint confirmed — USDC now on ${dst.name} at ${recipient}`);
  return mintHash;
}

// ─── Main orchestration ───────────────────────────────────────────────────────
async function main() {
  const ctx = setUp(process.argv.slice(2));
  const { account, src, dst, amount, recipient, mintRecipient, resumeBurnHash } = ctx;

  log(`signer: ${account.address}`);
  log(`route: ${src.name} (domain ${src.domain}) → ${dst.name} (domain ${dst.domain})`);
  log(`recipient: ${recipient}`);

  const srcPub = publicClient(src);
  const dstPub = publicClient(dst);
  const srcWal = walletClient(src, account);
  const dstWal = walletClient(dst, account);

  let burnHash = resumeBurnHash;
  if (!burnHash) {
    log(`amount: ${formatUnits(amount, 6)} USDC`);
    await approveIfNeeded({ srcPub, srcWal, src, account, amount });
    burnHash = await burn({ srcPub, srcWal, src, dst, amount, mintRecipient });
  } else {
    log(`resuming from existing burn tx: ${burnHash}`);
  }

  log(`waiting for Circle attestation (${src.finalityHint})…`);
  const { message, attestation } = await pollAttestation(src.domain, burnHash);
  log('attestation received');

  const mintHash = await mint({ dstPub, dstWal, dst, message, attestation, recipient });
  return { burnHash, mintHash };
}

main().catch((e) => {
  err('failed:', e.shortMessage || e.message || String(e));
  process.exit(1);
});
