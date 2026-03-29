import type { Letter, Signature } from '../../types.js';
import {
  escapeHtml,
  dashboardTabs,
  statCard,
  verificationBadge,
  formatDate,
  pagination,
  emptyState,
} from '../components.js';

export function signaturesPage(
  letter: Letter,
  signatures: Signature[],
  filter: string,
  page: number,
  totalPages: number,
  stats: { total: number; verified: number; pending: number }
): string {
  const filterLinks = ['all', 'verified', 'pending']
    .map(
      (f) =>
        `<a href="?filter=${f}" class="tab${f === filter ? ' active' : ''}">${f.charAt(0).toUpperCase() + f.slice(1)}</a>`
    )
    .join('\n  ');

  const rows = signatures
    .map(
      (sig) => `<tr>
        <td>${escapeHtml(sig.name)}</td>
        <td>${escapeHtml(sig.email)}</td>
        <td>${sig.organisation ? escapeHtml(sig.organisation) : '&mdash;'}</td>
        <td>${verificationBadge(sig.verified)}</td>
        <td>${formatDate(sig.created_at)}</td>
        <td>
          <form method="POST" action="/dashboard/${escapeHtml(letter.id)}/signatures/${escapeHtml(sig.id)}/delete" class="delete-form">
            <button type="submit" class="btn btn-ghost btn-icon btn-danger" title="Delete">&times;</button>
          </form>
        </td>
      </tr>`
    )
    .join('\n      ');

  return `
<div class="container container--wide">
${dashboardTabs(letter.id, 'signatures')}

<div class="stat-row">
  ${statCard('Total', stats.total)}
  ${statCard('Verified', stats.verified)}
  ${statCard('Pending', stats.pending)}
</div>

<div class="tabs" style="margin-bottom: var(--space-lg)">
  ${filterLinks}
</div>

<a href="/dashboard/${escapeHtml(letter.id)}/signatures/export" class="btn btn-secondary btn-sm">Export CSV</a>

${
  signatures.length
    ? `<div class="table-container">
  <table>
    <thead>
      <tr>
        <th>Name</th>
        <th>Email</th>
        <th>Organisation</th>
        <th>Status</th>
        <th>Date</th>
        <th></th>
      </tr>
    </thead>
    <tbody>
      ${rows}
    </tbody>
  </table>
</div>`
    : emptyState('No signatures', 'No signatures match this filter.')
}

${pagination(page, totalPages, `/dashboard/${escapeHtml(letter.id)}/signatures?filter=${filter}`)}
</div>`;
}
