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

export const buildOtpEmailHtml = ({
  assetBaseUrl,
  email,
  otp,
  partnerLogoUrl,
}: {
  assetBaseUrl: string;
  email: string;
  otp: string;
  partnerLogoUrl?: string;
}) => {
  const safeEmail = escapeHtml(email);
  const displayOtp = escapeHtml(formatOtpForDisplay(otp));
  const currentYear = new Date().getUTCFullYear();
  const resolvedPartnerLogoUrl = partnerLogoUrl ?? buildAbsoluteUrl(assetBaseUrl, '/logo_horizontal_email.png');

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta http-equiv="X-UA-Compatible" content="IE=edge" />
  <meta name="color-scheme" content="dark" />
  <meta name="supported-color-schemes" content="dark" />
  <title>Your Ramp2Swap Partner Portal Login OTP</title>
  <style>
    /*
      Design system source of truth for transactional email:
      @import url('https://fonts.googleapis.com/css2?family=DM+Mono:wght@400;500&family=DM+Sans:wght@300;400;500&family=Syne:wght@700;800&display=swap');
      --obsidian-900: #0A0D0F;
      --slate-100: #E8F0F7;
      --mint-500: #00E5A0;
      --state-amber: #F59E0B;
      --state-red: #EF4444;
      Approved shared logo asset: /logo_horizontal.png
      Email-specific rendering asset: /logo_horizontal_email.png
    */
    @media (max-width: 520px) {
      .shell-padding { padding: 24px 12px !important; }
      .section-padding { padding-left: 22px !important; padding-right: 22px !important; }
      .stack-column { display: block !important; width: 100% !important; text-align: center !important; }
      .stack-column-right { display: block !important; width: 100% !important; padding-top: 16px !important; text-align: left !important; }
      .stack-column-right { text-align: center !important; }
      .stack-column-right-inner { text-align: center !important; }
      .header-logo { margin: 0 auto !important; }
      .shell-card { border-radius: 22px !important; }
      .header-glass { border-radius: 16px !important; }
      .otp-panel { border-radius: 20px !important; }
      .warning-panel { border-radius: 0 14px 14px 0 !important; }
      .expire-pill { border-radius: 999px !important; }
      .otp-code { font-size: 32px !important; letter-spacing: 6px !important; }
    }
  </style>
</head>
<body style="margin: 0; padding: 0; background-color: #0a0d0f; color: #e8f0f7; font-family: Arial, Helvetica, sans-serif; -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%;">
  <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="width: 100%; border-collapse: collapse; background-color: #0a0d0f; margin: 0; padding: 0; mso-table-lspace: 0pt; mso-table-rspace: 0pt;" bgcolor="#0a0d0f">
    <tr>
      <td align="center" class="shell-padding" style="padding: 40px 16px;">
        <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="width: 100%; max-width: 600px; border-collapse: separate; border-spacing: 0; margin: 0 auto; background-color: #0f1419; border: 1px solid #243241; border-radius: 26px; overflow: hidden; mso-table-lspace: 0pt; mso-table-rspace: 0pt;" class="shell-card" bgcolor="#0f1419">
          <tr>
            <td style="padding: 0;">
              <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td class="section-padding" style="padding: 34px 34px 18px 34px; border-bottom: 1px solid #1f2a35; background-color: #121922;">
                    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="width: 100%; border-collapse: separate; border-spacing: 0;">
                      <tr>
                        <td class="stack-column" valign="middle" style="width: 68%; padding: 0;">
                          <img
                            src="${resolvedPartnerLogoUrl}"
                            alt="Ramp2Swap"
                            width="180"
                            class="header-logo"
                            style="display: block; width: 180px; max-width: 100%; height: auto; border: 0; outline: none; text-decoration: none;"
                          />
                        </td>
                        <td class="stack-column-right" valign="middle" align="right" style="width: 32%; padding: 0; text-align: right;">
                          <div class="stack-column-right-inner" style="text-align: right;">
                            <span class="header-glass" style="display: inline-block; padding: 8px 13px; border: 1px solid #2b4a42; background-color: #162028; color: #00e5a0; font-size: 11px; line-height: 1; letter-spacing: 1.5px; text-transform: uppercase; white-space: nowrap; font-family: 'Courier New', Courier, monospace; border-radius: 999px;">
                              Partner Portal Security
                            </span>
                          </div>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
                <tr>
                  <td class="section-padding" style="padding: 32px 34px 18px 34px;">
                    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="width: 100%; border-collapse: collapse;">
                      <tr>
                        <td style="padding: 0 0 14px 0; color: #fdf6e3; font-size: 30px; line-height: 34px; font-weight: 700; font-family: Arial, Helvetica, sans-serif;">
                          Your login verification code
                        </td>
                      </tr>
                      <tr>
                        <td style="padding: 0 0 28px 0; color: #7a98b3; font-size: 14px; line-height: 24px;">
                          Use the one-time password below to complete your sign-in for <strong style="color: #a5bbcf; font-weight: 700;">${safeEmail}</strong>. This code is short-lived and can only be used once.
                        </td>
                      </tr>
                      <tr>
                        <td style="padding: 0 0 24px 0;">
                          <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="width: 100%; border-collapse: separate; border-spacing: 0; background-color: #12211d; border: 1px solid #1f5f4b; border-radius: 20px;" class="otp-panel" bgcolor="#12211d">
                            <tr>
                              <td style="padding: 28px 20px 26px 20px; text-align: center; background-color: #12211d; border-radius: 20px;">
                                <div style="margin: 0 0 12px 0; color: #00e5a0; font-size: 11px; line-height: 16px; letter-spacing: 2px; text-transform: uppercase; font-family: 'Courier New', Courier, monospace;">
                                  One-Time Password
                                </div>
                                <div class="otp-code" style="margin: 0 0 18px 0; color: #fdf6e3; font-size: 38px; line-height: 42px; font-weight: 700; letter-spacing: 8px; text-align: center; font-family: 'Courier New', Courier, monospace;">
                                  ${displayOtp}
                                </div>
                                <span class="expire-pill" style="display: inline-block; padding: 7px 14px; border: 1px solid #7f1d1d; background-color: #2b1417; color: #f87171; font-size: 11px; line-height: 14px; letter-spacing: 1px; text-transform: uppercase; font-family: 'Courier New', Courier, monospace; border-radius: 999px;">
                                  Expires in 10 minutes
                                </span>
                              </td>
                            </tr>
                          </table>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding: 0 0 22px 0;">
                          <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="width: 100%; border-collapse: separate; border-spacing: 0; background-color: #2a2111; border-left: 3px solid #f59e0b; border-radius: 0 16px 16px 0;" class="warning-panel">
                            <tr>
                              <td style="padding: 16px 18px; color: #f6c768; font-size: 13px; line-height: 22px;">
                                <strong style="color: #fbbf24;">Never share this code.</strong> Ramp2Swap will never ask for your OTP by phone, chat, or email. If this sign-in was not initiated by you, you can ignore this message and your account will remain protected.
                              </td>
                            </tr>
                          </table>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding: 0 0 8px 0;">
                          <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="width: 100%; border-collapse: collapse;">
                            <tr>
                              <td style="padding: 12px 0; color: #7a98b3; font-size: 13px; line-height: 22px;">
                                <strong style="color: #e8f0f7;">Need a new code?</strong> Go back to the partner login screen and request another OTP.
                              </td>
                            </tr>
                            <tr>
                              <td style="padding: 12px 0; border-top: 1px solid #1f2a35; color: #7a98b3; font-size: 13px; line-height: 22px;">
                                <strong style="color: #e8f0f7;">Need help?</strong> Contact <a href="mailto:${SUPPORT_EMAIL}" style="color: #00e5a0; text-decoration: none;">${SUPPORT_EMAIL}</a>.
                              </td>
                            </tr>
                            <tr>
                              <td style="padding: 12px 0; border-top: 1px solid #1f2a35; color: #7a98b3; font-size: 13px; line-height: 22px;">
                                <strong style="color: #e8f0f7;">Partner Portal:</strong> <a href="${PARTNER_PORTAL_URL}" target="_blank" rel="noreferrer noopener" style="color: #00e5a0; text-decoration: none;">partner.ramp2swap.com</a>
                              </td>
                            </tr>
                          </table>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
                <tr>
                  <td class="section-padding" style="padding: 0 34px 30px 34px;">
                    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="width: 100%; border-collapse: collapse; border-top: 1px solid #1f2a35;">
                      <tr>
                        <td align="center" style="padding-top: 20px; color: #51687d; font-size: 12px; line-height: 20px; text-align: center;">
                          <table role="presentation" cellpadding="0" cellspacing="0" border="0" align="center" style="margin: 0 auto 10px auto; border-collapse: collapse;">
                            <tr>
                              <td style="padding: 0 10px 0 0;"><a href="${TERMS_URL}" target="_blank" rel="noreferrer noopener" style="color: #7a98b3; text-decoration: none;">Terms</a></td>
                              <td style="padding: 0 10px;"><a href="${PRIVACY_URL}" target="_blank" rel="noreferrer noopener" style="color: #7a98b3; text-decoration: none;">Privacy</a></td>
                              <td style="padding: 0 0 0 10px;"><a href="mailto:${SUPPORT_EMAIL}" style="color: #7a98b3; text-decoration: none;">Support</a></td>
                            </tr>
                          </table>
                          <div>&copy; ${currentYear} Ramp2Swap. This is an automated security email, so replies are not monitored.</div>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
};
