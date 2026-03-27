import type { Letter } from '../../types.js';
import { escapeHtml } from '../components.js';

function maskEmail(email: string): string {
  const [local, domain] = email.split('@');
  const visible = local.slice(0, 2);
  return `${visible}***@${domain}`;
}

export function signedPage(letter: Letter, email: string): string {
  return `<div class="login-container" style="text-align:center">
  <h1>Check your email</h1>
  <p>We've sent a verification link to <strong>${escapeHtml(maskEmail(email))}</strong></p>
  <p class="text-muted">Click the link in the email to verify your signature.</p>
  <a href="/l/${escapeHtml(letter.slug)}" class="btn btn-secondary">Back to letter</a>
</div>`;
}
