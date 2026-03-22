export type IntentWidgetFormValues = Partial<{
  fromAmount: string
  fromChain: number
  fromToken: string
  toChain: number
  toToken: string
  toAddress: string
}>

type IntentMockProfile = {
  name: string
  widgetFormValues: {
    fromAmount: string
    fromChain: number
    fromToken: string
    toChain: number
    toToken: string
    toAddress: string
  }
}

const MOCK_TO_ADDRESSES = [
  '0x29DaCdF7cCaDf4eE67c923b4C22255A4B2494eD7',
  '0x111111125421cA6dc452d289314280a0f8842A65',
  '0x3fC91A3afd70395Cd496C647D5A6CC9D4B2b7FAD'
]

const MOCK_INTENT_PROFILES: IntentMockProfile[] = [
  {
    name: 'polygon-usdc-to-optimism-usdc',
    widgetFormValues: {
      fromAmount: '25',
      fromChain: 137,
      fromToken: '0x3c499c542ceF5E3811e1192ce70d8cC03d5c3359',
      toChain: 10,
      toToken: '0x0b2C639c533813f4Aa9D7837CAf62653d097Ff85',
      toAddress: MOCK_TO_ADDRESSES[0]
    }
  },
  {
    name: 'ethereum-usdc-to-base-usdc',
    widgetFormValues: {
      fromAmount: '100',
      fromChain: 1,
      fromToken: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
      toChain: 8453,
      toToken: '0x833589fCD6EDB6E08f4c7C32D4f71b54bdA02913',
      toAddress: MOCK_TO_ADDRESSES[1]
    }
  },
  {
    name: 'arbitrum-usdt-to-base-usdc',
    widgetFormValues: {
      fromAmount: '250',
      fromChain: 42161,
      fromToken: '0xFd086bC7CD5C481DCC9C85ebE478A1C0b69FCbb9',
      toChain: 8453,
      toToken: '0x833589fCD6EDB6E08f4c7C32D4f71b54bdA02913',
      toAddress: MOCK_TO_ADDRESSES[2]
    }
  }
]

function getRandomArrayItem<T>(items: T[]) {
  return items[Math.floor(Math.random() * items.length)]
}

export function pickMockWidgetFormValues() {
  const profile = getRandomArrayItem(MOCK_INTENT_PROFILES)
  const includeAllFields = Math.random() >= 0.5

  if (includeAllFields) {
    return {
      profile: profile.name,
      widgetFormValues: profile.widgetFormValues satisfies IntentWidgetFormValues
    }
  }

  const randomWidgetFormValues: IntentWidgetFormValues = {}
  const includeFromFields = Math.random() >= 0.25
  const includeToFields = Math.random() >= 0.25
  const includeAmount = Math.random() >= 0.4
  const includeToAddress = Math.random() >= 0.4

  if (includeFromFields) {
    randomWidgetFormValues.fromChain = profile.widgetFormValues.fromChain
    randomWidgetFormValues.fromToken = profile.widgetFormValues.fromToken
  }

  if (includeToFields) {
    randomWidgetFormValues.toChain = profile.widgetFormValues.toChain
    randomWidgetFormValues.toToken = profile.widgetFormValues.toToken
  }

  if (includeAmount) {
    randomWidgetFormValues.fromAmount = profile.widgetFormValues.fromAmount
  }

  if (includeToAddress) {
    randomWidgetFormValues.toAddress = profile.widgetFormValues.toAddress
  }

  if (!Object.keys(randomWidgetFormValues).length) {
    randomWidgetFormValues.fromChain = profile.widgetFormValues.fromChain
    randomWidgetFormValues.fromToken = profile.widgetFormValues.fromToken
    randomWidgetFormValues.toChain = profile.widgetFormValues.toChain
    randomWidgetFormValues.toToken = profile.widgetFormValues.toToken
  }

  return {
    profile: `${profile.name}-partial`,
    widgetFormValues: randomWidgetFormValues
  }
}
