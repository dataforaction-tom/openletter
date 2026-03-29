import { Resend } from 'resend';
import nodemailer from 'nodemailer';

const appUrl = process.env.APP_URL || 'http://localhost:3000';

// Determine email provider from env
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

// --- HTML Email Templates ---

function emailLayout(content: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <title>OpenLetter</title>
  <!--[if mso]>
  <style>table,td{font-family:Arial,sans-serif!important}</style>
  <![endif]-->
</head>
<body style="margin:0;padding:0;background-color:#E8E5DD;font-family:Georgia,'Times New Roman',serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#E8E5DD;">
    <tr>
      <td align="center" style="padding:32px 16px;">
        <table role="presentation" width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;">
          <!-- Header -->
          <tr>
            <td style="background-color:#1B2A4A;padding:24px 32px;border-radius:8px 8px 0 0;">
              <a href="${appUrl}" style="color:#F7F5F0;font-family:Georgia,'Times New Roman',serif;font-size:22px;font-weight:600;text-decoration:none;letter-spacing:-0.3px;">&#9998; OpenLetter</a>
            </td>
          </tr>
          <!-- Body -->
          <tr>
            <td style="background-color:#F7F5F0;padding:36px 32px;">
              ${content}
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="background-color:#F0EDE5;padding:20px 32px;border-radius:0 0 8px 8px;border-top:1px solid rgba(26,42,74,0.08);">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="font-family:-apple-system,system-ui,sans-serif;font-size:13px;color:#636B78;">
                    <a href="${appUrl}" style="color:#636B78;text-decoration:none;font-weight:500;">OpenLetter</a>
                    &nbsp;&middot;&nbsp;
                    <a href="https://open-letter.uk" style="color:#636B78;text-decoration:none;">open-letter.uk</a>
                  </td>
                </tr>
                <tr>
                  <td style="font-family:-apple-system,system-ui,sans-serif;font-size:12px;color:#9BA3AE;padding-top:6px;">
                    Open source, self-hostable
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
}

function ctaButton(text: string, href: string): string {
  return `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:28px 0;">
  <tr>
    <td style="background-color:#2D8B7A;border-radius:6px;">
      <!--[if mso]>
      <v:roundrect xmlns:v="urn:schemas-microsoft-com:vml" href="${href}" style="height:48px;width:220px;v-text-anchor:middle;" arcsize="13%" fillcolor="#2D8B7A" stroke="f">
      <center style="color:#ffffff;font-family:Arial,sans-serif;font-size:16px;font-weight:bold;">${text}</center>
      </v:roundrect>
      <![endif]-->
      <!--[if !mso]><!-->
      <a href="${href}" style="display:inline-block;padding:14px 32px;background-color:#2D8B7A;color:#ffffff;font-family:-apple-system,system-ui,sans-serif;font-size:15px;font-weight:600;text-decoration:none;border-radius:6px;text-align:center;">${text}</a>
      <!--<![endif]-->
    </td>
  </tr>
</table>`;
}

function magicLinkHtml(link: string, type: 'login' | 'signup'): string {
  const heading = type === 'login' ? 'Log in to OpenLetter' : 'Complete your signup';
  const action = type === 'login' ? 'log in' : 'complete your signup';
  const buttonText = type === 'login' ? 'Log In' : 'Complete Signup';

  return emailLayout(`
    <h1 style="margin:0 0 16px;font-family:Georgia,'Times New Roman',serif;font-size:24px;font-weight:600;color:#1B2A4A;letter-spacing:-0.3px;">${heading}</h1>
    <p style="margin:0 0 4px;font-family:-apple-system,system-ui,sans-serif;font-size:15px;line-height:1.6;color:#3D4A5C;">
      Click the button below to ${action}:
    </p>
    ${ctaButton(buttonText, link)}
    <p style="margin:0 0 8px;font-family:-apple-system,system-ui,sans-serif;font-size:13px;line-height:1.5;color:#636B78;">
      This link expires in 1 hour. If you didn't request this, you can safely ignore this email.
    </p>
    <p style="margin:0;font-family:-apple-system,system-ui,sans-serif;font-size:12px;line-height:1.5;color:#9BA3AE;word-break:break-all;">
      ${link}
    </p>
  `);
}

function verificationHtml(name: string, letterTitle: string, letterContent: string, link: string): string {
  const preview = letterContent.length > 150
    ? letterContent.substring(0, 150).replace(/\s+\S*$/, '') + '...'
    : letterContent;

  return emailLayout(`
    <h1 style="margin:0 0 16px;font-family:Georgia,'Times New Roman',serif;font-size:24px;font-weight:600;color:#1B2A4A;letter-spacing:-0.3px;">Verify your signature</h1>
    <p style="margin:0 0 20px;font-family:-apple-system,system-ui,sans-serif;font-size:15px;line-height:1.6;color:#3D4A5C;">
      Hi ${escapeHtml(name)}, please confirm your signature on:
    </p>
    <!-- Letter preview card -->
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 24px;">
      <tr>
        <td style="background-color:#F0EDE5;border:1px solid rgba(26,42,74,0.08);border-radius:6px;padding:20px 24px;">
          <p style="margin:0 0 8px;font-family:Georgia,'Times New Roman',serif;font-size:17px;font-weight:600;color:#1B2A4A;letter-spacing:-0.2px;">
            &ldquo;${escapeHtml(letterTitle)}&rdquo;
          </p>
          <p style="margin:0;font-family:-apple-system,system-ui,sans-serif;font-size:14px;line-height:1.6;color:#636B78;">
            ${escapeHtml(preview)}
          </p>
        </td>
      </tr>
    </table>
    ${ctaButton('Verify My Signature', link)}
    <p style="margin:0;font-family:-apple-system,system-ui,sans-serif;font-size:13px;line-height:1.5;color:#636B78;">
      If you didn't sign this letter, you can safely ignore this email.
    </p>
  `);
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// --- Send helper ---
async function send(to: string, subject: string, text: string, html?: string): Promise<void> {
  if (provider === 'resend' && resend) {
    await resend.emails.send({
      from: getResendFrom(),
      to,
      subject,
      text,
      html,
    });
  } else if (provider === 'smtp' && smtpTransport) {
    await smtpTransport.sendMail({
      from: getSmtpFrom(),
      to,
      subject,
      text,
      html,
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

  await send(email, subject, body, magicLinkHtml(link, type));
}

export async function sendVerificationEmail(
  email: string,
  name: string,
  letterTitle: string,
  letterContent: string,
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

  await send(email, subject, body, verificationHtml(name, letterTitle, letterContent, link));
}

// Log provider on startup
console.log(`[EMAIL] Provider: ${provider}`);
