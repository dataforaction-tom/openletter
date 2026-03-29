import type { Letter } from '../../types.js';
import { escapeHtml } from '../components.js';
import { renderMarkdown } from '../../lib/markdown.js';

export function adminLetterDetailPage(letter: Letter & { user_email: string }): string {
  const isRemoved = letter.status === 'removed';

  return `
<div class="container">
  <a href="/admin" class="btn btn-secondary" style="margin-bottom:var(--space-lg)">&larr; Back to admin</a>

  <div class="card" style="margin-bottom:var(--space-lg)">
    <div class="card-body">
      <h1>${escapeHtml(letter.title)}</h1>
      <div style="display:flex;flex-wrap:wrap;gap:var(--space-md);margin-bottom:var(--space-md);font-size:0.9rem;color:var(--ink-muted);">
        <span>By: ${escapeHtml(letter.user_email)}</span>
        <span class="badge status-${letter.status}">${letter.status}</span>
        <span>${letter.signature_count} signatures</span>
        <span>${letter.view_count} views</span>
        <span>Created: ${letter.created_at?.split('T')[0] || ''}</span>
        ${letter.slug ? `<span><a href="/l/${letter.slug}" target="_blank">/l/${letter.slug}</a></span>` : ''}
      </div>
      <div class="letter-content">${renderMarkdown(letter.content_md)}</div>
    </div>
  </div>

  <div class="card">
    <div class="card-body">
      <h2 style="margin-bottom:var(--space-md)">Moderation Actions</h2>
      ${isRemoved ? `
        <p class="flash flash-error" style="margin-bottom:var(--space-md)">This letter has been removed.</p>
      ` : `
        <form method="POST" action="/admin/letters/${letter.id}/remove" style="display:inline;margin-right:var(--space-sm)">
          <button type="submit" class="btn btn-secondary" onclick="return confirm('Remove this letter? It will show a violation notice at its public URL.')">Remove (soft delete)</button>
        </form>
      `}
      <form method="POST" action="/admin/letters/${letter.id}/delete" style="display:inline">
        <button type="submit" class="btn btn-danger" onclick="return confirm('Permanently delete this letter and all its signatures? This cannot be undone.')">Delete permanently</button>
      </form>
    </div>
  </div>
</div>`;
}
