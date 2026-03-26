import type { WidgetTransactionLog } from './widget-events'

const baseTimestamp = 1760000000000

export const mockTransactions: WidgetTransactionLog[] = [
  {
    status: 'PENDING',
    amount: '1250.42',
    transaction: 'route_eth_usdc_001',
    from: 'ETH',
    to: 'USDC',
    walletAddress: '0x8f3cf7ad23cd3cadbd9735aff958023239c6a063',
    timestamp: baseTimestamp + 1_000
  },
  {
    status: 'COMPLETED',
    amount: '980.15',
    transaction: 'route_arb_usdt_002',
    from: 'USDT',
    to: 'ETH',
    walletAddress: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
    timestamp: baseTimestamp + 2_000
  },
  {
    status: 'FAILED',
    amount: '412.80',
    transaction: 'route_base_dai_003',
    from: 'DAI',
    to: 'USDC',
    walletAddress: '0x4200000000000000000000000000000000000006',
    timestamp: baseTimestamp + 3_000
  },
  {
    status: 'PENDING',
    amount: '76.09',
    transaction: 'route_opt_weth_004',
    from: 'WETH',
    to: 'OP',
    walletAddress: '0x4200000000000000000000000000000000000042',
    timestamp: baseTimestamp + 4_000
  },
  {
    status: 'COMPLETED',
    amount: '2200.00',
    transaction: 'route_sol_usdc_005',
    from: 'SOL',
    to: 'USDC',
    walletAddress: '7vfCXTUXx5Wj2VbT7b6Q2WfWc6r4A2U9w3m8xM1vK9Pf',
    timestamp: baseTimestamp + 5_000
  },
  {
    status: 'FAILED',
    amount: '315.55',
    transaction: 'route_pol_matic_006',
    from: 'MATIC',
    to: 'USDT',
    walletAddress: '0x0000000000000000000000000000000000001010',
    timestamp: baseTimestamp + 6_000
  },
  {
    status: 'PENDING',
    amount: '14999.99',
    transaction: 'route_eth_wbtc_007',
    from: 'WBTC',
    to: 'ETH',
    walletAddress: '0x2260fac5e5542a773aa44fbcfedf7c193bc2c599',
    timestamp: baseTimestamp + 7_000
  },
  {
    status: 'COMPLETED',
    amount: '58.33',
    transaction: 'route_base_cbeth_008',
    from: 'cbETH',
    to: 'ETH',
    walletAddress: '0xbe9895146f7af43049ca1c1ae358b0541ea49704',
    timestamp: baseTimestamp + 8_000
  },
  {
    status: 'FAILED',
    amount: '845.77',
    transaction: 'route_arb_link_009',
    from: 'LINK',
    to: 'USDC',
    walletAddress: '0xf97f4df75117a78c1A5a0DBb814Af92458539FB4',
    timestamp: baseTimestamp + 9_000
  },
  {
    status: 'COMPLETED',
    amount: '133.70',
    transaction: 'route_bnb_btcb_010',
    from: 'BNB',
    to: 'BTCB',
    walletAddress: '0xbb4cdb9cbd36b01bd1cbaebf2de08d9173bc095c',
    timestamp: baseTimestamp + 10_000
  }
]
