import type { User } from '../types.js';

export function layout(title: string, content: string, options: {
  user?: User;
  scripts?: string[];
  description?: string;
  slug?: string;
} = {}): string {
  const { user, scripts = [], description, slug } = options;
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title} — OpenLetter</title>
  ${description ? `<meta name="description" content="${description}">` : ''}
  ${slug ? `<meta property="og:url" content="${process.env.APP_URL}/l/${slug}">` : ''}
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=Source+Sans+3:ital,wght@0,300..900;1,300..900&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="/css/style.css">
</head>
<body>
  ${user ? navBar(user) : ''}
  <main>${content}</main>
  <script src="/js/app.js"></script>
  ${scripts.map(s => `<script src="${s}"></script>`).join('\n  ')}
</body>
</html>`;
}

function navBar(user: User): string {
  return `
  <nav class="nav">
    <div class="nav-inner">
      <a href="/dashboard" class="nav-logo">OpenLetter</a>
      <div class="nav-right">
        <span class="nav-email">${user.email}</span>
        <a href="/logout" class="nav-link">Log out</a>
      </div>
    </div>
  </nav>`;
}
