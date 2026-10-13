const express = require('express');
const router = express.Router();
const {
  getDashboardOverviewData,
  fetchAndSyncLiveLahoreData,
  askDhuanAssistant,
  analyzeSmartRoutesWithAi,
  monitorNavigationStepWithAi
} = require('../services/airQualityService');
const { dbRun, dbGet } = require('../db/database');

// GET /api/dashboard/overview - Complete dashboard metrics directly from SQL database
router.get('/overview', async (req, res) => {
  try {
    const data = await getDashboardOverviewData();
    res.json({
      success: true,
      source: 'sqlite_database',
      database: 'dhuan.sqlite',
      serverTime: new Date().toISOString(),
      ...data
    });
  } catch (err) {
    console.error('Error fetching dashboard overview from SQL:', err);
    res.status(500).json({ success: false, error: 'Database query failed', message: err.message });
  }
});

// POST /api/dashboard/sync - Trigger real-time sync with external sensors into SQL
router.post('/sync', async (req, res) => {
  try {
    const syncResult = await fetchAndSyncLiveLahoreData();
    const updatedData = await getDashboardOverviewData();
    res.json({
      success: true,
      synced: !!syncResult,
      message: syncResult ? 'SQL database updated with real Lahore sensor metrics' : 'Retained verified SQL baseline',
      ...updatedData
    });
  } catch (err) {
    console.error('Error during live sync:', err);
    res.status(500).json({ success: false, error: 'Sync failed', message: err.message });
  }
});

// GET /api/dashboard/alerts - Returns high alert areas
router.get('/alerts', async (req, res) => {
  try {
    const data = await getDashboardOverviewData();
    res.json({
      success: true,
      areas: data.highAlertAreas
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/dashboard/hourly-forecast - Hourly AI meteorological projections from SQLite
router.get('/hourly-forecast', async (req, res) => {
  try {
    const data = await getDashboardOverviewData();
    res.json({
      success: true,
      count: data.hourlyForecast.length,
      hourlyForecast: data.hourlyForecast
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/dashboard/assistant/ask - Grounded AI assistant endpoint
router.post('/assistant/ask', async (req, res) => {
  try {
    const { query, history } = req.body;
    if (!query || typeof query !== 'string') {
      return res.status(400).json({ success: false, error: 'Query string is required' });
    }
    const response = await askDhuanAssistant(query, history || []);
    res.json(response);
  } catch (err) {
    console.error('Error in assistant ask route:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/dashboard/routing/analyze - AI Multi-Modal Route Evaluation & Ranking
router.post('/routing/analyze', async (req, res) => {
  try {
    const { origin, destination, originName, destName, vehicleMode, preference, stops, clientRoutes } = req.body || {};
    if (!origin || !destination) {
      return res.status(400).json({ success: false, error: 'Origin and destination coordinates are required' });
    }
    const result = await analyzeSmartRoutesWithAi({
      origin,
      destination,
      originName,
      destName,
      vehicleMode: vehicleMode || 'car',
      preference: preference || 'safest',
      stops: stops || [],
      clientRoutes: clientRoutes || []
    });
    res.json(result);
  } catch (err) {
    console.error('Error in AI routing analyze:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/dashboard/routing/monitor - Real-Time 1-Second Ride Environment Check & Dynamic Smog Rerouting
router.post('/routing/monitor', async (req, res) => {
  try {
    const { sessionId, currentPos, aheadPos, destination, vehicleMode, remainingCoords, simulateSpike } = req.body || {};
    if (!currentPos) {
      return res.status(400).json({ success: false, error: 'currentPos is required' });
    }
    const result = await monitorNavigationStepWithAi({
      sessionId,
      currentPos,
      aheadPos: aheadPos || currentPos,
      destination,
      vehicleMode: vehicleMode || 'car',
      remainingCoords: remainingCoords || [],
      simulateSpike: !!simulateSpike
    });
    res.json(result);
  } catch (err) {
    console.error('Error in AI ride monitor:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/dashboard/routing/accept-reroute - Persist user acceptance of AI Smog Bypass Route
router.post('/routing/accept-reroute', async (req, res) => {
  try {
    const { sessionId, vehicleMode, currentPos, currentAqi, aheadAqi, corridorName } = req.body || {};
    await dbRun(`
      INSERT INTO ai_navigation_logs (
        session_id, vehicle_mode, current_lat, current_lng,
        current_aqi, ahead_aqi, event_type, ai_recommendation
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      sessionId || null,
      vehicleMode || 'car',
      currentPos?.[0] || 31.5204,
      currentPos?.[1] || 74.3587,
      currentAqi || 81,
      aheadAqi || 110,
      'USER_ACCEPTED_AI_SAFE_REROUTE',
      `Accepted cleaner route via ${corridorName || 'AI Green Bypass'}`
    ]);
    res.json({ success: true, message: 'Reroute logged in database' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;

