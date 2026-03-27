import type { Letter, Signature, LetterSettings, Author } from '../../types.js';
import { renderMarkdown } from '../../lib/markdown.js';
import { escapeHtml, formatDate, pagination, flashMessage } from '../components.js';

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
${flashes}

<article class="letter-article">
  <header class="letter-header">
    <span class="badge badge-published">Open Letter</span>
    ${statParts.length ? `<div class="letter-stats">${statParts.join(' &middot; ')}</div>` : ''}
  </header>

  <h1>${escapeHtml(letter.title)}</h1>

  ${authorsLine ? `<p class="letter-authors">By ${authorsLine}</p>` : ''}

  ${letter.published_at ? `<time class="letter-date">${formatDate(letter.published_at)}</time>` : ''}

  <div class="letter-content">
    ${renderMarkdown(letter.content_md)}
  </div>
</article>

<section class="letter-cta">
  <p><strong>${letter.signature_count} people</strong> have signed this letter</p>
  ${canSign ? `<button class="btn btn-primary" onclick="openModal('sign-modal')">Add your name</button>` : ''}
  ${isClosed ? `<p class="text-muted">This letter is closed for signatures</p>` : ''}
</section>

${settings.show_signatories ? `
<section class="signatories">
  <h2>Signatories</h2>
  ${verifiedSignatures.length ? `
  <ul>
    ${verifiedSignatures.map((s) => `<li>${escapeHtml(s.name)}${s.organisation ? ', ' + escapeHtml(s.organisation) : ''}</li>`).join('\n    ')}
  </ul>` : '<p class="text-muted">No verified signatures yet.</p>'}
  ${pagination(page, totalPages, `/l/${escapeHtml(letter.slug)}`)}
</section>` : ''}

${canSign ? `
<dialog id="sign-modal">
  <div class="modal-content">
    <button class="modal-close" onclick="closeModal('sign-modal')">&times;</button>
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
      <button type="submit" class="btn btn-primary" style="width:100%">Sign this letter</button>
    </form>
  </div>
</dialog>` : ''}

<script>fetch('/api/letters/${letter.id}/view', {method:'POST'})</script>`;
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
