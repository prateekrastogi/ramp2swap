import type { WidgetConfig } from '@lifi/widget';

type LiFiWidgetRuntimeConfig = {
  config: WidgetConfig;
  integrator: string;
};

export function getLiFiWidgetRuntimeConfig(): LiFiWidgetRuntimeConfig {
  const integrator = 'ramp2swap';

  return {
    integrator,
    config: {
      appearance: 'dark',
      integrator,
      variant: 'compact',
      hiddenUI: ['appearance'],
      theme: {
        container: {
          border: '1px solid rgba(255, 255, 255, 0.10)',
          borderRadius: '24px',
          boxShadow: '0 18px 54px rgba(0, 0, 0, 0.42), inset 0 1px 0 rgba(255, 255, 255, 0.08)',
          backgroundColor: 'rgba(15, 20, 25, 0.82)',
          backdropFilter: 'blur(32px) saturate(160%)',
          maxHeight: 760,
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
                borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
                boxShadow: 'none',
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
                borderRadius: '999px',
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
