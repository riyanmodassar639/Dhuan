const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const morgan = require('morgan');
const https = require('https');
const http = require('http');
const fs = require('fs');
const path = require('path');
const { initDatabase } = require('./db/database');
const { fetchAndSyncLiveLahoreData } = require('./services/airQualityService');
const dashboardRoutes = require('./routes/dashboardRoutes');
const emergencyRoutes = require('./routes/emergencyRoutes');
const routingRoutes = require('./routes/routingRoutes');
const dataExplorerRoutes = require('./routes/dataExplorerRoutes');

dotenv.config();

// Automatically accept local self-signed certificates in dev mode
if (process.env.NODE_ENV !== 'production') {
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
}

const app = express();
const PORT = process.env.PORT || 5000;
const HTTP_PORT = process.env.HTTP_PORT || 5001;

app.use(cors({
  origin: '*', // Allow frontend requests from Next.js (port 3000)
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS']
}));
app.use(express.json());
app.use(morgan('dev'));

// Mount API Routes
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/emergency', emergencyRoutes);
app.use('/api/routing', routingRoutes);
app.use(dataExplorerRoutes);

// Root landing page (Resolves "Cannot GET /" when opened directly in browser)
app.get(['/', '/health', '/api'], (req, res) => {
  // If browser request, return interactive status page
  if (req.headers.accept && req.headers.accept.includes('text/html')) {
    return res.send(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>DHUAN Backend API — Server Status</title>
  <link rel="icon" href="data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><text y=%22.9em%22 font-size=%2290%22>🟢</text></svg>">
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      background: #0f172a;
      color: #f8fafc;
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 24px;
    }
    .card {
      background: #1e293b;
      border: 1px solid #334155;
      border-radius: 24px;
      max-width: 640px;
      width: 100%;
      padding: 36px;
      box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
    }
    .badge {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      padding: 6px 14px;
      border-radius: 9999px;
      background: rgba(16, 185, 129, 0.15);
      border: 1px solid #10b981;
      color: #34d399;
      font-size: 12px;
      font-weight: 800;
      letter-spacing: 0.5px;
      text-transform: uppercase;
      margin-bottom: 16px;
    }
    .pulse-dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background: #10b981;
      animation: pulse 1.8s infinite;
    }
    @keyframes pulse {
      0% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.7); }
      70% { transform: scale(1); box-shadow: 0 0 0 8px rgba(16, 185, 129, 0); }
      100% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(16, 185, 129, 0); }
    }
    h1 {
      font-size: 26px;
      font-weight: 900;
      letter-spacing: -0.5px;
      margin-bottom: 8px;
      color: #ffffff;
    }
    p {
      color: #94a3b8;
      font-size: 14px;
      line-height: 1.6;
      margin-bottom: 24px;
    }
    .meta-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 12px;
      margin-bottom: 24px;
    }
    .meta-box {
      background: #0f172a;
      border: 1px solid #334155;
      padding: 14px;
      border-radius: 14px;
    }
    .meta-label {
      font-size: 11px;
      font-weight: 700;
      color: #64748b;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .meta-val {
      font-size: 14px;
      font-weight: 800;
      color: #e2e8f0;
      margin-top: 4px;
    }
    .section-title {
      font-size: 12px;
      font-weight: 800;
      color: #cbd5e1;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin-bottom: 12px;
    }
    .links-list {
      display: flex;
      flex-direction: column;
      gap: 8px;
      margin-bottom: 24px;
    }
    .api-link {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 10px 14px;
      background: #0f172a;
      border: 1px solid #334155;
      border-radius: 12px;
      color: #38bdf8;
      text-decoration: none;
      font-size: 13px;
      font-weight: 700;
      font-family: monospace;
      transition: all 0.2s;
    }
    .api-link:hover {
      background: #1e293b;
      border-color: #38bdf8;
      transform: translateX(3px);
    }
    .api-desc {
      font-family: -apple-system, sans-serif;
      font-size: 11px;
      color: #94a3b8;
      font-weight: 600;
    }
    .actions {
      display: flex;
      gap: 12px;
      border-top: 1px solid #334155;
      padding-top: 20px;
    }
    .btn-primary {
      flex: 1;
      padding: 14px;
      background: #10b981;
      color: #0f172a;
      text-align: center;
      border-radius: 14px;
      font-weight: 800;
      font-size: 14px;
      text-decoration: none;
      transition: background 0.2s;
    }
    .btn-primary:hover {
      background: #34d399;
    }
  </style>
