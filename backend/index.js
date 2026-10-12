const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const morgan = require('morgan');
const { initDatabase } = require('./db/database');
const { fetchAndSyncLiveLahoreData } = require('./services/airQualityService');
const dashboardRoutes = require('./routes/dashboardRoutes');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

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
    service: 'DHUAN Node.js & SQL Backend', 
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

    app.listen(PORT, () => {
      console.log(`===============================================`);
      console.log(`  DHUAN Node.js + SQL Backend API Running     `);
      console.log(`  URL: http://localhost:${PORT}               `);
      console.log(`  Database: backend/dhuan.sqlite              `);
      console.log(`===============================================`);
    });
  } catch (err) {
    console.error('Fatal error starting DHUAN backend:', err);
    process.exit(1);
  }
}

startServer();
