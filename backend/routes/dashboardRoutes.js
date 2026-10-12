const express = require('express');
const router = express.Router();
const { getDashboardOverviewData, fetchAndSyncLiveLahoreData } = require('../services/airQualityService');
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

module.exports = router;
