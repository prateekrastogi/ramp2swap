export const sendOtpEmail = async ({
  email,
  otp,
  resendKey,
  from,
  mode,
}: {
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
      subject: 'Your Ramp2Swap partner login code',
      text: `Your OTP is ${otp}. It expires in 10 minutes.`,
      html: `<p>Your Ramp2Swap partner login code is <strong>${otp}</strong>.</p><p>This code expires in 10 minutes.</p>`,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Resend email request failed: ${response.status} ${errorText}`);
  }
};
