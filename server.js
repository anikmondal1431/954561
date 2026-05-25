// ============================================================
//  Chakdaha Bazar — Node.js Express Server
//  Hostinger Node.js Deployment
//  This server serves all static files and injects
//  Firebase config from environment variables at runtime.
// ============================================================

require('dotenv').config();
const express    = require('express');
const path       = require('path');
const fs         = require('fs');
const compression = require('compression');
const helmet     = require('helmet');

const app  = express();
const PORT = process.env.PORT || 3000;

// ── Security & Performance Middleware ──
app.use(compression());
app.use(helmet({
  contentSecurityPolicy: false,   // disabled so Firebase + Google Fonts work
  crossOriginEmbedderPolicy: false
}));

// ── Health Check (Hostinger uses this to verify the server is alive) ──
app.get('/health', (req, res) => res.status(200).json({ status: 'ok', app: 'Chakdaha Bazar' }));

// ── Sitemap & Robots ──
app.get('/sitemap.xml', (req, res) => {
  res.setHeader('Content-Type', 'application/xml');
  res.sendFile(path.join(__dirname, 'sitemap.xml'));
});
app.get('/robots.txt', (req, res) => {
  res.setHeader('Content-Type', 'text/plain');
  res.sendFile(path.join(__dirname, 'robots.txt'));
});

// ── Static Assets (CSS, JS, images etc.) ──
app.use(express.static(__dirname, {
  index: false,               // we serve index.html manually below
  maxAge: '1d',               // cache static files for 1 day
  etag: true
}));

// ─────────────────────────────────────────────────────────────
//  HTML Injection Function
//  Reads index.html and replaces the empty FIREBASE_CONFIG
//  object with real keys from environment variables.
//  This keeps secrets out of source code.
// ─────────────────────────────────────────────────────────────
function getInjectedHTML(filePath) {
  let html = fs.readFileSync(filePath, 'utf8');

  // ── 1. Firebase Config ──
  const firebaseConfig = {
    apiKey:            process.env.FIREBASE_API_KEY             || '',
    authDomain:        process.env.FIREBASE_AUTH_DOMAIN         || '',
    projectId:         process.env.FIREBASE_PROJECT_ID          || '',
    storageBucket:     process.env.FIREBASE_STORAGE_BUCKET      || '',
    messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID || '',
    appId:             process.env.FIREBASE_APP_ID              || '',
    measurementId:     process.env.FIREBASE_MEASUREMENT_ID      || ''
  };
  html = html.replace(
    /const FIREBASE_CONFIG\s*=\s*\{[^}]*\};/,
    `const FIREBASE_CONFIG = ${JSON.stringify(firebaseConfig, null, 4)};`
  );

  // ── 2. Admin Password ──
  if (process.env.ADMIN_PASSWORD) {
    html = html.replace(
      /const ADMIN_PASS\s*=\s*["'][^"']*["']/,
      `const ADMIN_PASS = "${process.env.ADMIN_PASSWORD}"`
    );
  }

  // ── 3. Store URL (WhatsApp share links always use real domain) ──
  if (process.env.STORE_URL) {
    html = html.replace(
      /const STORE_LINK\s*=\s*['"][^'"]*['"]/,
      `const STORE_LINK = '${process.env.STORE_URL}'`
    );
  }

  // ── 4. Inject a runtime config block right before </head> ──
  const runtimeConfig = `
  <script>
    window.__ENV__ = {
      STORE_URL:          '${process.env.STORE_URL          || 'https://chakdahabazar.in'}',
      STORE_PHONE:        '${process.env.STORE_PHONE        || '917478926834'}',
      STORE_NAME:         '${process.env.STORE_NAME         || 'Chakdaha Bazar'}',
      FREE_DELIVERY_MIN:  ${process.env.FREE_DELIVERY_MIN   || 120},
      FIREBASE_ENABLED:   ${!!process.env.FIREBASE_PROJECT_ID}
    };
    // Make env available to app code
    window.STORE_URL   = window.__ENV__.STORE_URL;
    window.STORE_PHONE = window.__ENV__.STORE_PHONE;
  </script>`;
  html = html.replace('</head>', runtimeConfig + '\n</head>');

  return html;
}

// ── Serve index.html (main store) with injected config ──
app.get('/', (req, res) => {
  try {
    const html = getInjectedHTML(path.join(__dirname, 'index.html'));
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.setHeader('Cache-Control', 'no-store');   // don't cache HTML (config inside)
    res.send(html);
  } catch (err) {
    console.error('Error serving index.html:', err);
    res.status(500).send('Server Error');
  }
});

// ── home.html redirect ──
app.get('/home', (req, res) => res.redirect(301, '/'));
app.get('/home.html', (req, res) => res.redirect(301, '/'));
app.get('/home/', (req, res) => res.redirect(301, '/'));

// ── Admin panel ──
app.get('/admin', (req, res) => res.redirect(301, '/admin.html'));
app.get('/admin/', (req, res) => res.redirect(301, '/admin.html'));
app.get('/admin.html', (req, res) => {
  try {
    const html = getInjectedHTML(path.join(__dirname, 'index.html'));
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.setHeader('Cache-Control', 'no-store');
    res.send(html);
  } catch (err) {
    res.status(500).send('Server Error');
  }
});

// ── Catch-all: serve index.html for any unknown route (SPA style) ──
app.get('*', (req, res) => {
  const filePath = path.join(__dirname, req.path);
  if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
    res.sendFile(filePath);
  } else {
    try {
      const html = getInjectedHTML(path.join(__dirname, 'index.html'));
      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      res.setHeader('Cache-Control', 'no-store');
      res.send(html);
    } catch (err) {
      res.status(404).send('Page Not Found');
    }
  }
});

// ── Start Server ──
app.listen(PORT, () => {
  console.log(`
  ✅ Chakdaha Bazar Server Running
  ─────────────────────────────────
  🌐 URL      : http://localhost:${PORT}
  🔥 Firebase : ${process.env.FIREBASE_PROJECT_ID ? '✅ Connected (' + process.env.FIREBASE_PROJECT_ID + ')' : '⚠️  Not configured (using LocalStorage)'}
  📦 Mode     : ${process.env.NODE_ENV || 'production'}
  `);
});

module.exports = app;
