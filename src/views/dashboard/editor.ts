import type { Letter, Author } from '../../types.js';
import { dashboardTabs, escapeHtml } from '../components.js';

export function newLetterPage(): string {
  return `
<div class="container">
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

  const publishButton =
    letter.status === 'draft'
      ? `<form method="post" action="/dashboard/${escapeHtml(letter.id)}/publish" style="display:inline">
          <button type="submit" class="btn btn-success">Publish</button>
        </form>`
      : `<form method="post" action="/dashboard/${escapeHtml(letter.id)}/publish" style="display:inline">
          <button type="submit" class="btn btn-secondary">Unpublish</button>
        </form>`;

  const previewLink =
    letter.status === 'published'
      ? `<a href="/l/${escapeHtml(letter.slug)}" target="_blank" class="btn btn-secondary">Preview</a>`
      : '';

  return `
<div class="container">
  ${dashboardTabs(letter.id, 'edit')}

  <form method="post" action="/dashboard/${escapeHtml(letter.id)}" data-letter-id="${escapeHtml(letter.id)}">
    <div class="form-group">
      <label for="title">Title</label>
      <input type="text" id="title" name="title" value="${escapeHtml(letter.title)}" required class="input">
    </div>

    <div class="editor-container">
      <div class="editor-pane">
        <label for="editor">Content (Markdown)</label>
        <textarea id="editor" name="content_md" class="input editor-textarea">${escapeHtml(letter.content_md)}</textarea>
      </div>
      <div class="editor-pane">
        <label>Preview</label>
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
      ${previewLink}
      ${publishButton}
      <form method="post" action="/dashboard/${escapeHtml(letter.id)}/delete" class="delete-form" style="display:inline">
        <button type="submit" class="btn btn-danger">Delete</button>
      </form>
    </div>
  </form>
</div>
<script src="https://cdn.jsdelivr.net/npm/marked/marked.min.js"></script>`;
}
