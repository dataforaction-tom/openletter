import type { Letter } from '../../types.js';
import { escapeHtml } from '../components.js';

export function adminDashboardPage(letters: (Letter & { user_email: string })[]): string {
  const rows = letters.map(l => {
    const statusClass = l.status === 'removed' ? 'status-removed' : `status-${l.status}`;
    return `
    <tr>
      <td><a href="/admin/letters/${l.id}">${escapeHtml(l.title)}</a></td>
      <td>${escapeHtml(l.user_email)}</td>
      <td><span class="badge ${statusClass}">${l.status}</span></td>
      <td>${l.signature_count}</td>
      <td>${l.created_at?.split('T')[0] || ''}</td>
    </tr>`;
  }).join('');

  return `
<div class="container">
  <div class="dashboard-header">
    <h1>Admin — All Letters</h1>
    <p class="text-muted">${letters.length} letters total</p>
  </div>
  <div class="table-wrap">
    <table class="table">
      <thead>
        <tr>
          <th>Title</th>
          <th>Author</th>
          <th>Status</th>
          <th>Signatures</th>
          <th>Created</th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>
  </div>
</div>`;
}
