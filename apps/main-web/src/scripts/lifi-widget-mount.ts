import { LiFiWidget } from '@lifi/widget';
import { createElement } from 'react';
import { createRoot } from 'react-dom/client';
import { getLiFiWidgetRuntimeConfig } from '../lib/lifi-config';

const rootElement = document.getElementById('lifi-widget-root');
const headerConnectButton = document.getElementById('header-connect-wallet');

function findWidgetConnectButton() {
  return Array.from(rootElement?.querySelectorAll('button') ?? []).find((button) => {
    const label = button.textContent?.trim().toLowerCase();
    return label === 'connect wallet' || label === 'connect';
  });
}

if (rootElement) {
  const runtime = getLiFiWidgetRuntimeConfig();
  const root = createRoot(rootElement);

  root.render(createElement(LiFiWidget, {
    integrator: runtime.integrator,
    config: runtime.config,
  }));
}

if (headerConnectButton instanceof HTMLButtonElement) {
  headerConnectButton.addEventListener('click', () => {
    const widgetConnectButton = findWidgetConnectButton();
    if (widgetConnectButton instanceof HTMLButtonElement) {
      widgetConnectButton.click();
    }
  });
}
