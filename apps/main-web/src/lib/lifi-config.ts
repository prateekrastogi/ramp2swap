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
      integrator,
    },
  };
}
