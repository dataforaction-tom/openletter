import type { Letter } from '../../types.js';
import { escapeHtml } from '../components.js';

function maskEmail(email: string): string {
  const [local, domain] = email.split('@');
  const visible = local.slice(0, 2);
  return `${visible}***@${domain}`;
}

// Checkmark SVG
const checkSvg = `<svg width="56" height="56" viewBox="0 0 56 56" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
  <circle cx="28" cy="28" r="24" stroke="currentColor" stroke-width="1.5" opacity="0.2"/>
  <path d="M18 28L25 35L38 21" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
</svg>`;

// Share icon
const shareSvg = `<svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" style="vertical-align:middle">
  <path d="M3 9V15H15V9" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"/>
  <path d="M9 2V11" stroke="currentColor" stroke-width="1.2" stroke-linecap="round"/>
  <path d="M5.5 5.5L9 2L12.5 5.5" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"/>
</svg>`;

// Email sent SVG
const emailSvg = `<svg width="56" height="56" viewBox="0 0 56 56" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
  <rect x="8" y="16" width="40" height="24" rx="2.5" stroke="currentColor" stroke-width="1.5" opacity="0.3"/>
  <path d="M8 19L28 33L48 19" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
  <circle cx="42" cy="14" r="7" fill="currentColor" opacity="0.12"/>
  <path d="M39.5 14L41.5 16L45 12" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" opacity="0.6"/>
</svg>`;

export function signedPage(letter: Letter, email: string, verified: boolean): string {
  const letterUrl = `${process.env.APP_URL || ''}/l/${escapeHtml(letter.slug)}`;
  const shareText = encodeURIComponent(`I just signed "${letter.title}" — add your name too: ${letterUrl}`);

  if (verified) {
    // No verification required — thank you + share page
    return `<div class="container">
  <div class="signed-page">
    <div class="signed-icon" style="color:var(--accent)">${checkSvg}</div>
    <h1>Thank you for signing</h1>
    <p>Your name has been added to <strong>&ldquo;${escapeHtml(letter.title)}&rdquo;</strong></p>

    <div class="share-box">
      <p class="share-label">${shareSvg} Help this letter reach more people</p>
      <div class="share-buttons">
        <a href="https://twitter.com/intent/tweet?text=${shareText}" target="_blank" rel="noopener" class="btn btn-secondary btn-sm">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true"><path d="M9.3 6.8L14.5 1h-1.2L8.8 6l-3.5-5H1.5l5.5 7.6L1.5 15h1.2l4.7-5.2 3.8 5.2h3.8L9.3 6.8zm-1.7 1.8l-.5-.7L3.2 2h1.8l3.4 4.6.5.7 4.4 6H11.4L7.6 8.6z"/></svg>
          Post
        </a>
        <button type="button" class="btn btn-secondary btn-sm" onclick="navigator.clipboard.writeText('${letterUrl}').then(function(){this.textContent='Copied!'}.bind(this))">
          Copy link
        </button>
      </div>
    </div>

    <div class="signed-redirect">
      <p class="text-muted">Returning to the letter in <span id="countdown">15</span> seconds&hellip;</p>
      <a href="/l/${escapeHtml(letter.slug)}" class="btn btn-primary">Back to letter now</a>
    </div>

    <script>
    (function(){
      var s=15,el=document.getElementById('countdown');
      var t=setInterval(function(){s--;if(el)el.textContent=s;if(s<=0){clearInterval(t);window.location.href='/l/${escapeHtml(letter.slug)}';}},1000);
    })();
    </script>
  </div>
</div>`;
  }

  // Verification required — check email page
  return `<div class="container">
  <div class="signed-page">
    <div class="signed-icon" style="color:var(--accent)">${emailSvg}</div>
    <h1>Check your email</h1>
    <p>We&rsquo;ve sent a verification link to <strong>${escapeHtml(maskEmail(email))}</strong></p>
    <p class="text-muted">Click the link in the email to confirm your signature on &ldquo;${escapeHtml(letter.title)}&rdquo;.</p>
    <a href="/l/${escapeHtml(letter.slug)}" class="btn btn-secondary" style="margin-top:var(--space-md)">Back to letter</a>
  </div>
</div>`;
}
