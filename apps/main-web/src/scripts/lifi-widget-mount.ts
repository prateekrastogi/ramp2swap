import { LiFiWidget } from '@lifi/widget';
import { createElement } from 'react';
import { createRoot } from 'react-dom/client';
import { getLiFiWidgetRuntimeConfig } from '../lib/lifi-config';

const rootElement = document.getElementById('lifi-widget-root');
const headerConnectButton = document.getElementById('header-connect-wallet');
const headerConnectDesktopLabel = document.getElementById('header-connect-wallet-label-desktop');
const headerConnectMobileLabel = document.getElementById('header-connect-wallet-label-mobile');

const HEADER_CONNECT_DESKTOP = 'Connect Wallet';
const HEADER_CONNECT_MOBILE = 'Connect';
const HEADER_CONNECTED = 'Connected';

function isAddressLikeLabel(label: string) {
  return label.includes('...') && !label.includes(' ');
}

function setHeaderLabels(desktopLabel: string, mobileLabel: string) {
  if (headerConnectDesktopLabel) {
    headerConnectDesktopLabel.textContent = desktopLabel;
  }
  if (headerConnectMobileLabel) {
    headerConnectMobileLabel.textContent = mobileLabel;
  }
}

function findWidgetConnectButton() {
  return Array.from(rootElement?.querySelectorAll('button') ?? []).find((button) => {
    const label = button.textContent?.trim().toLowerCase();
    return label === 'connect wallet' || label === 'connect';
  });
}

function findWidgetWalletTrigger() {
  return Array.from(rootElement?.querySelectorAll('button') ?? []).find((button) => {
    const label = button.textContent?.trim() ?? '';
    return Boolean(button.querySelector('[data-testid="ExpandMoreIcon"]')) || isAddressLikeLabel(label);
  });
}

function setHeaderWalletState(state: 'connected' | 'disconnected') {
  if (!(headerConnectButton instanceof HTMLButtonElement)) {
    return;
  }

  headerConnectButton.dataset.walletState = state;

  if (state === 'connected') {
    headerConnectButton.setAttribute('aria-label', HEADER_CONNECTED);
    headerConnectButton.disabled = true;
    setHeaderLabels(HEADER_CONNECTED, HEADER_CONNECTED);
    return;
  }

  headerConnectButton.setAttribute('aria-label', HEADER_CONNECT_DESKTOP);
  headerConnectButton.disabled = false;
  setHeaderLabels(HEADER_CONNECT_DESKTOP, HEADER_CONNECT_MOBILE);
}

function syncHeaderWalletState() {
  const widgetConnectButton = findWidgetConnectButton();
  const widgetWalletTrigger = findWidgetWalletTrigger();

  if (widgetConnectButton instanceof HTMLButtonElement) {
    setHeaderWalletState('disconnected');
    return;
  }

  if (widgetWalletTrigger instanceof HTMLButtonElement) {
    setHeaderWalletState('connected');
  }
}

if (rootElement) {
  const runtime = getLiFiWidgetRuntimeConfig();
  const root = createRoot(rootElement);

  root.render(createElement(LiFiWidget, {
    integrator: runtime.integrator,
    config: runtime.config,
  }));

  const widgetObserver = new MutationObserver(() => {
    syncHeaderWalletState();
  });

  widgetObserver.observe(rootElement, {
    childList: true,
    subtree: true,
    attributes: true,
    characterData: true,
  });

  syncHeaderWalletState();
}

if (headerConnectButton instanceof HTMLButtonElement) {
  headerConnectButton.addEventListener('click', () => {
    if (headerConnectButton.dataset.walletState === 'connected' || headerConnectButton.disabled) {
      return;
    }

    const widgetConnectButton = findWidgetConnectButton();
    if (widgetConnectButton instanceof HTMLButtonElement) {
      widgetConnectButton.click();
    }
  });
}
