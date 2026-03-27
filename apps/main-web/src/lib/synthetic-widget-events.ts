import {
  WidgetEvent,
  type Route,
  type RouteExecutionUpdate,
} from '@lifi/widget'

type SyntheticTransactionSeed = {
  status: 'PENDING' | 'COMPLETED' | 'FAILED'
  amountUSD: string
  transactionId: string
  fromSymbol: string
  toSymbol: string
  walletAddress: string
}

type SyntheticWidgetEvent = {
  eventName:
    | WidgetEvent.RouteExecutionStarted
    | WidgetEvent.RouteExecutionCompleted
    | WidgetEvent.RouteExecutionFailed
  event: Route | RouteExecutionUpdate
}

const SYNTHETIC_WIDGET_EVENT_INTERVAL_MS = 60_000

const syntheticTransactionSeeds: SyntheticTransactionSeed[] = [
  {
    status: 'PENDING',
    amountUSD: '1250.42',
    transactionId: 'route_eth_usdc_001',
    fromSymbol: 'ETH',
    toSymbol: 'USDC',
    walletAddress: '0x8f3cf7ad23cd3cadbd9735aff958023239c6a063',
  },
  {
    status: 'COMPLETED',
    amountUSD: '1250.42',
    transactionId: 'route_eth_usdc_001',
    fromSymbol: 'ETH',
    toSymbol: 'USDC',
    walletAddress: '0x8f3cf7ad23cd3cadbd9735aff958023239c6a063',
  },
  {
    status: 'PENDING',
    amountUSD: '412.80',
    transactionId: 'route_base_dai_003',
    fromSymbol: 'DAI',
    toSymbol: 'USDC',
    walletAddress: '0x4200000000000000000000000000000000000006',
  },
  {
    status: 'FAILED',
    amountUSD: '412.80',
    transactionId: 'route_base_dai_003',
    fromSymbol: 'DAI',
    toSymbol: 'USDC',
    walletAddress: '0x4200000000000000000000000000000000000006',
  },
  {
    status: 'PENDING',
    amountUSD: '2200.00',
    transactionId: 'route_sol_usdc_005',
    fromSymbol: 'SOL',
    toSymbol: 'USDC',
    walletAddress: '7vfCXTUXx5Wj2VbT7b6Q2WfWc6r4A2U9w3m8xM1vK9Pf',
  },
  {
    status: 'COMPLETED',
    amountUSD: '2200.00',
    transactionId: 'route_sol_usdc_005',
    fromSymbol: 'SOL',
    toSymbol: 'USDC',
    walletAddress: '7vfCXTUXx5Wj2VbT7b6Q2WfWc6r4A2U9w3m8xM1vK9Pf',
  },
  {
    status: 'PENDING',
    amountUSD: '14999.99',
    transactionId: 'route_eth_wbtc_007',
    fromSymbol: 'WBTC',
    toSymbol: 'ETH',
    walletAddress: '0x2260fac5e5542a773aa44fbcfedf7c193bc2c599',
  },
  {
    status: 'COMPLETED',
    amountUSD: '980.15',
    transactionId: 'route_arb_usdt_002',
    fromSymbol: 'USDT',
    toSymbol: 'ETH',
    walletAddress: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
  },
  {
    status: 'COMPLETED',
    amountUSD: '58.33',
    transactionId: 'route_base_cbeth_008',
    fromSymbol: 'cbETH',
    toSymbol: 'ETH',
    walletAddress: '0xbe9895146f7af43049ca1c1ae358b0541ea49704',
  },
  {
    status: 'FAILED',
    amountUSD: '845.77',
    transactionId: 'route_arb_link_009',
    fromSymbol: 'LINK',
    toSymbol: 'USDC',
    walletAddress: '0xf97f4df75117a78c1A5a0DBb814Af92458539FB4',
  },
  {
    status: 'FAILED',
    amountUSD: '315.55',
    transactionId: 'route_pol_matic_006',
    fromSymbol: 'MATIC',
    toSymbol: 'USDT',
    walletAddress: '0x0000000000000000000000000000000000001010',
  },
]

const createSyntheticRoute = (seed: SyntheticTransactionSeed, index: number) =>
  ({
    id: seed.transactionId,
    insurance: {
      state: 'NOT_INSURABLE',
      feeAmountUsd: '0',
    },
    fromChainId: 1,
    fromAmountUSD: seed.amountUSD,
    fromAmount: `${(index + 1) * 1000000}`,
    fromToken: {
      symbol: seed.fromSymbol,
    },
    fromAddress: seed.walletAddress,
    toChainId: 8453,
    toAmountUSD: seed.amountUSD,
    toAmount: `${(index + 1) * 995000}`,
    toAmountMin: `${(index + 1) * 990000}`,
    toToken: {
      symbol: seed.toSymbol,
    },
    steps: [],
  }) as unknown as Route

const createSyntheticWidgetEvent = (
  seed: SyntheticTransactionSeed,
  index: number
): SyntheticWidgetEvent => {
  const route = createSyntheticRoute(seed, index)

  if (seed.status === 'PENDING') {
    return {
      eventName: WidgetEvent.RouteExecutionStarted,
      event: route,
    }
  }

  if (seed.status === 'COMPLETED') {
    return {
      eventName: WidgetEvent.RouteExecutionCompleted,
      event: route,
    }
  }

  return {
    eventName: WidgetEvent.RouteExecutionFailed,
    event: {
      route,
      process: {
        type: 'CROSS_CHAIN',
        status: 'FAILED',
      },
    } as unknown as RouteExecutionUpdate,
  }
}

const isSyntheticWidgetEventEnvironment = (hostname: string) => {
  const normalizedHostname = hostname.toLowerCase()
  const hostLabels = normalizedHostname.split('.')

  return (
    normalizedHostname === 'localhost' ||
    normalizedHostname === '127.0.0.1' ||
    normalizedHostname === '[::1]' ||
    (hostLabels.length >= 3 && (hostLabels[0] === 'staging' || hostLabels[0] === 'test'))
  )
}

export const startSyntheticWidgetEvents = (
  emit: (
    eventName:
      | WidgetEvent.RouteExecutionStarted
      | WidgetEvent.RouteExecutionCompleted
      | WidgetEvent.RouteExecutionFailed,
    event: Route | RouteExecutionUpdate
  ) => void,
  hostname: string
) => {
  if (!isSyntheticWidgetEventEnvironment(hostname)) {
    return
  }

  let syntheticEventIndex = 0

  window.setInterval(() => {
    const syntheticWidgetEvent = createSyntheticWidgetEvent(
      syntheticTransactionSeeds[syntheticEventIndex % syntheticTransactionSeeds.length],
      syntheticEventIndex
    )

    emit(syntheticWidgetEvent.eventName, syntheticWidgetEvent.event)
    syntheticEventIndex += 1
  }, SYNTHETIC_WIDGET_EVENT_INTERVAL_MS)
}
