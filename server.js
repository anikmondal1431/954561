// ============================================================
//  Chakdaha Bazar — Production Node.js Server
//  chakdahabazar.in | Hostinger Node.js Deployment
//  
//  Features:
//  - Serves index.html with injected config
//  - Built-in JSON file database (no Firebase needed)
//  - REST API for products, orders, reviews
//  - Admin API with password protection
//  - Auto-creates data/ folder on first run
// ============================================================

require('dotenv').config();
const express      = require('express');
const path         = require('path');
const fs           = require('fs');
const compression  = require('compression');
const crypto       = require('crypto');

const app  = express();
const PORT = process.env.PORT || 3000;

// ── Data Directory (persisted on Hostinger disk) ──
const DATA_DIR = path.join(__dirname, 'data');
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });

// ── JSON DB Helper ──
const db = {
  read(file) {
    const fp = path.join(DATA_DIR, file + '.json');
    if (!fs.existsSync(fp)) { fs.writeFileSync(fp, '[]'); return []; }
    try { return JSON.parse(fs.readFileSync(fp, 'utf8')); } catch { return []; }
  },
  write(file, data) {
    fs.writeFileSync(path.join(DATA_DIR, file + '.json'), JSON.stringify(data, null, 2));
  }
};

// ── Middleware ──
app.use(compression());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// ── CORS (allow from chakdahabazar.in) ──
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization');
  if (req.method === 'OPTIONS') return res.sendStatus(200);
  next();
});

// ── Admin Auth Middleware ──
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'chakdaha@admin2025';
function adminAuth(req, res, next) {
  const token = req.headers['x-admin-token'] || req.query.token;
  if (token === ADMIN_PASSWORD) return next();
  res.status(401).json({ error: 'Unauthorized' });
}

// ════════════════════════════════════════════════════════════
//  REST API — Products
// ════════════════════════════════════════════════════════════
app.get('/api/products', (req, res) => {
  res.json(db.read('products'));
});

app.post('/api/products', adminAuth, (req, res) => {
  const products = db.read('products');
  const prod = { id: req.body.id || ('p_' + Date.now()), ...req.body };
  const idx = products.findIndex(p => p.id === prod.id);
  if (idx >= 0) products[idx] = prod; else products.push(prod);
  db.write('products', products);
  res.json({ success: true, product: prod });
});

app.delete('/api/products/:id', adminAuth, (req, res) => {
  let products = db.read('products');
  products = products.filter(p => p.id !== req.params.id);
  db.write('products', products);
  res.json({ success: true });
});

// ════════════════════════════════════════════════════════════
//  REST API — Orders
// ════════════════════════════════════════════════════════════
app.get('/api/orders', adminAuth, (req, res) => {
  res.json(db.read('orders'));
});

app.post('/api/orders', (req, res) => {
  const orders = db.read('orders');
  const order = { orderId: 'CB-' + Date.now().toString().slice(-8), date: new Date().toISOString(), ...req.body };
  orders.unshift(order);
  db.write('orders', orders);
  res.json({ success: true, orderId: order.orderId });
});

app.put('/api/orders/:id', adminAuth, (req, res) => {
  const orders = db.read('orders');
  const idx = orders.findIndex(o => o.orderId === req.params.id);
  if (idx >= 0) { orders[idx] = { ...orders[idx], ...req.body }; db.write('orders', orders); }
  res.json({ success: true });
});

// ════════════════════════════════════════════════════════════
//  REST API — Reviews
// ════════════════════════════════════════════════════════════
app.get('/api/reviews', (req, res) => res.json(db.read('reviews')));

app.post('/api/reviews', (req, res) => {
  const reviews = db.read('reviews');
  const review = { id: 'r_' + Date.now(), date: new Date().toISOString(), ...req.body };
  reviews.unshift(review);
  db.write('reviews', reviews);
  res.json({ success: true });
});

// ════════════════════════════════════════════════════════════
//  REST API — Partners / Delivery Agents
// ════════════════════════════════════════════════════════════
app.get('/api/partners', adminAuth, (req, res) => res.json(db.read('partners')));

app.post('/api/partners', adminAuth, (req, res) => {
  const partners = db.read('partners');
  const partner = { id: 'pa_' + Date.now(), ...req.body };
  const idx = partners.findIndex(p => p.id === partner.id);
  if (idx >= 0) partners[idx] = partner; else partners.push(partner);
  db.write('partners', partners);
  res.json({ success: true });
});

app.delete('/api/partners/:id', adminAuth, (req, res) => {
  let partners = db.read('partners');
  partners = partners.filter(p => p.id !== req.params.id);
  db.write('partners', partners);
  res.json({ success: true });
});

// ════════════════════════════════════════════════════════════
//  REST API — Settings / Pincodes
// ════════════════════════════════════════════════════════════
app.get('/api/settings', (req, res) => {
  const s = db.read('settings');
  res.json(s[0] || {});
});

app.post('/api/settings', adminAuth, (req, res) => {
  db.write('settings', [req.body]);
  res.json({ success: true });
});

