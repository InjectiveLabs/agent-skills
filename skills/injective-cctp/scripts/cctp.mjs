#!/usr/bin/env node
// Headless CCTP V2 transfer CLI.
//
// Usage:
//   export CCTP_PRIVATE_KEY=0x...
//   node cctp.mjs --from ethereum --amount 100                   # → Injective
//   node cctp.mjs --from injective --to base --amount 50         # ← from Injective
//   node cctp.mjs --resume 0x<burnTxHash> --from arbitrum        # finish stuck transfer

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
  • Standard CCTP V2 transfer only — Injective does not support Fast Transfer.
    Ethereum→anywhere takes ~13 min for finality; L2s/Polygon/Avalanche are ~1 min.
  • Anyone can submit the destination receiveMessage — if your tab/process dies
    after the burn, just re-run with --resume <burnTxHash> and the script will
    skip ahead to the attestation poll + mint.
`);
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const log = (...a) => console.log('[cctp]', ...a);
const warn = (...a) => console.warn('[cctp]', ...a);
const err  = (...a) => console.error('[cctp]', ...a);

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

function shortHash(h) {
  return h ? h.slice(0, 10) + '…' + h.slice(-6) : '';
}

async function pollAttestation(srcDomain, txHash) {
  const url = `${ATTESTATION_API}/v2/messages/${srcDomain}?transactionHash=${txHash}`;
  const start = Date.now();
  const timeoutMs = 30 * 60 * 1000;
  let lastStatus = null;

  log(`polling ${url}`);
  while (true) {
    const elapsed = Date.now() - start;
    try {
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        const msg = data.messages?.[0];
        const status = msg?.status || null;
        if (status !== lastStatus) {
          log(`  attestation status: ${status || 'no message yet'} (${(elapsed / 1000).toFixed(0)}s elapsed)`);
          lastStatus = status;
        }
        if (msg && status === 'complete' && msg.attestation && msg.attestation !== 'PENDING') {
          return { message: msg.message, attestation: msg.attestation };
        }
      }
    } catch (e) {
      // network blip — retry
    }
    if (elapsed > timeoutMs) {
      throw new Error('attestation timed out after 30 minutes');
    }
    await sleep(5000);
  }
}

// ─── Main ─────────────────────────────────────────────────────────────────────
async function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.help || args.h) { help(); process.exit(0); }

  const pk = process.env.CCTP_PRIVATE_KEY;
  if (!pk) { err('CCTP_PRIVATE_KEY env var is required'); process.exit(1); }
  if (!pk.startsWith('0x')) { err('CCTP_PRIVATE_KEY must be 0x-prefixed'); process.exit(1); }
  const account = privateKeyToAccount(pk);
  log(`signer: ${account.address}`);

  const fromKey = (args.from || '').toLowerCase();
  if (!fromKey || !CHAINS[fromKey]) {
    err(`--from must be one of: ${Object.keys(CHAINS).join(', ')}`);
    process.exit(1);
  }
  const src = CHAINS[fromKey];

  // Default the destination: if source is Injective, --to is required.
  // Otherwise default to Injective.
  let toKey = (args.to || '').toLowerCase();
  if (!toKey) toKey = fromKey === 'injective' ? '' : 'injective';
  if (!toKey || !CHAINS[toKey]) {
    err(`--to must be one of: ${Object.keys(CHAINS).join(', ')}`);
    process.exit(1);
  }
  if (fromKey === toKey) { err('--from and --to must differ'); process.exit(1); }
  if (fromKey !== 'injective' && toKey !== 'injective') {
    err('one side must be "injective" — this skill only handles Injective ↔ EVM transfers');
    process.exit(1);
  }
  const dst = CHAINS[toKey];

  const recipientArg = (args.recipient || '').trim() || account.address;
  if (!isAddress(recipientArg)) { err(`invalid --recipient: ${recipientArg}`); process.exit(1); }
  const recipient = getAddress(recipientArg);
  const mintRecipient = pad(recipient, { size: 32 });

  const srcPub = publicClient(src);
  const dstPub = publicClient(dst);
  const srcWal = walletClient(src, account);
  const dstWal = walletClient(dst, account);

  log(`route: ${src.name} (domain ${src.domain}) → ${dst.name} (domain ${dst.domain})`);
  log(`recipient: ${recipient}`);

  let burnHash = args.resume || null;

  if (!burnHash) {
    // ── 1. Validate amount ─────────────────────────────────────────────────────
    const amountArg = String(args.amount || '');
    if (!amountArg) { err('--amount is required (or use --resume)'); process.exit(1); }
    let amount;
    try {
      amount = parseUnits(amountArg, 6);
    } catch (e) {
      err(`invalid --amount: ${amountArg}`);
      process.exit(1);
    }
    if (amount === 0n) { err('--amount must be > 0'); process.exit(1); }
    log(`amount: ${formatUnits(amount, 6)} USDC`);

    // ── 2. Allowance check + approve if needed ─────────────────────────────────
    const allowance = await srcPub.readContract({
      address: src.usdc,
      abi: ERC20_ABI,
      functionName: 'allowance',
      args: [account.address, src.cctp.tokenMessenger],
    });
    log(`allowance: ${formatUnits(allowance, 6)} USDC ${allowance >= amount ? '(sufficient)' : '(short — approving)'}`);

    if (allowance < amount) {
      const approveHash = await srcWal.writeContract({
        address: src.usdc,
        abi: ERC20_ABI,
        functionName: 'approve',
        args: [src.cctp.tokenMessenger, amount],
      });
      log(`approve tx: ${approveHash} → ${src.explorer}/tx/${approveHash}`);
      await srcPub.waitForTransactionReceipt({ hash: approveHash });
      log(`approve confirmed`);
    }

    // ── 3. Burn ────────────────────────────────────────────────────────────────
    log(`calling depositForBurn on ${src.name}…`);
    burnHash = await srcWal.writeContract({
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
    log(`burn confirmed`);
  } else {
    log(`resuming from existing burn tx: ${burnHash}`);
  }

  // ── 4. Attest ────────────────────────────────────────────────────────────────
  log(`waiting for Circle attestation (${src.finalityHint})…`);
  const { message, attestation } = await pollAttestation(src.domain, burnHash);
  log(`attestation received`);

  // ── 5. Mint ──────────────────────────────────────────────────────────────────
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

  return { burnHash, mintHash };
}

main().catch((e) => {
  err('failed:', e.shortMessage || e.message || String(e));
  process.exit(1);
});
