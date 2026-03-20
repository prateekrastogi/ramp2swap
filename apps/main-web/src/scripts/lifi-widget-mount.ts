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
const walletSearchHostTags = new Set(['WUI-SEARCH-BAR', 'WUI-INPUT-TEXT', 'W3M-ALL-WALLETS-VIEW']);
const patchedWalletSearchBars = new WeakSet<Element>();

function isAddressLikeLabel(label: string) {
  return label.includes('...') && !label.includes(' ');
}

function walkShadowDom(root: ParentNode, visitor: (node: Element) => boolean | void) {
  const elements = Array.from(root.children);

  for (const element of elements) {
    if (visitor(element)) {
      return true;
    }

    if (element.shadowRoot && walkShadowDom(element.shadowRoot, visitor)) {
      return true;
    }

    if (walkShadowDom(element, visitor)) {
      return true;
    }
  }

  return false;
}

function findAllWalletsSearchInput() {
  const modal = document.querySelector('w3m-modal');
  const modalShadowRoot = modal?.shadowRoot;
  const modalRouter = modalShadowRoot?.querySelector('w3m-router');
  const routerShadowRoot = modalRouter?.shadowRoot;
  const allWalletsView = routerShadowRoot?.querySelector('w3m-all-wallets-view');
  const allWalletsShadowRoot = allWalletsView?.shadowRoot;
  const searchBar = allWalletsShadowRoot?.querySelector('wui-search-bar');
  const searchBarShadowRoot = searchBar?.shadowRoot;
  const inputText = searchBarShadowRoot?.querySelector('wui-input-text');
  const inputTextShadowRoot = inputText?.shadowRoot;

  return inputTextShadowRoot?.querySelector('input[type="search"]') ?? null;
}

function getSearchInputFromBar(searchBar: Element | null | undefined) {
  const searchBarShadowRoot = searchBar?.shadowRoot;
  const inputText = searchBarShadowRoot?.querySelector('wui-input-text');
  const inputTextShadowRoot = inputText?.shadowRoot;
  return inputTextShadowRoot?.querySelector('input[type="search"]') ?? null;
}

function findShadowSearchInput() {
  const allWalletsSearchInput = findAllWalletsSearchInput();
  if (allWalletsSearchInput) {
    return allWalletsSearchInput;
  }

  let searchInput: HTMLInputElement | null = null;

  walkShadowDom(document, (element) => {
    if (
      element instanceof HTMLInputElement &&
      (element.type === 'search' || element.placeholder.toLowerCase().includes('search wallet'))
    ) {
      searchInput = element;
      return true;
    }
  });

  return searchInput;
}

function focusWalletSearchInput() {
  const searchInput = findShadowSearchInput();
  if (!searchInput) {
    return;
  }

  searchInput.focus({ preventScroll: true });
  searchInput.click();

  if (typeof searchInput.setSelectionRange === 'function') {
    const caret = searchInput.value.length;
    searchInput.setSelectionRange(caret, caret);
  }
}

function focusWalletSearchInputWithRetries(attempts = 6) {
  focusWalletSearchInput();

  if (document.activeElement === findShadowSearchInput()) {
    return;
  }

  if (attempts <= 0) {
    return;
  }

  window.requestAnimationFrame(() => {
    focusWalletSearchInputWithRetries(attempts - 1);
  });
}

function isWalletSearchTap(path: EventTarget[]) {
  return path.some((target) => {
    if (target instanceof HTMLInputElement) {
      return target.type === 'search' || target.placeholder.toLowerCase().includes('search wallet');
    }

    return target instanceof HTMLElement && walletSearchHostTags.has(target.tagName);
  });
}

function bindWalletSearchBar(searchBar: Element) {
  if (patchedWalletSearchBars.has(searchBar)) {
    return;
  }

  const focusFromBar = () => {
    const searchInput = getSearchInputFromBar(searchBar);
    if (!searchInput) {
      return;
    }

    searchInput.focus({ preventScroll: true });
    searchInput.click();

    if (typeof searchInput.setSelectionRange === 'function') {
      const caret = searchInput.value.length;
      searchInput.setSelectionRange(caret, caret);
    }
  };

  searchBar.addEventListener('pointerdown', focusFromBar, true);
  searchBar.addEventListener('pointerup', focusFromBar, true);
  searchBar.addEventListener('touchend', focusFromBar, true);
  searchBar.addEventListener('click', focusFromBar, true);
  patchedWalletSearchBars.add(searchBar);
}

function bindWalletSearchBars() {
  walkShadowDom(document, (element) => {
    if (element.tagName === 'WUI-SEARCH-BAR') {
      bindWalletSearchBar(element);
    }
  });
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
    if (headerConnectDesktopLabel) {
      headerConnectDesktopLabel.textContent = HEADER_CONNECTED;
    }
    if (headerConnectMobileLabel) {
      headerConnectMobileLabel.textContent = HEADER_CONNECTED;
    }
    return;
  }

  headerConnectButton.setAttribute('aria-label', HEADER_CONNECT_DESKTOP);
  headerConnectButton.disabled = false;
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

const walletModalObserver = new MutationObserver(() => {
  bindWalletSearchBars();
});

walletModalObserver.observe(document.documentElement, {
  childList: true,
  subtree: true,
});

bindWalletSearchBars();

document.addEventListener('pointerdown', (event) => {
  if (!isWalletSearchTap(event.composedPath())) {
    return;
  }

  focusWalletSearchInputWithRetries();
}, true);

document.addEventListener('click', (event) => {
  if (!isWalletSearchTap(event.composedPath())) {
    return;
  }

  focusWalletSearchInputWithRetries();
}, true);

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
