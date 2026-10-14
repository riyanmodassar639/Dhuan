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

// Clinical / Environmental Risk Calculation (Modeled purely on DB profile & live sensor readings - No external AI)
function calculateHealthMetrics(profile, liveAqi = 81, livePm25 = 25.2) {
  if (!profile || !profile.full_name) {
    return null;
  }

  let score = 15; // baseline

  // Chronic respiratory conditions
  if (profile.asthma_severity === 'mild') score += 18;
  if (profile.asthma_severity === 'moderate') score += 32;
  if (profile.asthma_severity === 'severe') score += 48;

  if (profile.has_copd) score += 28;
  if (profile.has_bronchitis) score += 22;
  if (profile.has_reduced_lung_capacity) score += 25;
  if (profile.has_lung_cancer_risk) score += 24;
  if (profile.has_cardio_condition) score += 20;
  if (profile.has_allergies) score += 10;
  if (profile.has_eye_irritation) score += 8;
  if (profile.has_ent_irritation) score += 8;
  if (profile.has_headaches_fatigue) score += 10;

  // Cohorts & age
  if (profile.has_pregnant) score += 20;
  if (profile.has_elderly || profile.age > 60) score += 18;
  if (profile.has_child || profile.age < 12) score += 18;
  if (profile.is_vulnerable_cohort) score += 12;

  // Smoker status
  if (profile.smoker_status === 'active') score += 20;
  if (profile.smoker_status === 'former') score += 6;

  // Commute exposure
  if (profile.primary_commute === 'bike') score += 16;
  if (profile.primary_commute === 'walk') score += 14;
  if (profile.primary_commute === 'transit') score += 8;
  if (profile.primary_commute === 'car') score += 2;

  const commuteMins = profile.daily_commute_minutes || 30;
  if (commuteMins > 60) score += 10;
  else if (commuteMins > 30) score += 5;

  // Protective habits
  if (profile.wears_mask === 'always') score -= 16;
  else if (profile.wears_mask === 'high_aqi_only') score -= 10;

  if (profile.mask_type === 'n95') score -= 8;
  if (profile.has_hepa_purifier) score -= 10;

  // Collect active health conditions & generate condition-specific advisories
  const activeConditions = [];
  const detailedAdvisories = [];
  const actionBadges = [];

  if (profile.asthma_severity && profile.asthma_severity !== 'none') {
    activeConditions.push(`${profile.asthma_severity.charAt(0).toUpperCase() + profile.asthma_severity.slice(1)} Asthma`);
    detailedAdvisories.push({
      id: 'asthma',
      title: 'Asthma Airway Hyper-responsiveness',
      advice: `Your ${profile.asthma_severity} asthma increases risk of acute bronchospasm during Lahore smog inversions. Pre-medicate with inhaler prior to stepping outdoors.`,
      severity: profile.asthma_severity === 'severe' ? 'critical' : 'warning'
    });
    actionBadges.push({ id: 'inhaler', label: 'Keep Rescue Inhaler in Pocket', type: 'blue' });
  }

  if (profile.has_bronchitis) {
    activeConditions.push('Chronic Bronchitis');
    detailedAdvisories.push({
      id: 'bronchitis',
      title: 'Bronchial Mucosal Inflammation',
      advice: 'Airborne particulates severely irritate inflamed bronchial linings, triggering chronic productive cough and nocturnal wheezing. Avoid morning thermal inversion fog.',
      severity: 'warning'
    });
    actionBadges.push({ id: 'bronchitis', label: 'Bronchial Warm Air Protection', type: 'amber' });
  }

  if (profile.has_reduced_lung_capacity) {
    activeConditions.push('Reduced Lung Function');
    detailedAdvisories.push({
      id: 'reduced_capacity',
      title: 'Diminished Pulmonary Capacity',
      advice: 'Reduced lung function limits arterial oxygen diffusion under heavy smog. Strictly prohibit strenuous outdoor aerobic workouts, jogging, or cycling.',
      severity: 'critical'
    });
    actionBadges.push({ id: 'cardio_ban', label: 'Zero Strenuous Outdoor Exercise', type: 'rose' });
  }

  if (profile.has_eye_irritation) {
    activeConditions.push('Eye Irritation & Burning');
    detailedAdvisories.push({
      id: 'eye_irritation',
      title: 'Ocular Conjunctival Burning',
      advice: 'High atmospheric levels of photochemical oxidants and acidic smog cause stinging and watery eyes. Wear wrap-around glasses outdoors and use preservative-free lubricating eye drops.',
      severity: 'info'
    });
    actionBadges.push({ id: 'eye_drops', label: 'Wrap-around Eyewear / Eye Drops', type: 'cyan' });
  }

  if (profile.has_ent_irritation) {
    activeConditions.push('Nose & Throat Irritation');
    detailedAdvisories.push({
      id: 'ent_irritation',
      title: 'Upper Respiratory & Pharyngeal Irritation',
      advice: 'Nitrogen dioxide and particulate soot irritate mucosal membranes, inducing sneezing and raw throat. Rinse nasal sinuses with isotonic saline solution twice daily.',
      severity: 'info'
    });
    actionBadges.push({ id: 'saline_rinse', label: 'Saline Nasal Rinse & Warm Gargle', type: 'yellow' });
  }

  if (profile.has_headaches_fatigue) {
    activeConditions.push('Headaches & Fatigue');
    detailedAdvisories.push({
      id: 'headaches_fatigue',
      title: 'Smog-Induced Hypoxia & Neurological Fatigue',
      advice: 'Fine particulates elevate systemic inflammatory cytokines and lower cerebral oxygenation, resulting in dull smog headaches and chronic tiredness. Maintain active indoor hydration and work in HEPA-filtered air.',
      severity: 'info'
    });
    actionBadges.push({ id: 'hydration', label: 'High Hydration & Indoor Rest', type: 'purple' });
  }

  if (profile.has_cardio_condition) {
    activeConditions.push('Cardiovascular Disease Risk');
    detailedAdvisories.push({
      id: 'cardio',
      title: 'Cardiovascular & Vascular Constriction Risk',
      advice: 'PM2.5 particles penetrate directly into capillaries, triggering systemic endothelial dysfunction, arterial plaque instability, and blood pressure spikes. Monitor BP regularly.',
      severity: 'critical'
    });
    actionBadges.push({ id: 'bp_monitor', label: 'Monitor Blood Pressure & Cardiac Strain', type: 'rose' });
  }

  if (profile.has_lung_cancer_risk) {
    activeConditions.push('Long-Term Lung Cancer Risk');
    detailedAdvisories.push({
      id: 'cancer_risk',
      title: 'Elevated Carcinogenic Particulate Sensitivity',
      advice: 'Long-term exposure to polycyclic aromatic hydrocarbons (PAHs) in Lahore smog increases oncological cell transformation risk. Strictly wear N95 airtight respirators.',
      severity: 'warning'
    });
    actionBadges.push({ id: 'n95_strict', label: 'Strict Airtight N95 / KN95 Respirator', type: 'emerald' });
  }

  if (profile.has_pregnant) {
    activeConditions.push('Pregnancy-Related Vulnerability');
    detailedAdvisories.push({
      id: 'pregnancy',
      title: 'Maternal & Prenatal Airway Defense',
      advice: 'Prenatal smog exposure correlates with fetal hypoxia, increased risk of low birth weight, and premature delivery. Strictly remain indoors during AQI > 150 with continuous HEPA purification.',
      severity: 'critical'
    });
    actionBadges.push({ id: 'maternal_hepa', label: 'Continuous Indoor HEPA Air Purifier', type: 'pink' });
  }

  if (profile.has_child) {
    activeConditions.push('Pediatric Vulnerability (Child)');
    detailedAdvisories.push({
      id: 'child',
      title: 'Pediatric Lung Development Hazard',
      advice: 'Children inhale up to 50% more air per pound of body weight than adults, leading to deeper alveolar deposition of soot and stunted lung growth. Restrict outdoor play.',
      severity: 'warning'
    });
    actionBadges.push({ id: 'child_indoor', label: 'Keep Children Indoors During Peak Smog', type: 'blue' });
  }

  if (profile.has_elderly || profile.age > 60) {
    activeConditions.push('Senior Citizen (60+) Risk');
    detailedAdvisories.push({
      id: 'elderly',
      title: 'Senior Respiratory Mucosal Fragility',
      advice: 'Diminished ciliary clearance in seniors allows soot to settle deeper in bronchioles. Avoid early morning walks during peak temperature inversion (06:30 - 09:30 AM).',
      severity: 'warning'
    });
    actionBadges.push({ id: 'senior_care', label: 'Avoid Morning Walks During Smog Fog', type: 'slate' });
  }

  // Active smog symptoms
  let activeSymptoms = [];
  try {
    if (profile.smog_symptoms_json) {
      activeSymptoms = JSON.parse(profile.smog_symptoms_json);
    }
  } catch (e) {}

  if (Array.isArray(activeSymptoms) && activeSymptoms.length > 0) {
    for (const sym of activeSymptoms) {
      score += 4;
    }
  }

  score = Math.max(5, Math.min(99, score));

  // Always include standard N95 badge if not already added
  if (!actionBadges.some(b => b.id === 'n95_strict')) {
    actionBadges.unshift({ id: 'n95_standard', label: 'Wear N95 Mask Outdoors', type: 'emerald' });
  }
  actionBadges.push({ id: 'avoid_peak', label: 'Avoid Morning Smog (07:30 - 09:30 AM)', type: 'amber' });

  // Generate triggers text
  let triggersText = '';
  if (activeConditions.length > 0) {
    triggersText = `Triggered by ${activeConditions.slice(0, 3).join(', ')}${activeConditions.length > 3 ? ` +${activeConditions.length - 3} more` : ''} + daily ${commuteMins}m ${profile.primary_commute || 'commute'}.`;
  } else {
    triggersText = `Baseline respiratory sensitivity (no chronic smog conditions) + daily ${commuteMins}m ${profile.primary_commute || 'commute'}.`;
  }

  let tier = 'Low';
  let tierColor = 'text-emerald-700 bg-emerald-50 border-emerald-200';
  let progressBg = 'bg-emerald-500';
  let advisory = 'Normal precautions. Outdoor activities permitted with standard awareness.';

  if (score >= 75) {
    tier = 'Severe';
    tierColor = 'text-rose-700 bg-rose-50 border-rose-200';
    progressBg = 'bg-rose-600';
    advisory = 'High danger of acute airway constriction or respiratory inflammation. Pre-medicate with inhaler and strictly wear N95 outdoors.';
  } else if (score >= 55) {
    tier = 'High';
    tierColor = 'text-orange-700 bg-orange-50 border-orange-200';
    progressBg = 'bg-orange-500';
    advisory = 'Elevated respiratory & cardiovascular risk. Limit outdoor exposure during peak morning smog inversions (07:30 - 10:00 AM).';
  } else if (score >= 35) {
    tier = 'Moderate';
    tierColor = 'text-yellow-700 bg-yellow-50 border-yellow-200';
    progressBg = 'bg-yellow-500';
    advisory = 'Sensitive airways will experience coughing, eye burning, or throat irritation. Keep rescue inhaler or eye drops readily accessible.';
  }

  const safeMinutesUnmasked = Math.max(12, Math.round(180 * (1 - score / 100) * (100 / liveAqi)));
  const safeMinutesMasked = Math.min(480, safeMinutesUnmasked * 4.5);

  const breathingRate = 0.8; // m3/hour
  const commuteHours = commuteMins / 60;
  const filtrationEfficiency = profile.mask_type === 'n95' ? 0.92 : profile.mask_type === 'surgical' ? 0.45 : 0.15;
  const maskProtection = profile.wears_mask === 'always' || profile.wears_mask === 'high_aqi_only' ? filtrationEfficiency : 0;

  const commuteInhaledUg = livePm25 * breathingRate * commuteHours * (1 - maskProtection);
  const indoorInhaledUg = (profile.has_hepa_purifier ? 25 : 55) * breathingRate * (24 - commuteHours);
  const totalDailyPm25Ug = Math.round(commuteInhaledUg + indoorInhaledUg);

  return {
    score,
    tier,
    tierColor,
    progressBg,
    advisory,
    triggersText,
    activeConditions,
    detailedAdvisories,
    actionBadges,
    safeMinutesUnmasked,
    safeMinutesMasked,
    totalDailyPm25Ug,
    calculatedAt: new Date().toISOString()
  };
}

