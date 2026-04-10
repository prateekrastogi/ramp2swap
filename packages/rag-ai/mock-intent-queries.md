# Mock Intent Queries

Use these sample queries in the main-web intent box to quickly sanity-check AI Search parsing into `widgetFormValues`.

## Recommended Test Queries

1. Swap 250 USDC from Arbitrum to Base
2. Bridge 100 USDC from Ethereum to Base and send it to 0x111111125421cA6dc452d289314280a0f8842A65
3. I want to bridge 500 USDC from Ethereum mainnet to Arbitrum
4. Convert 2 ETH on Base into USDC on Base
5. Swap 100 USDC from Arbitrum
6. Swap to USDC on Base
7. Move some tokens somewhere

## Extra Variants

These should stay identical to the inputs in `system-prompt.md` so the prompt examples and mock test set do not drift.

## What To Check

- `fromAmount` is captured as a string
- `fromChain` and `toChain` match the intended direction
- `fromToken` and `toToken` are grounded correctly
- partial source-side and destination-side values are returned even when the opposite side is missing
- `toAddress` only appears when the query explicitly includes one
- ambiguous or unsupported details are omitted instead of hallucinated
