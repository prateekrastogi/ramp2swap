import { LiFiWidget } from '@lifi/widget';
import { createElement } from 'react';
import { hydrateRoot } from 'react-dom/client';
import { getLiFiWidgetRuntimeConfig } from '../lib/lifi-config';

const rootElement = document.getElementById('lifi-widget-root');

if (rootElement) {
  const runtime = getLiFiWidgetRuntimeConfig();

  hydrateRoot(rootElement, createElement(LiFiWidget, {
    integrator: runtime.integrator,
    config: runtime.config,
  }));
}