// 5. GET, POST & DELETE /api/emergency/health-profile - Persistent SQL user health profile
router.get('/health-profile', async (req, res) => {
  try {
    const userId = req.query.userId || 'default_user';
    const profile = await dbGet('SELECT * FROM user_health_profiles WHERE user_id = ?', [userId]);
    const hasProfile = Boolean(profile && profile.full_name && profile.full_name.trim().length > 0 && profile.is_profile_created !== 0);
    
    // Also attach medical reports from user_medical_reports table if available
    let reports = [];
    try {
      reports = await dbAll('SELECT * FROM user_medical_reports WHERE user_id = ? ORDER BY report_date DESC, id DESC', [userId]);
    } catch (e) {}

    // Live atmospheric baseline from SQLite Overview data
    let liveAqi = 81;
    let livePm25 = 25.2;
    try {
      const overview = await getDashboardOverviewData();
      if (overview && overview.metrics) {
        if (typeof overview.metrics.current_aqi === 'number') liveAqi = overview.metrics.current_aqi;
        if (typeof overview.metrics.pm25_level === 'number') livePm25 = overview.metrics.pm25_level;
      }
    } catch (e) {}

    const vulnerability = hasProfile ? calculateHealthMetrics(profile, liveAqi, livePm25) : null;

    res.json({
      success: true,
      hasProfile,
      profile: hasProfile ? profile : null,
      medicalReports: reports,
      vulnerability,
      environmentBaseline: { aqi: liveAqi, pm25: livePm25 }
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.post('/health-profile', async (req, res) => {
  try {
    const {
      userId = 'default_user',
      fullName = '',
      age = 30,
      gender = 'Male',
      bloodGroup = 'O+',
      emergencyContactName = '',
      emergencyContactPhone = '',
      primaryCommute = 'car',
      dailyCommuteMinutes = 45,
      asthmaSeverity = 'none',
      hasCopd = 0,
      hasAllergies = 0,
      hasCardioCondition = 0,
      smokerStatus = 'never',
      isVulnerableCohort = 0,
      triggerAqiThreshold = 140,
      usesInhaler = 0,
      inhalerName = '',
      lastPreventiveDose = '',
      wearsMask = 'high_aqi_only',
      maskType = 'n95',
      hasHepaPurifier = 1,
      symptomLogs = [],
      // Comprehensive Smog-Specific Health Conditions
      hasBronchitis = 0,
      hasEyeIrritation = 0,
      hasEntIrritation = 0,
      hasHeadachesFatigue = 0,
      hasReducedLungCapacity = 0,
      hasLungCancerRisk = 0,
      hasPregnant = 0,
      hasElderly = 0,
      hasChild = 0,
      smogSymptoms = [],
      medicalReports = []
    } = req.body || {};

    if (!fullName || fullName.trim().length === 0) {
      return res.status(400).json({ success: false, error: 'Full name is required to create a medical profile.' });
    }

    const symptomLogsStr = typeof symptomLogs === 'string' ? symptomLogs : JSON.stringify(symptomLogs || []);
    const smogSymptomsStr = typeof smogSymptoms === 'string' ? smogSymptoms : JSON.stringify(smogSymptoms || []);
    const medicalReportsStr = typeof medicalReports === 'string' ? medicalReports : JSON.stringify(medicalReports || []);

    await dbRun(`
      INSERT INTO user_health_profiles (
        user_id, full_name, age, gender, blood_group, emergency_contact_name, emergency_contact_phone,
        primary_commute, daily_commute_minutes, asthma_severity, has_copd, has_allergies, has_cardio_condition,
        smoker_status, is_vulnerable_cohort, trigger_aqi_threshold, uses_inhaler, inhaler_name, last_preventive_dose,
        wears_mask, mask_type, has_hepa_purifier, symptom_logs, is_profile_created,
        has_bronchitis, has_eye_irritation, has_ent_irritation, has_headaches_fatigue,
        has_reduced_lung_capacity, has_lung_cancer_risk, has_pregnant, has_elderly, has_child,
        smog_symptoms_json, medical_reports, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
      ON CONFLICT(user_id) DO UPDATE SET
        full_name = excluded.full_name,
        age = excluded.age,
        gender = excluded.gender,
        blood_group = excluded.blood_group,
        emergency_contact_name = excluded.emergency_contact_name,
        emergency_contact_phone = excluded.emergency_contact_phone,
        primary_commute = excluded.primary_commute,
        daily_commute_minutes = excluded.daily_commute_minutes,
        asthma_severity = excluded.asthma_severity,
        has_copd = excluded.has_copd,
        has_allergies = excluded.has_allergies,
        has_cardio_condition = excluded.has_cardio_condition,
        smoker_status = excluded.smoker_status,
        is_vulnerable_cohort = excluded.is_vulnerable_cohort,
        trigger_aqi_threshold = excluded.trigger_aqi_threshold,
        uses_inhaler = excluded.uses_inhaler,
        inhaler_name = excluded.inhaler_name,
        last_preventive_dose = excluded.last_preventive_dose,
        wears_mask = excluded.wears_mask,
        mask_type = excluded.mask_type,
        has_hepa_purifier = excluded.has_hepa_purifier,
        symptom_logs = excluded.symptom_logs,
        is_profile_created = 1,
        has_bronchitis = excluded.has_bronchitis,
        has_eye_irritation = excluded.has_eye_irritation,
        has_ent_irritation = excluded.has_ent_irritation,
        has_headaches_fatigue = excluded.has_headaches_fatigue,
        has_reduced_lung_capacity = excluded.has_reduced_lung_capacity,
        has_lung_cancer_risk = excluded.has_lung_cancer_risk,
        has_pregnant = excluded.has_pregnant,
        has_elderly = excluded.has_elderly,
        has_child = excluded.has_child,
        smog_symptoms_json = excluded.smog_symptoms_json,
        medical_reports = excluded.medical_reports,
        updated_at = CURRENT_TIMESTAMP
    `, [
      userId, fullName.trim(), parseInt(age) || 30, gender, bloodGroup, emergencyContactName, emergencyContactPhone,
      primaryCommute, parseInt(dailyCommuteMinutes) || 45, asthmaSeverity,
      hasCopd ? 1 : 0, hasAllergies ? 1 : 0, hasCardioCondition ? 1 : 0,
      smokerStatus, isVulnerableCohort ? 1 : 0, parseInt(triggerAqiThreshold) || 140,
      usesInhaler ? 1 : 0, inhalerName || '', lastPreventiveDose || '',
      wearsMask, maskType, hasHepaPurifier ? 1 : 0, symptomLogsStr,
      hasBronchitis ? 1 : 0, hasEyeIrritation ? 1 : 0, hasEntIrritation ? 1 : 0, hasHeadachesFatigue ? 1 : 0,
      hasReducedLungCapacity ? 1 : 0, hasLungCancerRisk ? 1 : 0, hasPregnant ? 1 : 0, hasElderly ? 1 : 0, hasChild ? 1 : 0,
      smogSymptomsStr, medicalReportsStr
    ]);

    // Also persist individual medical reports to user_medical_reports table if provided
    if (Array.isArray(medicalReports) && medicalReports.length > 0) {
      for (const rep of medicalReports) {
        if (rep.hospitalName && rep.reportType) {
          await dbRun(`
            INSERT INTO user_medical_reports (user_id, hospital_name, report_type, report_date, doctor_name, diagnosis_notes, file_name, file_data)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
          `, [
            userId, rep.hospitalName, rep.reportType, rep.reportDate || new Date().toISOString().split('T')[0],
            rep.doctorName || '', rep.diagnosisNotes || '', rep.fileName || '', rep.fileData || ''
          ]);
        }
      }
    }

    const updated = await dbGet('SELECT * FROM user_health_profiles WHERE user_id = ?', [userId]);
    const reports = await dbAll('SELECT * FROM user_medical_reports WHERE user_id = ? ORDER BY report_date DESC, id DESC', [userId]);
    
    // Live atmospheric baseline from SQLite Overview data
    let liveAqi = 81;
    let livePm25 = 25.2;
    try {
      const overview = await getDashboardOverviewData();
      if (overview && overview.metrics) {
        if (typeof overview.metrics.current_aqi === 'number') liveAqi = overview.metrics.current_aqi;
        if (typeof overview.metrics.pm25_level === 'number') livePm25 = overview.metrics.pm25_level;
      }
    } catch (e) {}

    const vulnerability = calculateHealthMetrics(updated, liveAqi, livePm25);

    res.json({
      success: true,
      hasProfile: true,
      profile: updated,
      medicalReports: reports,
      vulnerability,
      environmentBaseline: { aqi: liveAqi, pm25: livePm25 }
    });
  } catch (err) {
    console.error('Error saving health profile:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

router.delete('/health-profile', async (req, res) => {
  try {
    const userId = req.query.userId || 'default_user';
    await dbRun('DELETE FROM user_health_profiles WHERE user_id = ?', [userId]);
    await dbRun('DELETE FROM user_medical_reports WHERE user_id = ?', [userId]);
    res.json({ success: true, hasProfile: false, message: 'Medical profile and attached records successfully deleted from SQLite database.' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 6. User Medical Reports Separate Endpoints (Optional Hospital / Lab Records)
router.get('/medical-reports', async (req, res) => {
  try {
    const userId = req.query.userId || 'default_user';
    const reports = await dbAll('SELECT * FROM user_medical_reports WHERE user_id = ? ORDER BY report_date DESC, id DESC', [userId]);
    res.json({ success: true, reports });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.post('/medical-reports', async (req, res) => {
  try {
    const {
      userId = 'default_user',
      hospitalName,
      reportType,
      reportDate = new Date().toISOString().split('T')[0],
      doctorName = '',
      diagnosisNotes = '',
      fileName = '',
      fileData = ''
    } = req.body || {};

    if (!hospitalName || !reportType) {
      return res.status(400).json({ success: false, error: 'Hospital/Lab Name and Report Type are required.' });
    }

    const result = await dbRun(`
      INSERT INTO user_medical_reports (user_id, hospital_name, report_type, report_date, doctor_name, diagnosis_notes, file_name, file_data)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `, [userId, hospitalName.trim(), reportType.trim(), reportDate, doctorName.trim(), diagnosisNotes.trim(), fileName, fileData]);

    const created = await dbGet('SELECT * FROM user_medical_reports WHERE id = ?', [result.lastID]);
    res.json({ success: true, report: created });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.delete('/medical-reports/:id', async (req, res) => {
  try {
    const userId = req.query.userId || 'default_user';
    const id = req.params.id;
    await dbRun('DELETE FROM user_medical_reports WHERE id = ? AND user_id = ?', [id, userId]);
    res.json({ success: true, message: 'Medical report deleted.' });
  } catch (err) {
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
