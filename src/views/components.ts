import type { Letter } from '../types.js';

const ESCAPE_MAP: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;',
};

export function escapeHtml(str: string): string {
  return str.replace(/[&<>"']/g, (ch) => ESCAPE_MAP[ch]!);
}

export function button(text: string, attrs: Record<string, string> = {}): string {
  const attrStr = Object.entries(attrs)
    .map(([k, v]) => ` ${k}="${escapeHtml(v)}"`)
    .join('');
  return `<button${attrStr}>${escapeHtml(text)}</button>`;
}

export function letterCard(letter: Letter): string {
  return `<a href="/dashboard/${escapeHtml(letter.id)}" class="letter-card">
  <div class="letter-card-title">${escapeHtml(letter.title || 'Untitled')}</div>
  <div class="letter-card-meta">
    ${statusBadge(letter.status)}
    <span>${letter.signature_count} signature${letter.signature_count === 1 ? '' : 's'}</span>
    <span>${formatDate(letter.created_at)}</span>
  </div>
</a>`;
}

export function statusBadge(status: string): string {
  return `<span class="badge badge-${escapeHtml(status)}">${escapeHtml(status)}</span>`;
}

export function verificationBadge(verified: number): string {
  if (verified) {
    return `<span class="badge badge-verified">verified</span>`;
  }
  return `<span class="badge badge-pending">pending</span>`;
}

export function emptyState(
  title: string,
  description: string,
  actionUrl?: string,
  actionText?: string,
): string {
  return `<div class="empty-state">
  <div class="empty-state-icon">&#9993;</div>
  <h3>${escapeHtml(title)}</h3>
  <p>${escapeHtml(description)}</p>
  ${actionUrl && actionText ? `<a href="${escapeHtml(actionUrl)}" class="btn btn-primary">${escapeHtml(actionText)}</a>` : ''}
</div>`;
}

export function flashMessage(type: 'success' | 'error' | 'info', message: string): string {
  return `<div class="flash flash-${type}">
  <span>${escapeHtml(message)}</span>
  <button class="flash-dismiss" onclick="this.parentElement.remove()" aria-label="Dismiss">&times;</button>
</div>`;
}

export function pagination(currentPage: number, totalPages: number, baseUrl: string): string {
  if (totalPages <= 1) return '';

  const separator = baseUrl.includes('?') ? '&' : '?';
  const parts: string[] = [];

  // Previous
  if (currentPage > 1) {
    parts.push(`<a href="${escapeHtml(baseUrl)}${separator}page=${currentPage - 1}">&laquo; Prev</a>`);
  } else {
    parts.push(`<span class="disabled">&laquo; Prev</span>`);
  }

  // Page numbers
  for (let i = 1; i <= totalPages; i++) {
    if (
      i === 1 ||
      i === totalPages ||
      (i >= currentPage - 2 && i <= currentPage + 2)
    ) {
      if (i === currentPage) {
        parts.push(`<span class="active">${i}</span>`);
      } else {
        parts.push(`<a href="${escapeHtml(baseUrl)}${separator}page=${i}">${i}</a>`);
      }
    } else if (
      i === currentPage - 3 ||
      i === currentPage + 3
    ) {
      parts.push(`<span>&hellip;</span>`);
    }
  }

  // Next
  if (currentPage < totalPages) {
    parts.push(`<a href="${escapeHtml(baseUrl)}${separator}page=${currentPage + 1}">Next &raquo;</a>`);
  } else {
    parts.push(`<span class="disabled">Next &raquo;</span>`);
  }

  return `<nav class="pagination">${parts.join('\n')}</nav>`;
}

export function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

export function statCard(label: string, value: string | number): string {
  return `<div class="stat-card">
  <div class="stat-card-value">${escapeHtml(String(value))}</div>
  <div class="stat-card-label">${escapeHtml(label)}</div>
</div>`;
}

export function dashboardTabs(letterId: string, active: 'edit' | 'settings' | 'signatures'): string {
  const tabs = [
    { key: 'edit', label: 'Edit', href: `/dashboard/${escapeHtml(letterId)}` },
    { key: 'settings', label: 'Settings', href: `/dashboard/${escapeHtml(letterId)}/settings` },
    { key: 'signatures', label: 'Signatures', href: `/dashboard/${escapeHtml(letterId)}/signatures` },
  ];

  const links = tabs
    .map(t => `<a href="${t.href}" class="tab${t.key === active ? ' active' : ''}">${t.label}</a>`)
    .join('\n  ');

  return `<nav class="tabs">
  ${links}
</nav>`;
}