// ════════════════════════════════════════════════════════════
//  Admin Auth Check
// ════════════════════════════════════════════════════════════
app.post('/api/admin/login', (req, res) => {
  if (req.body.password === ADMIN_PASSWORD) {
    res.json({ success: true, token: ADMIN_PASSWORD });
  } else {
    res.status(401).json({ success: false, error: 'Wrong password' });
  }
});

// ════════════════════════════════════════════════════════════
//  Health Check
// ════════════════════════════════════════════════════════════
app.get('/health', (req, res) => res.json({
  status: 'ok',
  app: 'Chakdaha Bazar',
  version: '2.0.0',
  database: 'JSON File DB',
  firebase: process.env.FIREBASE_PROJECT_ID ? 'enabled' : 'disabled (using local DB)',
  uptime: Math.floor(process.uptime()) + 's'
}));

// ════════════════════════════════════════════════════════════
//  HTML Injection — Inject config from .env into index.html
// ════════════════════════════════════════════════════════════
function getInjectedHTML(filePath) {
  let html = fs.readFileSync(filePath, 'utf8');

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
    `const FIREBASE_CONFIG = ${JSON.stringify(firebaseConfig)};`
  );

  if (process.env.ADMIN_PASSWORD) {
    html = html.replace(
      /const ADMIN_PASS\s*=\s*["'][^"']*["']/,
      `const ADMIN_PASS = "${process.env.ADMIN_PASSWORD}"`
    );
  }

  if (process.env.STORE_URL) {
    html = html.replace(
      /const STORE_LINK\s*=\s*['"][^'"]*['"]/,
      `const STORE_LINK = '${process.env.STORE_URL}'`
    );
  }

  // Runtime config injected into window — available to all JS in the page
  const runtimeConfig = `<script>
    window.__ENV__ = {
      STORE_URL:         '${process.env.STORE_URL         || 'https://chakdahabazar.in'}',
      STORE_PHONE:       '${process.env.STORE_PHONE       || '917478926834'}',
      STORE_NAME:        '${process.env.STORE_NAME        || 'Chakdaha Bazar'}',
      FREE_DELIVERY_MIN: ${process.env.FREE_DELIVERY_MIN  || 120},
      FIREBASE_ENABLED:  ${!!process.env.FIREBASE_PROJECT_ID},
      API_BASE:          '/api'
    };
    window.STORE_URL   = window.__ENV__.STORE_URL;
    window.STORE_PHONE = window.__ENV__.STORE_PHONE;
    window.API_BASE    = window.__ENV__.API_BASE;
  </script>`;
  html = html.replace('</head>', runtimeConfig + '\n</head>');
  return html;
}

// ════════════════════════════════════════════════════════════
//  Static Files
// ════════════════════════════════════════════════════════════
app.use(express.static(__dirname, { index: false, maxAge: '1d' }));

app.get('/sitemap.xml', (req, res) => {
  res.setHeader('Content-Type', 'application/xml');
  res.sendFile(path.join(__dirname, 'sitemap.xml'));
});
app.get('/robots.txt', (req, res) => {
  res.setHeader('Content-Type', 'text/plain');
  res.sendFile(path.join(__dirname, 'robots.txt'));
});

// ════════════════════════════════════════════════════════════
//  Page Routes
// ════════════════════════════════════════════════════════════
const serveIndex = (req, res) => {
  try {
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.setHeader('Cache-Control', 'no-store');
    res.send(getInjectedHTML(path.join(__dirname, 'index.html')));
  } catch (err) {
    console.error('Error:', err);
    res.status(500).send('Server Error');
  }
};

app.get('/', serveIndex);
app.get('/index.html', serveIndex);
app.get('/home', (req, res) => res.redirect(301, '/'));
app.get('/home.html', (req, res) => res.redirect(301, '/'));
app.get('/admin', (req, res) => res.redirect(301, '/#admin'));
app.get('/admin.html', serveIndex);
app.get('/admin/', serveIndex);

app.get('*', (req, res) => {
  const fp = path.join(__dirname, req.path);
  if (fs.existsSync(fp) && fs.statSync(fp).isFile()) return res.sendFile(fp);
  serveIndex(req, res);
});

// ════════════════════════════════════════════════════════════
//  Start
// ════════════════════════════════════════════════════════════
app.listen(PORT, '0.0.0.0', () => {
  const firebase = process.env.FIREBASE_PROJECT_ID;
  console.log(`
╔══════════════════════════════════════════════════╗
║       🌿  CHAKDAHA BAZAR  SERVER  STARTED        ║
╠══════════════════════════════════════════════════╣
║  🌐 URL      : http://localhost:${PORT}              ║
║  🗄️  Database : ${firebase ? '🔥 Firebase (' + firebase + ')' : '📁 Local JSON DB (data/)    '}  ║
║  🔐 Admin    : ${ADMIN_PASSWORD}                   ║
║  📦 Mode     : ${process.env.NODE_ENV || 'production'}                        ║
╚══════════════════════════════════════════════════╝
  `);
});

module.exports = app;
