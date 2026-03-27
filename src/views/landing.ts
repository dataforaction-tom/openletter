import { layout } from './layout.js';
import type { Letter } from '../types.js';

export function landingPage(recentLetters?: Letter[]): string {
  const recentSection =
    recentLetters && recentLetters.length > 0
      ? `
  <section class="recent-letters">
    <h2 class="text-center">Recent letters</h2>
    <div class="grid">
      ${recentLetters
        .map(
          (letter) => `
        <a href="/l/${letter.slug}" class="card">
          <h3>${escapeHtml(letter.title)}</h3>
          <p class="text-muted">${letter.signature_count} signature${letter.signature_count === 1 ? '' : 's'}</p>
        </a>`
        )
        .join('')}
    </div>
  </section>`
      : '';

  const content = `
<div class="hero">
  <h1>Create open letters that matter</h1>
  <p>Write, share, and collect verified signatures for causes you believe in.</p>
  <a href="/login" class="btn btn-primary btn-lg">Create your letter</a>
</div>

<section class="features-section">
  <h2 class="text-center">How it works</h2>
  <div class="features-grid">
    <div class="feature-card">
      <div class="feature-icon">\u270D\uFE0F</div>
      <h3>Write your letter</h3>
      <p>Use our markdown editor to craft your message. Add co-authors and configure signature fields.</p>
    </div>
    <div class="feature-card">
      <div class="feature-icon">\uD83D\uDD17</div>
      <h3>Share the link</h3>
      <p>Publish your letter and share the unique link with your audience.</p>
    </div>
    <div class="feature-card">
      <div class="feature-icon">\u2705</div>
      <h3>Collect signatures</h3>
      <p>Supporters sign with email verification. Track progress from your dashboard.</p>
    </div>
  </div>
</section>

${recentSection}

<section class="cta-section">
  <h2>Open source. Self-hostable. Privacy-conscious.</h2>
  <p>OpenLetter is free and open source. Host it yourself or use our platform.</p>
  <a href="/login" class="btn btn-primary">Get started</a>
</section>`;

  return layout('Create open letters that matter', content);
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
