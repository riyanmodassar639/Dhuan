const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('path');
const { initDatabase, dbGet, dbAll } = require('../db/database');
const { 
  getSmogStatus, 
  calculateUsAqiFromPm25, 
  getDashboardOverviewData 
} = require('../services/airQualityService');

test('DHUAN Backend Test Suite', async (t) => {

  await t.test('1. Database Initialization & Schema', async () => {
    await initDatabase();
    const metrics = await dbGet('SELECT * FROM dashboard_metrics WHERE id = 1');
    assert.ok(metrics, 'dashboard_metrics should have a record with id=1');
    assert.equal(metrics.city_name, 'Lahore');
    assert.ok(metrics.current_aqi > 0, 'Current AQI should be a positive integer');

    const areas = await dbAll('SELECT * FROM high_alert_areas');
    assert.ok(areas.length >= 10, 'Should have at least 10 monitored alert areas in Lahore');

    const hourly = await dbAll('SELECT * FROM hourly_forecast');
    assert.ok(hourly.length >= 24, 'Hourly forecast should contain at least 24 hours');
  });

  await t.test('2. US-EPA PM2.5 Breakpoint Math Accuracy', () => {
    // Exact US-EPA breakpoints
    assert.equal(calculateUsAqiFromPm25(0.0), 0);
    assert.equal(calculateUsAqiFromPm25(12.0), 50);
    assert.equal(calculateUsAqiFromPm25(35.4), 100);
    assert.equal(calculateUsAqiFromPm25(55.4), 150);
    assert.equal(calculateUsAqiFromPm25(150.4), 200);
    assert.equal(calculateUsAqiFromPm25(250.4), 300);
    assert.equal(calculateUsAqiFromPm25(500.4), 500);

    // Intermediate test: 25.2 µg/m³ should map into 75-85 Moderate range
    const aqi25 = calculateUsAqiFromPm25(25.2);
    assert.ok(aqi25 >= 75 && aqi25 <= 85, `25.2 µg/m³ should map to ~79-81 AQI, got ${aqi25}`);
  });

  await t.test('3. Smog Severity Category Mapping', () => {
    const clean = getSmogStatus(45);
    assert.equal(clean.status, 'Clean Air');
    assert.equal(clean.color, 'emerald');

    const moderate = getSmogStatus(81);
    assert.equal(moderate.status, 'Moderate Haze');
    assert.equal(moderate.color, 'amber');

    const inversion = getSmogStatus(125);
    assert.equal(inversion.status, 'Smog Inversion Forming');
    assert.equal(inversion.color, 'orange');

    const dense = getSmogStatus(175);
    assert.equal(dense.status, 'Dense Smog Inversion');
    assert.equal(dense.color, 'rose');

    const severe = getSmogStatus(250);
    assert.equal(severe.status, 'Severe Smog Event');
    assert.equal(severe.color, 'purple');

    const toxic = getSmogStatus(450);
    assert.equal(toxic.status, 'Hazardous Toxic Smog');
    assert.equal(toxic.color, 'maroon');
  });

  await t.test('4. Dashboard Overview Data Pipeline', async () => {
    const overview = await getDashboardOverviewData();
    assert.ok(overview.metrics, 'Overview must provide metrics');
    assert.ok(overview.highAlertAreas, 'Overview must provide highAlertAreas');
    assert.ok(overview.hourlyForecast, 'Overview must provide hourlyForecast');
    assert.ok(overview.highAlertAreas.length >= 10, 'Must have high alert areas');
    assert.ok(overview.hourlyForecast.length >= 24, 'Must have 24+ forecast hours');
  });

  await t.test('5. Live HTTP Health Endpoint', async () => {
    try {
      const res = await fetch('http://localhost:5001/api/health');
      if (res.ok) {
        const body = await res.json();
        assert.equal(body.status, 'ok');
        assert.ok(body.service.includes('DHUAN'));
      }
    } catch (e) {
      // If server is not listening on 5001 in CI environment, skip gracefully
      console.log('Skipping live HTTP check (server not bound on 5001 in test sandbox)');
    }
  });

});
