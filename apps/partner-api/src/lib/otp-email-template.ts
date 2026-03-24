const PARTNER_PORTAL_URL = 'https://partner.ramp2swap.com';
const PRIVACY_URL = 'https://ramp2swap.com/privacy';
const TERMS_URL = 'https://ramp2swap.com/terms';
const SUPPORT_EMAIL = 'help@ramp2swap.com';

const escapeHtml = (value: string) =>
  value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');

const formatOtpForDisplay = (otp: string) => otp.replace(/\D/g, '').replace(/(\d{3})(\d{3})/, '$1 $2');

const buildAbsoluteUrl = (baseUrl: string, path: string) => new URL(path, baseUrl).toString();

export const buildOtpEmailHtml = ({ assetBaseUrl, email, otp }: { assetBaseUrl: string; email: string; otp: string }) => {
  const safeEmail = escapeHtml(email);
  const displayOtp = escapeHtml(formatOtpForDisplay(otp));
  const currentYear = new Date().getUTCFullYear();
  const partnerLogoUrl = buildAbsoluteUrl(assetBaseUrl, '/logo_horizontal.png');

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta http-equiv="X-UA-Compatible" content="IE=edge" />
  <title>Your Ramp2Swap Partner Portal Login OTP</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=DM+Mono:wght@400;500&family=DM+Sans:wght@300;400;500&family=Syne:wght@700;800&display=swap');

    :root {
      --obsidian-900: #0A0D0F;
      --obsidian-800: #0F1419;
      --obsidian-700: #141C24;
      --obsidian-600: #1E2C3A;
      --slate-100: #E8F0F7;
      --slate-300: #7A98B3;
      --slate-500: #3D5269;
      --ivory-100: #FDF6E3;
      --mint-500: #00E5A0;
      --mint-600: #00C484;
      --mint-tint-strong: rgba(0, 229, 160, 0.12);
      --mint-tint-soft: rgba(0, 229, 160, 0.06);
      --mint-tint-faint: rgba(0, 229, 160, 0.04);
      --mint-glow-strong: rgba(0, 229, 160, 0.5);
      --mint-border-soft: rgba(0, 229, 160, 0.15);
      --mint-ring-edge: rgba(0, 229, 160, 0.06);
      --state-amber: #F59E0B;
      --state-amber-tint: rgba(245, 158, 11, 0.12);
      --state-red: #EF4444;
      --state-red-tint: rgba(239, 68, 68, 0.12);
      --white-a-06: rgba(255, 255, 255, 0.06);
      --white-a-07: rgba(255, 255, 255, 0.07);
      --white-a-08: rgba(255, 255, 255, 0.08);
      --white-a-10: rgba(255, 255, 255, 0.10);
      --white-a-12: rgba(255, 255, 255, 0.12);
    }

    * { margin: 0; padding: 0; box-sizing: border-box; }

    body {
      background:
        radial-gradient(circle at 20% 12%, rgba(0, 229, 160, 0.10) 0%, transparent 34%),
        radial-gradient(circle at 82% 90%, rgba(0, 120, 255, 0.08) 0%, transparent 32%),
        linear-gradient(180deg, var(--obsidian-900) 0%, #081015 100%);
      color: var(--slate-100);
      font-family: 'DM Sans', Arial, sans-serif;
      -webkit-font-smoothing: antialiased;
    }

    a { color: var(--mint-500); text-decoration: none; }

    .wrapper {
      max-width: 600px;
      margin: 0 auto;
      padding: 40px 16px;
    }

    .shell {
      position: relative;
      overflow: hidden;
      border-radius: 24px;
      background: rgba(15, 20, 25, 0.72);
      border: 1px solid var(--white-a-10);
      box-shadow:
        0 8px 48px rgba(0, 0, 0, 0.45),
        inset 0 1px 0 var(--white-a-08);
      backdrop-filter: blur(40px) saturate(160%);
    }

    .content {
      position: relative;
      z-index: 2;
    }

    .header {
      padding: 34px 34px 24px;
      border-bottom: 1px solid var(--white-a-06);
      background: linear-gradient(180deg, rgba(255, 255, 255, 0.03), transparent);
    }

    .eyebrow {
      display: inline-block;
      margin-top: 16px;
      margin-bottom: 0;
      padding: 6px 12px;
      border-radius: 999px;
      border: 1px solid var(--mint-border-soft);
      background: var(--mint-tint-faint);
      color: var(--mint-500);
      font-family: 'DM Mono', monospace;
      font-size: 11px;
      letter-spacing: 0.12em;
      text-transform: uppercase;
    }

    .brand {
      margin-bottom: 0;
      height: 72px;
      overflow: visible;
    }

    .brand-logo {
      display: block;
      width: auto;
      max-width: 260px;
      height: 32px;
      object-fit: contain;
      transform: scale(8);
      transform-origin: left center;
    }

    .header-sub {
      color: var(--slate-300);
      font-size: 13px;
      line-height: 1.6;
      max-width: 44ch;
    }

    .body {
      padding: 32px 34px 18px;
    }

    .title {
      margin-bottom: 14px;
      color: var(--ivory-100);
      font-family: 'Syne', Arial, sans-serif;
      font-size: 28px;
      font-weight: 700;
      line-height: 1.1;
      letter-spacing: -0.04em;
    }

    .intro {
      margin-bottom: 28px;
      color: var(--slate-300);
      font-size: 14px;
      line-height: 1.8;
    }

    .glass {
      position: relative;
      isolation: isolate;
    }

    .glass-mint {
      overflow: hidden;
      background: var(--mint-tint-faint);
      backdrop-filter: blur(40px) saturate(160%);
      border: 1px solid var(--mint-border-soft);
      box-shadow:
        0 8px 48px rgba(0, 0, 0, 0.4),
        0 0 0 1px var(--mint-ring-edge),
        inset 0 1px 0 var(--mint-tint-strong);
    }

    .glass-mint::before {
      content: '';
      position: absolute;
      bottom: 0;
      left: 10%;
      right: 10%;
      height: 1px;
      background: linear-gradient(90deg, transparent, var(--mint-glow-strong), transparent);
    }

    .otp-block {
      margin-bottom: 24px;
      padding: 28px 24px 26px;
      border-radius: 20px;
      text-align: center;
    }

    .otp-block::after {
      content: '';
      position: absolute;
      left: -10%;
      right: -10%;
      bottom: -42px;
      height: 140px;
      background: radial-gradient(circle at 50% 100%, rgba(0, 229, 160, 0.18) 0%, transparent 60%);
      pointer-events: none;
      z-index: -1;
    }

    .otp-label {
      margin-bottom: 12px;
      color: var(--mint-500);
      font-family: 'DM Mono', monospace;
      font-size: 11px;
      font-weight: 500;
      letter-spacing: 0.18em;
      text-transform: uppercase;
    }

    .otp-code {
      margin-bottom: 18px;
      color: var(--ivory-100);
      font-family: 'DM Mono', monospace;
      font-size: 40px;
      font-weight: 500;
      letter-spacing: 0.22em;
      text-indent: 0.22em;
      line-height: 1;
    }

    .otp-meta {
      display: inline-block;
      padding: 7px 14px;
      border-radius: 999px;
      border: 1px solid var(--state-red);
      background: var(--state-red-tint);
      color: var(--state-red);
      font-family: 'DM Mono', monospace;
      font-size: 11px;
      font-weight: 500;
      letter-spacing: 0.06em;
      text-transform: uppercase;
    }

    .security-note {
      margin-bottom: 22px;
      padding: 16px 18px;
      border-left: 3px solid var(--state-amber);
      border-radius: 0 14px 14px 0;
      background: var(--state-amber-tint);
      color: var(--state-amber);
      font-size: 13px;
      line-height: 1.7;
    }

    .security-note strong {
      color: #fbbf24;
      font-weight: 600;
    }

    .detail-list {
      margin-bottom: 8px;
      padding: 0;
      list-style: none;
    }

    .detail-item {
      padding: 12px 0;
      border-top: 1px solid rgba(255, 255, 255, 0.05);
      color: var(--slate-300);
      font-size: 13px;
      line-height: 1.7;
    }

    .detail-item strong {
      color: var(--slate-100);
      font-weight: 500;
    }

    .footer {
      padding: 0 34px 30px;
    }

    .footer-panel {
      padding-top: 20px;
      border-top: 1px solid var(--white-a-06);
      color: var(--slate-500);
      font-size: 12px;
      line-height: 1.8;
      text-align: center;
    }

    .footer-links {
      margin-bottom: 10px;
    }

    .footer-links a {
      display: inline-block;
      margin: 0 10px 8px;
      color: var(--slate-300);
    }

    @media (max-width: 520px) {
      .wrapper { padding: 24px 10px; }
      .header, .body, .footer { padding-left: 22px; padding-right: 22px; }
      .brand { height: 60px; }
      .brand-logo { height: 24px; max-width: 220px; }
      .title { font-size: 24px; }
      .otp-code { font-size: 32px; letter-spacing: 0.18em; text-indent: 0.18em; }
    }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="shell">
      <div class="content">
        <div class="header">
          <div class="brand">
            <img class="brand-logo" src="${partnerLogoUrl}" alt="Ramp2Swap" />
          </div>
          <div class="eyebrow">Partner Portal Security</div>
          <div class="header-sub">
            We received a sign-in request for your Ramp2Swap Partner Portal account.
          </div>
        </div>

        <div class="body">
          <div class="title">Your login verification code</div>
          <div class="intro">
            Use the one-time password below to complete your sign-in for <strong>${safeEmail}</strong>. This code is short-lived and can only be used once.
          </div>

          <div class="otp-block glass glass-mint">
            <div class="otp-label">One-Time Password</div>
            <div class="otp-code">${displayOtp}</div>
            <div class="otp-meta">Expires in 10 minutes</div>
          </div>

          <div class="security-note">
            <strong>Never share this code.</strong> Ramp2Swap will never ask for your OTP by phone, chat, or email. If this sign-in was not initiated by you, you can ignore this message and your account will remain protected.
          </div>

          <div class="detail-list">
            <div class="detail-item"><strong>Need a new code?</strong> Go back to the partner login screen and request another OTP.</div>
            <div class="detail-item"><strong>Need help?</strong> Contact <a href="mailto:${SUPPORT_EMAIL}">${SUPPORT_EMAIL}</a>.</div>
            <div class="detail-item"><strong>Partner Portal:</strong> <a href="${PARTNER_PORTAL_URL}" target="_blank" rel="noreferrer noopener">partner.ramp2swap.com</a></div>
          </div>
        </div>

        <div class="footer">
          <div class="footer-panel">
            <div class="footer-links">
              <a href="${TERMS_URL}" target="_blank" rel="noreferrer noopener">Terms</a>
              <a href="${PRIVACY_URL}" target="_blank" rel="noreferrer noopener">Privacy</a>
              <a href="mailto:${SUPPORT_EMAIL}">Support</a>
            </div>
            <div>
              &copy; ${currentYear} Ramp2Swap. This is an automated security email, so replies are not monitored.
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</body>
</html>`;
};
