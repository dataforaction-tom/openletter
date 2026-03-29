import { layout } from './layout.js';
import type { Letter } from '../types.js';

// SVG feature icons
const writeIcon = `<svg class="feature-icon" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
  <rect x="10" y="6" width="28" height="36" rx="2" stroke="currentColor" stroke-width="1.5" opacity="0.3"/>
  <path d="M16 16H32" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
  <path d="M16 22H28" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
  <path d="M16 28H30" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
  <path d="M16 34H24" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" opacity="0.5"/>
  <path d="M30 30L38 22C39 21 40 21 41 22L42 23C43 24 43 25 42 26L34 34L30 35L30 30Z" stroke="currentColor" stroke-width="1.5" fill="none"/>
</svg>`;

const shareIcon = `<svg class="feature-icon" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
  <circle cx="24" cy="24" r="16" stroke="currentColor" stroke-width="1.5" opacity="0.3"/>
  <circle cx="18" cy="20" r="3" stroke="currentColor" stroke-width="1.5"/>
  <circle cx="34" cy="14" r="3" stroke="currentColor" stroke-width="1.5"/>
  <circle cx="34" cy="30" r="3" stroke="currentColor" stroke-width="1.5"/>
  <path d="M21 20L31 14" stroke="currentColor" stroke-width="1.5"/>
  <path d="M21 22L31 28" stroke="currentColor" stroke-width="1.5"/>
  <path d="M14 32L10 36" stroke="currentColor" stroke-width="1" stroke-linecap="round" opacity="0.4"/>
  <path d="M18 34L16 38" stroke="currentColor" stroke-width="1" stroke-linecap="round" opacity="0.4"/>
  <path d="M22 34L22 38" stroke="currentColor" stroke-width="1" stroke-linecap="round" opacity="0.4"/>
</svg>`;

const signaturesIcon = `<svg class="feature-icon" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
  <path d="M8 36C12 30 16 26 18 28C20 30 14 38 20 36C26 34 22 24 26 24C30 24 28 32 32 30C36 28 34 22 38 24" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" fill="none"/>
  <circle cx="24" cy="14" r="6" stroke="currentColor" stroke-width="1.5" opacity="0.3"/>
  <path d="M16 14C16 14 20 10 24 10C28 10 32 14 32 14" stroke="currentColor" stroke-width="1" stroke-linecap="round" opacity="0.2" fill="none"/>
  <path d="M40 36L42 34" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" opacity="0.5"/>
</svg>`;

// Wave divider SVG
const waveDivider = `<svg class="wave-divider" viewBox="0 0 1440 56" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
  <path d="M0 28C240 4 480 52 720 28C960 4 1200 52 1440 28V56H0Z" fill="currentColor"/>
</svg>`;

const waveDividerFlip = `<svg class="wave-divider wave-divider--flip" viewBox="0 0 1440 56" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
  <path d="M0 28C240 4 480 52 720 28C960 4 1200 52 1440 28V56H0Z" fill="currentColor"/>
</svg>`;

// Hero decorative quill SVG (large, faded)
const heroDecoration = `<svg class="hero-decoration" viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
  <path d="M40 160L60 100L100 140L40 160Z" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/>
  <path d="M60 100L120 40C140 20 170 15 190 20C195 40 190 70 170 90L100 140" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
  <path d="M120 40L100 60" stroke="currentColor" stroke-width="0.75" stroke-linecap="round" opacity="0.4"/>
  <path d="M135 50L115 70" stroke="currentColor" stroke-width="0.75" stroke-linecap="round" opacity="0.4"/>
  <path d="M150 60L130 80" stroke="currentColor" stroke-width="0.75" stroke-linecap="round" opacity="0.4"/>
  <path d="M165 70L145 90" stroke="currentColor" stroke-width="0.75" stroke-linecap="round" opacity="0.4"/>
  <path d="M30 170L20 180" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" opacity="0.3"/>
  <path d="M50 175L45 190" stroke="currentColor" stroke-width="1" stroke-linecap="round" opacity="0.2"/>
</svg>`;

export function landingPage(recentLetters?: Letter[]): string {
  const recentSection =
    recentLetters && recentLetters.length > 0
      ? `
  <section class="recent-letters reveal">
    <h2>Recent letters</h2>
    <div class="grid">
      ${recentLetters
        .map(
          (letter, i) => `
        <a href="/l/${escapeHtml(letter.slug)}" class="card reveal reveal-delay-${i + 1}">
          <h3>${escapeHtml(letter.title)}</h3>
          <p class="text-muted">${letter.signature_count} signature${letter.signature_count === 1 ? '' : 's'}</p>
        </a>`
        )
        .join('')}
    </div>
  </section>`
      : '';

  const content = `
<nav class="nav-public" aria-label="Main navigation">
  <div class="nav-inner">
    <a href="/" class="nav-logo">
      <svg width="28" height="28" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
        <path d="M6 22L8.5 14.5L13.5 19.5L6 22Z" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round" fill="none"/>
        <path d="M8.5 14.5L18 5C20 3 23 2.5 25 3C25.5 5 25 8 23 10L13.5 19.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
        <path d="M5 23L3.5 24.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" opacity="0.5"/>
      </svg>
      OpenLetter
    </a>
    <div class="nav-right">
      <a href="/login" class="nav-cta">Sign in</a>
    </div>
  </div>
</nav>

<div class="container container--wide">
  <div class="hero reveal">
    ${heroDecoration}
    <h1>Create open letters that matter</h1>
    <p>Write, share, and collect verified signatures for causes you believe in.</p>
    <a href="/login" class="btn btn-amber btn-lg">Create your letter</a>
  </div>
</div>

${waveDivider}

<section class="features-section">
  <div class="features-inner">
    <h2 class="reveal">How it works</h2>
    <div class="features-grid">
      <div class="feature-cell reveal reveal-delay-1">
        ${writeIcon}
        <div class="feature-num">1</div>
        <h3>Write your letter</h3>
        <p>Use the markdown editor to craft your message. Add co-authors and configure signature fields.</p>
      </div>
      <div class="feature-cell reveal reveal-delay-2">
        ${shareIcon}
        <div class="feature-num">2</div>
        <h3>Share the link</h3>
        <p>Publish your letter and share the unique link with your audience.</p>
      </div>
      <div class="feature-cell reveal reveal-delay-3">
        ${signaturesIcon}
        <div class="feature-num">3</div>
        <h3>Collect signatures</h3>
        <p>Supporters sign with email verification. Track progress from your dashboard.</p>
      </div>
    </div>
  </div>
</section>

${waveDividerFlip}

<div class="container container--wide">
  ${recentSection}

  <section class="cta-section reveal">
    <h2>Open source. Self-hostable. Privacy-conscious.</h2>
    <p>OpenLetter is free and open source. Host it yourself or use our platform.</p>
    <a href="/login" class="btn btn-amber">Get started</a>
  </section>
</div>`;

  return layout('Create open letters that matter', content);
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
