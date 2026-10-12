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
