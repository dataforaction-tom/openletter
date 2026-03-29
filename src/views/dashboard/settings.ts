import type { Letter, LetterSettings } from '../../types.js';
import { dashboardTabs, escapeHtml } from '../components.js';

function radioGroup(
  name: string,
  label: string,
  currentValue: string,
  options: { value: string; label: string }[]
): string {
  const radios = options
    .map(
      (opt) =>
        `<label class="radio-label">
          <input type="radio" name="${escapeHtml(name)}" value="${escapeHtml(opt.value)}"${opt.value === currentValue ? ' checked' : ''}>
          ${escapeHtml(opt.label)}
        </label>`
    )
    .join('\n        ');

  return `
    <div class="form-group">
      <label>${escapeHtml(label)}</label>
      <div class="radio-group">
        ${radios}
      </div>
    </div>`;
}

function checkbox(name: string, label: string, checked: boolean): string {
  return `
    <div class="form-group">
      <label class="checkbox-label">
        <input type="checkbox" name="${escapeHtml(name)}" value="1"${checked ? ' checked' : ''}>
        ${escapeHtml(label)}
      </label>
    </div>`;
}

export function settingsPage(letter: Letter): string {
  const settings: LetterSettings = JSON.parse(letter.settings_json);
  const fieldOptions = [
    { value: 'required', label: 'Required' },
    { value: 'optional', label: 'Optional' },
    { value: 'hidden', label: 'Hidden' },
  ];
  const commentOptions = [
    { value: 'optional', label: 'Optional' },
    { value: 'hidden', label: 'Hidden' },
  ];

  return `
<div class="container container--wide">
  ${dashboardTabs(letter.id, 'settings')}

  <form method="post" action="/dashboard/${escapeHtml(letter.id)}/settings">
    <h2>Letter settings</h2>

    <div class="form-group">
      <label for="description">Description</label>
      <textarea id="description" name="description" rows="3" class="input" placeholder="Brief description of your letter">${escapeHtml(letter.description || '')}</textarea>
    </div>

    <div class="form-group">
      <label>Slug</label>
      <div class="input-readonly">${escapeHtml(letter.slug)}</div>
    </div>

    <h3>Signature form fields</h3>

    ${radioGroup('field_organisation', 'Organisation', settings.fields.organisation, fieldOptions)}
    ${radioGroup('field_role', 'Role', settings.fields.role, fieldOptions)}
    ${radioGroup('field_location', 'Location', settings.fields.location, fieldOptions)}
    ${radioGroup('field_comment', 'Comment', settings.allow_comments ? 'optional' : 'hidden', commentOptions)}

    <h3>Options</h3>

    ${checkbox('require_verification', 'Require email verification for signatures', settings.require_verification)}
    ${checkbox('show_signature_count', 'Show signature count publicly', settings.show_signature_count)}
    ${checkbox('show_view_count', 'Show view count publicly', settings.show_view_count)}
    ${checkbox('show_signatories', 'Show list of signatories publicly', settings.show_signatories)}

    <div class="form-group">
      <label for="closing_date">Closing date (optional)</label>
      <input type="date" id="closing_date" name="closing_date" value="${escapeHtml(letter.closing_date || '')}" class="input">
    </div>

    <button type="submit" class="btn btn-primary">Save settings</button>
  </form>
</div>`;
}
