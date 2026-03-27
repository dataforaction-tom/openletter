import { layout } from './layout.js';
import { escapeHtml } from './components.js';

export function loginPage(options: { error?: string; sent?: boolean; email?: string } = {}): string {
  const { error, sent, email } = options;

  let content = '';

  if (sent && email) {
    content = `
<div class="login-container">
  <h1>Check your email</h1>
  <p class="text-muted">We sent a magic link to <strong>${escapeHtml(email)}</strong>.</p>
  <p class="text-muted">Click the link in the email to sign in. It expires in 1 hour.</p>
  <a href="/login" class="btn btn-primary" style="width:100%;text-align:center;margin-top:var(--space-md)">Back to login</a>
</div>`;
  } else {
    content = `
<div class="login-container">
  ${error ? `<div class="flash flash-error"><span>${escapeHtml(error)}</span></div>` : ''}
  <h1>Sign in to OpenLetter</h1>
  <p class="text-muted">Enter your email to receive a magic link</p>
  <form method="POST" action="/login">
    <div class="form-group">
      <label for="email">Email address</label>
      <input type="email" id="email" name="email" required placeholder="you@example.com" autofocus>
    </div>
    <button type="submit" class="btn btn-primary" style="width:100%">Send magic link</button>
  </form>
  <p class="text-muted text-center" style="margin-top:var(--space-lg)">
    No account? One will be created automatically.
  </p>
</div>`;
  }

  const style = `
<style>
  .login-container {
    max-width: 400px;
    margin: 0 auto;
    padding-top: var(--space-3xl);
  }
</style>`;

  return layout('Sign in', style + content);
}
