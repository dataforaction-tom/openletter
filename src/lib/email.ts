import { Resend } from 'resend';

const apiKey = process.env.RESEND_API_KEY;
const appUrl = process.env.APP_URL || 'http://localhost:3000';

function getDomain(): string {
  try {
    return new URL(appUrl).hostname;
  } catch {
    return 'localhost';
  }
}

const resend = apiKey ? new Resend(apiKey) : null;

export async function sendMagicLink(
  email: string,
  token: string,
  type: 'login' | 'signup'
): Promise<void> {
  const link = `${appUrl}/auth/verify?token=${token}`;
  const subject =
    type === 'login' ? 'Your login link for OpenLetter' : 'Complete your OpenLetter signup';
  const body = `Click the link below to ${type === 'login' ? 'log in' : 'sign up'}:\n\n${link}\n\nThis link expires in 1 hour.`;

  if (!resend) {
    console.log(`[DEV EMAIL] To: ${email}`);
    console.log(`[DEV EMAIL] Subject: ${subject}`);
    console.log(`[DEV EMAIL] Link: ${link}`);
    return;
  }

  const domain = getDomain();
  await resend.emails.send({
    from: `OpenLetter <noreply@${domain}>`,
    to: email,
    subject,
    text: body,
  });
}

export async function sendVerificationEmail(
  email: string,
  name: string,
  letterTitle: string,
  token: string
): Promise<void> {
  const link = `${appUrl}/verify/${token}`;
  const subject = `Verify your signature on "${letterTitle}"`;
  const body = `Hi ${name},\n\nPlease verify your signature on "${letterTitle}" by clicking the link below:\n\n${link}\n\nIf you did not sign this letter, you can ignore this email.`;

  if (!resend) {
    console.log(`[DEV EMAIL] To: ${email}`);
    console.log(`[DEV EMAIL] Subject: ${subject}`);
    console.log(`[DEV EMAIL] Link: ${link}`);
    return;
  }

  const domain = getDomain();
  await resend.emails.send({
    from: `OpenLetter <noreply@${domain}>`,
    to: email,
    subject,
    text: body,
  });
}
