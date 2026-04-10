# Mock Intent Queries

Use these sample queries in the main-web intent box to quickly sanity-check AI Search parsing into `widgetFormValues`.

## Recommended Test Queries

1. Send 75 USDC out of Base into Arbitrum USDC
2. Bridge 123.45 USDT from Arbitrum to Ethereum for 0x29DaCdF7cCaDf4eE67c923b4C22255A4B2494eD7
3. Swap 0.5 ETH on Ethereum mainnet into USDC on Base
4. Trade 10 USDC on Base for ETH on Base
5. Start with 42 USDC on Ethereum
6. Receive USDC on Arbitrum
7. Swap USDC to USDT
8. Send tokens somewhere later

## Extra Variants

These are intentionally different from the examples in `system-prompt.md` so the mock set catches generalization issues instead of example memorization.

## What To Check

- `fromAmount` is captured as a string
- `fromChain` and `toChain` match the intended direction
- `fromToken` and `toToken` are grounded correctly
- partial source-side and destination-side values are returned even when the opposite side is missing
- `toAddress` only appears when the query explicitly includes one
- ambiguous or unsupported details are omitted instead of hallucinated
