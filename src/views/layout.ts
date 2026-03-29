import type { User } from '../types.js';

// Quill/pen SVG brand mark
const quillSvg = `<svg width="28" height="28" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
  <path d="M6 22L8.5 14.5L13.5 19.5L6 22Z" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round" fill="none"/>
  <path d="M8.5 14.5L18 5C20 3 23 2.5 25 3C25.5 5 25 8 23 10L13.5 19.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
  <path d="M18 5L15 8" stroke="currentColor" stroke-width="1" stroke-linecap="round" opacity="0.4"/>
  <path d="M20 7L17 10" stroke="currentColor" stroke-width="1" stroke-linecap="round" opacity="0.4"/>
  <path d="M22 9L19 12" stroke="currentColor" stroke-width="1" stroke-linecap="round" opacity="0.4"/>
  <path d="M5 23L3.5 24.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" opacity="0.5"/>
</svg>`;

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
  <link rel="preconnect" href="https://fonts.bunny.net">
  <link href="https://fonts.bunny.net/css2?family=fraunces:opsz,wght@9..144,300;9..144,400;9..144,600&family=dm-sans:wght@400;500;600&family=jetbrains-mono:wght@400&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="/css/style.css">
</head>
<body>
  <a href="#main-content" class="skip-link">Skip to content</a>
  ${user ? navBar(user) : ''}
  <main id="main-content">${content}</main>
  <footer class="site-footer" role="contentinfo">
    <div class="footer-inner">
      <div class="footer-brand">
        ${quillSvg}
        <span>OpenLetter</span>
      </div>
      <p>Open source, self-hostable &middot; <a href="/terms" style="text-decoration:underline;">Terms of Service</a></p>
    </div>
  </footer>
  <script src="/js/app.js"></script>
  <script>
  // Scroll reveal
  (function(){
    var els = document.querySelectorAll('.reveal');
    if (!els.length) return;
    var obs = new IntersectionObserver(function(entries){
      entries.forEach(function(e){
        if (e.isIntersecting) {
          e.target.classList.add('visible');
          obs.unobserve(e.target);
        }
      });
    }, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });
    els.forEach(function(el){ obs.observe(el); });
  })();
  // Nav scroll effect
  (function(){
    var nav = document.querySelector('.nav, .nav-public');
    if (!nav) return;
    window.addEventListener('scroll', function(){
      nav.classList.toggle('scrolled', window.scrollY > 40);
    }, { passive: true });
  })();
  </script>
  ${scripts.map(s => `<script src="${s}"></script>`).join('\n  ')}
</body>
</html>`;
}

function navBar(user: User): string {
  return `
  <nav class="nav" aria-label="Main navigation">
    <div class="nav-inner">
      <a href="/dashboard" class="nav-logo">
        ${quillSvg}
        OpenLetter
      </a>
      <div class="nav-right">
        <span class="nav-email">${user.email}</span>
        <a href="/logout" class="nav-link">Log out</a>
      </div>
    </div>
  </nav>`;
}
