import { buildOtpEmailHtml } from './otp-email-template';

export const sendOtpEmail = async ({
  assetBaseUrl,
  email,
  otp,
  resendKey,
  from,
  mode,
}: {
  assetBaseUrl: string;
  email: string;
  otp: string;
  resendKey?: string;
  from?: string;
  mode?: string;
}) => {
  if (mode === 'console' || !resendKey) {
    console.info(`[auth] OTP for ${email}: ${otp}`);
    return;
  }

  if (!from) {
    throw new Error('LOGIN_EMAIL_FROM is required when AUTH_EMAIL_MODE is set to resend.');
  }

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${resendKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from,
      to: [email],
      subject: 'Verify Your Login | Ramp2Swap Partner',
      text: `Your Ramp2Swap Partner Login Code: ${otp}. It expires in 10 minutes.`,
      html: buildOtpEmailHtml({ assetBaseUrl, email, otp }),
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Resend email request failed: ${response.status} ${errorText}`);
  }
};
