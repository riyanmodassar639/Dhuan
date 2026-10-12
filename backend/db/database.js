const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

const dbPath = path.resolve(__dirname, '../dhuan.sqlite');
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Failed to connect to SQLite database:', err.message);
  } else {
    console.log('Connected to SQLite database at:', dbPath);
  }
});

// Helper for running promises with SQL
function dbRun(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function (err) {
      if (err) reject(err);
      else resolve(this);
    });
  });
}

function dbAll(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });
}

function dbGet(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
      if (err) reject(err);
      else resolve(row);
    });
  });
}

// Initialize and auto-migrate all required SQL tables
async function initDatabase() {
  // 1. Dashboard Metrics Table
  await dbRun(`
    CREATE TABLE IF NOT EXISTS dashboard_metrics (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      city_name TEXT NOT NULL DEFAULT 'Lahore',
      current_aqi INTEGER NOT NULL,
      current_status TEXT NOT NULL,
      pm25_level REAL NOT NULL,
      who_multiplier REAL NOT NULL,
      forecast_24h_aqi INTEGER NOT NULL,
      forecast_24h_trend TEXT NOT NULL,
      model_insight TEXT,
      system_status TEXT NOT NULL DEFAULT 'All Models Online',
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // 2. High Alert Areas Table
  await dbRun(`
    CREATE TABLE IF NOT EXISTS high_alert_areas (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      zone_code TEXT,
      aqi INTEGER NOT NULL,
      pm25 REAL NOT NULL,
      status TEXT NOT NULL,
      color_tier TEXT NOT NULL,
      lat REAL,
      lng REAL,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // 3. Health Exposure Trends Table
  await dbRun(`
    CREATE TABLE IF NOT EXISTS health_exposure_trends (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      day_label TEXT NOT NULL,
      exposure REAL NOT NULL,
      risk INTEGER NOT NULL,
      order_idx INTEGER NOT NULL
    )
  `);

  // 4. Health Insights Table
  await dbRun(`
    CREATE TABLE IF NOT EXISTS health_insights (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      description TEXT NOT NULL,
      badge TEXT,
      type TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // 5. Hourly AI Forecast Table (Full 24h - 72h meteorological projection)
  await dbRun(`
    CREATE TABLE IF NOT EXISTS hourly_forecast (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      step INTEGER NOT NULL,
      time_label TEXT NOT NULL,
      day_label TEXT,
      timestamp TEXT NOT NULL,
      aqi INTEGER NOT NULL,
      pm25 REAL NOT NULL,
      temperature INTEGER,
      humidity INTEGER,
      wind_speed INTEGER,
      wind_direction INTEGER,
      weather_icon TEXT,
      status TEXT NOT NULL,
      color TEXT NOT NULL,
      detail TEXT,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // 6. Historical Hourly Table (Last 24 hours of recorded air quality & weather)
  await dbRun(`
    CREATE TABLE IF NOT EXISTS historical_hourly (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      hours_ago INTEGER NOT NULL,
      time_label TEXT NOT NULL,
      day_label TEXT,
      timestamp TEXT NOT NULL,
      aqi INTEGER NOT NULL,
      pm25 REAL NOT NULL,
      temperature INTEGER,
      humidity INTEGER,
      wind_speed INTEGER,
      status TEXT NOT NULL,
      color TEXT NOT NULL,
      detail TEXT,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Seed default authentic Lahore data if empty
  const metricsCount = await dbGet('SELECT COUNT(*) as count FROM dashboard_metrics');
  if (metricsCount.count === 0) {
    await seedInitialData();
  }
}

async function seedInitialData() {
  console.log('Seeding initial authentic Lahore environmental data into SQL...');

  // Seed Main Metrics (Accurate Real-World Lahore Ambient Baseline)
  await dbRun(`
    INSERT INTO dashboard_metrics 
    (city_name, current_aqi, current_status, pm25_level, who_multiplier, forecast_24h_aqi, forecast_24h_trend, model_insight, system_status)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `, [
    'Lahore',
    81,
    'Moderate Haze',
    25.2,
    5.0,
    119,
    'Smog Inversion Forming',
    'AI model projects nocturnal boundary layer inversion peaking at 161 (Dense Smog Inversion) around 05:00 AM.',
    'All Models Online'
  ]);

  // Seed High Alert Areas in Lahore with real coordinates
  const areas = [
    { name: 'Gulberg III', zone: 'G-3', aqi: 136, pm25: 50.4, status: 'Smog Inversion Forming', color: 'orange', lat: 31.5102, lng: 74.3441 },
    { name: 'Shahdara', zone: 'SH-1', aqi: 120, pm25: 48.5, status: 'Smog Inversion Forming', color: 'orange', lat: 31.6211, lng: 74.2811 },
    { name: 'Johar Town', zone: 'JT-B', aqi: 98, pm25: 34.6, status: 'Moderate Haze', color: 'amber', lat: 31.4697, lng: 74.2728 },
    { name: 'Mall Road', zone: 'MR-1', aqi: 94, pm25: 32.8, status: 'Moderate Haze', color: 'amber', lat: 31.5580, lng: 74.3270 },
  ];

  for (const a of areas) {
    await dbRun(`
      INSERT INTO high_alert_areas (name, zone_code, aqi, pm25, status, color_tier, lat, lng)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `, [a.name, a.zone, a.aqi, a.pm25, a.status, a.color, a.lat, a.lng]);
  }

  // Seed Weekly Health Exposure Trends
  const trends = [
    { day: 'Mon', exposure: 45, risk: 20, idx: 1 },
    { day: 'Tue', exposure: 82, risk: 55, idx: 2 },
    { day: 'Wed', exposure: 120, risk: 85, idx: 3 },
    { day: 'Thu', exposure: 90, risk: 60, idx: 4 },
    { day: 'Fri', exposure: 65, risk: 35, idx: 5 },
    { day: 'Sat', exposure: 40, risk: 15, idx: 6 },
    { day: 'Sun', exposure: 50, risk: 25, idx: 7 },
  ];

  for (const t of trends) {
    await dbRun(`
      INSERT INTO health_exposure_trends (day_label, exposure, risk, order_idx)
      VALUES (?, ?, ?, ?)
    `, [t.day, t.exposure, t.risk, t.idx]);
  }

  // Seed Health Insights
  const insights = [
    {
      title: 'Asthma Warning',
      description: "Based on your profile, today's PM2.5 levels are hazardous for your asthma. Keep inhaler nearby.",
      badge: 'High Sensitivity',
      type: 'warning'
    },
    {
      title: 'Outdoor Exercise',
      description: 'Not recommended until tomorrow morning when AQI is expected to drop below 100.',
      badge: 'Advisory',
      type: 'exercise'
    }
  ];

  for (const i of insights) {
    await dbRun(`
      INSERT INTO health_insights (title, description, badge, type)
      VALUES (?, ?, ?, ?)
    `, [i.title, i.description, i.badge, i.type]);
  }

  console.log('SQL Database seeded successfully!');
}

module.exports = {
  db,
  dbRun,
  dbAll,
  dbGet,
  initDatabase
};
