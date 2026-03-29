import { layout } from './layout.js';
import { escapeHtml } from './components.js';

// Magic link envelope SVG
const envelopeSvg = `<svg width="64" height="64" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
  <rect x="8" y="16" width="48" height="32" rx="3" stroke="currentColor" stroke-width="1.5" fill="none"/>
  <path d="M8 19L32 36L56 19" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
  <path d="M8 48L24 34" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" opacity="0.3"/>
  <path d="M56 48L40 34" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" opacity="0.3"/>
  <circle cx="50" cy="14" r="6" fill="currentColor" opacity="0.15"/>
  <path d="M48 14L50 16L53 12" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" opacity="0.6"/>
</svg>`;

// Sent state — paper plane SVG
const planeSvg = `<svg width="64" height="64" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
  <path d="M10 32L54 10L42 54L30 38L10 32Z" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round" fill="none"/>
  <path d="M30 38L54 10" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
  <path d="M30 38V50L36 44" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" opacity="0.5"/>
  <path d="M8 20L14 22" stroke="currentColor" stroke-width="1" stroke-linecap="round" opacity="0.2"/>
  <path d="M6 28L12 30" stroke="currentColor" stroke-width="1" stroke-linecap="round" opacity="0.2"/>
  <path d="M12 38L16 36" stroke="currentColor" stroke-width="1" stroke-linecap="round" opacity="0.2"/>
</svg>`;

export function loginPage(options: { error?: string; sent?: boolean; email?: string } = {}): string {
  const { error, sent, email } = options;

  let content = '';

  if (sent && email) {
    content = `
<div class="container">
  <div class="login-page">
    <div class="login-container">
      <div class="login-illustration">${planeSvg}</div>
      <h1>Check your email</h1>
      <p class="text-muted">We sent a magic link to <strong>${escapeHtml(email)}</strong>.</p>
      <p class="text-muted">Click the link in the email to sign in. It expires in 1 hour.</p>
      <a href="/login" class="btn btn-primary" style="width:100%;text-align:center;margin-top:var(--space-md)">Back to login</a>
    </div>
  </div>
</div>`;
  } else {
    content = `
<div class="container">
  <div class="login-page">
    <div class="login-container">
      ${error ? `<div class="flash flash-error"><span>${escapeHtml(error)}</span></div>` : ''}
      <div class="login-illustration">${envelopeSvg}</div>
      <h1>Sign in to OpenLetter</h1>
      <p class="text-muted">Enter your email to receive a magic link</p>
      <form method="POST" action="/login">
        <div class="form-group">
          <label for="email">Email address</label>
          <input type="email" id="email" name="email" required placeholder="you@example.com" autofocus>
        </div>
        <button type="submit" class="btn btn-primary" style="width:100%">Send magic link</button>
      </form>
      <p class="text-muted text-center mt-lg">
        No account? One will be created automatically.
      </p>
    </div>
  </div>
</div>`;
  }

  return layout('Sign in', content);
}
