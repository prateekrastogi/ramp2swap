import { ChainId, type WidgetConfig } from '@lifi/widget';
import { publicAppConfig } from './public-app-config';

type LiFiWidgetRuntimeConfig = {
  config: WidgetConfig;
  integrator: string;
};

export function getLiFiWidgetRuntimeConfig(): LiFiWidgetRuntimeConfig {
  const integrator = 'ramp2swap';
  const { alchemyRpcUrls } = publicAppConfig;
  const rpcUrls = Object.fromEntries(
    [
      [ChainId.ETH, alchemyRpcUrls.ethereum],
      [ChainId.ARB, alchemyRpcUrls.arbitrum],
      [ChainId.OPT, alchemyRpcUrls.optimism],
      [ChainId.BAS, alchemyRpcUrls.base],
      [ChainId.POL, alchemyRpcUrls.polygon],
      [ChainId.SOL, alchemyRpcUrls.solana],
    ].filter(([, rpcUrl]) => Boolean(rpcUrl))
     .map(([chainId, rpcUrl]) => [chainId, [rpcUrl as string]])
  );

  return {
    integrator,
    config: {
      appearance: 'dark',
      fee: 0.005,
      integrator,
      sdkConfig: {
        rpcUrls,
      },
      languageResources: {
        en: {
          button: {
            connectWallet: 'Connect Wallet',
          },
        },
      },
      variant: 'compact',
      hiddenUI: ['appearance', 'poweredBy'],
      theme: {
        header: {
          background: 'transparent',
          borderBottom: '0',
          boxShadow: 'none',
        },
        container: {
          width: '100%',
          minWidth: 0,
          maxWidth: 'min(100%, 440px)',
          border: '1px solid rgba(255, 255, 255, 0.10)',
          borderRadius: '24px',
          boxShadow: '0 8px 48px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(0, 229, 160, 0.12)',
          background: 'linear-gradient(180deg, rgba(0, 229, 160, 0.04), rgba(15, 20, 25, 0.72) 42%)',
          backgroundColor: 'rgba(15, 20, 25, 0.72)',
          backdropFilter: 'blur(40px) saturate(160%)',
          maxHeight: 'min(760px, calc(100vh - 148px))',
        },
        palette: {
          primary: {
            main: '#00E5A0',
          },
          secondary: {
            main: '#7A98B3',
          },
          background: {
            default: '#0F1419',
            paper: '#141C24',
          },
          text: {
            primary: '#E8F0F7',
            secondary: '#7A98B3',
          },
          grey: {
            200: '#243040',
            300: '#1E2C3A',
            700: '#3D5269',
            800: '#141C24',
          },
        },
        shape: {
          borderRadius: 20,
          borderRadiusSecondary: 18,
          borderRadiusTertiary: 999,
        },
        typography: {
          fontFamily: 'var(--font-body)',
        },
        components: {
          MuiAppBar: {
            styleOverrides: {
              root: {
                background: 'transparent',
                borderBottom: '0',
                boxShadow: 'none',
                '& .MuiButton-root': {
                  color: '#C0CDD9',
                  background: 'transparent',
                  border: '0',
                  boxShadow: 'none',
                  paddingInline: 0,
                  minWidth: 'auto',
                },
                '& .MuiButton-root:hover': {
                  background: 'transparent',
                },
                '& .MuiButton-root .MuiButton-startIcon > *, & .MuiButton-root .MuiButton-endIcon > *': {
                  color: '#C0CDD9',
                  fill: '#C0CDD9',
                },
              },
            },
          },
          MuiCard: {
            defaultProps: {
              variant: 'filled',
            },
            styleOverrides: {
              root: {
                background: 'rgba(20, 28, 36, 0.86)',
                border: '1px solid rgba(255, 255, 255, 0.07)',
                boxShadow: '0 10px 28px rgba(0, 0, 0, 0.28), inset 0 1px 0 rgba(255, 255, 255, 0.06)',
              },
            },
          },
          MuiInputCard: {
            styleOverrides: {
              root: {
                background: 'rgba(20, 28, 36, 0.86)',
                border: '1px solid rgba(255, 255, 255, 0.07)',
                boxShadow: 'none',
              },
            },
          },
          MuiButton: {
            styleOverrides: {
              root: {
                borderRadius: '10px',
                fontFamily: 'var(--font-body)',
                fontWeight: 500,
                textTransform: 'none',
              },
              contained: {
                background: '#00E5A0',
                color: '#0A0D0F',
                boxShadow: '0 14px 32px rgba(0, 0, 0, 0.26), inset 0 1px 0 rgba(0, 229, 160, 0.12)',
              },
              text: {
                color: '#00E5A0',
              },
            },
          },
          MuiIconButton: {
            styleOverrides: {
              root: {
                background: 'rgba(0, 229, 160, 0.06)',
                border: '1px solid rgba(0, 229, 160, 0.15)',
              },
            },
          },
          MuiTabs: {
            styleOverrides: {
              root: {
                background: 'rgba(0, 229, 160, 0.06)',
                border: '1px solid rgba(255, 255, 255, 0.06)',
              },
            },
          },
        },
      },
    },
  };
}
