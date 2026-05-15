---
name: injective-frontend-wallet
description: Build, review, or debug browser frontends that sign and broadcast Injective transactions with Keplr, Leap, MetaMask, CosmJS, @injectivelabs/sdk-ts, or CosmWasm execute messages. Use this whenever implementing Injective React/Vite/Next apps, wallet connect flows, swap-contract UIs, MsgExecuteContract, MsgBroadcaster, or when errors mention EthAccount, ethsecp256k1, invalid pubkey, account sequence, signer address, Keplr, Leap, or browser wallet signing.
license: MIT
metadata:
  author: ckhbtc
  version: "1.0.0"
  filePattern:
    - "**/*wallet*"
    - "**/*keplr*"
    - "**/*leap*"
    - "**/*cosmwasm*"
    - "**/*swap*"
  bashPattern:
    - "EthAccount"
    - "ethsecp256k1"
    - "invalid pubkey"
    - "MsgExecuteContract"
---

# Injective Frontend Wallet

Use this skill before shipping any Injective browser transaction flow. Injective looks Cosmos-shaped at the transaction layer, but its accounts and public keys are Ethereum-style. Generic Cosmos frontend code often reaches the quote screen and then fails at signing or CheckTx.

## First Decision

Choose the signing stack deliberately:

1. Prefer `@injectivelabs/sdk-ts` / Injective broadcaster utilities when the app already uses the Injective SDK and the transaction type is covered.
2. Use CosmJS for CosmWasm frontends only if you explicitly handle Injective account and pubkey compatibility.
3. Do not assume a Keplr/Leap `inj1...` address means generic `/cosmos.crypto.secp256k1.PubKey` signing will validate on-chain.

## Required Checks

Before calling the work complete, verify these on the actual signing path:

- Query account metadata from LCD: `GET /cosmos/auth/v1beta1/accounts/{injAddress}`.
- If the account `@type` is `/injective.types.v1beta1.EthAccount`, parse `base_account.account_number` and `base_account.sequence`; do not rely on CosmJS' default `accountFromAny`.
- Ensure transaction `AuthInfo.signer_infos[0].public_key.type_url` is `/injective.crypto.v1beta1.ethsecp256k1.PubKey`.
- Ensure the public key bytes are encoded as protobuf field 1 (`0a <len> <compressed-pubkey>`), same field shape as the standard secp256k1 key but with the Injective type URL.
- For direct signing, sign the `SignDoc` that contains that Injective pubkey in `authInfoBytes`; otherwise the wallet signs bytes that differ from the broadcast transaction.
- Use the wallet address returned for chain `injective-1`; do not derive or substitute addresses from another chain account without conversion checks.

## Common Failures

If the error is:

- `Unsupported type: '/injective.types.v1beta1.EthAccount'`: the client is using a generic Cosmos account parser for sequence/account number. Patch `getSequence()` or use Injective SDK account querying.
- `pubKey does not match signer address ... invalid pubkey`: `AuthInfo` likely contains `/cosmos.crypto.secp256k1.PubKey`; use `/injective.crypto.v1beta1.ethsecp256k1.PubKey`.
- `account does not exist on chain`: the wallet has never transacted or is unfunded. Fund it with INJ and retry after the account exists.
- `signature verification failed`: inspect sign mode, signed `authInfoBytes`, account number, sequence, and chain ID before changing business logic.

## CosmJS Compatibility Pattern

When using `SigningCosmWasmClient` against Injective:

1. Connect with the wallet signer.
2. Patch or wrap `getSequence(address)` so it reads account number and sequence from Injective LCD for `EthAccount`.
3. Patch direct signing so `AuthInfo` uses the Injective ethsecp pubkey type URL.
4. Keep the actual business message unchanged, e.g. `MsgExecuteContract` for a swap contract.
5. Add unit tests for the account payload and pubkey encoding helpers.

Minimal helper expectations:

```ts
const INJECTIVE_PUBKEY_TYPE = "/injective.crypto.v1beta1.ethsecp256k1.PubKey";
const INJECTIVE_ACCOUNT_TYPE = "/injective.types.v1beta1.EthAccount";
```

## Swap Contract Frontends

For Injective swap-contract UIs:

- Query the contract for routes and quotes; do not inspect orderbooks in the browser unless the task explicitly requires independent analytics.
- Execute the swap contract message (`swap_min_output` or `swap_exact_output`) with exactly one input coin in funds.
- Keep RFQ and direct exchange-module order placement out of scope unless the user asks for those venues.
- Apply slippage to the contract quote's raw output quantity, not the formatted decimal string.
- Test a live quote and a dry signing-path construction before asking the user to sign real funds.

## Regression Checklist

Add at least these tests or harness checks:

- Parse an Injective `EthAccount` LCD fixture into `{ accountNumber, sequence }`.
- Encode an Injective ethsecp pubkey and assert the type URL exactly.
- Build a tx or signing harness and assert `authInfoBytes` contains the Injective pubkey type before broadcast.
- Run `typecheck`, unit tests, and a production build for browser apps.

## Do Not Ship Until

- The account type and pubkey type checks above have been run.
- The transaction path has been tested with the same wallet family the user will use, typically Keplr or Leap for `inj1`.
- Any fallback to generic CosmJS behavior is documented as unsafe for Injective unless proven with the checks above.
