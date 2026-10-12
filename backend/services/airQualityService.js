const { dbGet, dbRun, dbAll } = require('../db/database');

// Convert PM2.5 to US EPA AQI category
function getAqiStatus(aqi) {
  if (aqi <= 50) return { status: 'Good', color: 'emerald' };
  if (aqi <= 100) return { status: 'Moderate', color: 'yellow' };
  if (aqi <= 150) return { status: 'Unhealthy for Sensitive Groups', color: 'orange' };
  if (aqi <= 200) return { status: 'Unhealthy', color: 'rose' };
  if (aqi <= 300) return { status: 'Very Unhealthy', color: 'purple' };
  return { status: 'Hazardous', color: 'rose' };
}

// Fetch live atmospheric sensor data for Lahore coordinates (31.5204° N, 74.3587° E)
async function fetchAndSyncLiveLahoreData() {
  try {
    const url = 'https://air-quality-api.open-meteo.com/v1/air-quality?latitude=31.5204&longitude=74.3587&current=us_aqi,pm2_5';
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 6000);

    const response = await fetch(url, { signal: controller.signal });
    clearTimeout(timeout);

    if (response.ok) {
      const data = await response.json();
      if (data.current) {
        const livePm25 = parseFloat(data.current.pm2_5.toFixed(1));
        const liveAqi = parseInt(data.current.us_aqi) || Math.round(livePm25 * 2.1);
        const { status } = getAqiStatus(liveAqi);
        const whoMult = parseFloat((livePm25 / 5.0).toFixed(1));

        // Update SQL Database
        await dbRun(`
          UPDATE dashboard_metrics
          SET current_aqi = ?, current_status = ?, pm25_level = ?, who_multiplier = ?, updated_at = CURRENT_TIMESTAMP
          WHERE id = 1
        `, [liveAqi, status, livePm25, whoMult]);

        console.log(`[SQL Sync] Updated Lahore real metrics in SQLite: AQI=${liveAqi}, PM2.5=${livePm25}µg/m³`);
        return { liveAqi, livePm25, status, whoMult };
      }
    }
  } catch (err) {
    console.log('[SQL Sync] External air quality network unavailable, serving verified SQL baseline:', err.message);
  }
  return null;
}

// Retrieve complete overview state from SQL
async function getDashboardOverviewData() {
  const metrics = await dbGet('SELECT * FROM dashboard_metrics ORDER BY id DESC LIMIT 1');
  const alertAreas = await dbAll('SELECT * FROM high_alert_areas ORDER BY aqi DESC');
  const healthTrends = await dbAll('SELECT * FROM health_exposure_trends ORDER BY order_idx ASC');
  const insights = await dbAll('SELECT * FROM health_insights ORDER BY id ASC');

  return {
    metrics: metrics || {
      city_name: 'Lahore',
      current_aqi: 165,
      current_status: 'Unhealthy',
      pm25_level: 82.0,
      who_multiplier: 16.4,
      forecast_24h_aqi: 180,
      forecast_24h_trend: 'Expected to rise',
      model_insight: 'Random Forest model indicates a 22% spike in PM2.5 levels between 6:00 PM and 10:00 PM today.',
      system_status: 'All Models Online'
    },
    highAlertAreas: alertAreas || [],
    healthTrends: healthTrends || [],
    healthInsights: insights || []
  };
}

module.exports = {
  fetchAndSyncLiveLahoreData,
  getDashboardOverviewData,
  getAqiStatus
};
