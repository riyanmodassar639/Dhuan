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

  // 7. AI Smart Routing Sessions Table
  await dbRun(`
    CREATE TABLE IF NOT EXISTS ai_routing_sessions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      vehicle_mode TEXT NOT NULL,
      preference TEXT NOT NULL,
      origin_name TEXT,
      origin_lat REAL NOT NULL,
      origin_lng REAL NOT NULL,
      dest_name TEXT,
      dest_lat REAL NOT NULL,
      dest_lng REAL NOT NULL,
      recommended_corridor TEXT,
      safest_aqi INTEGER,
      fastest_duration_sec INTEGER,
      inhaled_pm25_ug REAL,
      safety_score INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // 8. AI Real-Time Navigation & Reroute Logs Table
  await dbRun(`
    CREATE TABLE IF NOT EXISTS ai_navigation_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      session_id INTEGER,
      vehicle_mode TEXT NOT NULL,
      current_lat REAL NOT NULL,
      current_lng REAL NOT NULL,
      current_aqi INTEGER NOT NULL,
      ahead_aqi INTEGER NOT NULL,
      event_type TEXT NOT NULL,
      ai_recommendation TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // 9. Verified Lahore Hospitals & Emergency Centers Directory Table
  await dbRun(`
    CREATE TABLE IF NOT EXISTS hospitals (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      address TEXT NOT NULL,
      phone TEXT NOT NULL,
      emergency_dept TEXT NOT NULL,
      trauma_level TEXT NOT NULL,
      lat REAL NOT NULL,
      lng REAL NOT NULL,
      specialties TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // 10. Emergency Contacts Table
  await dbRun(`
    CREATE TABLE IF NOT EXISTS emergency_contacts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id TEXT NOT NULL DEFAULT 'default_user',
      name TEXT NOT NULL,
      relationship TEXT NOT NULL,
      phone TEXT NOT NULL,
      notify_on_sos INTEGER NOT NULL DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // 11. Emergency SOS & Incident Events Table (Mode A Public Prototype + Log)
  await dbRun(`
    CREATE TABLE IF NOT EXISTS emergency_events (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id TEXT NOT NULL DEFAULT 'default_user',
      event_type TEXT NOT NULL,
      mode TEXT NOT NULL DEFAULT 'mode_a_prototype',
      status TEXT NOT NULL,
      lat REAL,
      lng REAL,
      location_address TEXT,
      aqi_snapshot INTEGER,
      symptoms_summary TEXT,
      nearest_hospital_name TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // 12. Persistent User Health Profiles Table
  await dbRun(`
    CREATE TABLE IF NOT EXISTS user_health_profiles (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id TEXT NOT NULL UNIQUE DEFAULT 'default_user',
      full_name TEXT,
      age INTEGER,
      gender TEXT,
      blood_group TEXT,
      emergency_contact_name TEXT,
      emergency_contact_phone TEXT,
      primary_commute TEXT DEFAULT 'car',
      daily_commute_minutes INTEGER DEFAULT 45,
      asthma_severity TEXT DEFAULT 'none',
      has_copd INTEGER DEFAULT 0,
      has_allergies INTEGER DEFAULT 0,
      has_cardio_condition INTEGER DEFAULT 0,
      smoker_status TEXT DEFAULT 'never',
      is_vulnerable_cohort INTEGER DEFAULT 0,
      trigger_aqi_threshold INTEGER DEFAULT 150,
      uses_inhaler INTEGER DEFAULT 0,
      inhaler_name TEXT,
      last_preventive_dose TEXT,
      wears_mask TEXT DEFAULT 'high_aqi_only',
      mask_type TEXT DEFAULT 'n95',
      has_hepa_purifier INTEGER DEFAULT 1,
      symptom_logs TEXT,
      is_profile_created INTEGER DEFAULT 0,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // 13. User Privacy Consents Table
  await dbRun(`
    CREATE TABLE IF NOT EXISTS user_consents (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id TEXT NOT NULL DEFAULT 'default_user',
      consent_type TEXT NOT NULL,
      granted INTEGER NOT NULL DEFAULT 1,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // 14. Smart Routing & Multi-Stop Itinerary Table
  await dbRun(`
    CREATE TABLE IF NOT EXISTS planned_destinations (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL DEFAULT 'default_user',
      day TEXT NOT NULL,
      name TEXT NOT NULL,
      address TEXT NOT NULL,
      lat REAL NOT NULL,
      lng REAL NOT NULL,
      start_name TEXT DEFAULT 'Current Location',
      start_address TEXT,
      start_lat REAL,
      start_lng REAL,
      start_type TEXT DEFAULT 'current',
      time TEXT NOT NULL,
      tag TEXT DEFAULT 'General',
      vehicle TEXT DEFAULT 'car',
      aqi_forecast INTEGER NOT NULL,
      pm25_level REAL,
      smog_status TEXT NOT NULL,
      advisory TEXT,
      lead_time_mins INTEGER DEFAULT 30,
      notifications_enabled INTEGER DEFAULT 1,
      is_silent INTEGER DEFAULT 0,
      smog_spike_alert INTEGER DEFAULT 1,
      channel TEXT DEFAULT 'push',
      status TEXT DEFAULT 'scheduled',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Auto-migrate start location columns if existing table doesn't have them
  try { await dbRun('ALTER TABLE planned_destinations ADD COLUMN start_name TEXT DEFAULT "Current Location"'); } catch (e) {}
  try { await dbRun('ALTER TABLE planned_destinations ADD COLUMN start_address TEXT'); } catch (e) {}
  try { await dbRun('ALTER TABLE planned_destinations ADD COLUMN start_lat REAL'); } catch (e) {}
  try { await dbRun('ALTER TABLE planned_destinations ADD COLUMN start_lng REAL'); } catch (e) {}
  try { await dbRun('ALTER TABLE planned_destinations ADD COLUMN start_type TEXT DEFAULT "current"'); } catch (e) {}

  // Auto-migrate user_health_profiles columns if missing
  try { await dbRun('ALTER TABLE user_health_profiles ADD COLUMN daily_commute_minutes INTEGER DEFAULT 45'); } catch (e) {}
  try { await dbRun('ALTER TABLE user_health_profiles ADD COLUMN is_vulnerable_cohort INTEGER DEFAULT 0'); } catch (e) {}
  try { await dbRun('ALTER TABLE user_health_profiles ADD COLUMN last_preventive_dose TEXT'); } catch (e) {}
  try { await dbRun('ALTER TABLE user_health_profiles ADD COLUMN has_hepa_purifier INTEGER DEFAULT 1'); } catch (e) {}
  try { await dbRun('ALTER TABLE user_health_profiles ADD COLUMN symptom_logs TEXT'); } catch (e) {}
  try { await dbRun('ALTER TABLE user_health_profiles ADD COLUMN is_profile_created INTEGER DEFAULT 0'); } catch (e) {}

  // 15. Routing Smog Spike Alert Logs Table
  await dbRun(`
    CREATE TABLE IF NOT EXISTS routing_alert_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      destination_id TEXT,
      user_id TEXT NOT NULL DEFAULT 'default_user',
      day TEXT NOT NULL,
      destination_name TEXT NOT NULL,
      time TEXT NOT NULL,
      aqi_level INTEGER NOT NULL,
      alert_message TEXT NOT NULL,
      channel TEXT NOT NULL DEFAULT 'push',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Seed default authentic Lahore data if empty
  const metricsCount = await dbGet('SELECT COUNT(*) as count FROM dashboard_metrics');
  if (metricsCount.count === 0) {
    await seedInitialData();
  }

  // Seed hospitals if table is empty
  const hospCount = await dbGet('SELECT COUNT(*) as count FROM hospitals');
  if (hospCount.count === 0) {
    await seedHospitalsData();
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

async function seedHospitalsData() {
  console.log('Seeding authentic Lahore emergency hospitals directory into SQL...');
  const hospitals = [
    {
      name: 'Mayo Hospital Lahore',
      address: 'Hospital Road, Near Anarkali Bazaar, Lahore',
      phone: '+92 42 99211100',
      emergency_dept: '24/7 Level 1 Trauma & Emergency Wing',
      trauma_level: 'Level 1 Trauma Center',
      lat: 31.5752,
      lng: 74.3168,
      specialties: 'General Trauma, Emergency Surgery, Pulmonology, ICU, Burns Unit'
    },
    {
      name: 'Jinnah Hospital Lahore',
      address: 'Usmani Road, Faisal Town, Lahore',
      phone: '+92 42 99231400',
      emergency_dept: '24/7 Acute Medical & Trauma Emergency',
      trauma_level: 'Level 1 Trauma Center',
      lat: 31.4852,
      lng: 74.2982,
      specialties: 'Trauma, Cardiology, Respiratory Distress, Surgical ICU'
    },
    {
      name: 'Services Hospital Lahore',
      address: 'Jail Road, Shadman, Lahore',
      phone: '+92 42 99203402',
      emergency_dept: '24/7 Emergency Complex',
      trauma_level: 'Level 2 Trauma Center',
      lat: 31.5412,
      lng: 74.3341,
      specialties: 'Internal Medicine, Pulmonology, Pediatrics, Acute Surgery'
    },
    {
      name: 'Shaikh Zayed Hospital',
      address: 'University Avenue, New Garden Town, Lahore',
      phone: '+92 42 35865731',
      emergency_dept: '24/7 Tertiary Emergency & Critical Care',
      trauma_level: 'Tertiary Referral Center',
      lat: 31.5065,
      lng: 74.3156,
      specialties: 'Nephrology, Liver, Pulmonology, Cardiac ICU, Organ Support'
    },
    {
      name: 'Lahore General Hospital (LGH)',
      address: 'Ferozepur Road, Near Chungi Amar Sidhu, Lahore',
      phone: '+92 42 99264036',
      emergency_dept: '24/7 Punjab Neurotrauma & Emergency Complex',
      trauma_level: 'Level 1 Neurotrauma Center',
      lat: 31.4589,
      lng: 74.3598,
      specialties: 'Neurotrauma, Orthopedic Emergency, Spinal Surgery, Critical Care'
    },
    {
      name: 'Sir Ganga Ram Hospital',
      address: 'Queen\'s Road, Mozang, Lahore',
      phone: '+92 42 99200572',
      emergency_dept: '24/7 Emergency Department',
      trauma_level: 'Level 2 Trauma Center',
      lat: 31.5512,
      lng: 74.3214,
      specialties: 'Obstetrics & Gynecology, Pediatrics, Emergency Surgery'
    },
    {
      name: 'Punjab Institute of Cardiology (PIC)',
      address: 'Jail Road, Ghaus-ul-Azam Colony, Lahore',
      phone: '+92 42 99203051',
      emergency_dept: '24/7 Dedicated Cardiac Emergency (Heart Attack Care)',
      trauma_level: 'Specialized Cardiac Center',
      lat: 31.5435,
      lng: 74.3412,
      specialties: 'Acute Myocardial Infarction, Angioplasty, Cath Lab, CCU'
    },
    {
      name: 'Pakistan Kidney and Liver Institute (PKLI)',
      address: 'DHA Phase 6, Knowledge City, Bedian Road, Lahore',
      phone: '+92 42 111 545 454',
      emergency_dept: '24/7 Multi-Organ Transplant & Critical Care Emergency',
      trauma_level: 'Specialized Quaternary Center',
      lat: 31.4568,
      lng: 74.4498,
      specialties: 'Nephrology, Hepatology, Dialysis Emergency, Advanced ICU'
    },
    {
      name: 'Doctors Hospital & Medical Center',
      address: '152-G/1, Canal Bank Road, Johar Town, Lahore',
      phone: '+92 42 35302701',
      emergency_dept: '24/7 Private Emergency & Critical Care',
      trauma_level: 'Private Tertiary Center',
      lat: 31.4812,
      lng: 74.2754,
      specialties: 'Cardiology, Neuro Surgery, Trauma, In-House CT & MRI'
    },
    {
      name: 'The Children\'s Hospital Lahore',
      address: 'Ferozepur Road, Near Model Town, Lahore',
      phone: '+92 42 99230901',
      emergency_dept: '24/7 Specialized Pediatric Emergency',
      trauma_level: 'Specialized Pediatric Center',
      lat: 31.4782,
      lng: 74.3512,
      specialties: 'Pediatric Pulmonology, Neonatal ICU, Pediatric Surgery'
    },
    {
      name: 'Shalamar Hospital',
      address: 'Shalimar Link Road, Mughalpura, Lahore',
      phone: '+92 42 111 205 205',
      emergency_dept: '24/7 Emergency Wing',
      trauma_level: 'Level 2 Trauma Center',
      lat: 31.5792,
      lng: 74.3782,
      specialties: 'Trauma, Pulmonary Care, General Emergency, Dialysis'
    },
    {
      name: 'National Hospital & Medical Centre',
      address: '132/3, L-Block, DHA Phase 1, Lahore',
      phone: '+92 42 111 171 819',
      emergency_dept: '24/7 Acute Care & Emergency Room',
      trauma_level: 'Private Tertiary Center',
      lat: 31.4795,
      lng: 74.3812,
      specialties: 'Interventional Cardiology, Neurosurgery, Critical Care'
    },
    {
      name: 'Ittefaq Hospital (Trust)',
      address: 'Near H-Block, Model Town / Ferozepur Road, Lahore',
      phone: '+92 42 111 770 000',
      emergency_dept: '24/7 Emergency & Ambulance Service',
      trauma_level: 'Level 2 Trauma Center',
      lat: 31.4735,
      lng: 74.3548,
      specialties: 'Cardiac, Orthopedic Trauma, Pulmonary Medicine, ICU'
    },
    {
      name: 'Combined Military Hospital (CMH) Lahore',
      address: 'Abdur Rehman Road, Lahore Cantt, Lahore',
      phone: '+92 42 36605550',
      emergency_dept: '24/7 Trauma & Emergency Center',
      trauma_level: 'Level 1 Trauma Center',
      lat: 31.5282,
      lng: 74.3752,
      specialties: 'Polytrauma, Surgical ICU, Disaster Response, Reconstructive Surgery'
    },
    {
      name: 'Farooq Hospital West Wood',
      address: 'Canal Bank Road, West Wood Colony, Thokar Niaz Baig, Lahore',
      phone: '+92 42 111 327 667',
      emergency_dept: '24/7 Emergency & ICU',
      trauma_level: 'Secondary Emergency Center',
      lat: 31.4704,
      lng: 74.2483,
      specialties: 'Emergency Medicine, Pulmonology, Orthopedics'
    }
  ];

  for (const h of hospitals) {
    await dbRun(`
      INSERT INTO hospitals (name, address, phone, emergency_dept, trauma_level, lat, lng, specialties)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `, [h.name, h.address, h.phone, h.emergency_dept, h.trauma_level, h.lat, h.lng, h.specialties]);
  }
  console.log(`Seeded ${hospitals.length} verified Lahore emergency hospitals!`);
}

async function seedPlannedDestinationsData() {
  console.log('Seeding initial verified Lahore multi-stop itineraries into SQL...');
  const initialDestinations = [
    {
      id: 'stop-1',
      day: 'Monday',
      name: 'Packages Mall, Walton Road',
      address: 'Walton Road, Gulshan-e-Mustafa, Lahore',
      lat: 31.4746,
      lng: 74.3547,
      time: '08:30 AM',
      tag: 'Work',
      vehicle: 'car',
      aqi_forecast: 245,
      pm25_level: 85.5,
      smog_status: 'Severe Smog Event',
      advisory: 'Morning smog thermal inversion. Keep car AC on recirculation mode.',
      lead_time_mins: 30,
      notifications_enabled: 1,
      smog_spike_alert: 1,
      channel: 'push',
      status: 'scheduled'
    },
    {
      id: 'stop-2',
      day: 'Monday',
      name: 'Kalma Chowk Underpass',
      address: 'Main Boulevard Gulberg, Lahore',
      lat: 31.5034,
      lng: 74.3318,
      time: '09:45 AM',
      tag: 'Meeting',
      vehicle: 'car',
      aqi_forecast: 198,
      pm25_level: 62.1,
      smog_status: 'Dense Smog Inversion',
      advisory: 'High vehicular traffic corridor. Keep cabin sealed.',
      lead_time_mins: 30,
      notifications_enabled: 1,
      smog_spike_alert: 1,
      channel: 'push',
      status: 'scheduled'
    },
    {
      id: 'stop-3',
      day: 'Monday',
      name: 'Gaddafi Stadium & Liberty',
      address: 'Hafeez Centre / Ferozepur Rd, Gulberg, Lahore',
      lat: 31.5131,
      lng: 74.3332,
      time: '11:15 AM',
      tag: 'Dining',
      vehicle: 'car',
      aqi_forecast: 115,
      pm25_level: 23.5,
      smog_status: 'Smog Inversion Forming',
      advisory: 'Midday solar warming dispersing ground particulates.',
      lead_time_mins: 30,
      notifications_enabled: 1,
      smog_spike_alert: 1,
      channel: 'push',
      status: 'scheduled'
    },
    {
      id: 'stop-4',
      day: 'Monday',
      name: 'Lahore High Court / Mall Road',
      address: 'Mall Road / Anarkali Precinct, Lahore',
      lat: 31.5657,
      lng: 74.3168,
      time: '12:45 PM',
      tag: 'Work',
      vehicle: 'car',
      aqi_forecast: 105,
      pm25_level: 20.8,
      smog_status: 'Moderate Haze',
      advisory: 'Cleanest air window of the workday.',
      lead_time_mins: 30,
      notifications_enabled: 1,
      smog_spike_alert: 1,
      channel: 'push',
      status: 'scheduled'
    },
    {
      id: 'stop-5',
      day: 'Monday',
      name: 'Liberty Market Roundabout',
      address: 'Liberty Roundabout, Gulberg III, Lahore',
      lat: 31.5109,
      lng: 74.3444,
      time: '02:00 PM',
      tag: 'Shopping',
      vehicle: 'walk',
      aqi_forecast: 108,
      pm25_level: 21.6,
      smog_status: 'Smog Inversion Forming',
      advisory: 'Optimal window for brief outdoor movement.',
      lead_time_mins: 15,
      notifications_enabled: 0,
      smog_spike_alert: 0,
      channel: 'push',
      status: 'scheduled'
    },
    {
      id: 'stop-6',
      day: 'Monday',
      name: 'Lahore Gymkhana Club',
      address: 'Upper Mall Road, Lahore Cantt',
      lat: 31.5367,
      lng: 74.3644,
      time: '03:30 PM',
      tag: 'Fitness',
      vehicle: 'car',
      aqi_forecast: 122,
      pm25_level: 25.1,
      smog_status: 'Smog Inversion Forming',
      advisory: 'Tree-lined green belt provides natural PM2.5 filtration.',
      lead_time_mins: 30,
      notifications_enabled: 1,
      smog_spike_alert: 0,
      channel: 'push',
      status: 'scheduled'
    },
    {
      id: 'stop-7',
      day: 'Monday',
      name: 'Johar Town G1 Market',
      address: 'Khayaban-e-Firdousi, Johar Town, Lahore',
      lat: 31.4697,
      lng: 74.2988,
      time: '05:00 PM',
      tag: 'Meeting',
      vehicle: 'car',
      aqi_forecast: 185,
      pm25_level: 57.0,
      smog_status: 'Dense Smog Inversion',
      advisory: 'Early evening temperature inversion beginning. Wear N95 mask.',
      lead_time_mins: 45,
      notifications_enabled: 1,
      smog_spike_alert: 1,
      channel: 'whatsapp',
      status: 'scheduled'
    },
    {
      id: 'stop-8',
      day: 'Monday',
      name: 'Defence Raya Golf Resort',
      address: 'Sector M, DHA Phase 6, Lahore',
      lat: 31.4552,
      lng: 74.4371,
      time: '06:30 PM',
      tag: 'Meeting',
      vehicle: 'car',
      aqi_forecast: 230,
      pm25_level: 78.4,
      smog_status: 'Severe Smog Event',
      advisory: 'Evening smog surge detected along Southern Ring Road corridor.',
      lead_time_mins: 30,
      notifications_enabled: 1,
      smog_spike_alert: 1,
      channel: 'push',
      status: 'scheduled'
    },
    {
      id: 'stop-9',
      day: 'Monday',
      name: 'DHA Phase 5 Commercial Avenue',
      address: 'Main Commercial, Phase 5 DHA, Lahore',
      lat: 31.4722,
      lng: 74.4019,
      time: '08:00 PM',
      tag: 'Shopping',
      vehicle: 'car',
      aqi_forecast: 175,
      pm25_level: 52.2,
      smog_status: 'Dense Smog Inversion',
      advisory: 'High vehicular emissions in commercial zone. Keep cabin sealed.',
      lead_time_mins: 15,
      notifications_enabled: 1,
      smog_spike_alert: 1,
      channel: 'push',
      status: 'scheduled'
    },
    {
      id: 'stop-10',
      day: 'Monday',
      name: 'Askari 11 Gate 2',
      address: 'Bedian Road / Ring Road Interchange, Lahore',
      lat: 31.4485,
      lng: 74.4558,
      time: '09:15 PM',
      tag: 'Home',
      vehicle: 'car',
      aqi_forecast: 145,
      pm25_level: 34.0,
      smog_status: 'Smog Inversion Forming',
      advisory: 'Traffic easing. Safe journey home.',
      lead_time_mins: 30,
      notifications_enabled: 1,
      smog_spike_alert: 0,
      channel: 'push',
      status: 'scheduled'
    },
    {
      id: 'stop-tue-1',
      day: 'Tuesday',
      name: 'Shaukat Khanum Memorial Hospital',
      address: 'Khayaban-e-Jinnah, Johar Town, Lahore',
      lat: 31.4645,
      lng: 74.2798,
      time: '10:00 AM',
      tag: 'Medical',
      vehicle: 'car',
      aqi_forecast: 160,
      pm25_level: 46.5,
      smog_status: 'Dense Smog Inversion',
      advisory: 'Hospital precinct with HEPA clean-room access.',
      lead_time_mins: 30,
      notifications_enabled: 1,
      smog_spike_alert: 1,
      channel: 'push',
      status: 'scheduled'
    },
    {
      id: 'stop-tue-2',
      day: 'Tuesday',
      name: 'Emporium Mall by Nishat',
      address: 'Abdul Haque Rd, Johar Town, Lahore',
      lat: 31.4674,
      lng: 74.2678,
      time: '02:30 PM',
      tag: 'Shopping',
      vehicle: 'car',
      aqi_forecast: 110,
      pm25_level: 22.2,
      smog_status: 'Smog Inversion Forming',
      advisory: 'Indoor air filtered mall. Clean air haven.',
      lead_time_mins: 15,
      notifications_enabled: 1,
      smog_spike_alert: 0,
      channel: 'push',
      status: 'scheduled'
    }
  ];

  for (const d of initialDestinations) {
    await dbRun(`
      INSERT OR REPLACE INTO planned_destinations 
      (id, user_id, day, name, address, lat, lng, time, tag, vehicle, aqi_forecast, pm25_level, smog_status, advisory, lead_time_mins, notifications_enabled, smog_spike_alert, channel, status)
      VALUES (?, 'default_user', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      d.id, d.day, d.name, d.address, d.lat, d.lng, d.time, d.tag, d.vehicle,
      d.aqi_forecast, d.pm25_level, d.smog_status, d.advisory,
      d.lead_time_mins, d.notifications_enabled, d.smog_spike_alert, d.channel, d.status
    ]);
  }
  console.log(`Seeded ${initialDestinations.length} verified multi-stop itinerary destinations into SQL!`);
}

module.exports = {
  db,
  dbRun,
  dbAll,
  dbGet,
  initDatabase,
  seedPlannedDestinationsData
};
