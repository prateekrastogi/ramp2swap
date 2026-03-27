import './lifi-widget-mount';

type IntentWidgetFormValues = {
  fromAmount?: string;
  fromChain?: number;
  fromToken?: string;
  toChain?: number;
  toToken?: string;
  toAddress?: string;
};

type IntentResponse = {
  success: boolean;
  receivedText?: string;
  delayMs?: number;
  mock?: boolean;
  widgetFormValues?: IntentWidgetFormValues;
};

type AffiliateLandingEvent = {
  event: 'affiliate';
  username: string;
  campaign: string;
};

type AppEventRequest = {
  event: 'affiliate';
  username: string;
  campaign: string;
};

function getAffiliateEventFromDom() {
  const affiliateEventNode = document.getElementById('affiliate-event-data');
  if (!affiliateEventNode?.textContent) {
    return null;
  }

  try {
    return JSON.parse(affiliateEventNode.textContent) as AffiliateLandingEvent | null;
  } catch {
    return null;
  }
}

function getAffiliateEventFromLocation() {
  if (window.location.pathname !== '/r') {
    return null;
  }

  const username = new URLSearchParams(window.location.search).get('pid')?.trim() ?? '';
  const campaign = new URLSearchParams(window.location.search).get('cmp')?.trim() ?? '';

  if (!username || !campaign) {
    return null;
  }

  return {
    event: 'affiliate' as const,
    username,
    campaign,
  };
}

const affiliateEvent = getAffiliateEventFromDom() ?? getAffiliateEventFromLocation();
const LOCAL_MAIN_API_ORIGIN = 'http://127.0.0.1:7878';

function getAppEventEndpoint() {
  const isLocalHost =
    window.location.hostname === 'localhost' ||
    window.location.hostname === '127.0.0.1';

  return isLocalHost ? `${LOCAL_MAIN_API_ORIGIN}/app-event` : '/api/app-event';
}

async function sendAppEventToServer(payload: AppEventRequest) {
  try {
    await fetch(getAppEventEndpoint(), {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
      },
      body: JSON.stringify(payload),
    });
  } catch {}
}

if (affiliateEvent) {
  void sendAppEventToServer({
    event: 'affiliate',
    username: affiliateEvent.username,
    campaign: affiliateEvent.campaign,
  });
}

const conversationInput = document.getElementById('conversation-upload-input');
const conversationForm = document.getElementById('conversation-stage-form');
const conversationSubmit = document.getElementById('conversation-stage-submit');
const conversationInputShell = conversationInput?.closest('.conversation-stage-input-shell');
let successFlashTimeoutId = 0;

if (conversationInput instanceof HTMLTextAreaElement) {
  const resizeConversationInput = () => {
    conversationInput.style.height = 'auto';
    conversationInput.style.height = `${conversationInput.scrollHeight}px`;
  };

  const submitIntent = async () => {
    if (!(conversationSubmit instanceof HTMLButtonElement)) {
      return;
    }

    const text = conversationInput.value.trim();
    if (!text || conversationSubmit.disabled) {
      return;
    }

    const previousAriaLabel = conversationSubmit.getAttribute('aria-label');
    const previousInputAriaLabel = conversationInput.getAttribute('aria-label');
    conversationInput.readOnly = true;
    conversationInput.setAttribute('aria-label', 'Conversation input locked while sending');
    if (conversationInputShell instanceof HTMLElement) {
      conversationInputShell.dataset.loading = 'true';
    }
    conversationSubmit.disabled = true;
    conversationSubmit.dataset.loading = 'true';
    conversationSubmit.setAttribute('aria-pressed', 'true');
    conversationSubmit.setAttribute('aria-label', 'Sending intent');

    try {
      const isLocalHost =
        window.location.hostname === 'localhost' ||
        window.location.hostname === '127.0.0.1';
      const endpoint = isLocalHost ? `${LOCAL_MAIN_API_ORIGIN}/intent` : '/api/intent';

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
        },
        body: JSON.stringify({ text }),
      });

      if (!response.ok) {
        throw new Error(`Intent request failed with status ${response.status}`);
      }

      const responseData = (await response.json()) as IntentResponse;

      if (responseData.widgetFormValues) {
        window.dispatchEvent(new CustomEvent('ramp2swap:intent-widget-update', {
          detail: responseData.widgetFormValues,
        }));
      }

      conversationInput.value = '';
      resizeConversationInput();
      conversationSubmit.dataset.success = 'false';
      window.clearTimeout(successFlashTimeoutId);
      void conversationSubmit.offsetWidth;
      conversationSubmit.dataset.success = 'true';
      successFlashTimeoutId = window.setTimeout(() => {
        conversationSubmit.dataset.success = 'false';
      }, 450);
    } catch {
    } finally {
      conversationInput.readOnly = false;
      if (previousInputAriaLabel) {
        conversationInput.setAttribute('aria-label', previousInputAriaLabel);
      } else {
        conversationInput.removeAttribute('aria-label');
      }
      if (conversationInputShell instanceof HTMLElement) {
        conversationInputShell.dataset.loading = 'false';
      }
      conversationSubmit.disabled = false;
      conversationSubmit.dataset.loading = 'false';
      conversationSubmit.setAttribute('aria-pressed', 'false');
      if (previousAriaLabel) {
        conversationSubmit.setAttribute('aria-label', previousAriaLabel);
      } else {
        conversationSubmit.removeAttribute('aria-label');
      }
    }
  };

  resizeConversationInput();
  conversationInput.addEventListener('input', resizeConversationInput);

  if (conversationForm instanceof HTMLFormElement) {
    conversationForm.addEventListener('submit', (event) => {
      event.preventDefault();
      void submitIntent();
    });
  }

  conversationInput.addEventListener('keydown', (event) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      void submitIntent();
    }
  });
}
