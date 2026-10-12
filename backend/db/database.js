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
    { name: 'Shahdara (GT Road)', zone: 'SH-GT', aqi: 90, pm25: 30.7, status: 'Moderate Haze', color: 'amber', lat: 31.6250, lng: 74.2780 },
    { name: 'Kot Lakhpat Industrial', zone: 'KL-IND', aqi: 88, pm25: 29.7, status: 'Moderate Haze', color: 'amber', lat: 31.4500, lng: 74.3300 },
    { name: 'Multan Road (Thokar)', zone: 'MR-TNB', aqi: 86, pm25: 28.7, status: 'Moderate Haze', color: 'amber', lat: 31.4700, lng: 74.2400 },
    { name: 'US Consulate (Empress Rd)', zone: 'US-CONS', aqi: 79, pm25: 25.2, status: 'Moderate Haze', color: 'amber', lat: 31.5626, lng: 74.3361 },
    { name: 'Gulberg (Syed Maratib Ali)', zone: 'GL-SMA', aqi: 79, pm25: 25.5, status: 'Moderate Haze', color: 'amber', lat: 31.5122, lng: 74.3475 },
    { name: 'Mall Road (Anarkali)', zone: 'MR-ANK', aqi: 77, pm25: 24.4, status: 'Moderate Haze', color: 'amber', lat: 31.5580, lng: 74.3270 },
    { name: 'Barki Road (Paragon)', zone: 'BR-PGN', aqi: 76, pm25: 23.9, status: 'Moderate Haze', color: 'amber', lat: 31.5359, lng: 74.4352 },
    { name: 'Johar Town (Doctor\'s Hospital)', zone: 'JT-DH', aqi: 75, pm25: 23.4, status: 'Moderate Haze', color: 'amber', lat: 31.4697, lng: 74.2728 },
    { name: 'Model Town (A-Block)', zone: 'MT-A', aqi: 73, pm25: 22.4, status: 'Moderate Haze', color: 'amber', lat: 31.4850, lng: 74.3200 },
    { name: 'DHA Phase 6 (Bedian Rd)', zone: 'DHA-6', aqi: 71, pm25: 21.7, status: 'Moderate Haze', color: 'amber', lat: 31.4559, lng: 74.4638 },
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
