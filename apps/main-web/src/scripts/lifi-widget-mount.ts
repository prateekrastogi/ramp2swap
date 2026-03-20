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
const HEADER_DISCONNECT = 'Disconnect';

function isAddressLikeLabel(label: string) {
  return label.includes('...') && !label.includes(' ');
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

function findDisconnectMenuButton() {
  return Array.from(document.querySelectorAll('button')).find((button) => {
    const hasDisconnectIcon = button.querySelector('[data-testid="PowerSettingsNewRoundedIcon"]');
    const label = button.textContent?.trim().toLowerCase() ?? '';
    return Boolean(hasDisconnectIcon) && label !== 'connect another wallet';
  });
}

function setHeaderWalletState(state: 'connected' | 'disconnected') {
  if (!(headerConnectButton instanceof HTMLButtonElement)) {
    return;
  }

  headerConnectButton.dataset.walletState = state;

  if (state === 'connected') {
    headerConnectButton.setAttribute('aria-label', HEADER_DISCONNECT);
    if (headerConnectDesktopLabel) {
      headerConnectDesktopLabel.textContent = HEADER_DISCONNECT;
    }
    if (headerConnectMobileLabel) {
      headerConnectMobileLabel.textContent = HEADER_DISCONNECT;
    }
    return;
  }

  headerConnectButton.setAttribute('aria-label', HEADER_CONNECT_DESKTOP);
  if (headerConnectDesktopLabel) {
    headerConnectDesktopLabel.textContent = HEADER_CONNECT_DESKTOP;
  }
  if (headerConnectMobileLabel) {
    headerConnectMobileLabel.textContent = HEADER_CONNECT_MOBILE;
  }
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

function waitForElement<T extends Element>(
  finder: () => T | undefined,
  onFound: (element: T) => void,
  attempts = 18
) {
  const element = finder();
  if (element) {
    onFound(element);
    return;
  }

  if (attempts <= 0) {
    return;
  }

  window.setTimeout(() => {
    waitForElement(finder, onFound, attempts - 1);
  }, 120);
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
    if (headerConnectButton.dataset.walletState === 'connected') {
      const widgetWalletTrigger = findWidgetWalletTrigger();
      if (widgetWalletTrigger instanceof HTMLButtonElement) {
        widgetWalletTrigger.click();
        waitForElement(findDisconnectMenuButton, (disconnectButton) => {
          if (disconnectButton instanceof HTMLButtonElement) {
            disconnectButton.click();
            window.setTimeout(() => {
              syncHeaderWalletState();
            }, 150);
          }
        });
      }
      return;
    }

    const widgetConnectButton = findWidgetConnectButton();
    if (widgetConnectButton instanceof HTMLButtonElement) {
      widgetConnectButton.click();
    }
  });
}
