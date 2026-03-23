# Mock Intent Queries

Use these sample queries in the main-web intent box to quickly sanity-check AI Search parsing into `widgetFormValues`.

## Recommended Test Queries

1. Swap 250 USDC from Arbitrum to Base
2. Bridge 100 USDC from Ethereum to Base and send it to 0x111111125421cA6dc452d289314280a0f8842A65
3. Swap 1.25 SOL on Solana to ETH on Ethereum
4. Move 0.75 ETH from Base to USDT on Arbitrum
5. Send 50 USDC from HyperEVM to Base USDC
6. Swap 0.1 ETH on Ethereum to SOL on Solana for address 7YWHX4xJ6f9x5PjL9xkK5Xj8o6fS7FJk6j5W8i2rV1mM

## Extra Variants

1. I want to bridge 500 USDC from Ethereum mainnet to Arbitrum
2. Send 200 USDT from Arbitrum to Base
3. Convert 2 ETH on Base into USDC on Base
4. Bridge 25 USDC from Solana to Ethereum
5. Move 100 USDC from Ethereum to Base for wallet 0x29DaCdF7cCaDf4eE67c923b4C22255A4B2494eD7

## What To Check

- `fromAmount` is captured as a string
- `fromChain` and `toChain` match the intended direction
- `fromToken` and `toToken` are grounded correctly
- `toAddress` only appears when the query explicitly includes one
- ambiguous or unsupported details are omitted instead of hallucinated
