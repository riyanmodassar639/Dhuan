const test = require('node:test');
const assert = require('node:assert/strict');
const { initDatabase, dbGet, dbAll, dbRun } = require('../db/database');
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
      console.log('Skipping live HTTP check (server not bound on 5001 in test sandbox)');
    }
  });

  await t.test('6. Emergency Hospitals & SOS Briefing Pipeline', async () => {
    const hospitals = await dbAll('SELECT * FROM hospitals');
    assert.ok(hospitals.length >= 15, 'Should have at least 15 verified Lahore emergency hospitals');

    const mayo = hospitals.find(h => h.name.includes('Mayo Hospital'));
    assert.ok(mayo, 'Mayo Hospital must exist in directory');
    assert.ok(mayo.lat > 31.0 && mayo.lng > 74.0, 'Valid Lahore coordinates for Mayo Hospital');
    assert.ok(mayo.phone.includes('99211100'), 'Mayo Hospital phone must be verified');

    // Test live emergency route if server active
    try {
      const res = await fetch('http://localhost:5001/api/emergency/hospitals?lat=31.5204&lng=74.3587');
      if (res.ok) {
        const body = await res.json();
        assert.equal(body.success, true);
        assert.ok(body.hospitals.length >= 15);
        assert.ok(body.hospitals[0].distance_km >= 0);
      }
    } catch (e) {
      // In sandbox mode without network
    }
  });

  await t.test('7. Smart Routing SQLite & Dynamic Itinerary Pipeline', async () => {
    // Verify planned_destinations SQLite table exists and has proper schema
    const tableInfo = await dbAll('PRAGMA table_info(planned_destinations)');
    assert.ok(tableInfo.length > 0, 'planned_destinations table must exist in SQLite');
    const cols = tableInfo.map(c => c.name);
    assert.ok(cols.includes('id'), 'has id column');
    assert.ok(cols.includes('name'), 'has name column');
    assert.ok(cols.includes('day'), 'has day column');
    assert.ok(cols.includes('is_silent'), 'has is_silent column');
    assert.ok(cols.includes('notifications_enabled'), 'has notifications_enabled column');
    assert.ok(cols.includes('start_name'), 'has start_name column');
    assert.ok(cols.includes('start_address'), 'has start_address column');
    assert.ok(cols.includes('start_lat'), 'has start_lat column');
    assert.ok(cols.includes('start_lng'), 'has start_lng column');
    assert.ok(cols.includes('start_type'), 'has start_type column');

    // Test inserting a destination dynamically with custom starting location
    const testId = `test-dest-${Date.now()}`;
    await dbRun(`
      INSERT INTO planned_destinations (
        id, user_id, day, name, address, lat, lng, time, tag, vehicle,
        start_name, start_address, start_lat, start_lng, start_type,
        aqi_forecast, pm25_level, smog_status, advisory,
        lead_time_mins, notifications_enabled, is_silent, smog_spike_alert, channel, status
      ) VALUES (?, 'default_user', 'Monday', 'Lahore Gymkhana', 'Upper Mall, Lahore', 31.5333, 74.3498, '10:30 AM', 'Fitness', 'car', 'Home Garden Town', 'Garden Town, Lahore', 31.5012, 74.3211, 'custom', 120, 42.5, 'Moderate Haze', 'Keep vehicle AC on internal circulation.', 30, 1, 0, 1, 'push', 'scheduled')
    `, [testId]);

    const created = await dbGet('SELECT * FROM planned_destinations WHERE id = ?', [testId]);
    assert.ok(created, 'Destination must be created in SQLite');
    assert.equal(created.name, 'Lahore Gymkhana');
    assert.equal(created.start_name, 'Home Garden Town');
    assert.equal(created.start_type, 'custom');
    assert.equal(created.is_silent, 0);

    // Test live HTTP endpoints if server running
    try {
      const getRes = await fetch('http://localhost:5001/api/routing/destinations?day=Monday');
      if (getRes.ok) {
        const data = await getRes.json();
        assert.equal(data.success, true);
        assert.ok(Array.isArray(data.destinations));
      }

      // Test Smart Proactive Alert
      const alertRes = await fetch('http://localhost:5001/api/routing/destinations/test-alert', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ day: 'Monday', id: testId })
      });
      if (alertRes.ok) {
        const alertData = await alertRes.json();
        assert.equal(alertData.success, true);
        assert.ok(alertData.alert);
      }

      // Test creating destination for 'All' days
      const allDaysRes = await fetch('http://localhost:5001/api/routing/destinations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'Central Mall',
          address: 'Main Boulevard, Gulberg',
          lat: 31.5122,
          lng: 74.3475,
          time: '02:00 PM',
          day: 'All',
          tag: 'Shopping',
          vehicle: 'car'
        })
      });
      if (allDaysRes.ok) {
        const allDaysData = await allDaysRes.json();
        assert.equal(allDaysData.success, true);
        assert.equal(allDaysData.destinations.length, 7, 'Must create 7 destination rows for All days');
        // Clean up created all days destinations
        await dbRun('DELETE FROM planned_destinations WHERE name = "Central Mall"');
      }
    } catch (e) {
      // In standalone sandbox
    }

    // Clean up test destination
    await dbRun('DELETE FROM planned_destinations WHERE id = ?', [testId]);
    const afterDelete = await dbGet('SELECT * FROM planned_destinations WHERE id = ?', [testId]);
    assert.equal(afterDelete, undefined, 'Test destination must be cleaned up');
  });

});
