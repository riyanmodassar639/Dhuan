const express = require('express');
const router = express.Router();
const {
  getDashboardOverviewData,
  fetchAndSyncLiveLahoreData,
  askDhuanAssistant,
  analyzeSmartRoutesWithAi,
  monitorNavigationStepWithAi,
  getPlaceTelemetryWithAi
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

// POST /api/dashboard/place-telemetry - Location-Specific Telemetry, AI Health Protocol & 24h AI Forecast
router.post('/place-telemetry', async (req, res) => {
  try {
    const { lat, lng, name, displayName } = req.body || {};
    if (!lat || !lng) {
      return res.status(400).json({ success: false, error: 'Latitude and Longitude are required' });
    }
    const result = await getPlaceTelemetryWithAi({ lat, lng, name, displayName });
    res.json(result);
  } catch (err) {
    console.error('Error in place-telemetry route:', err);
    res.status(500).json({ success: false, error: 'Place telemetry failed', message: err.message });
  }
});

// POST /api/dashboard/simulator/run - Scenario Simulator & Environmental Digital Twin
router.post('/simulator/run', async (req, res) => {
  try {
    const { 
      windScenario = 'easterly_stubble_plume',
      policyIntervention = 'none',
      inversionSeverity = 'moderate'
    } = req.body || {};

    const overview = await getDashboardOverviewData();
    const baseStations = overview.highAlertAreas || [];

    let windAqiMultiplier = 1.0;
    let windDescription = 'Baseline prevailing wind';
    if (windScenario === 'easterly_stubble_plume') {
      windAqiMultiplier = 1.38;
      windDescription = 'Easterly low-velocity wind transporting dense stubble burning aerosols from eastern border';
    } else if (windScenario === 'calm_stagnant') {
      windAqiMultiplier = 1.22;
      windDescription = 'Dead calm (< 2 km/h); zero horizontal advection; pollutants pool at ground level';
    } else if (windScenario === 'westerly_clean') {
      windAqiMultiplier = 0.78;
      windDescription = 'Fresh westerly breeze (14 km/h) clearing particulates toward eastern plains';
    } else if (windScenario === 'monsoon_scrub') {
      windAqiMultiplier = 0.45;
      windDescription = 'Convective rain event scrubbing atmospheric aerosols down to ambient clean air';
    }

    let policyDelta = 0.0;
    let policyDescription = 'No active policy intervention';
    if (policyIntervention === 'odd_even_traffic') {
      policyDelta = -0.16;
      policyDescription = 'Odd-Even license plate rotation: 40% reduction in private vehicle exhaust';
    } else if (policyIntervention === 'industrial_shutdown') {
      policyDelta = -0.22;
      policyDescription = 'Temporary shutdown of non-compliant steel re-rolling mills & brick kilns';
    } else if (policyIntervention === 'heavy_truck_ban') {
      policyDelta = -0.14;
      policyDescription = 'Daytime restriction on heavy multi-axle diesel freight vehicles';
    } else if (policyIntervention === 'combined_emergency') {
      policyDelta = -0.38;
      policyDescription = 'Full Smog Emergency Protocol: Traffic curbs, industrial scrubbers, and water misting cannons';
    }

    let inversionDelta = 1.0;
    if (inversionSeverity === 'extreme_thermal_lid') {
      inversionDelta = 1.28;
    } else if (inversionSeverity === 'none') {
      inversionDelta = 0.85;
    }

    const simulatedStations = baseStations.map(st => {
      let spatialFactor = 1.0;
      if (windScenario === 'easterly_stubble_plume') {
        if (st.zone_code === 'WG-MNW' || st.zone_code === 'BR-PGN' || st.zone_code === 'DHA-6') {
          spatialFactor = 1.25;
        } else if (st.zone_code === 'SH-GT' || st.zone_code === 'KL-IND') {
          spatialFactor = 1.12;
        }
      }

      const combinedFactor = Math.max(0.25, (windAqiMultiplier * inversionDelta * spatialFactor) + policyDelta);
      const simAqi = Math.min(500, Math.max(25, Math.round(st.aqi * combinedFactor)));
      const simPm25 = Math.round((st.pm25 * combinedFactor) * 10) / 10;

      let status = 'Moderate Haze';
      let colorTier = 'amber';
      if (simAqi > 300) { status = 'Hazardous Toxic Smog'; colorTier = 'maroon'; }
      else if (simAqi > 200) { status = 'Severe Smog Event'; colorTier = 'purple'; }
      else if (simAqi > 150) { status = 'Dense Smog Inversion'; colorTier = 'rose'; }
      else if (simAqi > 100) { status = 'Smog Inversion Forming'; colorTier = 'orange'; }
      else if (simAqi <= 50) { status = 'Clean Air'; colorTier = 'emerald'; }

      return {
        ...st,
        baseline_aqi: st.aqi,
        simulated_aqi: simAqi,
        simulated_pm25: simPm25,
        aqi_delta: simAqi - st.aqi,
        simulated_status: status,
        simulated_color: colorTier
      };
    });

    const baseAvgAqi = Math.round(baseStations.reduce((a, b) => a + b.aqi, 0) / (baseStations.length || 1));
    const simAvgAqi = Math.round(simulatedStations.reduce((a, b) => a + b.simulated_aqi, 0) / (simulatedStations.length || 1));
    const netDeltaPercent = Math.round(((simAvgAqi - baseAvgAqi) / baseAvgAqi) * 100);

    res.json({
      success: true,
      is_simulation: true,
      simulation_engine: 'DHUAN Atmospheric Plume & Planetary Boundary Layer Digital Twin v1.0',
      parameters: {
        windScenario,
        windDescription,
        policyIntervention,
        policyDescription,
        inversionSeverity
      },
      summary: {
        baselineCityAvgAqi: baseAvgAqi,
        simulatedCityAvgAqi: simAvgAqi,
        netDeltaAqi: simAvgAqi - baseAvgAqi,
        netDeltaPercent,
        projectedExposureChange: netDeltaPercent > 0 ? `+${netDeltaPercent}% increased respiratory exposure` : `${netDeltaPercent}% reduced respiratory exposure`
      },
      simulatedStations
    });
  } catch (err) {
    console.error('Error running scenario simulation:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;

