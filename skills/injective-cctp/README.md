# injective-cctp

A Claude Code skill for moving **native USDC** to and from **Injective EVM** via Circle's [Cross-Chain Transfer Protocol V2](https://developers.circle.com/cctp).

Burns USDC on the source chain, polls Circle's attestation service, and submits the mint on the destination chain. No relayer, no aggregator, no custodian.

See [`SKILL.md`](./SKILL.md) for the full guide. Quick start:

```sh
cd scripts
npm install
export CCTP_PRIVATE_KEY=0x...
node cctp.mjs --from ethereum --amount 100        # deposit to Injective
node cctp.mjs --from injective --to base --amount 50   # withdraw to Base
```

The same flow with a wallet UI lives at **https://usdc.inj.so** ([source](https://github.com/ckhbtc/usdc-widget)).
