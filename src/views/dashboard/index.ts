import type { Letter } from '../../types.js';
import { letterCard, emptyState } from '../components.js';

export function dashboardPage(letters: Letter[]): string {
  if (letters.length === 0) {
    return emptyState(
      'No letters yet',
      'Create your first open letter',
      '/dashboard/new',
      'Create letter'
    );
  }

  return `
<div class="dashboard-header">
  <h1>Your letters</h1>
  <a href="/dashboard/new" class="btn btn-primary">New letter</a>
</div>
<div class="letter-grid">
  ${letters.map(letterCard).join('\n  ')}
</div>`;
}
