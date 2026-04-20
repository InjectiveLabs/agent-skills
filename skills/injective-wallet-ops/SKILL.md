---
name: injective-wallet-ops
description: Mass create, derive, and manage Injective wallets. Generate wallets from mnemonics (BIP-44 HD derivation), create random wallets, convert between ETH/INJ addresses, and batch fund wallets with INJ or USDT. Supports bulk wallet generation and batch funding.
license: MIT
metadata:
  author: ck
  version: "1.0.0"
---

# Injective Wallet Operations Skill

## Overview

Generate, derive, fund, and manage Injective wallets in bulk. Based on proven patterns from an Injective RFQ test framework.

## Reference Code

Key implementation files (from an Injective RFQ test framework):
- **Wallet library**: `src/rfq_test/crypto/wallet.py`
- **Mass generation**: `scripts/generate_wallets.py`, `scripts/setup_wallets.py`
- **Key derivation CLI**: `derive_key.py`
- **Mass funding**: `scripts/fund_subaccounts.py`, `scripts/fund_demo_subaccounts.py`
- **Balance checks**: `scripts/check_balances.py`, `scripts/check_all_balances.py`

## Wallet Generation

### From Mnemonic (Deterministic, BIP-44)
```python
from eth_account import Account
Account.enable_unaudited_hdwallet_features()

def generate_wallets_from_seed(seed_phrase: str, count: int, start_index: int = 0):
    wallets = []
    for i in range(start_index, start_index + count):
        path = f"m/44'/60'/0'/0/{i}"
        acct = Account.from_mnemonic(seed_phrase, account_path=path)
        eth_addr = acct.address
        inj_addr = eth_to_inj_address(eth_addr)
        wallets.append({
            "index": i,
            "private_key": acct.key.hex(),
            "eth_address": eth_addr,
            "inj_address": inj_addr,
        })
    return wallets
```

### Random Wallets
```python
import secrets
key = secrets.token_hex(32)
# Then use PrivateKey.from_hex(key) from pyinjective
```

### Address Conversion (ETH <-> INJ)

Injective is EVM-compatible: every secp256k1 key has two address encodings that map 1:1. The `0x` form (40 hex chars) is what MetaMask + bridging tools show; the `inj1` form (bech32, 38 chars after the prefix) is what Cosmos RPCs, `MsgSend`, contract state, and the indexer use. Any code that accepts a user-supplied address should accept both forms and canonicalize to `inj1` before chain ops — **rate limits, dedup keys, and authz lookups must be keyed on the inj form**, otherwise a caller can dodge them by flipping encodings.

Validation regexes (accept both, reject everything else):
```
inj1:  ^inj1[02-9ac-hj-np-z]{38}$      (bech32 charset; no b/i/o/1)
0x:    ^0x[0-9a-fA-F]{40}$              (mixed case OK; normalize to lowercase)
```

**Python** (standalone, no SDK):
```python
import bech32
def eth_to_inj_address(eth_address: str) -> str:
    eth_bytes = bytes.fromhex(eth_address.removeprefix("0x"))
    five_bit = bech32.convertbits(eth_bytes, 8, 5)
    return bech32.bech32_encode("inj", five_bit)

def inj_to_eth_address(inj_address: str) -> str:
    _, five_bit = bech32.bech32_decode(inj_address)
    eight_bit = bech32.convertbits(five_bit, 5, 8, False)
    return "0x" + bytes(eight_bit).hex()
```

**Node / TypeScript** (via `@injectivelabs/sdk-ts`, preferred when the project already depends on it):
```ts
import { getInjectiveAddress, getEthereumAddress } from '@injectivelabs/sdk-ts';

// 0x → inj1
const inj = getInjectiveAddress('0xYourEthAddress…40hex');
// inj1 → 0x (lowercase)
const eth = getEthereumAddress('inj1yourbech32address…');
```

**Accept-either pattern** (server accepting an external address):
```ts
const INJ_BECH32 = /^inj1[02-9ac-hj-np-z]{38}$/;
const ETH_HEX    = /^0x[0-9a-fA-F]{40}$/;

function normalize(raw: string) {
  const s = raw.trim();
  if (INJ_BECH32.test(s)) return { inj: s,                       eth: getEthereumAddress(s).toLowerCase() };
  if (ETH_HEX.test(s))    return { inj: getInjectiveAddress(s),  eth: s.toLowerCase() };
  throw new Error('malformed address — expected inj1… (43 chars) or 0x… (42 chars)');
}
```

The `PrivateKey.toBech32()` / `.toAddress()` methods on sdk-ts's `PrivateKey` return these two forms from a key directly — useful when you're generating + need both at once.

## Mass Funding

### Send INJ to Many Wallets (batched MsgSend)
The `setup_wallets.py` pattern batches up to 200 `MsgSend` messages in a single transaction:
```python
from pyinjective.composer import Composer
from pyinjective.transaction import Transaction

msgs = []
for wallet in wallets:
    msg = composer.msg_send(
        sender=funder_address,
        receiver=wallet["inj_address"],
        amount=amount,
        denom="inj"
    )
    msgs.append(msg)
# Submit all msgs in one tx
```

### Deposit to Exchange Subaccount
After funding bank accounts, deposit to trading subaccounts:
```python
from pyinjective.core.broadcaster import MsgBroadcasterWithPk

msg = composer.msg_subaccount_deposit(
    sender=address,
    subaccount_id=get_subaccount_id(address, nonce=0),
    amount=Decimal(str(amount)),
    denom=denom
)
```

### Two-Step USDT Funding (testnet)
1. Parent wallet sends USDT via bank `MsgSend` to child
2. Child deposits USDT from bank to exchange subaccount

## Balance Checks
```python
# Bank balance
balance = await client.fetch_bank_balance(address, denom)

# Subaccount deposit
deposits = await client.fetch_subaccount_deposits(subaccount_id)
```

## Environment Config
- Env var prefix pattern: `{ENV}_LOAD_TEST_MM_SEED_PHRASE`, `{ENV}_LOAD_TEST_RETAIL_SEED_PHRASE`
- Or comma-separated key lists: `TESTNET_MM_KEYS=hex1,hex2,...`
- YAML configs at `configs/{env}.yaml`

## Dependencies
- `injective-py>=1.12.0`
- `eth-account>=0.11.0`
- `bech32>=1.2.0`
- Python >= 3.11
