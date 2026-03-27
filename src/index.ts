import { Hono } from 'hono';
import { serve } from '@hono/node-server';
import { serveStatic } from '@hono/node-server/serve-static';

import authRoutes from './routes/auth.js';
import dashboardRoutes from './routes/dashboard.js';
import publicRoutes from './routes/public.js';
import apiRoutes from './routes/api.js';
import { notFoundPage, errorPage } from './middleware/error.js';
import { layout } from './views/layout.js';
import { landingPage } from './views/landing.js';
import * as db from './lib/db.js';

const app = new Hono();

// Static files
app.use('/css/*', serveStatic({ root: './public' }));
app.use('/js/*', serveStatic({ root: './public' }));
app.use('/fonts/*', serveStatic({ root: './public' }));

// Landing page
app.get('/', (c) => {
  const recentLetters = db.getRecentPublishedLetters(6);
  return c.html(landingPage(recentLetters));
});

// Routes
app.route('/', authRoutes);
app.route('/dashboard', dashboardRoutes);
app.route('/', publicRoutes);
app.route('/api', apiRoutes);

// 404 handler
app.notFound((c) => {
  return c.html(layout('Page not found', notFoundPage()), 404);
});

// Error handler
app.onError((err, c) => {
  console.error('Server error:', err);
  return c.html(layout('Error', errorPage()), 500);
});

// Start server
const port = parseInt(process.env.PORT || '3000', 10);

serve(
  {
    fetch: app.fetch,
    port,
  },
  (info) => {
    console.log(`OpenLetter running at http://localhost:${info.port}`);
  }
);
