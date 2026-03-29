import { Resend } from 'resend';
import nodemailer from 'nodemailer';

const appUrl = process.env.APP_URL || 'http://localhost:3000';

// Determine email provider from env
// Priority: EMAIL_PROVIDER env var > auto-detect from available config > console fallback
function getProvider(): 'resend' | 'smtp' | 'console' {
  const explicit = process.env.EMAIL_PROVIDER?.toLowerCase();
  if (explicit === 'resend' || explicit === 'smtp' || explicit === 'console') {
    return explicit;
  }
  if (process.env.RESEND_API_KEY) return 'resend';
  if (process.env.SMTP_HOST) return 'smtp';
  return 'console';
}

const provider = getProvider();

// --- Resend ---
const resend = provider === 'resend' ? new Resend(process.env.RESEND_API_KEY) : null;

function getResendFrom(): string {
  if (process.env.EMAIL_FROM) return process.env.EMAIL_FROM;
  try {
    const hostname = new URL(appUrl).hostname;
    return `OpenLetter <noreply@${hostname}>`;
  } catch {
    return 'OpenLetter <noreply@localhost>';
  }
}

// --- SMTP ---
const smtpTransport = provider === 'smtp'
  ? nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || '587', 10),
      secure: process.env.SMTP_SECURE === 'true',
      auth: process.env.SMTP_USER
        ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS || '' }
        : undefined,
    })
  : null;

function getSmtpFrom(): string {
  return process.env.SMTP_FROM || process.env.EMAIL_FROM || 'OpenLetter <noreply@localhost>';
}

// --- Send helper ---
async function send(to: string, subject: string, text: string): Promise<void> {
  if (provider === 'resend' && resend) {
    await resend.emails.send({
      from: getResendFrom(),
      to,
      subject,
      text,
    });
  } else if (provider === 'smtp' && smtpTransport) {
    await smtpTransport.sendMail({
      from: getSmtpFrom(),
      to,
      subject,
      text,
    });
  } else {
    console.log(`[DEV EMAIL] To: ${to}`);
    console.log(`[DEV EMAIL] Subject: ${subject}`);
    console.log(`[DEV EMAIL] Body:\n${text}`);
    console.log('---');
  }
}

// --- Public API ---

export async function sendMagicLink(
  email: string,
  token: string,
  type: 'login' | 'signup'
): Promise<void> {
  const link = `${appUrl}/auth/verify?token=${token}`;
  const subject =
    type === 'login' ? 'Your login link for OpenLetter' : 'Complete your OpenLetter signup';
  const body = `Click the link below to ${type === 'login' ? 'log in' : 'sign up'}:\n\n${link}\n\nThis link expires in 1 hour.`;

  if (provider === 'console') {
    console.log(`[DEV EMAIL] To: ${email}`);
    console.log(`[DEV EMAIL] Subject: ${subject}`);
    console.log(`[DEV EMAIL] Link: ${link}`);
    return;
  }

  await send(email, subject, body);
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

  if (provider === 'console') {
    console.log(`[DEV EMAIL] To: ${email}`);
    console.log(`[DEV EMAIL] Subject: ${subject}`);
    console.log(`[DEV EMAIL] Link: ${link}`);
    return;
  }

  await send(email, subject, body);
}

// Log provider on startup
console.log(`[EMAIL] Provider: ${provider}`);
