const express = require('express');
const router = express.Router();
const { getDashboardOverviewData, fetchAndSyncLiveLahoreData, askDhuanAssistant } = require('../services/airQualityService');
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

module.exports = router;
