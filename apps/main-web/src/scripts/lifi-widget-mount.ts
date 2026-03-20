import { LiFiWidget } from '@lifi/widget';
import { createElement } from 'react';
import { createRoot } from 'react-dom/client';
import { getLiFiWidgetRuntimeConfig } from '../lib/lifi-config';

const rootElement = document.getElementById('lifi-widget-root');

if (rootElement) {
  const runtime = getLiFiWidgetRuntimeConfig();
  const root = createRoot(rootElement);

  root.render(createElement(LiFiWidget, {
    integrator: runtime.integrator,
    config: runtime.config,
  }));
}
