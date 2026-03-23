export type MockAiSearchCase = {
  id: string
  query: string
}

export const MOCK_AI_SEARCH_CASES: MockAiSearchCase[] = [
  {
    id: 'arb-usdc-to-base',
    query: 'Swap 250 USDC from Arbitrum to Base'
  },
  {
    id: 'eth-usdc-to-base-address',
    query: 'Bridge 100 USDC from Ethereum to Base and send it to 0x111111125421cA6dc452d289314280a0f8842A65'
  },
  {
    id: 'sol-to-eth',
    query: 'Swap 1.25 SOL on Solana to ETH on Ethereum'
  },
  {
    id: 'base-eth-to-arb-usdt',
    query: 'Move 0.75 ETH from Base to USDT on Arbitrum'
  },
  {
    id: 'hyperevm-to-base',
    query: 'Send 50 USDC from HyperEVM to Base USDC'
  },
  {
    id: 'eth-to-sol-address',
    query: 'Swap 0.1 ETH on Ethereum to SOL on Solana for address 7YWHX4xJ6f9x5PjL9xkK5Xj8o6fS7FJk6j5W8i2rV1mM'
  }
]