</head>
<body>
  <div class="card">
    <div class="badge">
      <div class="pulse-dot"></div>
      <span>Backend & SQLite API Online</span>
    </div>
    <h1>DHUAN Environmental Intelligence API</h1>
    <p>Aapka DHUAN Node.js backend server successfully chal raha hai. Yeh REST API server hai jo frontend Next.js app ko live smog forecasts, dynamic SQLite routing, aur emergency hospitals data supply karta hai.</p>

    <div class="meta-grid">
      <div class="meta-box">
        <div class="meta-label">HTTPS Port</div>
        <div class="meta-val">https://localhost:5000</div>
      </div>
      <div class="meta-box">
        <div class="meta-label">HTTP Internal Port</div>
        <div class="meta-val">http://localhost:5001</div>
      </div>
      <div class="meta-box">
        <div class="meta-label">Database</div>
        <div class="meta-val">SQLite (dhuan.sqlite)</div>
      </div>
      <div class="meta-box">
        <div class="meta-label">Status</div>
        <div class="meta-val" style="color: #34d399;">200 OK &bull; Healthy</div>
      </div>
    </div>

    <div class="section-title">Verified Active REST API Endpoints:</div>
    <div class="links-list">
      <a href="/api/health" class="api-link" target="_blank">
        <span>GET /api/health</span>
        <span class="api-desc">Health Check & Status</span>
      </a>
      <a href="/api/dashboard/overview" class="api-link" target="_blank">
        <span>GET /api/dashboard/overview</span>
        <span class="api-desc">Lahore Real-Time AQI & Forecast</span>
      </a>
      <a href="/api/routing/destinations?day=Monday" class="api-link" target="_blank">
        <span>GET /api/routing/destinations</span>
        <span class="api-desc">Smart Routing & SQLite Trips</span>
      </a>
      <a href="/api/emergency/hospitals?lat=31.5204&lng=74.3587" class="api-link" target="_blank">
        <span>GET /api/emergency/hospitals</span>
        <span class="api-desc">Lahore Verified Hospitals Directory</span>
      </a>
    </div>

    <div class="actions">
      <a href="/data" class="btn-primary" style="background:#3b82f6; color:#ffffff;">
        🗄️ Open Database & Data Explorer &rarr;
      </a>
      <a href="http://localhost:3000/dashboard" class="btn-primary" target="_blank">
        Open Web App (Port 3000) &rarr;
      </a>
    </div>
  </div>
</body>
</html>`);
  }

  // JSON fallback for API clients
  res.json({
    status: 'ok',
    service: 'DHUAN Node.js & SQL Backend (HTTPS Enabled)',
    database: 'SQLite (dhuan.sqlite)',
    ports: {
      https: 5000,
      http: 5001
    },
    endpoints: {
      health: '/api/health',
      overview: '/api/dashboard/overview',
      routing: '/api/routing/destinations',
      emergency: '/api/emergency/hospitals',
      simulator: '/api/dashboard/simulator/run'
    },
    frontendUrl: 'http://localhost:3000',
    timestamp: new Date().toISOString()
  });
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    protocol: req.protocol,
    service: 'DHUAN Node.js & SQL Backend (HTTPS Enabled)', 
    database: 'SQLite (dhuan.sqlite)',
    timestamp: new Date().toISOString()
  });
});

// Initialize SQL database and boot server
async function startServer() {
  try {
    await initDatabase();
    console.log('[Database] SQL tables verified and ready.');

    // Fetch and sync live real Lahore ambient conditions on startup
    fetchAndSyncLiveLahoreData().catch(e => console.log('Background sync deferred:', e.message));

    const certPath = path.join(__dirname, 'certs', 'localhost.crt');
    const keyPath = path.join(__dirname, 'certs', 'localhost.key');
    const hasSsl = fs.existsSync(certPath) && fs.existsSync(keyPath);

    if (hasSsl) {
      const sslOptions = {
        key: fs.readFileSync(keyPath),
        cert: fs.readFileSync(certPath)
      };

      const httpsServer = https.createServer(sslOptions, app);
      httpsServer.listen(PORT, () => {
        console.log(`===============================================`);
        console.log(`  DHUAN Node.js + SQL Backend API (HTTPS)     `);
        console.log(`  HTTPS URL: https://localhost:${PORT}        `);
        console.log(`  Database:  backend/dhuan.sqlite             `);
        console.log(`===============================================`);
      });

      // Dual-protocol compatibility: HTTP server on port 5001 for internal proxying & clients
      http.createServer(app).listen(HTTP_PORT, () => {
        console.log(`  HTTP Internal Port: http://localhost:${HTTP_PORT}`);
      });
    } else {
      app.listen(PORT, () => {
        console.log(`===============================================`);
        console.log(`  DHUAN Node.js + SQL Backend API Running     `);
        console.log(`  URL: http://localhost:${PORT}               `);
        console.log(`  Database: backend/dhuan.sqlite              `);
        console.log(`===============================================`);
      });
    }
  } catch (err) {
    console.error('Fatal error starting DHUAN backend:', err);
    process.exit(1);
  }
}

startServer();
