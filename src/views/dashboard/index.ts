import type { Letter } from '../../types.js';
import { letterCard, emptyState } from '../components.js';

export function dashboardPage(letters: Letter[]): string {
  if (letters.length === 0) {
    return `<div class="container container--wide">
      ${emptyState(
        'No letters yet',
        'Create your first open letter',
        '/dashboard/new',
        'Create letter'
      )}
    </div>`;
  }

  return `
<div class="container container--wide">
  <div class="dashboard-header">
    <h1>Your letters</h1>
    <a href="/dashboard/new" class="btn btn-primary">New letter</a>
  </div>
  <div class="grid">
    ${letters.map(letterCard).join('\n    ')}
  </div>
</div>`;
}
