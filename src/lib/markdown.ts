import { marked } from 'marked';

marked.setOptions({ breaks: true, gfm: true });

export function renderMarkdown(md: string): string {
  return marked.parse(md) as string;
}

export function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
