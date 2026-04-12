import type { Letter, Signature, LetterSettings, Author } from '../../types.js';
import { renderMarkdown } from '../../lib/markdown.js';
import { escapeHtml, formatDate, pagination, flashMessage } from '../components.js';
import { isTurnstileEnabled, getSiteKey } from '../../lib/turnstile.js';

// Ornamental diamond SVG for section dividers
const ornamentSvg = `<svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
  <path d="M8 1L15 8L8 15L1 8Z" stroke="currentColor" stroke-width="1" fill="none"/>
  <path d="M8 4L12 8L8 12L4 8Z" stroke="currentColor" stroke-width="0.5" fill="none" opacity="0.5"/>
</svg>`;

// Pen nib SVG for the sign button area
const penNibSvg = `<svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" style="display:inline-block;vertical-align:middle;margin-right:8px;opacity:0.4">
  <path d="M7 25L9.5 17.5L14.5 22.5L7 25Z" stroke="currentColor" stroke-width="1.2" stroke-linejoin="round"/>
  <path d="M9.5 17.5L19 8C21 6 24 5.5 26 6C26.5 8 26 11 24 13L14.5 22.5" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"/>
  <path d="M6 26L4.5 27.5" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" opacity="0.4"/>
</svg>`;

export function publicLetterPage(
  letter: Letter,
  signatures: Signature[],
  page: number,
  totalPages: number,
  options: { verified?: boolean; alreadySigned?: boolean } = {}
): string {
  const settings: LetterSettings = JSON.parse(letter.settings_json);
  const authors: Author[] = JSON.parse(letter.authors_json);

  const isClosed =
    letter.status === 'closed' ||
    (letter.closing_date && new Date(letter.closing_date) < new Date());
  const canSign = letter.status === 'published' && !isClosed;

  // Stats line
  const statParts: string[] = [];
  if (settings.show_signature_count) {
    statParts.push(`${letter.signature_count} signature${letter.signature_count === 1 ? '' : 's'}`);
  }
  if (settings.show_view_count) {
    statParts.push(`${letter.view_count} views`);
  }

  // Authors line
  const authorsLine = authors.length
    ? authors.map((a) => escapeHtml(a.name) + (a.org ? ', ' + escapeHtml(a.org) : '')).join('; ')
    : '';

  // Verified signatures only for public display
  const verifiedSignatures = signatures.filter((s) => s.verified === 1);

  // Flash messages
  let flashes = '';
  if (options.verified) {
    flashes += flashMessage('success', 'Your signature has been verified!');
  }
  if (options.alreadySigned) {
    flashes += flashMessage('info', 'You have already signed this letter.');
  }

  // Form fields based on settings
  const formFields = buildFormFields(settings, letter.slug);

  return `
<nav class="nav-public" aria-label="Main navigation">
  <div class="nav-inner">
    <a href="/" class="nav-logo">
      <svg width="28" height="28" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
        <path d="M6 22L8.5 14.5L13.5 19.5L6 22Z" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round" fill="none"/>
        <path d="M8.5 14.5L18 5C20 3 23 2.5 25 3C25.5 5 25 8 23 10L13.5 19.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
        <path d="M5 23L3.5 24.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" opacity="0.5"/>
      </svg>
      OpenLetter
    </a>
    <div class="nav-right">
      <a href="/login" class="nav-cta">Create yours</a>
    </div>
  </div>
</nav>

<div class="container">
${flashes}

<header class="letter-header">
  <span class="badge badge-published">Open Letter</span>
  ${statParts.length ? `<div class="letter-stats">${statParts.join(' &middot; ')}</div>` : ''}
</header>

<h1>${escapeHtml(letter.title)}</h1>

${authorsLine ? `<p class="letter-authors">By ${authorsLine}</p>` : ''}

${letter.published_at ? `<time class="letter-date">${formatDate(letter.published_at)}</time>` : ''}

<div class="ornament">${ornamentSvg}</div>

<article class="letter-article">
  <div class="letter-content">
    ${renderMarkdown(letter.content_md)}
  </div>
</article>

<div class="ornament">${ornamentSvg}</div>

<section class="letter-cta">
  <p>${penNibSvg}<strong>${letter.signature_count} people</strong> have signed this letter</p>
  ${canSign ? `<button class="btn btn-amber btn-lg" onclick="openModal('sign-modal')">Add your name</button>` : ''}
  ${isClosed ? `<p class="text-muted">This letter is closed for signatures</p>` : ''}
</section>

${settings.show_signatories ? `
<section class="signatories" aria-label="Signatories">
  <div class="signatories-header">
    <h2>Signatories</h2>
    ${settings.show_signature_count ? `<span class="signatories-count">${letter.signature_count} total</span>` : ''}
  </div>
  ${verifiedSignatures.length ? `
  <ul class="signatories-list">
    ${verifiedSignatures.map((s) => {
      const initial = s.name.charAt(0);
      return `<li class="signatory">
      <span class="signatory-avatar">${escapeHtml(initial)}</span>
      <span class="signatory-info">
        <span class="signatory-name">${escapeHtml(s.name)}</span>
        ${s.organisation ? `<span class="signatory-detail">${escapeHtml(s.organisation)}</span>` : ''}
      </span>
    </li>`;
    }).join('\n    ')}
  </ul>` : '<p class="text-muted">No verified signatures yet.</p>'}
  ${pagination(page, totalPages, `/l/${escapeHtml(letter.slug)}`)}
</section>` : ''}

${canSign ? `
<dialog id="sign-modal">
  <div class="modal-content">
    <button class="modal-close" onclick="closeModal('sign-modal')" aria-label="Close">&times;</button>
    <h2>Sign this letter</h2>
    <form method="POST" action="/l/${escapeHtml(letter.slug)}/sign">
      <div class="form-group">
        <label for="name">Name *</label>
        <input type="text" id="name" name="name" required>
      </div>
      <div class="form-group">
        <label for="email">Email *</label>
        <input type="email" id="email" name="email" required>
        <small class="text-muted">Your email will not be displayed publicly</small>
      </div>
      ${formFields}
      <div style="display:none"><input type="text" name="website" tabindex="-1" autocomplete="off"></div>
      ${isTurnstileEnabled() ? `<div class="cf-turnstile" data-sitekey="${getSiteKey()}" data-theme="light"></div>` : ''}
      <button type="submit" class="btn btn-amber" style="width:100%">Sign this letter</button>
    </form>
    ${isTurnstileEnabled() ? `<script src="https://challenges.cloudflare.com/turnstile/v0/api.js" async defer></script>` : ''}
  </div>
</dialog>` : ''}

<script>fetch('/api/letters/${letter.id}/view', {method:'POST'})</script>
</div>`;
}

function buildFormFields(settings: LetterSettings, _slug: string): string {
  const fields: string[] = [];

  if (settings.fields.organisation !== 'hidden') {
    const req = settings.fields.organisation === 'required';
    fields.push(`<div class="form-group">
        <label for="organisation">Organisation${req ? ' *' : ''}</label>
        <input type="text" id="organisation" name="organisation"${req ? ' required' : ''}>
      </div>`);
  }

  if (settings.fields.role !== 'hidden') {
    const req = settings.fields.role === 'required';
    fields.push(`<div class="form-group">
        <label for="role">Role${req ? ' *' : ''}</label>
        <input type="text" id="role" name="role"${req ? ' required' : ''}>
      </div>`);
  }

  if (settings.fields.location !== 'hidden') {
    const req = settings.fields.location === 'required';
    fields.push(`<div class="form-group">
        <label for="location">Location${req ? ' *' : ''}</label>
        <input type="text" id="location" name="location"${req ? ' required' : ''}>
      </div>`);
  }

  if (settings.allow_comments) {
    fields.push(`<div class="form-group">
        <label for="comment">Comment</label>
        <textarea id="comment" name="comment" rows="3"></textarea>
      </div>`);
  }

  return fields.join('\n      ');
}
