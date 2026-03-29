import type { Letter, Author } from '../../types.js';
import { dashboardTabs, escapeHtml } from '../components.js';

// Markdown cheat sheet icon
const cheatSheetIcon = `<svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><circle cx="9" cy="9" r="7.5" stroke="currentColor" stroke-width="1.2"/><path d="M9 5.5V10" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/><circle cx="9" cy="12.5" r="0.75" fill="currentColor"/></svg>`;

// Toggle sidebar icon
const sidebarIcon = `<svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><rect x="2" y="3" width="14" height="12" rx="1.5" stroke="currentColor" stroke-width="1.2"/><path d="M10 3V15" stroke="currentColor" stroke-width="1.2"/><path d="M12.5 7H14" stroke="currentColor" stroke-width="1" stroke-linecap="round" opacity="0.4"/><path d="M12.5 9H14" stroke="currentColor" stroke-width="1" stroke-linecap="round" opacity="0.4"/><path d="M12.5 11H14" stroke="currentColor" stroke-width="1" stroke-linecap="round" opacity="0.4"/></svg>`;

export function newLetterPage(): string {
  return `
<div class="container container--wide">
  <h1>New letter</h1>
  <form method="post" action="/dashboard/new">
    <div class="form-group">
      <label for="title">Title</label>
      <input type="text" id="title" name="title" required placeholder="Your letter title" class="input">
    </div>
    <div class="form-group">
      <label for="content_md">Content</label>
      <textarea id="content_md" name="content_md" rows="10" placeholder="Write your letter content here (Markdown supported)" class="input"></textarea>
    </div>
    <button type="submit" class="btn btn-primary">Create draft</button>
  </form>
</div>`;
}

export function editorPage(letter: Letter): string {
  const authors: Author[] = JSON.parse(letter.authors_json || '[]');
  const authorsJsonEscaped = escapeHtml(JSON.stringify(authors));

  const authorsList = authors
    .map(
      (a, i) => `
      <div class="author-item">
        <span class="author-name">${escapeHtml(a.name)}${a.org ? ` <span class="author-org">(${escapeHtml(a.org)})</span>` : ''}</span>
        <button type="button" class="btn btn-sm btn-danger remove-author" data-index="${i}">Remove</button>
      </div>`
    )
    .join('\n');

  const isPublished = letter.status === 'published';

  return `
<div class="container container--wide">
  ${dashboardTabs(letter.id, 'edit')}

  <form method="post" action="/dashboard/${escapeHtml(letter.id)}" data-letter-id="${escapeHtml(letter.id)}">
    <div class="form-group">
      <label for="title">Title</label>
      <input type="text" id="title" name="title" value="${escapeHtml(letter.title)}" required class="input">
    </div>

    <div class="editor-toolbar">
      <button type="button" id="toggle-preview" class="btn btn-ghost btn-sm" title="Toggle preview panel">
        ${sidebarIcon}
        <span>Preview</span>
      </button>
      <button type="button" id="open-cheatsheet" class="btn btn-ghost btn-sm" title="Markdown syntax help">
        ${cheatSheetIcon}
        <span>Syntax help</span>
      </button>
    </div>

    <div class="editor-container" id="editor-container">
      <div class="editor-pane editor-pane--editor">
        <textarea id="editor" name="content_md" class="editor-textarea">${escapeHtml(letter.content_md)}</textarea>
      </div>
      <div class="editor-pane editor-pane--preview" id="preview-pane">
        <div id="preview" class="editor-preview"></div>
      </div>
    </div>

    <div class="authors-section">
      <h3>Authors</h3>
      <div id="authors-list">
        ${authorsList}
      </div>
      <div class="author-add-form">
        <input type="text" id="author-name" placeholder="Author name" class="input">
        <input type="text" id="author-org" placeholder="Organisation (optional)" class="input">
        <button type="button" id="add-author" class="btn btn-secondary">Add author</button>
      </div>
      <input type="hidden" id="authors_json" name="authors_json" value="${authorsJsonEscaped}">
    </div>

    <div class="action-buttons">
      <button type="submit" class="btn btn-primary">Save</button>
    </div>
  </form>

  <div class="action-buttons" style="border-top:none;padding-top:0;margin-top:var(--space-sm)">
    ${isPublished ? `<a href="/l/${escapeHtml(letter.slug)}" target="_blank" class="btn btn-secondary">View published letter &rarr;</a>` : ''}
    <form method="post" action="/dashboard/${escapeHtml(letter.id)}/publish">
      <button type="submit" class="btn ${isPublished ? 'btn-secondary' : 'btn-success'}">${isPublished ? 'Unpublish' : 'Publish'}</button>
    </form>
    <form method="post" action="/dashboard/${escapeHtml(letter.id)}/delete" class="delete-form">
      <button type="submit" class="btn btn-danger">Delete</button>
    </form>
  </div>
</div>

${markdownCheatSheet()}

<script src="https://cdn.jsdelivr.net/npm/marked/marked.min.js"></script>`;
}

function markdownCheatSheet(): string {
  return `
<dialog id="md-cheatsheet" class="cheatsheet-dialog">
  <div class="modal-content">
    <button class="modal-close" onclick="closeModal('md-cheatsheet')" aria-label="Close">&times;</button>
    <h2>Markdown syntax</h2>
    <div class="cheatsheet-grid">
      <div class="cheatsheet-section">
        <h4>Text formatting</h4>
        <table class="cheatsheet-table">
          <tr><td><code>**bold**</code></td><td><strong>bold</strong></td></tr>
          <tr><td><code>*italic*</code></td><td><em>italic</em></td></tr>
          <tr><td><code>~~strikethrough~~</code></td><td><s>strikethrough</s></td></tr>
          <tr><td><code>\`inline code\`</code></td><td><code>inline code</code></td></tr>
        </table>
      </div>
      <div class="cheatsheet-section">
        <h4>Headings</h4>
        <table class="cheatsheet-table">
          <tr><td><code># Heading 1</code></td><td>Largest heading</td></tr>
          <tr><td><code>## Heading 2</code></td><td>Second heading</td></tr>
          <tr><td><code>### Heading 3</code></td><td>Third heading</td></tr>
        </table>
      </div>
      <div class="cheatsheet-section">
        <h4>Lists</h4>
        <table class="cheatsheet-table">
          <tr><td><code>- item</code></td><td>Unordered list</td></tr>
          <tr><td><code>1. item</code></td><td>Ordered list</td></tr>
          <tr><td><code>- [ ] task</code></td><td>Task list</td></tr>
        </table>
      </div>
      <div class="cheatsheet-section">
        <h4>Other</h4>
        <table class="cheatsheet-table">
          <tr><td><code>[text](url)</code></td><td>Link</td></tr>
          <tr><td><code>![alt](url)</code></td><td>Image</td></tr>
          <tr><td><code>> quote</code></td><td>Blockquote</td></tr>
          <tr><td><code>---</code></td><td>Horizontal rule</td></tr>
        </table>
      </div>
    </div>
  </div>
</dialog>`;
}
