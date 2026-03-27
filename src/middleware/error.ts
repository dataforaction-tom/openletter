export function notFoundPage(): string {
  return `
<div class="error-page">
  <h1>Page not found</h1>
  <p>The page you're looking for doesn't exist.</p>
  <a href="/" class="btn btn-primary">Back to home</a>
</div>`;
}

export function errorPage(message?: string): string {
  return `
<div class="error-page">
  <h1>Something went wrong</h1>
  <p>An unexpected error occurred. Please try again later.</p>
  <a href="/" class="btn btn-primary">Back to home</a>
</div>`;
}
