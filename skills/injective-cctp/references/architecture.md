# CCTP V2 — protocol architecture

## What CCTP is

Circle's **Cross-Chain Transfer Protocol** is a burn-and-mint mechanism for moving **native USDC** between chains. Unlike a lock-and-mint bridge, no wrapped or bridged USDC is created — the source chain's USDC is destroyed and the destination chain's USDC is freshly minted by Circle's contracts.

This means:
- **No bridge risk on the asset side.** Wrapped USDC like USDC.e or USDCnb has off-chain backing assumptions that can break (Multichain, etc.). CCTP-minted USDC is the same asset Circle issues directly, just on a different chain.
- **No liquidity pool dependency.** The source liquidity isn't pooled — it's burned. The destination supply isn't pooled either — it's minted on demand.

## V2 vs V1

V2 was Circle's 2024-2025 upgrade with three major changes:
1. **Faster attestations.** "Standard" V2 transfers wait for hard finality on the source chain (still ~13 min on Ethereum, but Injective and most L2s are quicker). "Fast" transfers use a confirmed-but-not-finalized state with a small fee, ~8s on supported chains.
2. **Hooks.** Destination contracts can attach a callback that runs as part of the mint, enabling atomic same-tx swaps / deposits / liquidations.
3. **Deterministic addresses.** The V2 contract addresses are the same on every V2-enabled chain — no per-chain lookup needed.

This skill uses **standard transfer only** because Injective doesn't support Fast Transfer per Circle's [supported-chains list](https://developers.circle.com/cctp/cctp-supported-blockchains).

## The five steps

Every CCTP transfer goes through the same five steps. Anything calling itself a "CCTP transfer" is doing some subset of these:

### 1. Approve

Standard ERC-20 allowance grant. The source `TokenMessenger` contract needs to be allowed to pull `amount` USDC from the user's address.

```
USDC.approve(TokenMessenger, amount)
```

Skip this step if the user has already approved enough allowance from a previous transfer. Many users approve `MaxUint256` once and never have to approve again.

### 2. Burn

The user calls `depositForBurn` on the source chain's `TokenMessengerV2`. This:
- Pulls `amount` USDC from the user via the allowance.
- Burns it.
- Emits a `MessageSent(bytes message)` event with the cross-chain payload.
- Returns a uint64 nonce.

Args (V2):
```
depositForBurn(
  uint256 amount,
  uint32  destinationDomain,        // Circle's domain id, NOT EVM chain id
  bytes32 mintRecipient,            // bytes32-padded destination address
  address burnToken,                // USDC contract on the source chain
  bytes32 destinationCaller,        // bytes32(0) = anyone can submit the mint
  uint256 maxFee,                   // 0 for standard transfer
  uint32  minFinalityThreshold      // 2000 for standard, 1000 for fast
)
```

### 3. Attest

Circle runs an off-chain attestation service ("iris-api") that watches every chain. After the burn tx hits the source chain's finality threshold, the service signs a structured attestation message authorizing the mint.

For standard transfers the wait is dominated by the source chain's finality:
- Ethereum mainnet: ~13 min (2 epochs)
- Arbitrum, Base, Optimism: ~1 min
- Polygon: ~5 min
- Avalanche: ~1 min
- Injective EVM: standard finality

The skill polls:
```
GET https://iris-api.circle.com/v2/messages/{srcDomain}?transactionHash={txHash}
```
Response body (when complete):
```json
{
  "messages": [
    {
      "attestation": "0x...",
      "message": "0x...",
      "eventNonce": "...",
      "cctpVersion": 2,
      "status": "complete"
    }
  ]
}
```
While pending it'll be `status: pending_confirmations` with `attestation: PENDING`. Re-poll every few seconds until `status === complete && attestation !== PENDING`.

### 4. Switch

The mint happens on the destination chain. The signing wallet has to be on that chain. In a browser flow this means `wallet_switchEthereumChain`. In a headless script (this CLI), the script just builds a second `walletClient` for the destination chain — same private key, different `chain` arg.

### 5. Mint

The mint is a call to the destination chain's `MessageTransmitterV2`:
```
receiveMessage(bytes message, bytes attestation)
```

The contract verifies Circle's attestation signature and mints `amount` USDC to `mintRecipient`. **This call is permissionless** — anyone can submit it, not just the original burner. That's why CCTP doesn't need a relayer: in the worst case the recipient submits their own mint (and pays their own gas).

## Failure modes

CCTP is structurally safe — the burn happens before the attestation, and the mint is gated by Circle's signature, so funds can't be lost. But things can stall:

- **Attestation never lands.** If iris-api is degraded, the attestation poll will retry indefinitely. The funds are not lost — once attestation lands (might be hours later), the mint can be submitted.
- **Mint tx fails.** If the user's destination wallet has no native gas, or the chain is congested, the mint write reverts. Retry with more gas; the attestation is reusable.
- **Tab closed mid-flow.** As long as the burn confirmed, the message + attestation can be re-fetched any time and submitted by anyone. The CLI's `--resume <burnHash>` flag handles this.
- **Wrong USDC denom passed.** The `burnToken` arg must be the chain's **native** Circle USDC, not a bridged variant (USDC.e, USDCnb). Bridged variants aren't burnable by CCTP and the call will revert.

## Reference

- [Circle CCTP docs](https://developers.circle.com/cctp)
- [Supported chains + domain ids](https://developers.circle.com/cctp/cctp-supported-blockchains)
- [Contract addresses](https://developers.circle.com/cctp/references/contract-addresses)
- [`circlefin/evm-cctp-contracts`](https://github.com/circlefin/evm-cctp-contracts) — V2 source
- [iris-api OpenAPI spec](https://developers.circle.com/cctp/iris-attestation-api)
