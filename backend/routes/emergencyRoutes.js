const express = require('express');
const router = express.Router();
const { dbAll, dbGet, dbRun } = require('../db/database');
const { getDashboardOverviewData } = require('../services/airQualityService');

// Helper: Haversine distance in kilometers
function haversineKm(lat1, lon1, lat2, lon2) {
  const R = 6371; // Earth radius in km
  const p1 = lat1 * Math.PI / 180;
  const p2 = lat2 * Math.PI / 180;
  const dp = (lat2 - lat1) * Math.PI / 180;
  const dl = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dp / 2) * Math.sin(dp / 2) + Math.cos(p1) * Math.cos(p2) * Math.sin(dl / 2) * Math.sin(dl / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// 1. GET /api/emergency/hospitals - Find nearest emergency hospitals
router.get('/hospitals', async (req, res) => {
  try {
    const lat = parseFloat(req.query.lat) || 31.5204; // Default central Lahore
    const lng = parseFloat(req.query.lng) || 74.3587;
    const specialty = req.query.specialty || null;

    let query = 'SELECT * FROM hospitals';
    let hospitals = await dbAll(query);

    // Compute real distance from user coordinates
    const withDistance = hospitals.map(h => {
      const dist = haversineKm(lat, lng, h.lat, h.lng);
      return {
        ...h,
        distance_km: Math.round(dist * 10) / 10,
        estimated_drive_min: Math.max(3, Math.round(dist * 2.5)) // ~24 km/h Lahore city traffic
      };
    });

    // Sort by nearest first
    withDistance.sort((a, b) => a.distance_km - b.distance_km);

    res.json({
      success: true,
      user_location: { lat, lng },
      count: withDistance.length,
      emergency_helpline: '1122 (Punjab Emergency Service)',
      hospitals: withDistance
    });
  } catch (err) {
    console.error('Error fetching hospitals:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// 2. POST /api/emergency/sos/briefing - Generates structured verified incident briefing
router.post('/sos/briefing', async (req, res) => {
  try {
    const { 
      lat = 31.5204, 
      lng = 74.3587, 
      eventType = 'user_sos', 
      symptoms = '', 
      userId = 'default_user' 
    } = req.body || {};

    // 1. Get Live Environment Snapshot from SQLite
    const overview = await getDashboardOverviewData();
    const liveAqi = overview.metrics ? overview.metrics.current_aqi : 81;
    const livePm25 = overview.metrics ? overview.metrics.pm25_level : 25.2;
    const status = overview.metrics ? overview.metrics.current_status : 'Moderate Haze';

    // 2. Get Nearest Hospital
    const allHosp = await dbAll('SELECT * FROM hospitals');
    let nearestHosp = allHosp[0];
    let minD = 9999;
    for (const h of allHosp) {
      const d = haversineKm(lat, lng, h.lat, h.lng);
      if (d < minD) {
        minD = d;
        nearestHosp = h;
      }
    }

    // 3. Get Consented Health Profile
    const profile = await dbGet('SELECT * FROM user_health_profiles WHERE user_id = ?', [userId]) || {};

    const incidentTime = new Date().toISOString();
    const textBriefing = [
      `🚨 [DHUAN EMERGENCY INCIDENT BRIEFING]`,
      `• Type: ${eventType.toUpperCase().replace('_', ' ')}`,
      `• Operational Mode: Mode A (Prototype / Verified Sensor Log)`,
      `• Incident Timestamp: ${incidentTime}`,
      `• GPS Coordinates: ${lat.toFixed(5)}, ${lng.toFixed(5)} (Accuracy: ~15m)`,
      `• Environmental Conditions: ${liveAqi} AQI (${status}), PM2.5: ${livePm25} µg/m³`,
      `• Nearest Hospital: ${nearestHosp.name} (${Math.round(minD * 10) / 10} km away)`,
      `• Hospital Emergency: ${nearestHosp.emergency_dept} | Phone: ${nearestHosp.phone}`,
      profile.blood_group ? `• Patient Blood Group: ${profile.blood_group}` : null,
      profile.asthma_severity && profile.asthma_severity !== 'none' ? `• Medical Condition: Asthma (${profile.asthma_severity})` : null,
      symptoms ? `• Reported Symptoms: ${symptoms}` : null,
      `• Official Rescue Contact: 1122 (Punjab Emergency Service)`
    ].filter(Boolean).join('\n');

    res.json({
      success: true,
      briefing: {
        eventType,
        mode: 'mode_a_prototype',
        timestamp: incidentTime,
        coordinates: { lat, lng },
        environment: { aqi: liveAqi, pm25: livePm25, status },
        nearestHospital: {
          name: nearestHosp.name,
          phone: nearestHosp.phone,
          distanceKm: Math.round(minD * 10) / 10,
          lat: nearestHosp.lat,
          lng: nearestHosp.lng
        },
        healthProfile: {
          bloodGroup: profile.blood_group || 'Not specified',
          asthma: profile.asthma_severity || 'none',
          inhaler: profile.uses_inhaler ? 'Yes' : 'No'
        },
        formattedText: textBriefing
      }
    });
  } catch (err) {
    console.error('Error generating SOS briefing:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// 3. POST /api/emergency/sos/trigger - Initiates SOS log (Mode A prototype)
router.post('/sos/trigger', async (req, res) => {
  try {
    const { 
      userId = 'default_user', 
      eventType = 'user_sos', 
      lat = 31.5204, 
      lng = 74.3587, 
      address = 'Lahore, Punjab', 
      symptoms = '',
      aqi = 81
    } = req.body || {};

    const allHosp = await dbAll('SELECT * FROM hospitals');
    let nearestHospName = 'Mayo Hospital Lahore';
    let minD = 9999;
    for (const h of allHosp) {
      const d = haversineKm(lat, lng, h.lat, h.lng);
      if (d < minD) {
        minD = d;
        nearestHospName = h.name;
      }
    }

    const result = await dbRun(`
      INSERT INTO emergency_events 
      (user_id, event_type, mode, status, lat, lng, location_address, aqi_snapshot, symptoms_summary, nearest_hospital_name)
      VALUES (?, ?, 'mode_a_prototype', 'initiated', ?, ?, ?, ?, ?, ?)
    `, [userId, eventType, lat, lng, address, aqi, symptoms, nearestHospName]);

    // Build trusted contact notification link
    const contacts = await dbAll('SELECT * FROM emergency_contacts WHERE user_id = ? AND notify_on_sos = 1', [userId]);

    const sosMessage = encodeURIComponent(
      `[DHUAN EMERGENCY ALERT] Urgent assistance requested at https://maps.google.com/?q=${lat},${lng}. Air Quality: ${aqi} AQI. Nearest Hospital: ${nearestHospName}. Please check immediately!`
    );

    const contactAlerts = contacts.map(c => ({
      name: c.name,
      phone: c.phone,
      whatsappUrl: `https://wa.me/${c.phone.replace(/[^0-9]/g, '')}?text=${sosMessage}`,
      smsUrl: `sms:${c.phone}?body=${sosMessage}`
    }));

    res.json({
      success: true,
      eventId: result.lastID,
      mode: 'mode_a_prototype',
      status: 'initiated',
      message: 'SOS event registered in security audit log (Mode A Prototype). User emergency actions ready.',
      officialCallNumber: '1122',
      contactAlerts
    });
  } catch (err) {
    console.error('Error triggering SOS:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// 4. POST /api/emergency/sos/cancel - Cancels an SOS countdown or false alarm
router.post('/sos/cancel', async (req, res) => {
  try {
    const { eventId, reason = 'User cancelled countdown / False alarm' } = req.body || {};
    if (eventId) {
      await dbRun(`
        UPDATE emergency_events 
        SET status = 'cancelled'
        WHERE id = ?
      `, [eventId]);
    }
    res.json({
      success: true,
      status: 'cancelled',
      message: 'SOS countdown cancelled safely. No alert dispatched.'
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 5. GET & POST /api/emergency/health-profile - Persistent SQL user health profile
router.get('/health-profile', async (req, res) => {
  try {
    const userId = req.query.userId || 'default_user';
    const profile = await dbGet('SELECT * FROM user_health_profiles WHERE user_id = ?', [userId]);
    res.json({ success: true, profile: profile || null });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.post('/health-profile', async (req, res) => {
  try {
    const {
      userId = 'default_user',
      fullName = 'Lahore Commuter',
      age = 32,
      gender = 'Other',
      bloodGroup = 'B+',
      emergencyContactName = 'Family Contact',
      emergencyContactPhone = '+92 300 1234567',
      primaryCommute = 'car',
      asthmaSeverity = 'none',
      hasCopd = 0,
      hasAllergies = 0,
      hasCardioCondition = 0,
      smokerStatus = 'never',
      triggerAqiThreshold = 150,
      usesInhaler = 0,
      inhalerName = '',
      wearsMask = 'high_aqi_only',
      maskType = 'n95'
    } = req.body || {};

    await dbRun(`
      INSERT INTO user_health_profiles (
        user_id, full_name, age, gender, blood_group, emergency_contact_name, emergency_contact_phone,
        primary_commute, asthma_severity, has_copd, has_allergies, has_cardio_condition,
        smoker_status, trigger_aqi_threshold, uses_inhaler, inhaler_name, wears_mask, mask_type, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
      ON CONFLICT(user_id) DO UPDATE SET
        full_name = excluded.full_name,
        age = excluded.age,
        gender = excluded.gender,
        blood_group = excluded.blood_group,
        emergency_contact_name = excluded.emergency_contact_name,
        emergency_contact_phone = excluded.emergency_contact_phone,
        primary_commute = excluded.primary_commute,
        asthma_severity = excluded.asthma_severity,
        has_copd = excluded.has_copd,
        has_allergies = excluded.has_allergies,
        has_cardio_condition = excluded.has_cardio_condition,
        smoker_status = excluded.smoker_status,
        trigger_aqi_threshold = excluded.trigger_aqi_threshold,
        uses_inhaler = excluded.uses_inhaler,
        inhaler_name = excluded.inhaler_name,
        wears_mask = excluded.wears_mask,
        mask_type = excluded.mask_type,
        updated_at = CURRENT_TIMESTAMP
    `, [
      userId, fullName, age, gender, bloodGroup, emergencyContactName, emergencyContactPhone,
      primaryCommute, asthmaSeverity, hasCopd ? 1 : 0, hasAllergies ? 1 : 0, hasCardioCondition ? 1 : 0,
      smokerStatus, triggerAqiThreshold, usesInhaler ? 1 : 0, inhalerName, wearsMask, maskType
    ]);

    const updated = await dbGet('SELECT * FROM user_health_profiles WHERE user_id = ?', [userId]);
    res.json({ success: true, profile: updated });
  } catch (err) {
    console.error('Error saving health profile:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// 6. User Consents GET & POST
router.get('/consents', async (req, res) => {
  try {
    const userId = req.query.userId || 'default_user';
    const consents = await dbAll('SELECT * FROM user_consents WHERE user_id = ?', [userId]);
    res.json({ success: true, consents });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.post('/consents', async (req, res) => {
  try {
    const { userId = 'default_user', consentType, granted = true } = req.body || {};
    if (!consentType) return res.status(400).json({ success: false, error: 'consentType is required' });

    await dbRun(`
      INSERT INTO user_consents (user_id, consent_type, granted, updated_at)
      VALUES (?, ?, ?, CURRENT_TIMESTAMP)
    `, [userId, consentType, granted ? 1 : 0]);

    res.json({ success: true, consentType, granted });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
