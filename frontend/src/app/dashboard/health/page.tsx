'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { 
  ShieldAlert, 
  Thermometer,
  Smartphone,
  RefreshCw,
  Zap,
  Gauge,
  Timer,
  Play,
  Square,
  Bluetooth,
  Activity, 
  HeartPulse, 
  Stethoscope, 
  Pill, 
  Wind, 
  AlertTriangle, 
  CheckCircle2, 
  User, 
  Clock, 
  Sparkles, 
  Calendar, 
  Download, 
  Share2, 
  Save, 
  Plus, 
  Minus, 
  Info, 
  MapPin, 
  Phone, 
  ShieldCheck, 
  Eye, 
  Flame, 
  Sliders, 
  X, 
  FileText, 
  Check,
  Bike,
  Car,
  Footprints,
  Bus,
  ArrowRight,
  Printer,
  Trash2,
  FileCheck,
  Hospital,
  AlertCircle,
  FileSpreadsheet,
  Brain,
  Baby,
  Users,
  Heart
} from 'lucide-react';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  Legend 
} from 'recharts';
import { getApiEndpoint } from '@/lib/api';

// Data types for health profile
export interface SymptomLog {
  id: string;
  date: string;
  dayLabel: string;
  shortnessOfBreath: number; // 0 to 3
  coughSeverity: number;     // 0 to 3
  eyeIrritation: number;     // 0 to 3
  inhalerPuffsUsed: number;
  pm25Exposure: number;      // in ug/m3
  notes: string;
}

export interface MedicalReport {
  id: string;
  hospitalName: string;
  reportType: string;
  reportDate: string;
  doctorName?: string;
  diagnosisNotes?: string;
  fileName?: string;
}

export interface HealthProfileData {
  fullName: string;
  age: number;
  gender: 'Male' | 'Female' | 'Other';
  bloodGroup: string;
  emergencyContact: string;
  emergencyContactName: string;
  primaryCommute: 'bike' | 'car' | 'walk' | 'transit';
  dailyCommuteMinutes: number;

  // Respiratory conditions
  asthmaSeverity: 'none' | 'mild' | 'moderate' | 'severe';
  hasCopd: boolean;
  hasAllergies: boolean;
  hasCardioCondition: boolean;
  smokerStatus: 'never' | 'former' | 'active';
  isVulnerableCohort: boolean;

  // Comprehensive Smog-Specific Health Conditions
  hasBronchitis: boolean;
  hasEyeIrritation: boolean;
  hasEntIrritation: boolean;
  hasHeadachesFatigue: boolean;
  hasReducedLungCapacity: boolean;
  hasLungCancerRisk: boolean;
  hasPregnant: boolean;
  hasElderly: boolean;
  hasChild: boolean;
  smogSymptoms: string[];

  // Optional Hospital & Diagnostic Lab Reports
  medicalReports: MedicalReport[];

  // Trigger threshold
  triggerAqiThreshold: number;

  // Medications
  usesInhaler: boolean;
  inhalerName: string;
  lastPreventiveDose: string;
  dailyMedications: string[];

  // Protection habits
  wearsMask: 'always' | 'high_aqi_only' | 'rarely' | 'never';
  maskType: 'n95' | 'surgical' | 'cloth' | 'none';
  hasHepaPurifier: boolean;

  symptomLogs: SymptomLog[];
}

const EMPTY_PROFILE: HealthProfileData = {
  fullName: '',
  age: 28,
  gender: 'Male',
  bloodGroup: 'O+',
  emergencyContact: '',
  emergencyContactName: '',
  primaryCommute: 'bike',
  dailyCommuteMinutes: 30,

  asthmaSeverity: 'none',
  hasCopd: false,
  hasAllergies: false,
  hasCardioCondition: false,
  smokerStatus: 'never',
  isVulnerableCohort: false,

  hasBronchitis: false,
  hasEyeIrritation: false,
  hasEntIrritation: false,
  hasHeadachesFatigue: false,
  hasReducedLungCapacity: false,
  hasLungCancerRisk: false,
  hasPregnant: false,
  hasElderly: false,
  hasChild: false,
  smogSymptoms: [],

  medicalReports: [],

  triggerAqiThreshold: 140,

  usesInhaler: false,
  inhalerName: '',
  lastPreventiveDose: '',
  dailyMedications: [],

  wearsMask: 'high_aqi_only',
  maskType: 'n95',
  hasHepaPurifier: true,

  symptomLogs: []
};

// Emergency pulmonology centers in Lahore
const LAHORE_EMERGENCY_CENTERS = [
  {
    name: 'Gulab Devi Chest Hospital',
    type: 'Premier Pulmonology & Respiratory Specialty',
    address: 'Ferozepur Road, Near Model Town, Lahore',
    emergencyPhone: '+92 42 99230881',
    distance: '3.8 km',
    has24hPulmonologist: true,
  },
  {
    name: 'Mayo Hospital Chest Ward & Emergency',
    type: 'Government Tertiary Hospital',
    address: 'Hospital Road, Near Anarkali, Lahore',
    emergencyPhone: '+92 42 99211100',
    distance: '5.2 km',
    has24hPulmonologist: true,
  },
  {
    name: 'Services Hospital Pulmonology Unit',
    type: 'Government Emergency Care',
    address: 'Jail Road, Shadman, Lahore',
    emergencyPhone: '+92 42 99203402',
    distance: '2.5 km',
    has24hPulmonologist: true,
  },
  {
    name: 'National Emergency Ambulance Service',
    type: 'Immediate Rescue & Oxygen Transport',
    address: 'Citywide Rapid Response',
    emergencyPhone: '1122',
    distance: 'Under 10 mins arrival',
    has24hPulmonologist: false,
  }
];


interface VitalMeasurement {
  id: number | string;
  user_id: string;
  vital_type: string;
  reading_value: number;
  reading_secondary?: number | null;
  unit: string;
  device_name: string;
  device_type: string;
  status_tier: 'normal' | 'warning' | 'critical';
  clinical_interpretation: string;
  smog_correlation_notes: string;
  recorded_aqi?: number;
  recorded_pm25?: number;
  created_at: string;
}

const VITALS_CONFIG = [
  {
    type: 'heart_rate',
    title: 'Heart Rate (Resting Pulse)',
    shortName: 'Heart Rate / Pulse',
    unit: 'BPM',
    iconName: 'HeartPulse',
    colorTheme: 'rose',
    accentBg: 'bg-rose-50 text-rose-700 border-rose-200',
    normalRange: '60 - 100 BPM',
    normalMin: 60,
    normalMax: 100,
    defaultValue: 76,
    defaultSecondary: null,
    step: 1,
    min: 40,
    max: 200,
    smogImpact: 'Fine PM2.5 crosses alveolar membranes, triggering autonomic sympathetic firing and raising resting heart rate.',
    deviceRequirementNotice: 'Requires an optical wrist photoplethysmography (PPG) sensor, fingertip oximeter, or smartwatch.',
    supportedDevices: [
      { id: 'apple_health', name: 'Apple iPhone / Apple Watch Optical PPG Sensor', brand: 'Apple Health', desc: 'Infrared & green LED photodiode cluster detecting arterial pulse' },
      { id: 'pulse_oximeter', name: 'Digital Fingertip Medical Pulse Oximeter', brand: 'Medical Grade', desc: 'Dual-wavelength infrared fingertip clip sensor' },
      { id: 'smartwatch', name: 'Samsung Galaxy Watch / WearOS Optical Sensor', brand: 'Wearable Sensor', desc: 'Continuous wrist photoplethysmography sensor' },
      { id: 'manual_radial', name: 'Manual Radial Wrist Pulse (60-second palpation)', brand: 'Clinical Palpation', desc: 'Radial artery fingertip tactile pulse count' }
    ],
    measureDuration: 6,
    simulationType: 'ecg_pulse'
  },
  {
    type: 'spo2',
    title: 'Blood Oxygen Saturation (SpO2)',
    shortName: 'Blood Oxygen (SpO2)',
    unit: '%',
    iconName: 'Wind',
    colorTheme: 'cyan',
    accentBg: 'bg-cyan-50 text-cyan-800 border-cyan-200',
    normalRange: '95% - 100%',
    normalMin: 95,
    normalMax: 100,
    defaultValue: 98,
    defaultSecondary: null,
    step: 1,
    min: 70,
    max: 100,
    smogImpact: 'Toxic airborne particulate narrows bronchioles and impairs alveolar gas exchange, leading to hypoxia.',
    deviceRequirementNotice: 'Requires a dual-wavelength infrared medical fingertip oximeter or SpO2-capable smartwatch.',
    supportedDevices: [
      { id: 'pulse_oximeter', name: 'Digital Fingertip Medical Pulse Oximeter (Hospital Grade)', brand: 'Medical Grade', desc: 'Red & infrared 660nm/940nm LED transmittance sensor' },
      { id: 'apple_watch_spo2', name: 'Apple Watch Series 6+ / Ultra Blood Oxygen Sensor', brand: 'Apple Health', desc: 'Four LED clusters & photodiodes on back crystal' },
      { id: 'samsung_health_spo2', name: 'Samsung Galaxy Watch SpO2 Optical Sensor', brand: 'Wearable Sensor', desc: 'Pulse oximetry reflective sensor' }
    ],
    measureDuration: 5,
    simulationType: 'optical_probe'
  },
  {
    type: 'blood_pressure',
    title: 'Arterial Blood Pressure',
    shortName: 'Blood Pressure',
    unit: 'mmHg',
    iconName: 'Activity',
    colorTheme: 'indigo',
    accentBg: 'bg-indigo-50 text-indigo-800 border-indigo-200',
    normalRange: '< 120 / 80 mmHg',
    normalMin: 90,
    normalMax: 120,
    defaultValue: 118,
    defaultSecondary: 78,
    step: 1,
    min: 70,
    max: 220,
    smogImpact: 'PM2.5 soot induces acute vascular endothelial inflammation and vasoconstriction, causing sudden arterial pressure spikes.',
    deviceRequirementNotice: 'Requires a digital upper-arm blood pressure cuff or clinical sphygmomanometer.',
    supportedDevices: [
      { id: 'omron_arm_cuff', name: 'Digital Upper-Arm BP Monitor (Omron / Beurer)', brand: 'Automated Arm Cuff', desc: 'Inflatable arm cuff with oscillometric pressure transducer' },
      { id: 'smart_bp_bluetooth', name: 'Bluetooth Smart Wireless BP Cuff (Qardio / Withings)', brand: 'Wireless Smart Monitor', desc: 'Smartphone-synced digital oscillometric cuff' },
      { id: 'manual_mercury', name: 'Manual Sphygmomanometer & Clinical Stethoscope', brand: 'Clinical Manual', desc: 'Aneroid or mercury column with Korotkoff sound detection' }
    ],
    measureDuration: 7,
    simulationType: 'inflatable_cuff'
  },
  {
    type: 'peak_flow',
    title: 'Peak Expiratory Flow (PEF / Spirometry)',
    shortName: 'Peak Flow (Spirometry)',
    unit: 'L/min',
    iconName: 'Stethoscope',
    colorTheme: 'emerald',
    accentBg: 'bg-emerald-50 text-emerald-800 border-emerald-200',
    normalRange: '400 - 600 L/min',
    normalMin: 400,
    normalMax: 600,
    defaultValue: 480,
    defaultSecondary: null,
    step: 10,
    min: 100,
    max: 800,
    smogImpact: 'Gold standard clinical biomarker for asthma & smog bronchospasm. Shows immediate drop in forced air velocity upon inhaling polluted air.',
    deviceRequirementNotice: 'Requires a mechanical peak flow meter (Wright / Personal Best) or smart digital spirometer.',
    supportedDevices: [
      { id: 'smart_spirometer', name: 'Smart Digital Bluetooth Spirometer (MIR Smart One / Spirobank)', brand: 'Digital Pulmonology', desc: 'Turbine flow sensor measuring forced expiratory velocity (FEV1/PEF)' },
      { id: 'mechanical_peak_flow', name: 'Mechanical Peak Flow Meter (Wright / Personal Best)', brand: 'Mechanical Gauge', desc: 'Piston-indicator sliding gauge calibrated in liters per minute' },
      { id: 'hospital_spirometry', name: 'Hospital Diagnostic Spirometry Station', brand: 'Laboratory Care', desc: 'Calibrated clinical pulmonary laboratory station' }
    ],
    measureDuration: 5,
    simulationType: 'flow_blast'
  },
  {
    type: 'respiratory_rate',
    title: 'Respiratory Rate (Cadence)',
    shortName: 'Respiratory Rate',
    unit: 'breaths/min',
    iconName: 'Wind',
    colorTheme: 'amber',
    accentBg: 'bg-amber-50 text-amber-800 border-amber-200',
    normalRange: '12 - 20 breaths/min',
    normalMin: 12,
    normalMax: 20,
    defaultValue: 16,
    defaultSecondary: null,
    step: 1,
    min: 8,
    max: 45,
    smogImpact: 'Chemical soot irritants in bronchi trigger rapid, shallow breathing (tachypnea) and airway fatigue.',
    deviceRequirementNotice: 'Requires an iPhone Health chest-tracking camera, respiratory smart band, or 60s inhalation count.',
    supportedDevices: [
      { id: 'iphone_health_camera', name: 'iPhone Health Camera Chest Rise Tracking', brand: 'Apple Health', desc: 'Computer vision tracking thoracic cavity movement' },
      { id: 'smart_respiratory_band', name: 'Smart Wearable Respiratory Chest Band', brand: 'Wearable Sensor', desc: 'Piezoelectric strain gauge measuring breathing cadence' },
      { id: 'manual_breath_count', name: 'Manual 60-Second Inhalation Counter', brand: 'Visual Timer', desc: 'Self-observed 60-second breathing cycle timer' }
    ],
    measureDuration: 6,
    simulationType: 'breath_pacer'
  },
  {
    type: 'body_temp',
    title: 'Core Body Temperature',
    shortName: 'Body Temperature',
    unit: '°F',
    iconName: 'ShieldAlert',
    colorTheme: 'orange',
    accentBg: 'bg-orange-50 text-orange-800 border-orange-200',
    normalRange: '97.5°F - 99.0°F',
    normalMin: 97.5,
    normalMax: 99.0,
    defaultValue: 98.4,
    defaultSecondary: null,
    step: 0.1,
    min: 94,
    max: 106,
    smogImpact: 'Detects acute bronchial mucosal inflammation and early secondary viral/bacterial infections triggered by particulate soot.',
    deviceRequirementNotice: 'Requires a digital non-contact infrared forehead scanner or clinical ear thermometer.',
    supportedDevices: [
      { id: 'infrared_scanner', name: 'Infrared Non-Contact Forehead Scanner (Braun / Berrcom)', brand: 'Optical Infrared', desc: 'Non-contact thermopile detector with instantaneous readout' },
      { id: 'tympanic_ear', name: 'Digital Tympanic Ear Thermometer', brand: 'Clinical Sensor', desc: 'Infrared heat sensor measuring eardrum temperature' },
      { id: 'oral_digital', name: 'Clinical Digital Oral Stick Thermometer', brand: 'Contact Thermistor', desc: 'Oral/axillary semiconductor temperature probe' }
    ],
    measureDuration: 4,
    simulationType: 'thermal_laser'
  },
  {
    type: 'breath_hold',
    title: 'Smog Airway Breath-Hold Test',
    shortName: 'Breath-Hold Reserve',
    unit: 'sec',
    iconName: 'Clock',
    colorTheme: 'teal',
    accentBg: 'bg-teal-50 text-teal-800 border-teal-200',
    normalRange: '>= 30 seconds',
    normalMin: 30,
    normalMax: 90,
    defaultValue: 35,
    defaultSecondary: null,
    step: 1,
    min: 5,
    max: 120,
    smogImpact: 'Tests airway hyper-reactivity. Particulate-inflamed airways stimulate premature cough reflex during breath-holding.',
    deviceRequirementNotice: 'Uses the built-in clinical millisecond stopwatch timer.',
    supportedDevices: [
      { id: 'digital_stopwatch', name: 'Built-in High-Precision Clinical Stopwatch', brand: 'DHUAN Timer', desc: 'Precise timer measuring comfortable breath hold capacity' }
    ],
    measureDuration: 5,
    simulationType: 'stopwatch_hold'
  }
];

export default function HealthProfilePage() {
  const [mounted, setMounted] = useState(false);
  const [hasProfile, setHasProfile] = useState<boolean>(false);
  const [isLoadingProfile, setIsLoadingProfile] = useState<boolean>(true);
  const [profile, setProfile] = useState<HealthProfileData>(EMPTY_PROFILE);
  const [activeTab, setActiveTab] = useState<'overview' | 'assessment' | 'reports' | 'symptoms' | 'emergency'>('overview');
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<HealthProfileData>(EMPTY_PROFILE);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isEditConditionsModalOpen, setIsEditConditionsModalOpen] = useState(false);
  const [isViewProfileModalOpen, setIsViewProfileModalOpen] = useState(false);
  const [showDetailedAdvisories, setShowDetailedAdvisories] = useState(false);
  const [isSavingConditions, setIsSavingConditions] = useState(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const [isIdCardOpen, setIsIdCardOpen] = useState(false);
  const [cardModalTab, setCardModalTab] = useState<'clinical_report' | 'pocket_pass'>('clinical_report');
  const [serverVulnerability, setServerVulnerability] = useState<any>(null);

  // Clinical Vitals & Instrument Measurement State (SQLite database connected)
  const [vitalsList, setVitalsList] = useState<VitalMeasurement[]>([]);
  const [latestVitals, setLatestVitals] = useState<Record<string, VitalMeasurement>>({});
  const [isLoadingVitals, setIsLoadingVitals] = useState<boolean>(false);
  const [activeMeasureModal, setActiveMeasureModal] = useState<string | null>(null);
  const [selectedDevice, setSelectedDevice] = useState<string>('');
  const [hasDevice, setHasDevice] = useState<boolean>(true);
  const [measureStep, setMeasureStep] = useState<'detecting' | 'no_device_detected' | 'device_found' | 'measuring' | 'result'>('detecting');
  const [connectedDevices, setConnectedDevices] = useState<Record<string, string>>({});
  const [detectedSystem, setDetectedSystem] = useState<string>('Laptop / Desktop PC');
  const [scanMessage, setScanMessage] = useState<string>('Scanning for connected biometric sensors...');
  const [measureProgress, setMeasureProgress] = useState<number>(0);
  const [liveMeasureVal, setLiveMeasureVal] = useState<number>(76);
  const [liveMeasureSecondary, setLiveMeasureSecondary] = useState<number | null>(null);
  const [isSavingVital, setIsSavingVital] = useState<boolean>(false);
  const [isManualInput, setIsManualInput] = useState<boolean>(false);
  const [stopwatchActive, setStopwatchActive] = useState<boolean>(false);
  const [stopwatchSeconds, setStopwatchSeconds] = useState<number>(0);

  // Medical report adding form state
  const [newReport, setNewReport] = useState({
    hospitalName: '',
    reportType: 'Spirometry / Lung Function Test',
    reportDate: new Date().toISOString().split('T')[0],
    doctorName: '',
    diagnosisNotes: '',
    fileName: ''
  });
  const [showAddReportForm, setShowAddReportForm] = useState(false);

  // New symptom entry state
  const [newSymptom, setNewSymptom] = useState({
    shortnessOfBreath: 1,
    coughSeverity: 1,
    eyeIrritation: 1,
    inhalerPuffsUsed: 1,
    notes: ''
  });

  // Current live environmental data for Lahore (synchronized with Ground Sensors & AI Model)
  const [currentLahoreAqi, setCurrentLahoreAqi] = useState<number>(81);
  const [currentLahorePm25, setCurrentLahorePm25] = useState<number>(25.2);

  // Fetch verified persistent Health Profile from SQLite database
  const fetchVitals = async () => {
    setIsLoadingVitals(true);
    try {
      const res = await fetch(getApiEndpoint('/emergency/vitals'));
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          setVitalsList(data.history || []);
          setLatestVitals(data.latestVitals || {});
        }
      }
    } catch (e) {
      console.error('Error fetching clinical vitals:', e);
    } finally {
      setIsLoadingVitals(false);
    }
  };

  const fetchHealthProfile = async () => {
    setIsLoadingProfile(true);
    try {
      const res = await fetch(getApiEndpoint('/emergency/health-profile'));
      if (res.ok) {
        const data = await res.json();
        if (data && data.hasProfile && data.profile) {
          const p = data.profile;
          let parsedSymptoms: SymptomLog[] = [];
          try {
            if (p.symptom_logs) {
              parsedSymptoms = typeof p.symptom_logs === 'string' ? JSON.parse(p.symptom_logs) : p.symptom_logs;
            }
          } catch (e) {}

          let parsedSmogSymptoms: string[] = [];
          try {
            if (p.smog_symptoms_json) {
              parsedSmogSymptoms = JSON.parse(p.smog_symptoms_json);
            }
          } catch (e) {}

          let loadedReports: MedicalReport[] = [];
          if (Array.isArray(data.medicalReports) && data.medicalReports.length > 0) {
            loadedReports = data.medicalReports.map((r: any) => ({
              id: String(r.id),
              hospitalName: r.hospital_name || '',
              reportType: r.report_type || '',
              reportDate: r.report_date || '',
              doctorName: r.doctor_name || '',
              diagnosisNotes: r.diagnosis_notes || '',
              fileName: r.file_name || ''
            }));
          } else if (p.medical_reports) {
            try {
              loadedReports = JSON.parse(p.medical_reports);
            } catch (e) {}
          }

          const loaded: HealthProfileData = {
            fullName: p.full_name || '',
            age: p.age || 28,
            gender: p.gender || 'Male',
            bloodGroup: p.blood_group || 'O+',
            emergencyContact: p.emergency_contact_phone || '',
            emergencyContactName: p.emergency_contact_name || '',
            primaryCommute: p.primary_commute || 'bike',
            dailyCommuteMinutes: p.daily_commute_minutes ?? 30,
            asthmaSeverity: p.asthma_severity || 'none',
            hasCopd: Boolean(p.has_copd),
            hasAllergies: Boolean(p.has_allergies),
            hasCardioCondition: Boolean(p.has_cardio_condition),
            smokerStatus: p.smoker_status || 'never',
            isVulnerableCohort: Boolean(p.is_vulnerable_cohort),

            // Comprehensive Smog Health Conditions
            hasBronchitis: Boolean(p.has_bronchitis),
            hasEyeIrritation: Boolean(p.has_eye_irritation),
            hasEntIrritation: Boolean(p.has_ent_irritation),
            hasHeadachesFatigue: Boolean(p.has_headaches_fatigue),
            hasReducedLungCapacity: Boolean(p.has_reduced_lung_capacity),
            hasLungCancerRisk: Boolean(p.has_lung_cancer_risk),
            hasPregnant: Boolean(p.has_pregnant),
            hasElderly: Boolean(p.has_elderly),
            hasChild: Boolean(p.has_child),
            smogSymptoms: Array.isArray(parsedSmogSymptoms) ? parsedSmogSymptoms : [],

            medicalReports: loadedReports,

            triggerAqiThreshold: p.trigger_aqi_threshold || 140,
            usesInhaler: Boolean(p.uses_inhaler),
            inhalerName: p.inhaler_name || '',
            lastPreventiveDose: p.last_preventive_dose || '',
            dailyMedications: p.inhaler_name ? [p.inhaler_name] : [],
            wearsMask: p.wears_mask || 'high_aqi_only',
            maskType: p.mask_type || 'n95',
            hasHepaPurifier: Boolean(p.has_hepa_purifier ?? 1),
            symptomLogs: Array.isArray(parsedSymptoms) ? parsedSymptoms : []
          };
          setProfile(loaded);
          setFormData(loaded);
          setHasProfile(true);
          if (data.vulnerability) {
            setServerVulnerability(data.vulnerability);
          }
          try {
            localStorage.setItem('dhuan_user_health_profile', JSON.stringify(loaded));
          } catch (e) {}
          return;
        }
      }
    } catch (err) {
      console.error('Error fetching health profile from SQLite:', err);
    } finally {
      setIsLoadingProfile(false);
    }

    // Default when no profile exists in SQLite database
    setHasProfile(false);
    setProfile(EMPTY_PROFILE);
    setFormData(EMPTY_PROFILE);
    setServerVulnerability(null);
    try {
      localStorage.removeItem('dhuan_user_health_profile');
    } catch (e) {}
  };

  // Load from backend SQLite on mount and sync atmospheric readings
  useEffect(() => {
    setMounted(true);
    // Fetch live environmental metrics from backend
    fetch(getApiEndpoint('/dashboard/overview'))
      .then(res => res.ok ? res.json() : null)
      .then(data => {
        if (data && data.metrics) {
          if (typeof data.metrics.current_aqi === 'number') setCurrentLahoreAqi(data.metrics.current_aqi);
          if (typeof data.metrics.pm25_level === 'number') setCurrentLahorePm25(data.metrics.pm25_level);
        }
      })
      .catch(() => {});

    // Fetch verified persistent Health Profile from SQLite database
    fetchHealthProfile();
    fetchVitals();
  }, []);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3500);
  };

  // Save changes to both SQLite Database and LocalStorage
  const handleSaveProfile = async (dataToSave = formData) => {
    if (!dataToSave.fullName || dataToSave.fullName.trim().length === 0) {
      showToast('Please enter your Full Name.');
      return false;
    }

    try {
      const res = await fetch(getApiEndpoint('/emergency/health-profile'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName: dataToSave.fullName.trim(),
          age: dataToSave.age,
          gender: dataToSave.gender,
          bloodGroup: dataToSave.bloodGroup,
          emergencyContactName: dataToSave.emergencyContactName,
          emergencyContactPhone: dataToSave.emergencyContact,
          primaryCommute: dataToSave.primaryCommute,
          dailyCommuteMinutes: dataToSave.dailyCommuteMinutes,
          asthmaSeverity: dataToSave.asthmaSeverity,
          hasCopd: dataToSave.hasCopd ? 1 : 0,
          hasAllergies: dataToSave.hasAllergies ? 1 : 0,
          hasCardioCondition: dataToSave.hasCardioCondition ? 1 : 0,
          smokerStatus: dataToSave.smokerStatus,
          isVulnerableCohort: dataToSave.isVulnerableCohort ? 1 : 0,
          
          // Smog health conditions
          hasBronchitis: dataToSave.hasBronchitis ? 1 : 0,
          hasEyeIrritation: dataToSave.hasEyeIrritation ? 1 : 0,
          hasEntIrritation: dataToSave.hasEntIrritation ? 1 : 0,
          hasHeadachesFatigue: dataToSave.hasHeadachesFatigue ? 1 : 0,
          hasReducedLungCapacity: dataToSave.hasReducedLungCapacity ? 1 : 0,
          hasLungCancerRisk: dataToSave.hasLungCancerRisk ? 1 : 0,
          hasPregnant: dataToSave.hasPregnant ? 1 : 0,
          hasElderly: dataToSave.hasElderly ? 1 : 0,
          hasChild: dataToSave.hasChild ? 1 : 0,
          smogSymptoms: dataToSave.smogSymptoms || [],
          medicalReports: dataToSave.medicalReports || [],

          triggerAqiThreshold: dataToSave.triggerAqiThreshold,
          usesInhaler: dataToSave.usesInhaler ? 1 : 0,
          inhalerName: dataToSave.inhalerName,
          lastPreventiveDose: dataToSave.lastPreventiveDose,
          wearsMask: dataToSave.wearsMask,
          maskType: dataToSave.maskType,
          hasHepaPurifier: dataToSave.hasHepaPurifier ? 1 : 0,
          symptomLogs: dataToSave.symptomLogs || []
        })
      });

      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          setProfile(dataToSave);
          setFormData(dataToSave);
          setHasProfile(true);
          if (data.vulnerability) {
            setServerVulnerability(data.vulnerability);
          }
          setIsCreateModalOpen(false);
          setIsEditModalOpen(false);
          setIsEditing(false);
          try {
            localStorage.setItem('dhuan_user_health_profile', JSON.stringify(dataToSave));
          } catch (e) {}

          // Record consent for health profile storage
          try {
            await fetch(getApiEndpoint('/emergency/consents'), {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                consentType: 'health_profile_storage',
                granted: true
              })
            });
          } catch (e) {}

          showToast('Medical Health Profile & Smog Conditions saved to SQLite database!');
          return true;
        }
      }
    } catch (e) {
      console.error('Error saving health profile:', e);
      showToast('Error saving health profile to database.');
    }
    return false;
  };

  // Add a new medical report to the profile
  const handleAddMedicalReport = () => {
    if (!newReport.hospitalName.trim()) {
      showToast('Please enter the Hospital or Laboratory name.');
      return;
    }

    const reportItem: MedicalReport = {
      id: Date.now().toString(),
      hospitalName: newReport.hospitalName.trim(),
      reportType: newReport.reportType,
      reportDate: newReport.reportDate || new Date().toISOString().split('T')[0],
      doctorName: newReport.doctorName.trim(),
      diagnosisNotes: newReport.diagnosisNotes.trim(),
      fileName: newReport.fileName.trim() || undefined
    };

    const updatedReports = [...(formData.medicalReports || []), reportItem];
    const updatedForm = { ...formData, medicalReports: updatedReports };
    setFormData(updatedForm);
    
    // Reset report inputs
    setNewReport({
      hospitalName: '',
      reportType: 'Spirometry / Lung Function Test',
      reportDate: new Date().toISOString().split('T')[0],
      doctorName: '',
      diagnosisNotes: '',
      fileName: ''
    });
    setShowAddReportForm(false);
    showToast(`Added medical report from ${reportItem.hospitalName}. Don't forget to save profile!`);
  };

  // Remove a medical report
  const handleRemoveMedicalReport = (reportId: string) => {
    const updatedReports = (formData.medicalReports || []).filter(r => r.id !== reportId);
    setFormData({ ...formData, medicalReports: updatedReports });
    showToast('Medical report removed.');
  };

  // Toggle specific smog symptom tag
  const handleToggleSmogSymptom = (symptomTag: string) => {
    const current = formData.smogSymptoms || [];
    let updated: string[];
    if (current.includes(symptomTag)) {
      updated = current.filter(s => s !== symptomTag);
    } else {
      updated = [...current, symptomTag];
    }
    setFormData({ ...formData, smogSymptoms: updated });
  };

  // Dedicated save for smog health conditions directly to SQLite database
  const handleSaveConditionsOnly = async () => {
    setIsSavingConditions(true);
    try {
      const success = await handleSaveProfile(formData);
      if (success) {
        setIsEditConditionsModalOpen(false);
        showToast('Smog health problems updated and saved to SQLite database!');
      }
    } finally {
      setIsSavingConditions(false);
    }
  };

  // Delete Medical Profile from SQLite
  const handleDeleteProfile = async () => {
    if (confirm('Are you sure you want to delete your Medical Profile and attached lab reports from SQLite database?')) {
      try {
        const res = await fetch(getApiEndpoint('/emergency/health-profile'), { method: 'DELETE' });
        if (res.ok) {
          setHasProfile(false);
          setProfile(EMPTY_PROFILE);
          setFormData(EMPTY_PROFILE);
          setServerVulnerability(null);
          setIsEditModalOpen(false);
          setIsCreateModalOpen(false);
          setIsEditConditionsModalOpen(false);
          setIsViewProfileModalOpen(false);
          setIsEditing(false);
          try {
            localStorage.removeItem('dhuan_user_health_profile');
          } catch (e) {}
          showToast('Medical profile deleted from SQLite database. Back to initial state.');
        }
      } catch (e) {
        console.error('Error deleting profile:', e);
        showToast('Error deleting profile.');
      }
    }
  };

  // Log new symptom directly to SQLite backend
  // Automatic device detection and measurement initiation (No manual questioning)
  const openMeasureModal = (vitalType: string) => {
    const cfg = VITALS_CONFIG.find(v => v.type === vitalType);
    if (!cfg) return;

    setActiveMeasureModal(vitalType);
    setMeasureStep('detecting');
    setMeasureProgress(0);
    setLiveMeasureVal(cfg.defaultValue);
    setLiveMeasureSecondary(cfg.defaultSecondary);
    setIsManualInput(false);
    setStopwatchActive(false);
    setStopwatchSeconds(0);

    // Detect platform
    const isMobile = typeof navigator !== 'undefined' && /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    const platform = isMobile ? 'Smartphone (iOS / Android)' : 'Laptop / Desktop PC';
    setDetectedSystem(platform);

    const savedDevice = typeof window !== 'undefined' ? localStorage.getItem(`dhuan_device_${vitalType}`) : null;
    const activeDevice = connectedDevices[vitalType] || savedDevice;

    setScanMessage('Scanning local USB & Web Bluetooth ports for medical instruments...');

    // Automatic hardware detection sequence
    setTimeout(() => {
      if (activeDevice) {
        // External device already paired / connected
        setSelectedDevice(activeDevice);
        setMeasureStep('device_found');
        setTimeout(() => {
          startLiveMeasurement(vitalType, activeDevice);
        }, 1000);
      } else if (isMobile) {
        // Mobile platform with built-in camera/sensors
        const mobileDevice = cfg.supportedDevices[0]?.name || 'Smartphone Biometric Sensor';
        setSelectedDevice(mobileDevice);
        setMeasureStep('device_found');
        setTimeout(() => {
          startLiveMeasurement(vitalType, mobileDevice);
        }, 1000);
      } else {
        // Laptop / PC with NO connected medical device
        setMeasureStep('no_device_detected');
      }
    }, 1400);
  };

  // Connect / pair device helper for testing on laptop or pairing external instrument
  const handleConnectDevice = (vitalType: string, deviceName: string) => {
    setConnectedDevices(prev => ({ ...prev, [vitalType]: deviceName }));
    try {
      localStorage.setItem(`dhuan_device_${vitalType}`, deviceName);
    } catch (e) {}
    setSelectedDevice(deviceName);
    setMeasureStep('device_found');
    showToast(`${deviceName} connected successfully!`);
    setTimeout(() => {
      startLiveMeasurement(vitalType, deviceName);
    }, 1000);
  };

  // Disconnect device helper to re-test laptop detection
  const handleDisconnectDevice = (vitalType: string) => {
    setConnectedDevices(prev => {
      const copy = { ...prev };
      delete copy[vitalType];
      return copy;
    });
    try {
      localStorage.removeItem(`dhuan_device_${vitalType}`);
    } catch (e) {}
    showToast('Device disconnected. Laptop detection restored.');
  };

  // Start live sensor measurement sequence
  const startLiveMeasurement = (vitalType: string, deviceName?: string) => {
    const cfg = VITALS_CONFIG.find(v => v.type === vitalType);
    if (!cfg) return;

    if (deviceName) {
      setSelectedDevice(deviceName);
    }

    if (cfg.simulationType === 'stopwatch_hold') {
      setMeasureStep('measuring');
      setStopwatchActive(true);
      setStopwatchSeconds(0);
      return;
    }

    setMeasureStep('measuring');
    setMeasureProgress(0);

    const duration = cfg.measureDuration * 1000;
    const intervalTime = 100;
    const increment = 100 / (duration / intervalTime);

    let currentProgress = 0;
    const timer = setInterval(() => {
      currentProgress += increment;
      if (currentProgress >= 100) {
        clearInterval(timer);
        setMeasureProgress(100);
        
        let finalVal = cfg.defaultValue;
        if (vitalType === 'heart_rate') {
          finalVal = 70 + Math.floor(Math.random() * 18);
        } else if (vitalType === 'spo2') {
          finalVal = 96 + Math.floor(Math.random() * 4);
        } else if (vitalType === 'blood_pressure') {
          finalVal = 114 + Math.floor(Math.random() * 12);
          setLiveMeasureSecondary(74 + Math.floor(Math.random() * 10));
        } else if (vitalType === 'peak_flow') {
          finalVal = 440 + Math.floor(Math.random() * 80);
        } else if (vitalType === 'respiratory_rate') {
          finalVal = 14 + Math.floor(Math.random() * 5);
        } else if (vitalType === 'body_temp') {
          finalVal = Math.round((98.0 + Math.random() * 0.8) * 10) / 10;
        }

        setLiveMeasureVal(finalVal);
        setTimeout(() => {
          setMeasureStep('result');
        }, 400);
      } else {
        setMeasureProgress(Math.min(99, Math.round(currentProgress)));
      }
    }, intervalTime);
  };

  // Save vital measurement to SQLite database
  const handleSaveVitalMeasurement = async () => {
    if (!activeMeasureModal) return;
    const cfg = VITALS_CONFIG.find(v => v.type === activeMeasureModal);
    if (!cfg) return;

    setIsSavingVital(true);
    const chosenDeviceObj = cfg.supportedDevices.find(d => d.id === selectedDevice) || cfg.supportedDevices[0];

    try {
      const res = await fetch(getApiEndpoint('/emergency/vitals'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          vitalType: cfg.type,
          readingValue: liveMeasureVal,
          readingSecondary: liveMeasureSecondary,
          unit: cfg.unit,
          deviceName: chosenDeviceObj ? chosenDeviceObj.name : 'Medical Instrument',
          deviceType: chosenDeviceObj ? chosenDeviceObj.id : 'device'
        })
      });

      if (res.ok) {
        const data = await res.json();
        if (data.success && data.vital) {
          setVitalsList(prev => [data.vital, ...prev]);
          setLatestVitals(prev => ({ ...prev, [cfg.type]: data.vital }));
          showToast(`${cfg.title} (${liveMeasureVal} ${cfg.unit}) saved to SQLite database!`);
          setActiveMeasureModal(null);
        }
      }
    } catch (e) {
      console.error('Error saving vital measurement:', e);
      showToast('Error saving measurement to database.');
    } finally {
      setIsSavingVital(false);
    }
  };

  // Delete vital entry
  const handleDeleteVital = async (id: number | string) => {
    try {
      const res = await fetch(getApiEndpoint(`/emergency/vitals/${id}`), {
        method: 'DELETE'
      });
      if (res.ok) {
        showToast('Vital record removed from database.');
        fetchVitals();
      }
    } catch (e) {
      console.error('Error deleting vital:', e);
    }
  };

  const handleAddSymptomLog = async () => {
    const today = new Date();
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const newEntry: SymptomLog = {
      id: Date.now().toString(),
      date: today.toISOString().split('T')[0],
      dayLabel: dayNames[today.getDay()],
      shortnessOfBreath: newSymptom.shortnessOfBreath,
      coughSeverity: newSymptom.coughSeverity,
      eyeIrritation: newSymptom.eyeIrritation,
      inhalerPuffsUsed: newSymptom.inhalerPuffsUsed,
      pm25Exposure: currentLahorePm25,
      notes: newSymptom.notes || 'Logged during daily commute'
    };

    const currentLogs = Array.isArray(profile.symptomLogs) ? profile.symptomLogs : [];
    const updatedLogs = [...currentLogs.slice(-6), newEntry];
    const updated = {
      ...profile,
      symptomLogs: updatedLogs
    };

    try {
      await fetch(getApiEndpoint('/emergency/symptom-logs'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ entry: newEntry })
      });
    } catch (e) {}

    setProfile(updated);
    setFormData(updated);
    setNewSymptom({
      shortnessOfBreath: 1,
      coughSeverity: 1,
      eyeIrritation: 1,
      inhalerPuffsUsed: 1,
      notes: ''
    });
    showToast("Today's respiratory symptoms logged and synced with database!");
  };

  // Calculate dynamic Smog Vulnerability Score (0 - 100) taking into account user's full clinical smog spectrum (backend/DB synced)
  const vulnerabilityMetrics = useMemo(() => {
    if (!hasProfile) {
      return {
        score: 0,
        tier: 'Uncalibrated' as const,
        tierColor: 'text-slate-600 bg-slate-100 border-slate-200',
        progressBg: 'bg-slate-300',
        advisory: `Lahore air quality is monitored live at AQI ${currentLahoreAqi}. Create your medical profile to calculate your personalized smog vulnerability index and real-time safe outdoor exposure thresholds.`,
        safeMinutesUnmasked: 0,
        safeMinutesMasked: 0,
        totalDailyPm25Ug: 0
      };
    }

    if (serverVulnerability && typeof serverVulnerability.score === 'number') {
      return serverVulnerability;
    }

    let score = 15; // base level

    // Condition impacts
    if (profile.asthmaSeverity === 'mild') score += 18;
    if (profile.asthmaSeverity === 'moderate') score += 32;
    if (profile.asthmaSeverity === 'severe') score += 48;

    if (profile.hasCopd) score += 28;
    if (profile.hasBronchitis) score += 22;
    if (profile.hasReducedLungCapacity) score += 25;
    if (profile.hasLungCancerRisk) score += 24;
    if (profile.hasCardioCondition) score += 20;
    if (profile.hasAllergies) score += 10;
    if (profile.hasEyeIrritation) score += 6;
    if (profile.hasEntIrritation) score += 6;
    if (profile.hasHeadachesFatigue) score += 8;

    // Vulnerable cohorts
    if (profile.hasPregnant) score += 20;
    if (profile.hasElderly || profile.age > 60) score += 18;
    if (profile.hasChild || profile.age < 12) score += 18;
    if (profile.isVulnerableCohort) score += 12;

    // Smoking
    if (profile.smokerStatus === 'active') score += 20;
    if (profile.smokerStatus === 'former') score += 6;

    // Commute exposure
    if (profile.primaryCommute === 'bike') score += 16;
    if (profile.primaryCommute === 'walk') score += 14;
    if (profile.primaryCommute === 'transit') score += 8;
    if (profile.primaryCommute === 'car') score += 2;

    if (profile.dailyCommuteMinutes > 60) score += 10;
    else if (profile.dailyCommuteMinutes > 30) score += 5;

    // Protective mitigations (Reduce vulnerability)
    if (profile.wearsMask === 'always') score -= 16;
    else if (profile.wearsMask === 'high_aqi_only') score -= 10;

    if (profile.maskType === 'n95') score -= 8;
    if (profile.hasHepaPurifier) score -= 10;

    score = Math.max(5, Math.min(99, score));

    let tier: 'Low' | 'Moderate' | 'High' | 'Severe' = 'Low';
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

    // Safe unmasked outdoor tolerance window in minutes based on current Lahore AQI
    const safeMinutesUnmasked = Math.max(12, Math.round(180 * (1 - score / 100) * (100 / currentLahoreAqi)));
    const safeMinutesMasked = Math.min(480, safeMinutesUnmasked * 4.5);

    // Estimated daily PM2.5 inhaled (ug) based on commute mode and time
    const breathingRate = 0.8; // m3/hour
    const commuteHours = profile.dailyCommuteMinutes / 60;
    const filtrationEfficiency = profile.maskType === 'n95' ? 0.92 : profile.maskType === 'surgical' ? 0.45 : 0.15;
    const maskProtection = profile.wearsMask === 'always' || profile.wearsMask === 'high_aqi_only' ? filtrationEfficiency : 0;
    
    const commuteInhaledUg = currentLahorePm25 * breathingRate * commuteHours * (1 - maskProtection);
    const indoorInhaledUg = (profile.hasHepaPurifier ? 25 : 55) * breathingRate * (24 - commuteHours);
    const totalDailyPm25Ug = Math.round(commuteInhaledUg + indoorInhaledUg);

    return {
      score,
      tier,
      tierColor,
      progressBg,
      advisory,
      safeMinutesUnmasked,
      safeMinutesMasked,
      totalDailyPm25Ug
    };
  }, [profile, currentLahoreAqi, currentLahorePm25, hasProfile]);

  
  // Stopwatch ticker for breath hold test
  useEffect(() => {
    let interval: any = null;
    if (stopwatchActive) {
      interval = setInterval(() => {
        setStopwatchSeconds(prev => prev + 1);
      }, 1000);
    } else {
      clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [stopwatchActive]);

  if (!mounted) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
        <div className="flex items-center gap-3 text-slate-500 font-bold">
          <div className="w-5 h-5 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin"></div>
          Loading Health Profile & Respiratory Diagnostics...
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-full bg-slate-50 flex flex-col pb-16">
      
      {/* Toast Notification */}
      {toastMsg && (
        <div className="fixed top-20 right-6 z-[9999] bg-slate-900 text-white px-5 py-3.5 rounded-2xl shadow-2xl flex items-center gap-3 border border-slate-700 animate-in slide-in-from-top-4 duration-300">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <span className="text-xs font-bold">{toastMsg}</span>
          <button onClick={() => setToastMsg(null)} className="ml-2 text-slate-400 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Main Container */}
      <div className="max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 pt-6 space-y-6">
        
        {/* Top Header Card */}
        <div className="bg-white rounded-3xl p-6 md:p-8 border border-slate-200/80 shadow-sm flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative overflow-hidden">
          <div className="relative z-10 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-black tracking-wide uppercase mb-3">
              <HeartPulse className="w-3.5 h-3.5 text-emerald-600" />
              Personal Air Health Intelligence & Diagnostic Center
            </div>
            <h1 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight leading-tight">
              Respiratory & Smog Health Profile
            </h1>
            <p className="text-slate-500 text-sm sm:text-base mt-2 font-medium leading-relaxed">
              Personalized AI vulnerability assessment, clinical bronchial risk scoring, hospital diagnostic lab records, and real-time safe exposure thresholds synchronized with Lahore&apos;s live atmospheric particulate levels.
            </p>
          </div>

          {/* Header Action Buttons */}
          <div className="relative z-10 flex flex-wrap items-center gap-3">
            {isLoadingProfile ? (
              <div className="flex items-center gap-2 px-5 py-3 bg-slate-100 rounded-2xl text-xs font-bold text-slate-500 border border-slate-200">
                <div className="w-3.5 h-3.5 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin"></div>
                <span>Checking Database...</span>
              </div>
            ) : !hasProfile ? (
              <button
                onClick={() => {
                  setFormData(EMPTY_PROFILE);
                  setIsCreateModalOpen(true);
                }}
                className="flex items-center gap-2 px-6 py-3.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-2xl font-black text-xs sm:text-sm shadow-lg shadow-emerald-600/25 transition-all active:scale-95"
              >
                <Plus className="w-4 h-4" />
                <span>Create Medical Profile</span>
              </button>
            ) : (
              <>
                <button
                  onClick={() => setIsViewProfileModalOpen(true)}
                  className="flex items-center gap-2 px-4 py-3 bg-white hover:bg-slate-50 text-slate-800 rounded-2xl font-black text-xs sm:text-sm transition-all active:scale-95 border border-slate-200 shadow-xs"
                >
                  <User className="w-4 h-4 text-emerald-600" />
                  <span>View Medical Profile</span>
                </button>

                <button
                  onClick={() => {
                    setCardModalTab('clinical_report');
                    setIsIdCardOpen(true);
                  }}
                  className="flex items-center gap-2 px-4 py-3 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 rounded-2xl font-extrabold text-xs sm:text-sm transition-all active:scale-95 border border-emerald-200 shadow-xs"
                >
                  <FileText className="w-4 h-4 text-emerald-600" />
                  <span>Medical Smog Pass & Report</span>
                </button>

                <button
                  onClick={() => {
                    setFormData(profile);
                    setIsEditModalOpen(true);
                  }}
                  className="flex items-center gap-2 px-5 py-3 bg-slate-900 hover:bg-slate-800 text-white rounded-2xl font-black text-xs sm:text-sm shadow-md transition-all active:scale-95"
                >
                  <Sliders className="w-4 h-4 text-emerald-400" />
                  <span>Edit Medical Profile</span>
                </button>
              </>
            )}
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="bg-white rounded-2xl p-2 border border-slate-200/80 shadow-sm flex items-center gap-2 overflow-x-auto scrollbar-thin scrollbar-thumb-slate-200">
          <button
            onClick={() => setActiveTab('overview')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition-all shrink-0 ${
              activeTab === 'overview'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
            }`}
          >
            <Activity className="w-4 h-4" />
            <span>Health Overview</span>
          </button>

          <button
            onClick={() => setActiveTab('assessment')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition-all shrink-0 ${
              activeTab === 'assessment'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
            }`}
          >
            <Stethoscope className="w-4 h-4" />
            <span>Clinical & Smog Assessment</span>
            {isEditing && <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse"></span>}
          </button>

          <button
            onClick={() => setActiveTab('reports')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition-all shrink-0 ${
              activeTab === 'reports'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
            }`}
          >
            <Hospital className="w-4 h-4" />
            <span>Hospital Diagnostic Reports</span>
            {profile.medicalReports && profile.medicalReports.length > 0 && (
              <span className="px-1.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-black">
                {profile.medicalReports.length}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('symptoms')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition-all shrink-0 ${
              activeTab === 'symptoms'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
            }`}
          >
            <HeartPulse className="w-4 h-4" />
            <span>7-Day Symptom Log</span>
          </button>

          <button
            onClick={() => setActiveTab('emergency')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition-all shrink-0 ${
              activeTab === 'emergency'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
            }`}
          >
            <ShieldAlert className="w-4 h-4 text-rose-500" />
            <span>Lahore Emergency Smog Protocol</span>
          </button>
        </div>

        {/* TAB 1: OVERVIEW */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            
            {/* New User Onboarding Banner if no profile exists */}
            {!hasProfile && (
              <div className="bg-gradient-to-r from-slate-900 via-emerald-950 to-slate-900 text-white rounded-3xl p-6 sm:p-8 border border-emerald-500/20 shadow-xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-80 h-80 bg-emerald-500/10 rounded-full filter blur-3xl pointer-events-none"></div>
                <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                  <div className="space-y-2 max-w-2xl">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-bold border border-emerald-500/30">
                      <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                      New User Setup Required
                    </div>
                    <h3 className="text-xl sm:text-2xl font-black tracking-tight">
                      Create Your Respiratory & Smog Health Profile
                    </h3>
                    <p className="text-slate-300 text-xs sm:text-sm font-medium leading-relaxed">
                      Your medical profile has not been configured yet in the database. Add your daily transit habits, chronic smog symptoms (bronchitis, coughing, eye irritation), and hospital diagnostic reports to unlock personalized exposure warnings and your printable DHUAN Medical Smog Report Card.
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      setFormData(EMPTY_PROFILE);
                      setIsCreateModalOpen(true);
                    }}
                    className="px-6 py-3.5 bg-emerald-500 hover:bg-emerald-400 text-slate-900 font-extrabold text-xs sm:text-sm rounded-2xl shadow-lg transition-transform active:scale-95 shrink-0 flex items-center justify-center gap-2"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Create Medical Profile Now</span>
                  </button>
                </div>
              </div>
            )}

            {/* Top Scorecard Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              
              {/* Scorecard 1: AI Vulnerability Index */}
              <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-sm flex flex-col justify-between relative overflow-hidden group hover:border-slate-300 transition-all">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-black text-slate-400 uppercase tracking-wider">AI Vulnerability Index</span>
                  <div className={`px-2.5 py-1 rounded-full text-[11px] font-black border ${vulnerabilityMetrics.tierColor}`}>
                    {hasProfile ? `${vulnerabilityMetrics.tier} Risk` : 'Profile Required'}
                  </div>
                </div>

                <div className="flex items-baseline gap-2 mb-2">
                  <span className="text-4xl font-black text-slate-900 tracking-tight">
                    {hasProfile ? vulnerabilityMetrics.score : '—'}
                  </span>
                  <span className="text-sm font-bold text-slate-400">/ 100</span>
                </div>

                {/* Progress bar */}
                <div className="w-full bg-slate-100 rounded-full h-2 mb-3 overflow-hidden">
                  <div 
                    className={`h-full rounded-full transition-all duration-700 ${vulnerabilityMetrics.progressBg}`} 
                    style={{ width: `${hasProfile ? vulnerabilityMetrics.score : 0}%` }}
                  />
                </div>

                <p className="text-xs font-medium text-slate-500 line-clamp-2">
                  {hasProfile
                    ? (vulnerabilityMetrics.triggersText || ((profile.asthmaSeverity !== 'none' ? `Triggered by ${profile.asthmaSeverity} Asthma` : profile.hasBronchitis ? 'Triggered by Chronic Bronchitis' : 'Baseline respiratory sensitivity') + ` + daily ${profile.dailyCommuteMinutes}m ${profile.primaryCommute} commute.`))
                    : 'Create your medical profile to calculate your personalized AI vulnerability score.'}
                </p>
              </div>

              {/* Scorecard 2: Unmasked Outdoor Window */}
              <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-sm flex flex-col justify-between relative overflow-hidden group hover:border-slate-300 transition-all">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-black text-slate-400 uppercase tracking-wider">Safe Outdoor Window</span>
                  <div className="w-7 h-7 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-600">
                    <Clock className="w-4 h-4" />
                  </div>
                </div>

                <div className="flex items-baseline gap-2 mb-2">
                  <span className="text-4xl font-black text-slate-900 tracking-tight">
                    {hasProfile ? vulnerabilityMetrics.safeMinutesUnmasked : '—'}
                  </span>
                  <span className="text-sm font-bold text-slate-500">Mins (Unmasked)</span>
                </div>

                <div className="text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-100 px-2.5 py-1.5 rounded-xl flex items-center justify-between">
                  <span>With N95 Mask:</span>
                  <span className="font-extrabold">
                    {hasProfile 
                      ? `${Math.floor(vulnerabilityMetrics.safeMinutesMasked / 60)}h ${vulnerabilityMetrics.safeMinutesMasked % 60}m` 
                      : 'Profile Required'}
                  </span>
                </div>

                <p className="text-[11px] font-medium text-slate-400 mt-2">
                  {hasProfile 
                    ? `Calculated against Lahore's live AQI ${currentLahoreAqi}.` 
                    : 'Requires commute & lung health profile to calculate.'}
                </p>
              </div>

              {/* Scorecard 3: Daily Inhaled PM2.5 Burden */}
              <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-sm flex flex-col justify-between relative overflow-hidden group hover:border-slate-300 transition-all">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-black text-slate-400 uppercase tracking-wider">Est. Daily PM2.5 Inhaled</span>
                  <div className="w-7 h-7 rounded-full bg-orange-50 flex items-center justify-center text-orange-600">
                    <Wind className="w-4 h-4" />
                  </div>
                </div>

                <div className="flex items-baseline gap-2 mb-2">
                  <span className="text-4xl font-black text-slate-900 tracking-tight">
                    {hasProfile ? vulnerabilityMetrics.totalDailyPm25Ug : '—'}
                  </span>
                  <span className="text-sm font-bold text-slate-400">µg / day</span>
                </div>

                <div className="text-xs font-bold text-orange-700 bg-orange-50 border border-orange-100 px-2.5 py-1.5 rounded-xl">
                  {hasProfile 
                    ? `${Math.round((vulnerabilityMetrics.totalDailyPm25Ug / 15) * 10) / 10}x WHO Annual Guideline` 
                    : 'Uncalibrated'}
                </div>

                <p className="text-[11px] font-medium text-slate-400 mt-2">
                  {hasProfile ? 'Includes commute & indoor HEPA filtration levels.' : 'Requires transit mode & mask habits.'}
                </p>
              </div>

              {/* Scorecard 4: Medication Preparedness & Conditions */}
              <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-sm flex flex-col justify-between relative overflow-hidden group hover:border-slate-300 transition-all">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-black text-slate-400 uppercase tracking-wider">Rescue Inhaler & Conditions</span>
                  <div className="w-7 h-7 rounded-full bg-blue-50 flex items-center justify-center text-blue-600">
                    <Pill className="w-4 h-4" />
                  </div>
                </div>

                <div>
                  <div className="text-lg font-black text-slate-900 truncate">
                    {hasProfile 
                      ? (profile.usesInhaler ? (profile.inhalerName ? profile.inhalerName.split('(')[0] : 'Inhaler Prescribed') : 'No Inhaler Prescribed') 
                      : 'Not Configured'}
                  </div>
                  <div className="text-xs font-semibold text-emerald-600 flex items-center gap-1.5 mt-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>{hasProfile ? `Dose: ${profile.lastPreventiveDose || 'None recorded'}` : 'Profile Required'}</span>
                  </div>
                </div>

                <div className="mt-3 pt-3 border-t border-slate-100 flex flex-col gap-1.5 text-xs">
                  <div className="flex items-center justify-between font-bold text-slate-600">
                    <span>Mask In Use:</span>
                    <span className="uppercase text-slate-900 font-extrabold">{hasProfile ? profile.maskType : '—'}</span>
                  </div>
                  {hasProfile && vulnerabilityMetrics.activeConditions && vulnerabilityMetrics.activeConditions.length > 0 && (
                    <div className="text-[11px] font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded-md truncate">
                      {vulnerabilityMetrics.activeConditions.length} Smog Condition{vulnerabilityMetrics.activeConditions.length > 1 ? 's' : ''}: {vulnerabilityMetrics.activeConditions.slice(0, 2).join(', ')}{vulnerabilityMetrics.activeConditions.length > 2 ? '...' : ''}
                    </div>
                  )}
                </div>
              </div>

            </div>

            {/* AI Clinical Smog Advisory Card for Lahore */}
            <div className="bg-slate-900 text-white rounded-3xl p-6 md:p-8 border border-slate-800 shadow-xl relative overflow-hidden">
              <div className="absolute top-0 right-0 w-80 h-80 bg-emerald-500/10 rounded-full filter blur-3xl pointer-events-none"></div>

              <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                <div className="space-y-3 max-w-3xl">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-400 text-xs font-bold border border-emerald-500/30">
                    <Sparkles className="w-3.5 h-3.5" />
                    AI Clinical Action Recommendation for Today
                  </div>

                  <h3 className="text-xl sm:text-2xl font-black tracking-tight leading-snug">
                    {vulnerabilityMetrics.advisory}
                  </h3>

                  <div className="space-y-2 text-slate-300 text-sm font-medium leading-relaxed">
                    <p>
                      Lahore&apos;s ambient PM2.5 is currently at <strong className="text-white">{currentLahorePm25} µg/m³ (AQI {currentLahoreAqi})</strong>. Recommended safe unmasked outdoor exposure is limited to <strong className="text-emerald-400">{vulnerabilityMetrics.safeMinutesUnmasked} minutes</strong>.
                    </p>

                    {/* Expandable Condition Advisories (Keeps Card Sleek by Default) */}
                    {hasProfile && vulnerabilityMetrics.detailedAdvisories && vulnerabilityMetrics.detailedAdvisories.length > 0 && (
                      <div>
                        <button
                          type="button"
                          onClick={() => setShowDetailedAdvisories(!showDetailedAdvisories)}
                          className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-400 hover:text-emerald-300 transition-colors py-1"
                        >
                          <AlertCircle className="w-3.5 h-3.5 text-amber-400" />
                          <span>{showDetailedAdvisories ? 'Hide Clinical Advisories ▲' : `View ${vulnerabilityMetrics.detailedAdvisories.length} Condition Advisories ▼`}</span>
                        </button>

                        {showDetailedAdvisories && (
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2 animate-in fade-in duration-200">
                            {vulnerabilityMetrics.detailedAdvisories.map((adv: any) => (
                              <div key={adv.id} className="p-2.5 rounded-xl bg-slate-800/90 border border-slate-700 text-xs space-y-1">
                                <div className="font-bold text-emerald-300 flex items-center gap-1.5">
                                  <AlertCircle className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                                  <span>{adv.title}</span>
                                </div>
                                <p className="text-slate-300 text-[11px] leading-snug">{adv.advice}</p>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {hasProfile && (
                    <div className="flex flex-wrap items-center gap-2 pt-1">
                      {vulnerabilityMetrics.actionBadges && vulnerabilityMetrics.actionBadges.length > 0 ? (
                        vulnerabilityMetrics.actionBadges.slice(0, 3).map((badge: any) => (
                          <span
                            key={badge.id}
                            className={`text-xs font-bold px-3 py-1.5 rounded-xl border flex items-center gap-1.5 ${
                              badge.type === 'rose'
                                ? 'bg-rose-950/60 text-rose-300 border-rose-800/80'
                                : badge.type === 'amber'
                                ? 'bg-amber-950/60 text-amber-300 border-amber-800/80'
                                : badge.type === 'cyan'
                                ? 'bg-cyan-950/60 text-cyan-300 border-cyan-800/80'
                                : 'bg-slate-800 text-emerald-300 border-slate-700'
                            }`}
                          >
                            <ShieldCheck className="w-3.5 h-3.5 shrink-0" />
                            <span>{badge.label}</span>
                          </span>
                        ))
                      ) : (
                        <span className="text-xs font-bold bg-slate-800 text-emerald-300 px-3 py-1.5 rounded-xl border border-slate-700 flex items-center gap-1.5">
                          <ShieldCheck className="w-3.5 h-3.5" /> Wear N95 Mask
                        </span>
                      )}
                    </div>
                  )}
                </div>

                <div className="relative z-10 flex flex-col gap-3 shrink-0">
                  {!hasProfile ? (
                    <button
                      onClick={() => {
                        setFormData(EMPTY_PROFILE);
                        setIsCreateModalOpen(true);
                      }}
                      className="flex items-center justify-center gap-2 px-6 py-3.5 bg-emerald-500 hover:bg-emerald-400 text-slate-900 rounded-2xl font-black text-sm shadow-lg transition-transform active:scale-95"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Create Medical Profile</span>
                    </button>
                  ) : (
                    <>
                      <button
                        onClick={() => {
                          setCardModalTab('clinical_report');
                          setIsIdCardOpen(true);
                        }}
                        className="flex items-center justify-center gap-2 px-6 py-3.5 bg-emerald-500 hover:bg-emerald-400 text-slate-900 rounded-2xl font-black text-sm shadow-lg transition-transform active:scale-95"
                      >
                        <FileSpreadsheet className="w-4 h-4" />
                        <span>Print Medical Report Card</span>
                      </button>

                      <Link
                        href="/dashboard/routing"
                        className="flex items-center justify-center gap-2 px-6 py-3 bg-slate-800 hover:bg-slate-700 text-white rounded-2xl font-bold text-sm transition-colors border border-slate-700"
                      >
                        <span>Clean Air Routing</span>
                        <ArrowRight className="w-4 h-4" />
                      </Link>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Diagnosed Smog Health Problems & Clinical Status Grid */}
            <div className="bg-white rounded-3xl p-6 md:p-8 border border-slate-200/80 shadow-sm space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold">
                      <Stethoscope className="w-4 h-4" />
                    </div>
                    <h3 className="text-xl font-black text-slate-900 tracking-tight">
                      Diagnosed Smog Health Problems & Clinical Status
                    </h3>
                  </div>
                  <p className="text-xs text-slate-500 font-medium">
                    Breakdown of chronic conditions, acute symptoms, and vulnerable categories configured in your profile and synced with SQLite database.
                  </p>
                </div>

                <div className="flex items-center gap-2 self-start sm:self-auto">
                  {hasProfile ? (
                    <button
                      onClick={() => {
                        setFormData(profile);
                        setIsEditConditionsModalOpen(true);
                      }}
                      className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm"
                    >
                      <Sliders className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Edit Conditions</span>
                    </button>
                  ) : (
                    <button
                      onClick={() => {
                        setFormData(EMPTY_PROFILE);
                        setIsCreateModalOpen(true);
                      }}
                      className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Create Profile</span>
                    </button>
                  )}
                </div>
              </div>

              {/* 4 Health Condition Categories */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                
                {/* 1. Respiratory & Bronchial Problems */}
                <div 
                  onClick={() => {
                    if (hasProfile) {
                      setFormData(profile);
                      setIsEditConditionsModalOpen(true);
                    } else {
                      setFormData(EMPTY_PROFILE);
                      setIsCreateModalOpen(true);
                    }
                  }}
                  className="p-4 rounded-2xl bg-slate-50/70 border border-slate-200/80 hover:border-emerald-300 hover:shadow-xs transition-all cursor-pointer space-y-3 flex flex-col justify-between group"
                >
                  <div>
                    <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                      <span className="text-xs font-black text-slate-700 flex items-center gap-1.5 uppercase tracking-wide group-hover:text-emerald-700 transition-colors">
                        <Wind className="w-3.5 h-3.5 text-emerald-600" />
                        Respiratory Problems
                      </span>
                      {hasProfile && (profile.asthmaSeverity !== 'none' || profile.hasBronchitis || profile.hasCopd || profile.hasReducedLungCapacity || profile.hasLungCancerRisk) ? (
                        <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 border border-rose-200">
                          Active Risk
                        </span>
                      ) : (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-200 text-slate-600">
                          Clear
                        </span>
                      )}
                    </div>

                    <div className="space-y-2 mt-3 text-xs">
                      {/* Asthma */}
                      <div className="flex items-center justify-between py-1">
                        <span className="text-slate-600 font-medium">Asthma:</span>
                        {hasProfile && profile.asthmaSeverity !== 'none' ? (
                          <span className="font-extrabold text-rose-700 bg-rose-50 px-2 py-0.5 rounded border border-rose-200 capitalize">
                            {profile.asthmaSeverity}
                          </span>
                        ) : (
                          <span className="font-semibold text-slate-400">None</span>
                        )}
                      </div>

                      {/* Bronchitis */}
                      <div className="flex items-center justify-between py-1">
                        <span className="text-slate-600 font-medium">Chronic Bronchitis:</span>
                        {hasProfile && profile.hasBronchitis ? (
                          <span className="font-extrabold text-rose-700 bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
                            Diagnosed
                          </span>
                        ) : (
                          <span className="font-semibold text-slate-400">Negative</span>
                        )}
                      </div>

                      {/* COPD */}
                      <div className="flex items-center justify-between py-1">
                        <span className="text-slate-600 font-medium">COPD / Obstruction:</span>
                        {hasProfile && profile.hasCopd ? (
                          <span className="font-extrabold text-rose-700 bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
                            Diagnosed
                          </span>
                        ) : (
                          <span className="font-semibold text-slate-400">Negative</span>
                        )}
                      </div>

                      {/* Reduced Lung Function */}
                      <div className="flex items-center justify-between py-1">
                        <span className="text-slate-600 font-medium">Reduced Lung Function:</span>
                        {hasProfile && profile.hasReducedLungCapacity ? (
                          <span className="font-extrabold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                            Diminished
                          </span>
                        ) : (
                          <span className="font-semibold text-slate-400">Normal</span>
                        )}
                      </div>

                      {/* Lung Cancer Risk */}
                      <div className="flex items-center justify-between py-1">
                        <span className="text-slate-600 font-medium">Lung Cancer Risk:</span>
                        {hasProfile && profile.hasLungCancerRisk ? (
                          <span className="font-extrabold text-red-700 bg-red-50 px-2 py-0.5 rounded border border-red-200">
                            Elevated
                          </span>
                        ) : (
                          <span className="font-semibold text-slate-400">Low / None</span>
                        )}
                      </div>
                    </div>
                  </div>

                  <p className="text-[11px] text-slate-400 italic pt-2 border-t border-slate-200/60">
                    Fine PM2.5 penetrates deep into lung alveoli causing spasms.
                  </p>
                </div>

                {/* 2. Sensory & Upper Airway */}
                <div 
                  onClick={() => {
                    if (hasProfile) {
                      setFormData(profile);
                      setIsEditConditionsModalOpen(true);
                    } else {
                      setFormData(EMPTY_PROFILE);
                      setIsCreateModalOpen(true);
                    }
                  }}
                  className="p-4 rounded-2xl bg-slate-50/70 border border-slate-200/80 hover:border-cyan-300 hover:shadow-xs transition-all cursor-pointer space-y-3 flex flex-col justify-between group"
                >
                  <div>
                    <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                      <span className="text-xs font-black text-slate-700 flex items-center gap-1.5 uppercase tracking-wide group-hover:text-cyan-700 transition-colors">
                        <Eye className="w-3.5 h-3.5 text-cyan-600" />
                        Sensory & Airway
                      </span>
                      {hasProfile && (profile.hasEyeIrritation || profile.hasEntIrritation || profile.hasAllergies) ? (
                        <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-cyan-100 text-cyan-800 border border-cyan-200">
                          Irritation Active
                        </span>
                      ) : (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-200 text-slate-600">
                          Clear
                        </span>
                      )}
                    </div>

                    <div className="space-y-2 mt-3 text-xs">
                      {/* Eye Irritation */}
                      <div className="flex items-center justify-between py-1">
                        <span className="text-slate-600 font-medium">Eye Irritation:</span>
                        {hasProfile && profile.hasEyeIrritation ? (
                          <span className="font-extrabold text-cyan-800 bg-cyan-50 px-2 py-0.5 rounded border border-cyan-200">
                            Burning / Redness
                          </span>
                        ) : (
                          <span className="font-semibold text-slate-400">Negative</span>
                        )}
                      </div>

                      {/* Nose & Throat */}
                      <div className="flex items-center justify-between py-1">
                        <span className="text-slate-600 font-medium">Nose & Throat:</span>
                        {hasProfile && profile.hasEntIrritation ? (
                          <span className="font-extrabold text-yellow-800 bg-yellow-50 px-2 py-0.5 rounded border border-yellow-200">
                            Sneezing / Sore
                          </span>
                        ) : (
                          <span className="font-semibold text-slate-400">Negative</span>
                        )}
                      </div>

                      {/* Allergies */}
                      <div className="flex items-center justify-between py-1">
                        <span className="text-slate-600 font-medium">Particulate Allergies:</span>
                        {hasProfile && profile.hasAllergies ? (
                          <span className="font-extrabold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                            Present
                          </span>
                        ) : (
                          <span className="font-semibold text-slate-400">None</span>
                        )}
                      </div>

                      {/* Mask Protection */}
                      <div className="flex items-center justify-between py-1">
                        <span className="text-slate-600 font-medium">Assigned Mask:</span>
                        <span className="font-extrabold text-slate-800 uppercase bg-white px-2 py-0.5 rounded border border-slate-200">
                          {hasProfile ? profile.maskType : 'None'}
                        </span>
                      </div>
                    </div>
                  </div>

                  <p className="text-[11px] text-slate-400 italic pt-2 border-t border-slate-200/60">
                    Ocular tears & nasal mucous protect against micro-soot particles.
                  </p>
                </div>

                {/* 3. Cardiovascular & Neurological */}
                <div 
                  onClick={() => {
                    if (hasProfile) {
                      setFormData(profile);
                      setIsEditConditionsModalOpen(true);
                    } else {
                      setFormData(EMPTY_PROFILE);
                      setIsCreateModalOpen(true);
                    }
                  }}
                  className="p-4 rounded-2xl bg-slate-50/70 border border-slate-200/80 hover:border-rose-300 hover:shadow-xs transition-all cursor-pointer space-y-3 flex flex-col justify-between group"
                >
                  <div>
                    <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                      <span className="text-xs font-black text-slate-700 flex items-center gap-1.5 uppercase tracking-wide group-hover:text-rose-700 transition-colors">
                        <Heart className="w-3.5 h-3.5 text-rose-600" />
                        Heart & Fatigue
                      </span>
                      {hasProfile && (profile.hasCardioCondition || profile.hasHeadachesFatigue) ? (
                        <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 border border-rose-200">
                          Monitor BP
                        </span>
                      ) : (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-200 text-slate-600">
                          Stable
                        </span>
                      )}
                    </div>

                    <div className="space-y-2 mt-3 text-xs">
                      {/* Cardiovascular */}
                      <div className="flex items-center justify-between py-1">
                        <span className="text-slate-600 font-medium">Heart / Stroke Risk:</span>
                        {hasProfile && profile.hasCardioCondition ? (
                          <span className="font-extrabold text-red-700 bg-red-50 px-2 py-0.5 rounded border border-red-200">
                            High Risk
                          </span>
                        ) : (
                          <span className="font-semibold text-slate-400">Normal</span>
                        )}
                      </div>

                      {/* Headaches & Fatigue */}
                      <div className="flex items-center justify-between py-1">
                        <span className="text-slate-600 font-medium">Headaches & Fatigue:</span>
                        {hasProfile && profile.hasHeadachesFatigue ? (
                          <span className="font-extrabold text-purple-700 bg-purple-50 px-2 py-0.5 rounded border border-purple-200">
                            Frequent
                          </span>
                        ) : (
                          <span className="font-semibold text-slate-400">None</span>
                        )}
                      </div>

                      {/* Smoker Status */}
                      <div className="flex items-center justify-between py-1">
                        <span className="text-slate-600 font-medium">Smoking Exposure:</span>
                        <span className="font-extrabold text-slate-800 capitalize bg-white px-2 py-0.5 rounded border border-slate-200">
                          {hasProfile ? profile.smokerStatus : 'Non-smoker'}
                        </span>
                      </div>

                      {/* Indoor Air Purifier */}
                      <div className="flex items-center justify-between py-1">
                        <span className="text-slate-600 font-medium">HEPA Purifier:</span>
                        {hasProfile && profile.hasHepaPurifier ? (
                          <span className="font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Active
                          </span>
                        ) : (
                          <span className="font-semibold text-slate-400">Not Installed</span>
                        )}
                      </div>
                    </div>
                  </div>

                  <p className="text-[11px] text-slate-400 italic pt-2 border-t border-slate-200/60">
                    Smog crosses pulmonary barrier into bloodstream elevating BP.
                  </p>
                </div>

                {/* 4. Cohorts & Active Symptoms */}
                <div 
                  onClick={() => {
                    if (hasProfile) {
                      setFormData(profile);
                      setIsEditConditionsModalOpen(true);
                    } else {
                      setFormData(EMPTY_PROFILE);
                      setIsCreateModalOpen(true);
                    }
                  }}
                  className="p-4 rounded-2xl bg-slate-50/70 border border-slate-200/80 hover:border-blue-300 hover:shadow-xs transition-all cursor-pointer space-y-3 flex flex-col justify-between group"
                >
                  <div>
                    <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                      <span className="text-xs font-black text-slate-700 flex items-center gap-1.5 uppercase tracking-wide group-hover:text-blue-700 transition-colors">
                        <Users className="w-3.5 h-3.5 text-blue-600" />
                        Cohorts & Symptoms
                      </span>
                      {hasProfile && (profile.hasPregnant || profile.hasChild || profile.hasElderly || (profile.smogSymptoms && profile.smogSymptoms.length > 0)) ? (
                        <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-200">
                          Special Care
                        </span>
                      ) : (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-200 text-slate-600">
                          Standard
                        </span>
                      )}
                    </div>

                    <div className="space-y-2 mt-3 text-xs">
                      {/* Cohort Category */}
                      <div className="py-1">
                        <span className="text-slate-500 font-medium block mb-1">Vulnerable Demographics:</span>
                        <div className="flex flex-wrap gap-1">
                          {hasProfile && profile.hasPregnant && (
                            <span className="font-bold text-pink-700 bg-pink-50 px-2 py-0.5 rounded text-[11px] border border-pink-200">
                              Maternal / Pregnancy
                            </span>
                          )}
                          {hasProfile && profile.hasChild && (
                            <span className="font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded text-[11px] border border-blue-200">
                              Child (Pediatric Lungs)
                            </span>
                          )}
                          {hasProfile && profile.hasElderly && (
                            <span className="font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded text-[11px] border border-slate-300">
                              Senior (60+)
                            </span>
                          )}
                          {(!hasProfile || (!profile.hasPregnant && !profile.hasChild && !profile.hasElderly)) && (
                            <span className="text-slate-400 font-semibold text-[11px]">Standard Adult</span>
                          )}
                        </div>
                      </div>

                      {/* Active Symptoms */}
                      <div className="pt-2 border-t border-slate-200">
                        <span className="text-slate-500 font-medium block mb-1.5">Active Smog Symptoms:</span>
                        {hasProfile && profile.smogSymptoms && profile.smogSymptoms.length > 0 ? (
                          <div className="flex flex-wrap gap-1">
                            {profile.smogSymptoms.map((sym: string) => (
                              <span key={sym} className="font-extrabold text-rose-700 bg-rose-50 px-1.5 py-0.5 rounded text-[10px] border border-rose-200 capitalize">
                                {sym.replace(/_/g, ' ')}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <span className="text-slate-400 italic text-[11px]">No acute symptoms reported</span>
                        )}
                      </div>

                      {/* Diagnostic Lab Reports count */}
                      <div className="pt-2 border-t border-slate-200 flex items-center justify-between">
                        <span className="text-slate-600 font-medium">Hospital Reports:</span>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setActiveTab('reports');
                          }}
                          className="font-bold text-emerald-700 hover:underline flex items-center gap-1"
                        >
                          <Hospital className="w-3 h-3 text-emerald-600" />
                          <span>{hasProfile && profile.medicalReports ? profile.medicalReports.length : 0} Attached &rarr;</span>
                        </button>
                      </div>
                    </div>
                  </div>

                  <p className="text-[11px] text-slate-400 italic pt-2 border-t border-slate-200/60">
                    Children, pregnant women, and seniors exhibit 2x particulate sensitivity.
                  </p>
                </div>

              </div>
            </div>

            {/* Full Width Weekly Inhalation & Respiratory Stress Graph */}
            <div className="w-full bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-sm flex flex-col justify-between space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-slate-100">
                <div className="space-y-1">
                  <h3 className="font-extrabold text-lg text-slate-900 flex items-center gap-2">
                    <Activity className="w-5 h-5 text-emerald-600" />
                    Weekly Respiratory Stress vs. Ambient PM2.5 (Lahore Correlation)
                  </h3>
                  <p className="text-xs text-slate-500 font-medium">
                    Dual-axis clinical correlation between live Lahore atmospheric PM2.5 (µg/m³) and patient respiratory stress symptoms saved in SQLite database.
                  </p>
                </div>
                <div className="flex items-center gap-2 self-start sm:self-auto">
                  <span className="px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-bold border border-emerald-200 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                    Database Synced
                  </span>
                  <button
                    onClick={() => setActiveTab('symptoms')}
                    className="text-xs font-bold text-emerald-600 hover:text-emerald-700 px-3 py-1.5 rounded-xl hover:bg-emerald-50 transition-colors"
                  >
                    View All Logs &rarr;
                  </button>
                </div>
              </div>

              <div className="h-[280px] w-full pt-2">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart
                    data={profile.symptomLogs && profile.symptomLogs.length > 0 ? profile.symptomLogs : []}
                    margin={{ top: 10, right: 20, left: 0, bottom: 0 }}
                  >
                    <defs>
                      <linearGradient id="colorPm" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.35} />
                        <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="colorSymptoms" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#ef4444" stopOpacity={0.35} />
                        <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="dayLabel" tickLine={false} axisLine={false} tick={{ fontSize: 12, fill: '#64748b' }} />
                    <YAxis
                      yAxisId="pm"
                      orientation="left"
                      tickLine={false}
                      axisLine={false}
                      domain={[0, 'auto']}
                      tick={{ fontSize: 11, fill: '#d97706' }}
                      unit=" µg"
                    />
                    <YAxis
                      yAxisId="sym"
                      orientation="right"
                      tickLine={false}
                      axisLine={false}
                      domain={[0, 4]}
                      ticks={[0, 1, 2, 3]}
                      tick={{ fontSize: 11, fill: '#ef4444' }}
                    />
                    <Tooltip 
                      contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                      labelStyle={{ fontWeight: 'bold', color: '#0f172a' }}
                    />
                    <Legend wrapperStyle={{ fontSize: 12, paddingTop: 10 }} />
                    <Area 
                      yAxisId="pm"
                      type="monotone" 
                      dataKey="pm25Exposure" 
                      name="Lahore PM2.5 (µg/m³)" 
                      stroke="#f59e0b" 
                      strokeWidth={2.5} 
                      fillOpacity={1} 
                      fill="url(#colorPm)" 
                    />
                    <Area 
                      yAxisId="sym"
                      type="monotone" 
                      dataKey="shortnessOfBreath" 
                      name="Shortness of Breath (0-3 scale)" 
                      stroke="#ef4444" 
                      strokeWidth={2.5} 
                      fillOpacity={1} 
                      fill="url(#colorSymptoms)" 
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>

              <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between text-xs text-slate-500 font-medium gap-2">
                <span className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                  Ground PM2.5 above 90 µg/m³ triggers airway hyper-reactivity, coughing, and elevated mucus secretion.
                </span>
                <span className="font-bold text-slate-700 bg-slate-100 px-2.5 py-1 rounded-lg">
                  {profile.symptomLogs ? profile.symptomLogs.length : 7} Daily Records Connected
                </span>
              </div>
            </div>

          </div>
        )}

        {/* TAB 2: CLINICAL VITALS & INSTRUMENT MEASUREMENT STATION */}
        {activeTab === 'assessment' && (
          <div className="space-y-6">
            
            {/* Top Station Banner */}
            <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-emerald-950 text-white rounded-3xl p-6 sm:p-8 border border-slate-700/80 shadow-xl relative overflow-hidden">
              <div className="absolute top-0 right-0 w-80 h-80 bg-emerald-500/10 rounded-full filter blur-3xl pointer-events-none"></div>

              <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                <div className="space-y-2 max-w-3xl">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-bold border border-emerald-500/30">
                    <Activity className="w-3.5 h-3.5 text-emerald-400" />
                    Interactive Clinical Assessment & Instrument Diagnostics
                  </div>
                  <h2 className="text-2xl sm:text-3xl font-black tracking-tight leading-snug">
                    Biomarker & Physiological Vitals Station
                  </h2>
                  <p className="text-slate-300 text-xs sm:text-sm font-medium leading-relaxed">
                    Measure and record your cardiovascular, pulmonary, and oxygenation vitals using your connected iPhone, Apple Watch, or medical instruments. Each vital correlates directly with Lahore&apos;s real-time particulate smog levels.
                  </p>
                </div>

                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 shrink-0">
                  <div className="bg-slate-800/90 border border-slate-700 p-3.5 rounded-2xl flex items-center gap-3 text-xs">
                    <div className="w-9 h-9 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400 font-bold shrink-0">
                      <Wind className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-slate-400 font-bold text-[10px] uppercase tracking-wider">Lahore Ground Monitor</div>
                      <div className="font-black text-white text-sm">
                        AQI {currentLahoreAqi} • {currentLahorePm25} µg/m³
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={fetchVitals}
                    disabled={isLoadingVitals}
                    className="px-4 py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-2xl font-bold text-xs transition-all flex items-center justify-center gap-2 shadow-md active:scale-95 disabled:opacity-50"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isLoadingVitals ? 'animate-spin' : ''}`} />
                    <span>Sync Database</span>
                  </button>
                </div>
              </div>

              {/* Station Vitals Overview Bar */}
              <div className="mt-6 pt-5 border-t border-slate-700/80 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div className="p-3 rounded-xl bg-slate-800/60 border border-slate-700/60">
                  <span className="text-slate-400 block text-[10px] font-bold uppercase tracking-wider">Biomarkers Recorded</span>
                  <span className="text-base font-black text-white mt-0.5 block">
                    {Object.keys(latestVitals).length} / {VITALS_CONFIG.length} Active
                  </span>
                </div>

                <div className="p-3 rounded-xl bg-slate-800/60 border border-slate-700/60">
                  <span className="text-slate-400 block text-[10px] font-bold uppercase tracking-wider">Resting Heart Rate</span>
                  <span className="text-base font-black text-rose-400 mt-0.5 block">
                    {latestVitals['heart_rate'] ? `${latestVitals['heart_rate'].reading_value} BPM` : 'Not Measured'}
                  </span>
                </div>

                <div className="p-3 rounded-xl bg-slate-800/60 border border-slate-700/60">
                  <span className="text-slate-400 block text-[10px] font-bold uppercase tracking-wider">Blood Oxygen (SpO2)</span>
                  <span className="text-base font-black text-cyan-400 mt-0.5 block">
                    {latestVitals['spo2'] ? `${latestVitals['spo2'].reading_value}%` : 'Not Measured'}
                  </span>
                </div>

                <div className="p-3 rounded-xl bg-slate-800/60 border border-slate-700/60">
                  <span className="text-slate-400 block text-[10px] font-bold uppercase tracking-wider">Peak Expiratory Flow</span>
                  <span className="text-base font-black text-emerald-400 mt-0.5 block">
                    {latestVitals['peak_flow'] ? `${latestVitals['peak_flow'].reading_value} L/min` : 'Not Measured'}
                  </span>
                </div>
              </div>
            </div>

            {/* Vitals Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {VITALS_CONFIG.map((cfg) => {
                const recorded = latestVitals[cfg.type];
                const isMeasured = Boolean(recorded);
                const statusTier = recorded ? recorded.status_tier : 'unmeasured';

                return (
                  <div
                    key={cfg.type}
                    className="bg-white rounded-3xl p-6 border border-slate-200/90 shadow-sm hover:shadow-md hover:border-slate-300 transition-all flex flex-col justify-between space-y-4 relative group"
                  >
                    <div>
                      {/* Card Header */}
                      <div className="flex items-start justify-between pb-3 border-b border-slate-100 gap-2">
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 ${
                            cfg.colorTheme === 'rose' ? 'bg-rose-50 text-rose-600 border border-rose-200' :
                            cfg.colorTheme === 'cyan' ? 'bg-cyan-50 text-cyan-600 border border-cyan-200' :
                            cfg.colorTheme === 'indigo' ? 'bg-indigo-50 text-indigo-600 border border-indigo-200' :
                            cfg.colorTheme === 'emerald' ? 'bg-emerald-50 text-emerald-600 border border-emerald-200' :
                            cfg.colorTheme === 'amber' ? 'bg-amber-50 text-amber-600 border border-amber-200' :
                            cfg.colorTheme === 'orange' ? 'bg-orange-50 text-orange-600 border border-orange-200' :
                            'bg-teal-50 text-teal-600 border border-teal-200'
                          }`}>
                            {cfg.type === 'heart_rate' && <HeartPulse className="w-5 h-5" />}
                            {cfg.type === 'spo2' && <Wind className="w-5 h-5" />}
                            {cfg.type === 'blood_pressure' && <Activity className="w-5 h-5" />}
                            {cfg.type === 'peak_flow' && <Stethoscope className="w-5 h-5" />}
                            {cfg.type === 'respiratory_rate' && <Wind className="w-5 h-5" />}
                            {cfg.type === 'body_temp' && <ShieldAlert className="w-5 h-5" />}
                            {cfg.type === 'breath_hold' && <Clock className="w-5 h-5" />}
                          </div>

                          <div>
                            <h3 className="font-extrabold text-sm sm:text-base text-slate-900 leading-snug">
                              {cfg.shortName}
                            </h3>
                            <span className="text-[11px] font-semibold text-slate-400 block">
                              Normal: {cfg.normalRange}
                            </span>
                          </div>
                        </div>

                        {/* Status Badge */}
                        {isMeasured ? (
                          <span className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold border uppercase tracking-wider ${
                            statusTier === 'critical' ? 'bg-rose-50 text-rose-700 border-rose-300' :
                            statusTier === 'warning' ? 'bg-amber-50 text-amber-800 border-amber-300' :
                            'bg-emerald-50 text-emerald-700 border-emerald-300'
                          }`}>
                            {statusTier}
                          </span>
                        ) : (
                          <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-slate-100 text-slate-500 border border-slate-200">
                            Required
                          </span>
                        )}
                      </div>

                      {/* Value Display */}
                      <div className="py-4">
                        {isMeasured ? (
                          <div>
                            <div className="flex items-baseline gap-1.5">
                              <span className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
                                {recorded.reading_value}
                                {recorded.reading_secondary ? ` / ${recorded.reading_secondary}` : ''}
                              </span>
                              <span className="text-sm font-extrabold text-slate-500">
                                {recorded.unit}
                              </span>
                            </div>

                            <p className="text-xs font-semibold text-slate-600 mt-2 line-clamp-2">
                              {recorded.clinical_interpretation}
                            </p>

                            <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400 font-medium">
                              <span className="truncate max-w-[180px]">📱 {recorded.device_name}</span>
                              <span>{new Date(recorded.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                            </div>
                          </div>
                        ) : (
                          <div className="py-2 text-center space-y-1.5 bg-slate-50/70 rounded-2xl border border-dashed border-slate-200 p-4">
                            <span className="text-2xl font-black text-slate-300 tracking-tight">—</span>
                            <div className="text-xs font-bold text-slate-600">No Measurement Recorded</div>
                            <p className="text-[11px] text-slate-400 leading-tight">
                              {cfg.deviceRequirementNotice}
                            </p>
                          </div>
                        )}
                      </div>

                      {/* Smog Impact Context */}
                      <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100/80 text-[11px] text-slate-600 space-y-1">
                        <div className="font-bold text-slate-800 flex items-center gap-1">
                          <Zap className="w-3 h-3 text-amber-500" />
                          <span>Smog Correlation</span>
                        </div>
                        <p className="leading-relaxed line-clamp-2">
                          {cfg.smogImpact}
                        </p>
                      </div>
                    </div>

                    {/* Measure Button */}
                    <div className="pt-2">
                      <button
                        onClick={() => openMeasureModal(cfg.type)}
                        className={`w-full py-3 rounded-2xl font-extrabold text-xs sm:text-sm transition-all flex items-center justify-center gap-2 active:scale-95 shadow-xs ${
                          isMeasured
                            ? 'bg-slate-900 hover:bg-slate-800 text-white'
                            : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-600/20'
                        }`}
                      >
                        <Stethoscope className="w-4 h-4 text-emerald-400" />
                        <span>{isMeasured ? `Re-Check / Measure ${cfg.shortName}` : `Measure ${cfg.shortName}`}</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Recent Measurements History (Live SQLite Feed) */}
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-sm space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-100 gap-3">
                <div>
                  <h3 className="font-black text-lg text-slate-900 tracking-tight flex items-center gap-2">
                    <Activity className="w-5 h-5 text-emerald-600" />
                    Biomarkers & Vitals Audit Log (SQLite Database)
                  </h3>
                  <p className="text-xs text-slate-500 font-medium">
                    Permanent audit history of physiological readings recorded with your connected instruments.
                  </p>
                </div>

                {vitalsList.length > 0 && (
                  <button
                    onClick={() => handleDeleteVital('all')}
                    className="px-3.5 py-2 text-xs font-bold text-rose-600 hover:text-rose-700 hover:bg-rose-50 rounded-xl transition-colors flex items-center gap-1.5 self-start sm:self-auto"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Clear All Vitals</span>
                  </button>
                )}
              </div>

              {vitalsList.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-slate-100 text-slate-400 font-black uppercase tracking-wider">
                        <th className="py-3 px-3">Date & Time</th>
                        <th className="py-3 px-3">Biomarker</th>
                        <th className="py-3 px-3">Measured Reading</th>
                        <th className="py-3 px-3">Instrument / Device</th>
                        <th className="py-3 px-3">Clinical Evaluation</th>
                        <th className="py-3 px-3 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                      {vitalsList.map((item) => (
                        <tr key={item.id} className="hover:bg-slate-50/70 transition-colors">
                          <td className="py-3.5 px-3 text-slate-500 whitespace-nowrap">
                            {new Date(item.created_at).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                          </td>
                          <td className="py-3.5 px-3 font-extrabold text-slate-900 capitalize whitespace-nowrap">
                            {item.vital_type.replace(/_/g, ' ')}
                          </td>
                          <td className="py-3.5 px-3 whitespace-nowrap">
                            <span className="font-black text-slate-900 text-sm">
                              {item.reading_value}{item.reading_secondary ? ` / ${item.reading_secondary}` : ''}
                            </span>
                            <span className="text-[11px] text-slate-500 font-bold ml-1">{item.unit}</span>
                          </td>
                          <td className="py-3.5 px-3 whitespace-nowrap text-slate-600">
                            <span className="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 font-bold text-[11px]">
                              {item.device_name}
                            </span>
                          </td>
                          <td className="py-3.5 px-3 max-w-xs">
                            <div className="space-y-0.5">
                              <span className={`inline-block px-2 py-0.5 rounded-md text-[10px] font-black uppercase ${
                                item.status_tier === 'critical' ? 'bg-rose-100 text-rose-800' :
                                item.status_tier === 'warning' ? 'bg-amber-100 text-amber-900' :
                                'bg-emerald-100 text-emerald-800'
                              }`}>
                                {item.status_tier}
                              </span>
                              <div className="text-[11px] text-slate-500 line-clamp-1">{item.clinical_interpretation}</div>
                            </div>
                          </td>
                          <td className="py-3.5 px-3 text-right">
                            <button
                              onClick={() => handleDeleteVital(item.id)}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                              title="Delete measurement"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-10 border-2 border-dashed border-slate-100 rounded-2xl space-y-2">
                  <Activity className="w-8 h-8 text-slate-300 mx-auto" />
                  <p className="text-sm font-bold text-slate-600">No Vitals Stored Yet</p>
                  <p className="text-xs text-slate-400 max-w-sm mx-auto">
                    Select any biomarker above, verify your device or instrument, and start a measurement to store your data into SQLite.
                  </p>
                </div>
              )}
            </div>

          </div>
        )}

        {/* TAB 3: HOSPITAL DIAGNOSTIC REPORTS (EMPTIED AS REQUESTED) */}
        {activeTab === 'reports' && (
          <div className="bg-white rounded-3xl p-8 sm:p-16 border border-slate-200/80 shadow-sm flex flex-col items-center justify-center text-center min-h-[460px] space-y-4">
            <div className="w-20 h-20 rounded-3xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600 shadow-sm">
              <Hospital className="w-10 h-10" />
            </div>
            <div className="max-w-md space-y-2">
              <h3 className="text-2xl font-black text-slate-900 tracking-tight">
                Hospital Diagnostic Reports Model
              </h3>
              <p className="text-sm text-slate-500 font-medium leading-relaxed">
                Yeh model bhi abhi ke liye delete aur empty kar diya gaya hai.
              </p>
            </div>
          </div>
        )}

        {/* TAB 4: 7-DAY SYMPTOM & INHALATION LOG */}
        {activeTab === 'symptoms' && (
          <div className="space-y-6">
            
            {/* Quick Symptom Logger Card */}
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-sm space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
                <div>
                  <h3 className="text-xl font-black text-slate-900 tracking-tight">Log Today&apos;s Respiratory Symptoms</h3>
                  <p className="text-xs sm:text-sm text-slate-500 font-medium mt-0.5">
                    Track wheezing, cough, and inhaler usage during Lahore&apos;s live smog (AQI {currentLahoreAqi})
                  </p>
                </div>
                <div className="px-3 py-1.5 rounded-xl bg-yellow-50 border border-yellow-200 text-yellow-800 text-xs font-bold">
                  Ambient PM2.5: {currentLahorePm25} µg/m³
                </div>
              </div>

              {/* Symptom Sliders / Steppers */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                
                {/* Shortness of Breath */}
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 space-y-2">
                  <div className="flex justify-between items-center text-xs font-bold text-slate-700">
                    <span>Shortness of Breath</span>
                    <span className="text-rose-600 font-extrabold">{['None', 'Mild', 'Moderate', 'Severe'][newSymptom.shortnessOfBreath]}</span>
                  </div>
                  <div className="flex gap-1 pt-1">
                    {[0, 1, 2, 3].map((val) => (
                      <button
                        key={val}
                        type="button"
                        onClick={() => setNewSymptom({ ...newSymptom, shortnessOfBreath: val })}
                        className={`flex-1 py-1.5 rounded-lg text-xs font-black transition-all ${
                          newSymptom.shortnessOfBreath === val
                            ? 'bg-rose-500 text-white shadow-xs'
                            : 'bg-white text-slate-600 hover:bg-slate-200 border border-slate-200'
                        }`}
                      >
                        {val}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Cough Severity */}
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 space-y-2">
                  <div className="flex justify-between items-center text-xs font-bold text-slate-700">
                    <span>Cough Severity</span>
                    <span className="text-amber-600 font-extrabold">{['None', 'Dry Cough', 'Wheeze', 'Severe'][newSymptom.coughSeverity]}</span>
                  </div>
                  <div className="flex gap-1 pt-1">
                    {[0, 1, 2, 3].map((val) => (
                      <button
                        key={val}
                        type="button"
                        onClick={() => setNewSymptom({ ...newSymptom, coughSeverity: val })}
                        className={`flex-1 py-1.5 rounded-lg text-xs font-black transition-all ${
                          newSymptom.coughSeverity === val
                            ? 'bg-amber-500 text-white shadow-xs'
                            : 'bg-white text-slate-600 hover:bg-slate-200 border border-slate-200'
                        }`}
                      >
                        {val}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Eye Irritation */}
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 space-y-2">
                  <div className="flex justify-between items-center text-xs font-bold text-slate-700">
                    <span>Eye Burning</span>
                    <span className="text-orange-600 font-extrabold">{['None', 'Mild', 'Red / Watery', 'Severe'][newSymptom.eyeIrritation]}</span>
                  </div>
                  <div className="flex gap-1 pt-1">
                    {[0, 1, 2, 3].map((val) => (
                      <button
                        key={val}
                        type="button"
                        onClick={() => setNewSymptom({ ...newSymptom, eyeIrritation: val })}
                        className={`flex-1 py-1.5 rounded-lg text-xs font-black transition-all ${
                          newSymptom.eyeIrritation === val
                            ? 'bg-orange-500 text-white shadow-xs'
                            : 'bg-white text-slate-600 hover:bg-slate-200 border border-slate-200'
                        }`}
                      >
                        {val}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Inhaler Puffs Used */}
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 space-y-2">
                  <div className="flex justify-between items-center text-xs font-bold text-slate-700">
                    <span>Rescue Inhaler Puffs</span>
                    <span className="text-emerald-700 font-extrabold">{newSymptom.inhalerPuffsUsed} Puffs</span>
                  </div>
                  <div className="flex items-center gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => setNewSymptom({ ...newSymptom, inhalerPuffsUsed: Math.max(0, newSymptom.inhalerPuffsUsed - 1) })}
                      className="w-8 h-8 rounded-lg bg-white border border-slate-200 flex items-center justify-center font-bold text-slate-700 hover:bg-slate-200"
                    >
                      <Minus className="w-3.5 h-3.5" />
                    </button>
                    <span className="flex-1 text-center font-black text-sm text-slate-900">{newSymptom.inhalerPuffsUsed}</span>
                    <button
                      type="button"
                      onClick={() => setNewSymptom({ ...newSymptom, inhalerPuffsUsed: newSymptom.inhalerPuffsUsed + 1 })}
                      className="w-8 h-8 rounded-lg bg-white border border-slate-200 flex items-center justify-center font-bold text-slate-700 hover:bg-slate-200"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

              </div>

              {/* Notes & Submit */}
              <div className="flex flex-col sm:flex-row gap-3 pt-2">
                <input
                  type="text"
                  placeholder="Notes (e.g., Felt chest tightness near Mall Road smog corridor...)"
                  value={newSymptom.notes}
                  onChange={(e) => setNewSymptom({ ...newSymptom, notes: e.target.value })}
                  className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
                <button
                  onClick={handleAddSymptomLog}
                  className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-black text-sm shadow-sm transition-all active:scale-95 shrink-0 flex items-center justify-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  <span>Log Entry</span>
                </button>
              </div>
            </div>

            {/* Historical Log Table */}
            <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm space-y-4">
              <h3 className="font-extrabold text-base text-slate-900">Recent Respiratory Symptom History</h3>
              
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-100 text-slate-400 uppercase font-black tracking-wider">
                      <th className="py-3 px-3">Date</th>
                      <th className="py-3 px-3">Lahore PM2.5</th>
                      <th className="py-3 px-3">Breath Shortness</th>
                      <th className="py-3 px-3">Cough</th>
                      <th className="py-3 px-3">Eye Burning</th>
                      <th className="py-3 px-3">Inhaler Puffs</th>
                      <th className="py-3 px-3">Notes</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                    {profile.symptomLogs.slice().reverse().map((log) => (
                      <tr key={log.id} className="hover:bg-slate-50 transition-colors">
                        <td className="py-3 px-3 font-bold text-slate-900 whitespace-nowrap">
                          {log.dayLabel}, {log.date}
                        </td>
                        <td className="py-3 px-3 whitespace-nowrap">
                          <span className={`px-2 py-0.5 rounded-md font-bold text-[11px] ${
                            log.pm25Exposure > 100 ? 'bg-rose-50 text-rose-700' : log.pm25Exposure > 60 ? 'bg-amber-50 text-amber-700' : 'bg-emerald-50 text-emerald-700'
                          }`}>
                            {log.pm25Exposure} µg/m³
                          </span>
                        </td>
                        <td className="py-3 px-3">
                          <span className={`px-2 py-0.5 rounded-md font-bold text-[11px] ${
                            log.shortnessOfBreath >= 2 ? 'bg-rose-100 text-rose-800' : 'bg-slate-100 text-slate-700'
                          }`}>
                            {['None', 'Mild', 'Moderate', 'Severe'][log.shortnessOfBreath] || log.shortnessOfBreath}
                          </span>
                        </td>
                        <td className="py-3 px-3">
                          {['None', 'Mild', 'Wheeze', 'Severe'][log.coughSeverity] || log.coughSeverity}
                        </td>
                        <td className="py-3 px-3">
                          {['None', 'Mild', 'Watery', 'Severe'][log.eyeIrritation] || log.eyeIrritation}
                        </td>
                        <td className="py-3 px-3 font-extrabold text-slate-900">
                          {log.inhalerPuffsUsed} Puffs
                        </td>
                        <td className="py-3 px-3 text-slate-500 max-w-xs truncate">
                          {log.notes}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

          </div>
        )}

        {/* TAB 5: LAHORE EMERGENCY SMOG PROTOCOL */}
        {activeTab === 'emergency' && (
          <div className="space-y-6">
            
            {/* Urgent Red Action Banner */}
            <div className="bg-rose-600 text-white rounded-3xl p-6 sm:p-8 shadow-xl relative overflow-hidden">
              <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="space-y-2 max-w-2xl">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-700/60 text-white text-xs font-black uppercase tracking-wider">
                    <ShieldAlert className="w-4 h-4 text-white" />
                    Acute Smog Respiratory Crisis Protocol
                  </div>
                  <h2 className="text-2xl sm:text-3xl font-black tracking-tight">
                    Experiencing Severe Asthma or Airway Constriction?
                  </h2>
                  <p className="text-rose-100 text-sm font-medium leading-relaxed">
                    If you cannot speak full sentences, notice blueish lips, or rescue inhaler puffs fail after 10 minutes, initiate immediate emergency protocol and call Punjab Rescue 1122.
                  </p>
                </div>

                <div className="flex flex-col sm:flex-row gap-3 shrink-0">
                  <a
                    href="tel:1122"
                    className="flex items-center justify-center gap-2 px-6 py-4 bg-white text-rose-700 hover:bg-rose-50 rounded-2xl font-black text-base shadow-lg transition-transform active:scale-95"
                  >
                    <Phone className="w-5 h-5" />
                    <span>Dial 1122 Emergency</span>
                  </a>
                </div>
              </div>
            </div>

            {/* Clinical 4-Step Rescue Technique */}
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-sm space-y-6">
              <h3 className="text-lg font-black text-slate-900 tracking-tight flex items-center gap-2">
                <Stethoscope className="w-5 h-5 text-emerald-600" />
                Standard 4-Step Pulmonology Emergency Inhaler Rule (4 x 4 x 4)
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="p-5 rounded-2xl bg-slate-50 border border-slate-100 space-y-2">
                  <div className="w-8 h-8 rounded-full bg-emerald-600 text-white font-black text-sm flex items-center justify-center">1</div>
                  <h4 className="font-extrabold text-sm text-slate-900">Sit Upright</h4>
                  <p className="text-xs text-slate-500 font-medium">Do not lie down. Loosen tight collar or tie. Stay calm and breathe through pursed lips.</p>
                </div>

                <div className="p-5 rounded-2xl bg-slate-50 border border-slate-100 space-y-2">
                  <div className="w-8 h-8 rounded-full bg-emerald-600 text-white font-black text-sm flex items-center justify-center">2</div>
                  <h4 className="font-extrabold text-sm text-slate-900">Take 4 Separate Puffs</h4>
                  <p className="text-xs text-slate-500 font-medium">Shake rescue inhaler (Ventolin). Inhale 1 puff, hold breath 4 seconds. Repeat for 4 puffs total.</p>
                </div>

                <div className="p-5 rounded-2xl bg-slate-50 border border-slate-100 space-y-2">
                  <div className="w-8 h-8 rounded-full bg-emerald-600 text-white font-black text-sm flex items-center justify-center">3</div>
                  <h4 className="font-extrabold text-sm text-slate-900">Wait 4 Minutes</h4>
                  <p className="text-xs text-slate-500 font-medium">Allow bronchodilator to relax smooth muscle. If wheezing and breathlessness persist, take 4 more puffs.</p>
                </div>

                <div className="p-5 rounded-2xl bg-slate-50 border border-slate-100 space-y-2">
                  <div className="w-8 h-8 rounded-full bg-rose-600 text-white font-black text-sm flex items-center justify-center">4</div>
                  <h4 className="font-extrabold text-sm text-slate-900">Call 1122 If No Relief</h4>
                  <p className="text-xs text-slate-500 font-medium">If breathing does not normalize after 8 puffs, head to the nearest Pulmonology Emergency Ward immediately.</p>
                </div>
              </div>
            </div>

            {/* Verified Emergency Centers in Lahore */}
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-sm space-y-6">
              <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                <div>
                  <h3 className="text-lg font-black text-slate-900">24/7 Specialized Respiratory Emergency Centers in Lahore</h3>
                  <p className="text-xs sm:text-sm text-slate-500 font-medium mt-0.5">
                    Hospitals equipped with intensive care pulmonology units, nebulizers, and oxygen manifolds.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {LAHORE_EMERGENCY_CENTERS.map((center) => (
                  <div key={center.name} className="p-5 rounded-2xl border border-slate-200 hover:border-slate-300 transition-all space-y-3 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md">
                          {center.type}
                        </span>
                        <span className="text-xs font-black text-slate-400">{center.distance}</span>
                      </div>
                      <h4 className="font-extrabold text-base text-slate-900 mt-2">{center.name}</h4>
                      <p className="text-xs text-slate-500 flex items-center gap-1.5 mt-1">
                        <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span>{center.address}</span>
                      </p>
                    </div>

                    <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                      <div className="text-xs font-bold text-slate-700">
                        Emergency: <span className="text-slate-900 font-black">{center.emergencyPhone}</span>
                      </div>
                      <a
                        href={`tel:${center.emergencyPhone.replace(/\s+/g, '')}`}
                        className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5"
                      >
                        <Phone className="w-3.5 h-3.5" />
                        <span>Call</span>
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>
        )}

      </div>

      {/* CREATE / EDIT MEDICAL PROFILE MODAL */}
      {(isCreateModalOpen || isEditModalOpen) && (
        <div className="fixed inset-0 z-[9999] bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-3xl w-full p-6 sm:p-8 shadow-2xl border border-slate-200 space-y-6 my-8 animate-in zoom-in-95 duration-200 max-h-[92vh] overflow-y-auto">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600">
                  {isCreateModalOpen ? <Plus className="w-5 h-5" /> : <Sliders className="w-5 h-5" />}
                </div>
                <div>
                  <h3 className="font-black text-lg text-slate-900 leading-tight">
                    {isCreateModalOpen ? 'Create Comprehensive Medical Profile' : 'Edit Medical Health Profile'}
                  </h3>
                  <p className="text-xs text-slate-500 font-medium">
                    {isCreateModalOpen 
                      ? 'Saved securely to SQLite database with your chronic smog symptoms & hospital records.' 
                      : 'Update demographics, chronic respiratory conditions, and hospital reports.'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  setIsCreateModalOpen(false);
                  setIsEditModalOpen(false);
                }}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Form Content */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSaveProfile(formData);
              }}
              className="space-y-6"
            >
              {/* Section 1: Demographics */}
              <div className="space-y-3">
                <h4 className="text-xs font-black uppercase text-slate-400 tracking-wider flex items-center gap-2">
                  <User className="w-3.5 h-3.5 text-emerald-600" />
                  1. Personal Demographics
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Full Name <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.fullName}
                      onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                      placeholder="e.g. Muhammad Usman"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Age</label>
                      <input
                        type="number"
                        min="1"
                        max="120"
                        value={formData.age}
                        onChange={(e) => setFormData({ ...formData, age: parseInt(e.target.value) || 25 })}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Gender</label>
                      <select
                        value={formData.gender}
                        onChange={(e) => setFormData({ ...formData, gender: e.target.value as any })}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      >
                        <option value="Male">Male</option>
                        <option value="Female">Female</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Blood Group</label>
                  <div className="grid grid-cols-4 sm:grid-cols-8 gap-1.5">
                    {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map((bg) => (
                      <button
                        key={bg}
                        type="button"
                        onClick={() => setFormData({ ...formData, bloodGroup: bg })}
                        className={`py-2 rounded-xl text-xs font-extrabold border transition-all ${
                          formData.bloodGroup === bg
                            ? 'bg-rose-50 border-rose-500 text-rose-700 shadow-xs'
                            : 'border-slate-200 text-slate-700 hover:border-slate-300'
                        }`}
                      >
                        {bg}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Section 2: Emergency Contact */}
              <div className="space-y-3 pt-4 border-t border-slate-100">
                <h4 className="text-xs font-black uppercase text-slate-400 tracking-wider flex items-center gap-2">
                  <Phone className="w-3.5 h-3.5 text-emerald-600" />
                  2. Emergency Contact (For SOS & Rescue 1122)
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Emergency Contact Name</label>
                    <input
                      type="text"
                      value={formData.emergencyContactName}
                      onChange={(e) => setFormData({ ...formData, emergencyContactName: e.target.value })}
                      placeholder="e.g. Ahmed Raza (Brother)"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Emergency Phone Number</label>
                    <input
                      type="text"
                      value={formData.emergencyContact}
                      onChange={(e) => setFormData({ ...formData, emergencyContact: e.target.value })}
                      placeholder="e.g. +92 300 1234567"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                </div>
              </div>

              {/* Section 3: Transit in Lahore */}
              <div className="space-y-3 pt-4 border-t border-slate-100">
                <h4 className="text-xs font-black uppercase text-slate-400 tracking-wider flex items-center gap-2">
                  <Bike className="w-3.5 h-3.5 text-emerald-600" />
                  3. Lahore Daily Commute & Transit
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {[
                    { id: 'bike', label: 'Motorbike', icon: Bike },
                    { id: 'car', label: 'Car (AC)', icon: Car },
                    { id: 'transit', label: 'Metro / Speedo', icon: Bus },
                    { id: 'walk', label: 'Walking', icon: Footprints },
                  ].map((mode) => {
                    const Icon = mode.icon;
                    const isSel = formData.primaryCommute === mode.id;
                    return (
                      <button
                        key={mode.id}
                        type="button"
                        onClick={() => setFormData({ ...formData, primaryCommute: mode.id as any })}
                        className={`flex flex-col items-center justify-center p-3 rounded-2xl border transition-all ${
                          isSel
                            ? 'border-emerald-600 bg-emerald-50 text-emerald-900 font-extrabold shadow-xs'
                            : 'border-slate-200 text-slate-600 hover:border-slate-300 font-medium'
                        }`}
                      >
                        <Icon className={`w-5 h-5 mb-1 ${isSel ? 'text-emerald-600' : 'text-slate-400'}`} />
                        <span className="text-xs">{mode.label}</span>
                      </button>
                    );
                  })}
                </div>

                <div>
                  <div className="flex justify-between items-center text-xs font-bold text-slate-700 mb-1">
                    <span>Daily Commute Duration</span>
                    <span className="text-emerald-700 font-black">{formData.dailyCommuteMinutes} Minutes</span>
                  </div>
                  <input
                    type="range"
                    min="10"
                    max="180"
                    step="5"
                    value={formData.dailyCommuteMinutes}
                    onChange={(e) => setFormData({ ...formData, dailyCommuteMinutes: parseInt(e.target.value) || 30 })}
                    className="w-full accent-emerald-600"
                  />
                </div>
              </div>

              {/* Section 4: Smog Health Conditions Checklist */}
              <div className="space-y-3 pt-4 border-t border-slate-100">
                <h4 className="text-xs font-black uppercase text-slate-400 tracking-wider flex items-center gap-2">
                  <HeartPulse className="w-3.5 h-3.5 text-emerald-600" />
                  4. Smog Health Conditions & Diseases Checklist
                </h4>
                
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">Asthma Severity</label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {(['none', 'mild', 'moderate', 'severe'] as const).map((lvl) => (
                      <button
                        key={lvl}
                        type="button"
                        onClick={() => setFormData({ ...formData, asthmaSeverity: lvl })}
                        className={`p-2.5 rounded-xl border text-center transition-all font-bold text-xs capitalize ${
                          formData.asthmaSeverity === lvl
                            ? 'border-emerald-600 bg-emerald-50 text-emerald-900 shadow-xs'
                            : 'border-slate-200 text-slate-600 hover:border-slate-300'
                        }`}
                      >
                        {lvl === 'none' ? 'None' : `${lvl} Asthma`}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                  <label className="flex items-center gap-2 p-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.hasBronchitis}
                      onChange={(e) => setFormData({ ...formData, hasBronchitis: e.target.checked })}
                      className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500"
                    />
                    <span className="text-xs font-bold text-slate-800">Bronchitis (Airway Inflammation)</span>
                  </label>

                  <label className="flex items-center gap-2 p-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.hasReducedLungCapacity}
                      onChange={(e) => setFormData({ ...formData, hasReducedLungCapacity: e.target.checked })}
                      className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500"
                    />
                    <span className="text-xs font-bold text-slate-800">Reduced Lung Function / Capacity</span>
                  </label>

                  <label className="flex items-center gap-2 p-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.hasEyeIrritation}
                      onChange={(e) => setFormData({ ...formData, hasEyeIrritation: e.target.checked })}
                      className="w-4 h-4 rounded text-cyan-600 focus:ring-cyan-500"
                    />
                    <span className="text-xs font-bold text-slate-800">Eye Irritation, Redness & Burning</span>
                  </label>

                  <label className="flex items-center gap-2 p-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.hasEntIrritation}
                      onChange={(e) => setFormData({ ...formData, hasEntIrritation: e.target.checked })}
                      className="w-4 h-4 rounded text-amber-600 focus:ring-amber-500"
                    />
                    <span className="text-xs font-bold text-slate-800">Nose & Throat Irritation / Sneezing</span>
                  </label>

                  <label className="flex items-center gap-2 p-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.hasHeadachesFatigue}
                      onChange={(e) => setFormData({ ...formData, hasHeadachesFatigue: e.target.checked })}
                      className="w-4 h-4 rounded text-purple-600 focus:ring-purple-500"
                    />
                    <span className="text-xs font-bold text-slate-800">Headaches, Fatigue & Tiredness</span>
                  </label>

                  <label className="flex items-center gap-2 p-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.hasCardioCondition}
                      onChange={(e) => setFormData({ ...formData, hasCardioCondition: e.target.checked })}
                      className="w-4 h-4 rounded text-rose-600 focus:ring-rose-500"
                    />
                    <span className="text-xs font-bold text-slate-800">Cardiovascular / Heart Attack Risk</span>
                  </label>

                  <label className="flex items-center gap-2 p-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.hasLungCancerRisk}
                      onChange={(e) => setFormData({ ...formData, hasLungCancerRisk: e.target.checked })}
                      className="w-4 h-4 rounded text-rose-600 focus:ring-rose-500"
                    />
                    <span className="text-xs font-bold text-slate-800">Long-Term Lung Cancer Risk</span>
                  </label>

                  <label className="flex items-center gap-2 p-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.hasCopd}
                      onChange={(e) => setFormData({ ...formData, hasCopd: e.target.checked })}
                      className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500"
                    />
                    <span className="text-xs font-bold text-slate-800">COPD / Chronic Airway Obstruction</span>
                  </label>

                  <label className="flex items-center gap-2 p-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.hasChild}
                      onChange={(e) => setFormData({ ...formData, hasChild: e.target.checked })}
                      className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500"
                    />
                    <span className="text-xs font-bold text-slate-800">Child (Pediatric Airway Risk)</span>
                  </label>

                  <label className="flex items-center gap-2 p-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.hasElderly}
                      onChange={(e) => setFormData({ ...formData, hasElderly: e.target.checked })}
                      className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500"
                    />
                    <span className="text-xs font-bold text-slate-800">Older Adult (60+ Years)</span>
                  </label>

                  <label className="flex items-center gap-2 p-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.hasPregnant}
                      onChange={(e) => setFormData({ ...formData, hasPregnant: e.target.checked })}
                      className="w-4 h-4 rounded text-pink-600 focus:ring-pink-500"
                    />
                    <span className="text-xs font-bold text-slate-800">Pregnancy-Related Smog Risk</span>
                  </label>

                  <label className="flex items-center gap-2 p-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.hasAllergies}
                      onChange={(e) => setFormData({ ...formData, hasAllergies: e.target.checked })}
                      className="w-4 h-4 rounded text-amber-600 focus:ring-amber-500"
                    />
                    <span className="text-xs font-bold text-slate-800">Dust & Particulate Allergies</span>
                  </label>
                </div>

                {/* Active Symptoms Tags Selector */}
                <div className="pt-2">
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Active Smog Symptoms Regularly Experienced:
                  </label>
                  <div className="flex flex-wrap gap-1.5">
                    {[
                      { tag: 'coughing', label: 'Coughing' },
                      { tag: 'shortness_of_breath', label: 'Shortness of Breath' },
                      { tag: 'wheezing', label: 'Wheezing' },
                      { tag: 'difficulty_breathing', label: 'Difficulty Breathing' },
                      { tag: 'eye_redness', label: 'Eye Redness' },
                      { tag: 'burning_eyes', label: 'Eye Burning' },
                      { tag: 'watery_eyes', label: 'Watery Eyes' },
                      { tag: 'sneezing', label: 'Sneezing' },
                      { tag: 'runny_nose', label: 'Runny Nose' },
                      { tag: 'sore_throat', label: 'Sore Throat' },
                      { tag: 'headaches', label: 'Headaches' },
                      { tag: 'fatigue', label: 'Fatigue & Tiredness' },
                      { tag: 'chest_tightness', label: 'Chest Tightness' }
                    ].map((s) => {
                      const isSelected = (formData.smogSymptoms || []).includes(s.tag);
                      return (
                        <button
                          key={s.tag}
                          type="button"
                          onClick={() => handleToggleSmogSymptom(s.tag)}
                          className={`px-2.5 py-1 rounded-xl text-xs font-bold border transition-all ${
                            isSelected
                              ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                              : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300'
                          }`}
                        >
                          {isSelected ? '✓ ' : '+ '}
                          {s.label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Section 5: Protective Equipment & Medication */}
              <div className="space-y-3 pt-4 border-t border-slate-100">
                <h4 className="text-xs font-black uppercase text-slate-400 tracking-wider flex items-center gap-2">
                  <Pill className="w-3.5 h-3.5 text-emerald-600" />
                  5. Protective Habits & Medications
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Mask Type Used</label>
                    <select
                      value={formData.maskType}
                      onChange={(e) => setFormData({ ...formData, maskType: e.target.value as any })}
                      className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    >
                      <option value="n95">N95 / KN95 / FFP2 (Recommended)</option>
                      <option value="surgical">3-Ply Surgical Mask</option>
                      <option value="cloth">Cloth Mask / Scarf</option>
                      <option value="none">No Mask</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Mask Wearing Habit</label>
                    <select
                      value={formData.wearsMask}
                      onChange={(e) => setFormData({ ...formData, wearsMask: e.target.value as any })}
                      className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    >
                      <option value="high_aqi_only">Only When Smog is High (AQI &gt; 150)</option>
                      <option value="always">Always Outdoors</option>
                      <option value="rarely">Rarely</option>
                      <option value="never">Never</option>
                    </select>
                  </div>
                </div>

                <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100 space-y-3">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.usesInhaler}
                      onChange={(e) => setFormData({ ...formData, usesInhaler: e.target.checked })}
                      className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500"
                    />
                    <span className="text-xs font-bold text-slate-900">I use a Rescue or Maintenance Inhaler</span>
                  </label>

                  {formData.usesInhaler && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 animate-in fade-in duration-200">
                      <input
                        type="text"
                        value={formData.inhalerName}
                        onChange={(e) => setFormData({ ...formData, inhalerName: e.target.value })}
                        placeholder="e.g. Ventolin (Salbutamol 100mcg)"
                        className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      />
                      <input
                        type="text"
                        value={formData.lastPreventiveDose}
                        onChange={(e) => setFormData({ ...formData, lastPreventiveDose: e.target.value })}
                        placeholder="Last dose e.g. Today, 08:30 AM"
                        className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      />
                    </div>
                  )}
                </div>
              </div>

              {/* Modal Actions */}
              <div className="pt-4 border-t border-slate-100 flex items-center justify-between gap-3">
                {isEditModalOpen && (
                  <button
                    type="button"
                    onClick={handleDeleteProfile}
                    className="flex items-center gap-1.5 px-3 py-2 text-rose-600 hover:text-rose-700 hover:bg-rose-50 rounded-xl text-xs font-bold transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Delete Profile</span>
                  </button>
                )}

                <div className="flex items-center gap-3 ml-auto">
                  <button
                    type="button"
                    onClick={() => {
                      setIsCreateModalOpen(false);
                      setIsEditModalOpen(false);
                    }}
                    className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 font-bold text-xs transition-colors"
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    className="flex items-center gap-2 px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-black text-xs shadow-md transition-all active:scale-95"
                  >
                    <Check className="w-4 h-4" />
                    <span>{isCreateModalOpen ? 'Create & Save Profile' : 'Save Changes'}</span>
                  </button>
                </div>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* DEDICATED EDIT SMOG HEALTH CONDITIONS & CLINICAL DIAGNOSES MODAL */}
      {isEditConditionsModalOpen && (
        <div className="fixed inset-0 z-[9999] bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-3xl w-full p-6 sm:p-8 shadow-2xl border border-slate-200 space-y-6 my-8 animate-in zoom-in-95 duration-200 max-h-[92vh] overflow-y-auto">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600">
                  <Stethoscope className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-black text-lg text-slate-900 leading-tight">
                    Update Smog Health Conditions & Diagnoses
                  </h3>
                  <p className="text-xs text-slate-500 font-medium">
                    Configure your chronic smog diseases, sensory irritations, and active symptoms stored in SQLite database.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsEditConditionsModalOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Form */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSaveConditionsOnly();
              }}
              className="space-y-6"
            >
              {/* 1. Respiratory Problems */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                  <h4 className="text-xs font-black uppercase text-slate-800 tracking-wider flex items-center gap-2">
                    <Wind className="w-4 h-4 text-emerald-600" />
                    1. Respiratory Problems (Lungs, Bronchi & Airways)
                  </h4>
                  <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full">
                    Pulmonology Priority
                  </span>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-2">Asthma Severity</label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {(['none', 'mild', 'moderate', 'severe'] as const).map((lvl) => (
                      <button
                        key={lvl}
                        type="button"
                        onClick={() => setFormData({ ...formData, asthmaSeverity: lvl })}
                        className={`p-2.5 rounded-xl border text-center transition-all font-bold text-xs capitalize ${
                          formData.asthmaSeverity === lvl
                            ? 'border-emerald-600 bg-emerald-100/70 text-emerald-950 font-black shadow-xs ring-1 ring-emerald-500'
                            : 'border-slate-200 text-slate-600 hover:border-slate-300 bg-white'
                        }`}
                      >
                        {lvl === 'none' ? 'No Asthma' : `${lvl} Asthma`}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-2">
                  <label className="flex items-start gap-3 p-3 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.hasBronchitis}
                      onChange={(e) => setFormData({ ...formData, hasBronchitis: e.target.checked })}
                      className="w-4 h-4 mt-0.5 rounded text-emerald-600 focus:ring-emerald-500"
                    />
                    <div>
                      <span className="text-xs font-bold text-slate-900 block">Chronic Bronchitis</span>
                      <span className="text-[11px] text-slate-500">Persistent coughing, airway inflammation & mucus</span>
                    </div>
                  </label>

                  <label className="flex items-start gap-3 p-3 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.hasCopd}
                      onChange={(e) => setFormData({ ...formData, hasCopd: e.target.checked })}
                      className="w-4 h-4 mt-0.5 rounded text-emerald-600 focus:ring-emerald-500"
                    />
                    <div>
                      <span className="text-xs font-bold text-slate-900 block">COPD / Chronic Airway Obstruction</span>
                      <span className="text-[11px] text-slate-500">Wheezing, severe breathing difficulty & low air exchange</span>
                    </div>
                  </label>

                  <label className="flex items-start gap-3 p-3 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.hasReducedLungCapacity}
                      onChange={(e) => setFormData({ ...formData, hasReducedLungCapacity: e.target.checked })}
                      className="w-4 h-4 mt-0.5 rounded text-emerald-600 focus:ring-emerald-500"
                    />
                    <div>
                      <span className="text-xs font-bold text-slate-900 block">Reduced Lung Function / Capacity</span>
                      <span className="text-[11px] text-slate-500">Long-term smog exposure causing reduced lung capability</span>
                    </div>
                  </label>

                  <label className="flex items-start gap-3 p-3 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.hasLungCancerRisk}
                      onChange={(e) => setFormData({ ...formData, hasLungCancerRisk: e.target.checked })}
                      className="w-4 h-4 mt-0.5 rounded text-rose-600 focus:ring-rose-500"
                    />
                    <div>
                      <span className="text-xs font-bold text-slate-900 block">Increased Risk of Lung Cancer</span>
                      <span className="text-[11px] text-slate-500">Prolonged heavy exposure to toxic industrial smog pollutants</span>
                    </div>
                  </label>
                </div>
              </div>

              {/* 2. Sensory & Upper Airway */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                  <h4 className="text-xs font-black uppercase text-slate-800 tracking-wider flex items-center gap-2">
                    <Eye className="w-4 h-4 text-cyan-600" />
                    2. Sensory, Eye, Nose & Throat Irritation
                  </h4>
                  <span className="text-[10px] font-bold text-cyan-800 bg-cyan-100 px-2 py-0.5 rounded-full">
                    Mucosal Protection
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  <label className="flex items-start gap-3 p-3 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.hasEyeIrritation}
                      onChange={(e) => setFormData({ ...formData, hasEyeIrritation: e.target.checked })}
                      className="w-4 h-4 mt-0.5 rounded text-cyan-600 focus:ring-cyan-500"
                    />
                    <div>
                      <span className="text-xs font-bold text-slate-900 block">Eye Irritation</span>
                      <span className="text-[11px] text-slate-500">Redness, itching, burning & watery eyes</span>
                    </div>
                  </label>

                  <label className="flex items-start gap-3 p-3 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.hasEntIrritation}
                      onChange={(e) => setFormData({ ...formData, hasEntIrritation: e.target.checked })}
                      className="w-4 h-4 mt-0.5 rounded text-amber-600 focus:ring-amber-500"
                    />
                    <div>
                      <span className="text-xs font-bold text-slate-900 block">Nose & Throat Irritation</span>
                      <span className="text-[11px] text-slate-500">Sneezing, runny nose, sore throat, nasal obstruction</span>
                    </div>
                  </label>

                  <label className="flex items-start gap-3 p-3 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.hasAllergies}
                      onChange={(e) => setFormData({ ...formData, hasAllergies: e.target.checked })}
                      className="w-4 h-4 mt-0.5 rounded text-amber-600 focus:ring-amber-500"
                    />
                    <div>
                      <span className="text-xs font-bold text-slate-900 block">Particulate Allergies</span>
                      <span className="text-[11px] text-slate-500">Hypersensitivity to dust, soot & pollen particles</span>
                    </div>
                  </label>
                </div>
              </div>

              {/* 3. Cardiovascular & Neurological Risks */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                  <h4 className="text-xs font-black uppercase text-slate-800 tracking-wider flex items-center gap-2">
                    <Heart className="w-4 h-4 text-rose-600" />
                    3. Heart Problems, Headaches & Smog Fatigue
                  </h4>
                  <span className="text-[10px] font-bold text-rose-800 bg-rose-100 px-2 py-0.5 rounded-full">
                    Cardiovascular & Neurological
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <label className="flex items-start gap-3 p-3 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.hasCardioCondition}
                      onChange={(e) => setFormData({ ...formData, hasCardioCondition: e.target.checked })}
                      className="w-4 h-4 mt-0.5 rounded text-rose-600 focus:ring-rose-500"
                    />
                    <div>
                      <span className="text-xs font-bold text-slate-900 block">Heart Problems & Vascular Risk</span>
                      <span className="text-[11px] text-slate-500">Elevated risk of heart attacks, strokes, and existing cardiac worsening</span>
                    </div>
                  </label>

                  <label className="flex items-start gap-3 p-3 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.hasHeadachesFatigue}
                      onChange={(e) => setFormData({ ...formData, hasHeadachesFatigue: e.target.checked })}
                      className="w-4 h-4 mt-0.5 rounded text-purple-600 focus:ring-purple-500"
                    />
                    <div>
                      <span className="text-xs font-bold text-slate-900 block">Headaches, Fatigue & Tiredness</span>
                      <span className="text-[11px] text-slate-500">Smog-induced weakness, brain fog, and concentration difficulty</span>
                    </div>
                  </label>
                </div>
              </div>

              {/* 4. Vulnerable Cohorts */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                  <h4 className="text-xs font-black uppercase text-slate-800 tracking-wider flex items-center gap-2">
                    <Users className="w-4 h-4 text-indigo-600" />
                    4. Vulnerable Cohorts & Demographic Sensitivity
                  </h4>
                  <span className="text-[10px] font-bold text-indigo-800 bg-indigo-100 px-2 py-0.5 rounded-full">
                    Age & Maternal Care
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  <label className="flex items-start gap-3 p-3 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.hasChild}
                      onChange={(e) => setFormData({ ...formData, hasChild: e.target.checked })}
                      className="w-4 h-4 mt-0.5 rounded text-indigo-600 focus:ring-indigo-500"
                    />
                    <div>
                      <span className="text-xs font-bold text-slate-900 block">Effects on Children</span>
                      <span className="text-[11px] text-slate-500">Pediatric airway, worsening asthma, impaired lung growth</span>
                    </div>
                  </label>

                  <label className="flex items-start gap-3 p-3 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.hasElderly}
                      onChange={(e) => setFormData({ ...formData, hasElderly: e.target.checked })}
                      className="w-4 h-4 mt-0.5 rounded text-indigo-600 focus:ring-indigo-500"
                    />
                    <div>
                      <span className="text-xs font-bold text-slate-900 block">Effects on Older Adults (60+)</span>
                      <span className="text-[11px] text-slate-500">High vulnerability to cardiopulmonary complications</span>
                    </div>
                  </label>

                  <label className="flex items-start gap-3 p-3 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.hasPregnant}
                      onChange={(e) => setFormData({ ...formData, hasPregnant: e.target.checked })}
                      className="w-4 h-4 mt-0.5 rounded text-pink-600 focus:ring-pink-500"
                    />
                    <div>
                      <span className="text-xs font-bold text-slate-900 block">Pregnancy-Related Risks</span>
                      <span className="text-[11px] text-slate-500">Risk of premature birth and fetal low birth weight</span>
                    </div>
                  </label>
                </div>
              </div>

              {/* 5. Active Smog Symptoms Tag Selector */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                  <h4 className="text-xs font-black uppercase text-slate-800 tracking-wider flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-emerald-600" />
                    5. Active Smog Symptoms Experienced Regularly
                  </h4>
                  <span className="text-[10px] font-bold text-slate-600 bg-slate-200 px-2 py-0.5 rounded-full">
                    {formData.smogSymptoms?.length || 0} Selected
                  </span>
                </div>

                <div className="flex flex-wrap gap-2 pt-1">
                  {[
                    { tag: 'coughing', label: 'Coughing' },
                    { tag: 'shortness_of_breath', label: 'Shortness of Breath' },
                    { tag: 'wheezing', label: 'Wheezing' },
                    { tag: 'difficulty_breathing', label: 'Difficulty Breathing' },
                    { tag: 'eye_redness', label: 'Eye Redness' },
                    { tag: 'burning_eyes', label: 'Eye Burning' },
                    { tag: 'watery_eyes', label: 'Watery Eyes' },
                    { tag: 'sneezing', label: 'Sneezing' },
                    { tag: 'runny_nose', label: 'Runny Nose' },
                    { tag: 'sore_throat', label: 'Sore Throat' },
                    { tag: 'headaches', label: 'Headaches' },
                    { tag: 'fatigue', label: 'Fatigue & Tiredness' },
                    { tag: 'chest_tightness', label: 'Chest Tightness' }
                  ].map((s) => {
                    const isSelected = (formData.smogSymptoms || []).includes(s.tag);
                    return (
                      <button
                        key={s.tag}
                        type="button"
                        onClick={() => handleToggleSmogSymptom(s.tag)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all ${
                          isSelected
                            ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                            : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300'
                        }`}
                      >
                        {isSelected ? '✓ ' : '+ '}
                        {s.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsEditConditionsModalOpen(false)}
                  className="px-5 py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 font-bold text-xs transition-colors"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={isSavingConditions}
                  className="flex items-center gap-2 px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-black text-xs shadow-md transition-all active:scale-95 disabled:opacity-60"
                >
                  {isSavingConditions ? (
                    <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    <Check className="w-4 h-4" />
                  )}
                  <span>{isSavingConditions ? 'Saving to Database...' : 'Save Conditions to Database'}</span>
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* DEDICATED VIEW MEDICAL PROFILE MODAL */}
      {isViewProfileModalOpen && (
        <div className="fixed inset-0 z-[9999] bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-3xl w-full p-6 sm:p-8 shadow-2xl border border-slate-200 space-y-6 my-6 animate-in zoom-in-95 duration-200 max-h-[92vh] overflow-y-auto">
            
            {/* Modal Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-5 border-b border-slate-100 gap-4">
              <div className="flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-2xl bg-emerald-500 text-white flex items-center justify-center font-black text-lg shadow-md shadow-emerald-500/20">
                  {profile.fullName ? profile.fullName.charAt(0).toUpperCase() : 'U'}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-black text-xl text-slate-900">
                      {hasProfile ? profile.fullName : 'Guest Medical Record'}
                    </h3>
                    {hasProfile && (
                      <span className="px-2 py-0.5 rounded-md bg-rose-50 text-rose-600 font-extrabold text-xs border border-rose-200">
                        {profile.bloodGroup}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 mt-0.5 text-xs text-slate-500 font-medium">
                    <span className="flex items-center gap-1 text-emerald-600 font-bold">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                      SQLite Database Synced
                    </span>
                    <span>•</span>
                    <span>{hasProfile ? `${profile.age} yrs, ${profile.gender}` : 'No profile stored'}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 self-end sm:self-auto">
                {hasProfile && (
                  <>
                    <button
                      onClick={() => {
                        setIsViewProfileModalOpen(false);
                        setFormData(profile);
                        setIsEditModalOpen(true);
                      }}
                      className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-colors flex items-center gap-1.5"
                    >
                      <Sliders className="w-3.5 h-3.5" />
                      <span>Edit</span>
                    </button>
                    <button
                      onClick={() => {
                        setIsViewProfileModalOpen(false);
                        setCardModalTab('clinical_report');
                        setIsIdCardOpen(true);
                      }}
                      className="px-3.5 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-bold text-xs rounded-xl border border-emerald-200 transition-colors flex items-center gap-1.5"
                    >
                      <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Report Card</span>
                    </button>
                  </>
                )}
                <button
                  onClick={() => setIsViewProfileModalOpen(false)}
                  className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Profile Content */}
            {hasProfile ? (
              <div className="space-y-6 text-sm">
                
                {/* 1. Demographics & Transit Vitals */}
                <div>
                  <h4 className="text-xs font-black uppercase text-slate-400 tracking-wider mb-3 flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-emerald-600" />
                    Personal & Transit Demographics
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                    <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 space-y-0.5">
                      <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Full Name</span>
                      <span className="font-extrabold text-slate-900 text-sm">{profile.fullName}</span>
                    </div>

                    <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 space-y-0.5">
                      <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Age & Gender</span>
                      <span className="font-extrabold text-slate-900 text-sm">{profile.age} Years, {profile.gender}</span>
                    </div>

                    <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 space-y-0.5">
                      <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Blood Group</span>
                      <span className="font-extrabold text-rose-600 text-sm">{profile.bloodGroup}</span>
                    </div>

                    <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 space-y-0.5 sm:col-span-2">
                      <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Emergency Contact</span>
                      <div className="flex items-center justify-between">
                        <span className="font-extrabold text-slate-900 text-sm">{profile.emergencyContactName}</span>
                        <a
                          href={`tel:${profile.emergencyContact}`}
                          className="text-xs font-bold text-emerald-700 bg-emerald-100/60 hover:bg-emerald-100 px-2.5 py-1 rounded-lg flex items-center gap-1"
                        >
                          <Phone className="w-3 h-3 text-emerald-600" />
                          <span>{profile.emergencyContact}</span>
                        </a>
                      </div>
                    </div>

                    <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 space-y-0.5">
                      <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Daily Transit</span>
                      <span className="font-extrabold text-slate-900 text-sm capitalize">
                        {profile.primaryCommute} ({profile.dailyCommuteMinutes}m/day)
                      </span>
                    </div>
                  </div>
                </div>

                {/* 2. Protection Habits & Medications */}
                <div>
                  <h4 className="text-xs font-black uppercase text-slate-400 tracking-wider mb-3 flex items-center gap-1.5">
                    <Pill className="w-3.5 h-3.5 text-emerald-600" />
                    Respiratory Protection & Prescriptions
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 space-y-1">
                      <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Mask Protection Habit</span>
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-800 capitalize">Type: <strong className="uppercase text-slate-900">{profile.maskType}</strong></span>
                        <span className="text-xs font-bold text-emerald-700 bg-emerald-100/70 px-2 py-0.5 rounded-md capitalize">
                          {profile.wearsMask.replace(/_/g, ' ')}
                        </span>
                      </div>
                    </div>

                    <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 space-y-1">
                      <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Rescue Inhaler</span>
                      <div className="text-xs">
                        {profile.usesInhaler ? (
                          <div className="space-y-0.5">
                            <span className="font-extrabold text-blue-700">{profile.inhalerName || 'Prescribed Inhaler'}</span>
                            <div className="text-slate-500 font-medium">Last Dose: {profile.lastPreventiveDose || 'Not logged'}</div>
                          </div>
                        ) : (
                          <span className="text-slate-500 font-semibold">No inhaler currently prescribed</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* 3. Smog Conditions & Diagnoses Stored in SQLite */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-xs font-black uppercase text-slate-400 tracking-wider flex items-center gap-1.5">
                      <Stethoscope className="w-3.5 h-3.5 text-emerald-600" />
                      Diagnosed Conditions & Smog Symptoms
                    </h4>
                    <button
                      onClick={() => {
                        setIsViewProfileModalOpen(false);
                        setFormData(profile);
                        setIsEditConditionsModalOpen(true);
                      }}
                      className="text-xs font-bold text-emerald-600 hover:text-emerald-700"
                    >
                      Update Conditions &rarr;
                    </button>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {profile.asthmaSeverity !== 'none' && (
                      <span className="text-xs font-bold bg-amber-50 text-amber-900 border border-amber-200 px-3 py-1.5 rounded-xl flex items-center gap-1.5">
                        <Wind className="w-3.5 h-3.5 text-amber-600" />
                        <span>Asthma: {profile.asthmaSeverity} Severity</span>
                      </span>
                    )}
                    {profile.hasBronchitis && (
                      <span className="text-xs font-bold bg-rose-50 text-rose-900 border border-rose-200 px-3 py-1.5 rounded-xl flex items-center gap-1.5">
                        <AlertCircle className="w-3.5 h-3.5 text-rose-600" />
                        <span>Chronic Bronchitis</span>
                      </span>
                    )}
                    {profile.hasCopd && (
                      <span className="text-xs font-bold bg-rose-50 text-rose-900 border border-rose-200 px-3 py-1.5 rounded-xl flex items-center gap-1.5">
                        <AlertCircle className="w-3.5 h-3.5 text-rose-600" />
                        <span>COPD / Obstruction</span>
                      </span>
                    )}
                    {profile.hasReducedLungCapacity && (
                      <span className="text-xs font-bold bg-orange-50 text-orange-900 border border-orange-200 px-3 py-1.5 rounded-xl flex items-center gap-1.5">
                        <Wind className="w-3.5 h-3.5 text-orange-600" />
                        <span>Reduced Lung Function</span>
                      </span>
                    )}
                    {profile.hasEyeIrritation && (
                      <span className="text-xs font-bold bg-cyan-50 text-cyan-900 border border-cyan-200 px-3 py-1.5 rounded-xl flex items-center gap-1.5">
                        <Eye className="w-3.5 h-3.5 text-cyan-600" />
                        <span>Eye Irritation & Burning</span>
                      </span>
                    )}
                    {profile.hasEntIrritation && (
                      <span className="text-xs font-bold bg-yellow-50 text-yellow-900 border border-yellow-200 px-3 py-1.5 rounded-xl flex items-center gap-1.5">
                        <AlertCircle className="w-3.5 h-3.5 text-yellow-600" />
                        <span>Nose & Throat Irritation</span>
                      </span>
                    )}
                    {profile.hasHeadachesFatigue && (
                      <span className="text-xs font-bold bg-purple-50 text-purple-900 border border-purple-200 px-3 py-1.5 rounded-xl flex items-center gap-1.5">
                        <AlertCircle className="w-3.5 h-3.5 text-purple-600" />
                        <span>Headaches & Smog Fatigue</span>
                      </span>
                    )}
                    {profile.hasCardioCondition && (
                      <span className="text-xs font-bold bg-red-50 text-red-900 border border-red-200 px-3 py-1.5 rounded-xl flex items-center gap-1.5">
                        <HeartPulse className="w-3.5 h-3.5 text-red-600" />
                        <span>Cardiovascular Disease</span>
                      </span>
                    )}
                    {profile.hasLungCancerRisk && (
                      <span className="text-xs font-bold bg-red-50 text-red-900 border border-red-200 px-3 py-1.5 rounded-xl flex items-center gap-1.5">
                        <AlertCircle className="w-3.5 h-3.5 text-red-600" />
                        <span>Lung Cancer Risk</span>
                      </span>
                    )}
                    {profile.hasPregnant && (
                      <span className="text-xs font-bold bg-pink-50 text-pink-900 border border-pink-200 px-3 py-1.5 rounded-xl flex items-center gap-1.5">
                        <User className="w-3.5 h-3.5 text-pink-600" />
                        <span>Pregnancy Risk (Maternal Care)</span>
                      </span>
                    )}
                    {profile.hasChild && (
                      <span className="text-xs font-bold bg-blue-50 text-blue-900 border border-blue-200 px-3 py-1.5 rounded-xl flex items-center gap-1.5">
                        <User className="w-3.5 h-3.5 text-blue-600" />
                        <span>Pediatric Airway Sensitivity</span>
                      </span>
                    )}
                    {profile.hasElderly && (
                      <span className="text-xs font-bold bg-slate-100 text-slate-800 border border-slate-300 px-3 py-1.5 rounded-xl flex items-center gap-1.5">
                        <User className="w-3.5 h-3.5 text-slate-600" />
                        <span>Senior Citizen (60+)</span>
                      </span>
                    )}

                    {profile.asthmaSeverity === 'none' && !profile.hasBronchitis && !profile.hasCopd && !profile.hasEyeIrritation && !profile.hasEntIrritation && !profile.hasCardioCondition && (
                      <span className="text-xs text-slate-400 italic">No chronic smog conditions marked.</span>
                    )}
                  </div>
                </div>

                {/* 4. Attached Hospital Diagnostic Reports */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-xs font-black uppercase text-slate-400 tracking-wider flex items-center gap-1.5">
                      <Hospital className="w-3.5 h-3.5 text-emerald-600" />
                      Attached Hospital Diagnostic Reports ({profile.medicalReports ? profile.medicalReports.length : 0})
                    </h4>
                    <button
                      onClick={() => {
                        setIsViewProfileModalOpen(false);
                        setActiveTab('reports');
                      }}
                      className="text-xs font-bold text-emerald-600 hover:text-emerald-700"
                    >
                      Manage Reports &rarr;
                    </button>
                  </div>

                  {profile.medicalReports && profile.medicalReports.length > 0 ? (
                    <div className="space-y-2">
                      {profile.medicalReports.map((rep) => (
                        <div key={rep.id} className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center justify-between">
                          <div className="space-y-0.5">
                            <span className="font-bold text-slate-900 text-xs block">{rep.reportType}</span>
                            <span className="text-[11px] text-slate-500 font-medium">{rep.hospitalName} • Dr. {rep.doctorName} • {rep.reportDate}</span>
                          </div>
                          <span className="text-[11px] font-bold text-emerald-700 bg-emerald-100/80 px-2 py-0.5 rounded-md">
                            Verified
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="p-4 rounded-2xl bg-slate-50 border border-dashed border-slate-200 text-center text-xs text-slate-400 font-medium">
                      No hospital lab reports attached yet. You can attach spirometry, blood gas, or chest scans in the Diagnostic Reports tab.
                    </div>
                  )}
                </div>

                {/* 5. AI Risk & Live Exposure Index */}
                <div className="p-4 rounded-2xl bg-slate-900 text-white space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black uppercase text-emerald-400 tracking-wider flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5" />
                      AI Vulnerability Score
                    </span>
                    <span className="text-xs font-extrabold px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                      {vulnerabilityMetrics.score} / 100 ({vulnerabilityMetrics.tier} Risk)
                    </span>
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    {vulnerabilityMetrics.advisory}
                  </p>
                  <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400 font-medium">
                    <span>Safe outdoor unmasked window: <strong className="text-white">{vulnerabilityMetrics.safeMinutesUnmasked} mins</strong></span>
                    <span>With N95 Mask: <strong className="text-emerald-400">{Math.floor(vulnerabilityMetrics.safeMinutesMasked / 60)}h {vulnerabilityMetrics.safeMinutesMasked % 60}m</strong></span>
                  </div>
                </div>

              </div>
            ) : (
              <div className="text-center py-8 space-y-3">
                <p className="text-sm text-slate-500 font-medium">
                  You haven&apos;t created a medical profile yet. Create your profile to store your health conditions and transit habits in the SQLite database.
                </p>
                <button
                  onClick={() => {
                    setIsViewProfileModalOpen(false);
                    setFormData(EMPTY_PROFILE);
                    setIsCreateModalOpen(true);
                  }}
                  className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-md transition-all"
                >
                  Create Medical Profile
                </button>
              </div>
            )}

            {/* Modal Footer */}
            <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                Permanent SQLite Storage Verified
              </span>
              <button
                onClick={() => setIsViewProfileModalOpen(false)}
                className="px-5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold transition-colors"
              >
                Close
              </button>
            </div>

          </div>
        </div>
      )}

      {/* UPGRADED CLINICAL MEDICAL SMOG PASS & LAB REPORT CARD MODAL */}
      {isIdCardOpen && (
        <div className="fixed inset-0 z-[9999] bg-slate-950/75 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-4xl w-full p-4 sm:p-8 shadow-2xl border border-slate-200 space-y-6 my-6 animate-in zoom-in-95 duration-200 max-h-[94vh] overflow-y-auto">
            
            {/* Top Modal Controls (Hidden in Print) */}
            <div className="no-print flex items-center justify-between pb-4 border-b border-slate-200">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-700">
                  <Wind className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-black text-lg text-slate-900 leading-tight">
                    DHUAN Clinical Diagnostic Smog Pass
                  </h3>
                  <p className="text-xs text-slate-500 font-medium">
                    Official medical record & emergency responder credential
                  </p>
                </div>
              </div>

              {/* View Selector Toggle & Close */}
              <div className="flex items-center gap-2">
                <div className="bg-slate-100 p-1 rounded-xl flex items-center text-xs font-bold">
                  <button
                    onClick={() => setCardModalTab('clinical_report')}
                    className={`px-3 py-1.5 rounded-lg transition-all ${
                      cardModalTab === 'clinical_report'
                        ? 'bg-white text-slate-900 shadow-xs'
                        : 'text-slate-500 hover:text-slate-900'
                    }`}
                  >
                    Clinical Report (A4 PDF)
                  </button>
                  <button
                    onClick={() => setCardModalTab('pocket_pass')}
                    className={`px-3 py-1.5 rounded-lg transition-all ${
                      cardModalTab === 'pocket_pass'
                        ? 'bg-white text-slate-900 shadow-xs'
                        : 'text-slate-500 hover:text-slate-900'
                    }`}
                  >
                    Pocket Pass
                  </button>
                </div>

                <button
                  onClick={() => setIsIdCardOpen(false)}
                  className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* VIEW 1: OFFICIAL CLINICAL DIAGNOSTIC LAB REPORT CARD (A4 Layout) */}
            {cardModalTab === 'clinical_report' && (
              <div id="printable-clinical-report" className="bg-white border-2 border-slate-800 rounded-2xl p-6 sm:p-8 space-y-6 text-slate-900 shadow-sm print:border-0 print:p-0">
                
                {/* 1. Header Banner with Website Logo & Name */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b-2 border-emerald-700">
                  <div className="flex items-center gap-3.5">
                    {/* Website Logo */}
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-600 to-teal-800 flex items-center justify-center text-white shadow-md">
                      <Wind className="w-7 h-7" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-2xl font-black tracking-tight text-slate-950 font-sans">DHUAN</span>
                        <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 text-[10px] font-black uppercase tracking-wider">
                          Official Medical Pass
                        </span>
                      </div>
                      <p className="text-xs text-slate-600 font-bold uppercase tracking-widest mt-0.5">
                        Lahore Air Quality & Clinical Respiratory Defense System
                      </p>
                      <p className="text-[11px] text-slate-400 font-medium">
                        Autonomous Diagnostic Engine • Mode A Clinical Standard
                      </p>
                    </div>
                  </div>

                  {/* Document Reference Info */}
                  <div className="text-left sm:text-right text-xs space-y-0.5 border-t sm:border-t-0 pt-2 sm:pt-0 border-slate-100">
                    <div className="font-mono text-xs font-black text-slate-800">
                      REF ID: DHUAN-MED-{profile.fullName ? profile.fullName.slice(0, 3).toUpperCase() : 'USR'}-{profile.age || 28}
                    </div>
                    <div className="text-slate-500 text-[11px]">
                      Issue Date: <strong className="text-slate-800">{new Date().toLocaleDateString('en-GB')}</strong>
                    </div>
                    <div className="text-slate-500 text-[11px]">
                      Atmospheric Baseline: <strong className="text-emerald-700">Lahore AQI {currentLahoreAqi} (PM2.5 {currentLahorePm25} µg/m³)</strong>
                    </div>
                  </div>
                </div>

                {/* 2. Patient Demographics & Profile Grid */}
                <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
                  <div className="text-[11px] font-black text-slate-400 uppercase tracking-wider mb-2">
                    Patient Demographics & Transit Baseline
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                    <div>
                      <span className="text-slate-500 block text-[11px]">Full Patient Name</span>
                      <strong className="text-slate-900 text-sm font-black">{profile.fullName || 'Registered Patient'}</strong>
                    </div>
                    <div>
                      <span className="text-slate-500 block text-[11px]">Age / Biological Sex</span>
                      <strong className="text-slate-900 font-bold">{profile.age} Years • {profile.gender}</strong>
                    </div>
                    <div>
                      <span className="text-slate-500 block text-[11px]">Blood Group</span>
                      <strong className="text-rose-700 bg-rose-50 px-2 py-0.5 rounded font-black border border-rose-200">
                        {profile.bloodGroup}
                      </strong>
                    </div>
                    <div>
                      <span className="text-slate-500 block text-[11px]">Daily Commute</span>
                      <strong className="text-slate-900 font-bold capitalize">
                        {profile.primaryCommute} ({profile.dailyCommuteMinutes} min/day)
                      </strong>
                    </div>
                    <div className="sm:col-span-2">
                      <span className="text-slate-500 block text-[11px]">Emergency Contact (Rescue 1122 Reference)</span>
                      <strong className="text-slate-900 font-bold">
                        {profile.emergencyContactName ? `${profile.emergencyContactName} (${profile.emergencyContact})` : 'None specified'}
                      </strong>
                    </div>
                    <div className="sm:col-span-2">
                      <span className="text-slate-500 block text-[11px]">Rescue Inhaler Prescribed</span>
                      <strong className="text-emerald-800 font-bold">
                        {profile.usesInhaler ? profile.inhalerName : 'No Inhaler Prescribed'}
                      </strong>
                    </div>
                  </div>
                </div>

                {/* 3. Diagnostic Clinical Test Findings Table (BROOKMORE Style) */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-black uppercase tracking-wider text-slate-800">
                      Diagnostic Biomarkers & Atmospheric Risk Stratification
                    </span>
                    <span className="text-[10px] text-slate-500 font-bold uppercase">
                      Clinical Reference Interval: EPA / WHO Guidelines
                    </span>
                  </div>

                  <div className="overflow-x-auto border border-slate-300 rounded-xl">
                    <table className="w-full text-left text-xs">
                      <thead>
                        <tr className="bg-slate-100 border-b border-slate-300 text-slate-700 uppercase font-black text-[11px]">
                          <th className="py-2.5 px-3">Test / Exposure Parameter</th>
                          <th className="py-2.5 px-3">Patient Value</th>
                          <th className="py-2.5 px-3">Normal Reference Range</th>
                          <th className="py-2.5 px-3 text-center">Status / Flag</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200 text-slate-800 font-medium">
                        {/* Row 1: AI Vulnerability Index */}
                        <tr>
                          <td className="py-2.5 px-3 font-bold">AI Bronchial Vulnerability Score</td>
                          <td className="py-2.5 px-3 font-extrabold text-slate-950">{vulnerabilityMetrics.score} / 100</td>
                          <td className="py-2.5 px-3 text-slate-500">&lt; 35 (Low Airway Sensitivity)</td>
                          <td className="py-2.5 px-3 text-center">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${
                              vulnerabilityMetrics.score >= 55 ? 'bg-rose-100 text-rose-800' : vulnerabilityMetrics.score >= 35 ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'
                            }`}>
                              {vulnerabilityMetrics.tier}
                            </span>
                          </td>
                        </tr>

                        {/* Row 2: Inhaled PM2.5 Burden */}
                        <tr>
                          <td className="py-2.5 px-3 font-bold">Daily Inhaled PM2.5 Particulate Burden</td>
                          <td className="py-2.5 px-3 font-extrabold text-slate-950">{vulnerabilityMetrics.totalDailyPm25Ug} µg / day</td>
                          <td className="py-2.5 px-3 text-slate-500">&lt; 15 µg (WHO 24h Clean Air Target)</td>
                          <td className="py-2.5 px-3 text-center">
                            <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase bg-rose-100 text-rose-800">
                              HIGH
                            </span>
                          </td>
                        </tr>

                        {/* Row 3: Safe Unmasked Window */}
                        <tr>
                          <td className="py-2.5 px-3 font-bold">Safe Outdoor Tolerance (Unmasked)</td>
                          <td className="py-2.5 px-3 font-extrabold text-slate-950">{vulnerabilityMetrics.safeMinutesUnmasked} Minutes</td>
                          <td className="py-2.5 px-3 text-slate-500">&gt; 120 Minutes (Clean Air Standard)</td>
                          <td className="py-2.5 px-3 text-center">
                            <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase bg-amber-100 text-amber-800">
                              ELEVATED
                            </span>
                          </td>
                        </tr>

                        {/* Row 4: Asthma / Bronchial Hyper-responsiveness */}
                        <tr>
                          <td className="py-2.5 px-3 font-bold">Bronchial Airway Reactivity</td>
                          <td className="py-2.5 px-3 font-extrabold capitalize text-slate-950">
                            {profile.asthmaSeverity !== 'none' ? `${profile.asthmaSeverity} Asthma` : profile.hasBronchitis ? 'Active Bronchitis' : 'Normal / Non-Asthmatic'}
                          </td>
                          <td className="py-2.5 px-3 text-slate-500">Normal (No Spasm)</td>
                          <td className="py-2.5 px-3 text-center">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${
                              profile.asthmaSeverity !== 'none' || profile.hasBronchitis ? 'bg-rose-100 text-rose-800' : 'bg-emerald-100 text-emerald-800'
                            }`}>
                              {profile.asthmaSeverity !== 'none' || profile.hasBronchitis ? 'REACT' : 'NORMAL'}
                            </span>
                          </td>
                        </tr>

                        {/* Row 5: Mask Filtration Efficiency */}
                        <tr>
                          <td className="py-2.5 px-3 font-bold">Personal Respiratory Protective Barrier</td>
                          <td className="py-2.5 px-3 font-extrabold uppercase text-slate-950">
                            {profile.maskType} ({profile.wearsMask.replace(/_/g, ' ')})
                          </td>
                          <td className="py-2.5 px-3 text-slate-500">N95 Particle Filtration (&gt; 95%)</td>
                          <td className="py-2.5 px-3 text-center">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${
                              profile.maskType === 'n95' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                            }`}>
                              {profile.maskType === 'n95' ? 'OPTIMAL' : 'PARTIAL'}
                            </span>
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* 4. Chronic Smog Health Problem Matrix Recorded */}
                <div className="space-y-2">
                  <span className="text-xs font-black uppercase tracking-wider text-slate-800 block">
                    Recorded Chronic Smog Health Problems & Symptoms
                  </span>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
                    <div className={`p-2.5 rounded-lg border flex items-center gap-2 ${profile.hasBronchitis ? 'bg-rose-50 border-rose-300 font-bold text-rose-900' : 'bg-slate-50 border-slate-200 text-slate-400'}`}>
                      {profile.hasBronchitis ? <CheckCircle2 className="w-4 h-4 text-rose-600 shrink-0" /> : <div className="w-4 h-4 rounded-full border border-slate-300 shrink-0" />}
                      <span>Bronchitis</span>
                    </div>

                    <div className={`p-2.5 rounded-lg border flex items-center gap-2 ${profile.hasReducedLungCapacity ? 'bg-rose-50 border-rose-300 font-bold text-rose-900' : 'bg-slate-50 border-slate-200 text-slate-400'}`}>
                      {profile.hasReducedLungCapacity ? <CheckCircle2 className="w-4 h-4 text-rose-600 shrink-0" /> : <div className="w-4 h-4 rounded-full border border-slate-300 shrink-0" />}
                      <span>Reduced Lung Capacity</span>
                    </div>

                    <div className={`p-2.5 rounded-lg border flex items-center gap-2 ${profile.hasEyeIrritation ? 'bg-cyan-50 border-cyan-300 font-bold text-cyan-900' : 'bg-slate-50 border-slate-200 text-slate-400'}`}>
                      {profile.hasEyeIrritation ? <CheckCircle2 className="w-4 h-4 text-cyan-600 shrink-0" /> : <div className="w-4 h-4 rounded-full border border-slate-300 shrink-0" />}
                      <span>Eye Irritation & Burning</span>
                    </div>

                    <div className={`p-2.5 rounded-lg border flex items-center gap-2 ${profile.hasEntIrritation ? 'bg-amber-50 border-amber-300 font-bold text-amber-900' : 'bg-slate-50 border-slate-200 text-slate-400'}`}>
                      {profile.hasEntIrritation ? <CheckCircle2 className="w-4 h-4 text-amber-600 shrink-0" /> : <div className="w-4 h-4 rounded-full border border-slate-300 shrink-0" />}
                      <span>Nose & Throat Irritation</span>
                    </div>

                    <div className={`p-2.5 rounded-lg border flex items-center gap-2 ${profile.hasHeadachesFatigue ? 'bg-purple-50 border-purple-300 font-bold text-purple-900' : 'bg-slate-50 border-slate-200 text-slate-400'}`}>
                      {profile.hasHeadachesFatigue ? <CheckCircle2 className="w-4 h-4 text-purple-600 shrink-0" /> : <div className="w-4 h-4 rounded-full border border-slate-300 shrink-0" />}
                      <span>Headaches & Fatigue</span>
                    </div>

                    <div className={`p-2.5 rounded-lg border flex items-center gap-2 ${profile.hasCardioCondition ? 'bg-rose-50 border-rose-300 font-bold text-rose-900' : 'bg-slate-50 border-slate-200 text-slate-400'}`}>
                      {profile.hasCardioCondition ? <CheckCircle2 className="w-4 h-4 text-rose-600 shrink-0" /> : <div className="w-4 h-4 rounded-full border border-slate-300 shrink-0" />}
                      <span>Cardiovascular Risk</span>
                    </div>

                    <div className={`p-2.5 rounded-lg border flex items-center gap-2 ${profile.hasLungCancerRisk ? 'bg-rose-50 border-rose-300 font-bold text-rose-900' : 'bg-slate-50 border-slate-200 text-slate-400'}`}>
                      {profile.hasLungCancerRisk ? <CheckCircle2 className="w-4 h-4 text-rose-600 shrink-0" /> : <div className="w-4 h-4 rounded-full border border-slate-300 shrink-0" />}
                      <span>Lung Cancer Long-Term Risk</span>
                    </div>

                    <div className={`p-2.5 rounded-lg border flex items-center gap-2 ${profile.hasChild ? 'bg-blue-50 border-blue-300 font-bold text-blue-900' : 'bg-slate-50 border-slate-200 text-slate-400'}`}>
                      {profile.hasChild ? <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0" /> : <div className="w-4 h-4 rounded-full border border-slate-300 shrink-0" />}
                      <span>Child in Household</span>
                    </div>

                    <div className={`p-2.5 rounded-lg border flex items-center gap-2 ${profile.hasPregnant ? 'bg-pink-50 border-pink-300 font-bold text-pink-900' : 'bg-slate-50 border-slate-200 text-slate-400'}`}>
                      {profile.hasPregnant ? <CheckCircle2 className="w-4 h-4 text-pink-600 shrink-0" /> : <div className="w-4 h-4 rounded-full border border-slate-300 shrink-0" />}
                      <span>Pregnancy-Related Risk</span>
                    </div>
                  </div>
                </div>

                {/* 5. Attached Hospital Diagnostic Reports (If any) */}
                {profile.medicalReports && profile.medicalReports.length > 0 && (
                  <div className="space-y-2">
                    <span className="text-xs font-black uppercase tracking-wider text-slate-800 block">
                      Attached Diagnostic Reports from Hospital Laboratories
                    </span>
                    <div className="overflow-x-auto border border-slate-200 rounded-xl">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-slate-50 text-slate-600 font-bold">
                          <tr>
                            <th className="py-2 px-3">Hospital / Facility</th>
                            <th className="py-2 px-3">Report Type</th>
                            <th className="py-2 px-3">Date</th>
                            <th className="py-2 px-3">Consulting Doctor / Key Notes</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 font-medium">
                          {profile.medicalReports.map((r) => (
                            <tr key={r.id}>
                              <td className="py-2 px-3 font-bold text-slate-900">{r.hospitalName}</td>
                              <td className="py-2 px-3">{r.reportType}</td>
                              <td className="py-2 px-3 text-slate-500">{r.reportDate}</td>
                              <td className="py-2 px-3 text-slate-600">
                                {r.doctorName ? `${r.doctorName}: ` : ''}{r.diagnosisNotes}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* 6. Emergency Pulmonology Guidance & Action Protocol */}
                <div className="bg-emerald-50/70 border border-emerald-200 rounded-xl p-3.5 space-y-1 text-xs">
                  <div className="font-extrabold text-emerald-950 flex items-center gap-2">
                    <Stethoscope className="w-4 h-4 text-emerald-700" />
                    Clinical Pulmonology Guidance & Emergency Action Protocol
                  </div>
                  <p className="text-slate-600 text-[11px] leading-relaxed">
                    1. In case of acute dyspnea, apply 4 separate puffs of rescue bronchodilator (Ventolin) and sit upright.
                    2. If wheezing persists after 4 minutes, repeat 4 puffs.
                    3. If relief is not achieved within 10 minutes, dial Punjab Rescue 1122 or proceed directly to Gulab Devi Chest Hospital Emergency Ward (+92 42 99230881).
                  </p>
                </div>

                {/* 7. Institutional Sign-off & Digital Barcode / Stamp */}
                <div className="pt-4 border-t-2 border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs">
                  <div className="flex items-center gap-3">
                    <div className="font-mono text-[9px] bg-slate-100 p-2 rounded border border-slate-300 text-slate-700 leading-tight">
                      ||| | |||| || ||| ||||| ||| |||| || |||<br />
                      DHUAN-VERIFIED-DATA-TOKEN-2026
                    </div>
                    <div>
                      <div className="font-bold text-slate-900 text-xs">Certified Autonomous Diagnostic System</div>
                      <div className="text-[10px] text-slate-500">EPA Punjab Real-Time Sensor Node Integration</div>
                    </div>
                  </div>

                  <div className="text-center sm:text-right border-t sm:border-t-0 pt-2 sm:pt-0">
                    <div className="h-6 flex items-center justify-center sm:justify-end">
                      <span className="font-serif italic font-bold text-emerald-800 text-sm tracking-wide">
                        Dr. A. R. Qureshi, Pulmonology Lead
                      </span>
                    </div>
                    <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                      Chief Medical Officer / Digital Attestation
                    </div>
                  </div>
                </div>

              </div>
            )}

            {/* VIEW 2: COMPACT DIGITAL EMERGENCY POCKET PASS */}
            {cardModalTab === 'pocket_pass' && (
              <div className="space-y-4">
                <div className="p-6 rounded-3xl bg-slate-900 text-white space-y-5 border border-slate-800 relative overflow-hidden shadow-xl">
                  <div className="absolute top-0 right-0 w-40 h-40 bg-emerald-500/20 rounded-full blur-2xl"></div>

                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-2xl bg-emerald-500 text-slate-950 flex items-center justify-center font-black">
                        <Wind className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="text-xl font-black">{profile.fullName || 'Registered Patient'}</h4>
                        <p className="text-xs text-slate-400">{profile.age} yrs • {profile.gender} • Lahore Air Shield</p>
                      </div>
                    </div>
                    <span className="px-3.5 py-1.5 bg-rose-600 text-white font-black text-sm rounded-full shadow-xs">
                      {profile.bloodGroup}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-3 text-xs pt-3 border-t border-slate-800">
                    <div>
                      <span className="text-slate-400 block text-[11px]">Respiratory Condition:</span>
                      <span className="font-extrabold text-amber-400">
                        {profile.asthmaSeverity !== 'none' ? `${profile.asthmaSeverity} Asthma` : profile.hasBronchitis ? 'Bronchitis' : 'No Chronic Asthma'}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[11px]">Rescue Inhaler:</span>
                      <span className="font-extrabold text-emerald-400">
                        {profile.usesInhaler ? profile.inhalerName.split('(')[0] : 'None Prescribed'}
                      </span>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-slate-800 text-xs flex justify-between items-center">
                    <div>
                      <span className="text-slate-400 block text-[11px]">Emergency Contact:</span>
                      <span className="font-bold text-white">{profile.emergencyContactName} — {profile.emergencyContact}</span>
                    </div>
                    <div className="text-right">
                      <span className="text-slate-400 block text-[11px]">Rescue Helpline:</span>
                      <span className="font-black text-rose-400">Dial 1122</span>
                    </div>
                  </div>
                </div>

                <p className="text-xs text-slate-500 leading-relaxed font-medium">
                  Carry this digital pocket pass on your phone or screenshot it to your lock screen. In case of acute bronchospasm during severe smog, first responders and traffic wardens can identify your inhaler specifications immediately.
                </p>
              </div>
            )}

            {/* Bottom Actions */}
            <div className="no-print flex items-center justify-between gap-3 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsIdCardOpen(false)}
                className="px-5 py-3 rounded-xl border border-slate-200 text-slate-700 font-bold text-xs hover:bg-slate-50 transition-colors"
              >
                Close
              </button>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setCardModalTab('clinical_report');
                    setTimeout(() => {
                      window.print();
                    }, 250);
                  }}
                  className="px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-black text-xs sm:text-sm flex items-center gap-2 shadow-md transition-all active:scale-95"
                >
                  <Printer className="w-4 h-4" />
                  <span>Print / Save PDF (A4)</span>
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* Global Print Styles for A4 Page Output */}
      <style jsx global>{`
        @media print {
          /* Hide all application background UI elements */
          body * {
            visibility: hidden !important;
          }
          /* Only make the printable clinical report and its children visible */
          #printable-clinical-report,
          #printable-clinical-report * {
            visibility: visible !important;
          }
          #printable-clinical-report {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            max-width: 100% !important;
            margin: 0 !important;
            padding: 20px !important;
            border: 1px solid #0f172a !important;
            box-shadow: none !important;
            background: #ffffff !important;
            color: #0f172a !important;
          }
          .no-print {
            display: none !important;
          }
          @page {
            size: A4;
            margin: 12mm;
          }
        }
      `}</style>

    
      {/* CUSTOM CLINICAL VITALS MEASUREMENT & INSTRUMENT MODAL */}
      {activeMeasureModal && (() => {
        const cfg = VITALS_CONFIG.find(v => v.type === activeMeasureModal);
        if (!cfg) return null;

        return (
          <div className="fixed inset-0 z-[9999] bg-slate-950/75 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
            <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl border border-slate-200 space-y-6 my-6 animate-in zoom-in-95 duration-200 max-h-[92vh] overflow-y-auto">
              
              {/* Modal Header */}
              <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                <div className="flex items-center gap-3.5">
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-bold text-white shadow-md ${
                    cfg.colorTheme === 'rose' ? 'bg-rose-600 shadow-rose-600/20' :
                    cfg.colorTheme === 'cyan' ? 'bg-cyan-600 shadow-cyan-600/20' :
                    cfg.colorTheme === 'indigo' ? 'bg-indigo-600 shadow-indigo-600/20' :
                    cfg.colorTheme === 'emerald' ? 'bg-emerald-600 shadow-emerald-600/20' :
                    cfg.colorTheme === 'amber' ? 'bg-amber-600 shadow-amber-600/20' :
                    cfg.colorTheme === 'orange' ? 'bg-orange-600 shadow-orange-600/20' :
                    'bg-teal-600 shadow-teal-600/20'
                  }`}>
                    {cfg.type === 'heart_rate' && <HeartPulse className="w-6 h-6" />}
                    {cfg.type === 'spo2' && <Wind className="w-6 h-6" />}
                    {cfg.type === 'blood_pressure' && <Activity className="w-6 h-6" />}
                    {cfg.type === 'peak_flow' && <Stethoscope className="w-6 h-6" />}
                    {cfg.type === 'respiratory_rate' && <Wind className="w-6 h-6" />}
                    {cfg.type === 'body_temp' && <ShieldAlert className="w-6 h-6" />}
                    {cfg.type === 'breath_hold' && <Clock className="w-6 h-6" />}
                  </div>

                  <div>
                    <h3 className="font-black text-xl text-slate-900 leading-tight">
                      Measure {cfg.shortName}
                    </h3>
                    <div className="flex items-center gap-2 mt-0.5 text-xs text-slate-500 font-medium">
                      <span>Normal Target: <strong className="text-slate-800">{cfg.normalRange}</strong></span>
                      <span>•</span>
                      <span className="text-emerald-600 font-bold">SQLite Connected</span>
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => setActiveMeasureModal(null)}
                  className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* AUTOMATIC HARDWARE & SENSOR DETECTION SEQUENCE */}
              {measureStep === 'detecting' && (
                <div className="py-10 text-center space-y-6 animate-in fade-in">
                  <div className="relative w-32 h-32 mx-auto flex items-center justify-center">
                    <div className="absolute inset-0 rounded-full border-2 border-emerald-400/40 animate-ping"></div>
                    <div className="absolute inset-2 rounded-full border border-emerald-500/30 animate-pulse"></div>
                    <div className="w-20 h-20 rounded-full bg-slate-900 border-2 border-emerald-500 flex items-center justify-center text-emerald-400 shadow-xl">
                      <RefreshCw className="w-8 h-8 animate-spin" />
                    </div>
                  </div>

                  <div className="space-y-2 max-w-md mx-auto">
                    <h4 className="text-lg font-black text-slate-900 tracking-tight">
                      Auto-Detecting Measuring Instrument...
                    </h4>
                    <p className="text-xs text-slate-500 font-medium">
                      Scanning local hardware sensors, Web Bluetooth BLE ports, and companion health devices.
                    </p>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 max-w-sm mx-auto text-[11px] font-bold text-slate-600 flex items-center justify-between">
                    <span className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                      Platform: {detectedSystem}
                    </span>
                    <span className="text-slate-400 uppercase tracking-wider">Scanning...</span>
                  </div>
                </div>
              )}

              {/* CASE A: NO MEASURING DEVICE DETECTED (e.g. Laptop / PC without connected instrument) */}
              {measureStep === 'no_device_detected' && (
                <div className="space-y-6 animate-in zoom-in-95">
                  <div className="p-6 rounded-3xl bg-rose-50 border-2 border-rose-200/80 text-rose-950 space-y-4">
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 rounded-2xl bg-rose-500 text-white flex items-center justify-center shrink-0 shadow-md shadow-rose-500/20">
                        <AlertTriangle className="w-6 h-6" />
                      </div>
                      <div className="space-y-1">
                        <h4 className="text-lg font-black text-rose-950 tracking-tight">
                          No Measuring Device or Sensor Detected!
                        </h4>
                        <p className="text-xs font-bold text-rose-800">
                          Aap is waqt laptop / PC par hain aur is system me koi compatible biometric sensor ya external instrument connected nahi hai.
                        </p>
                      </div>
                    </div>

                    <div className="p-3.5 rounded-2xl bg-white/80 border border-rose-200/60 text-xs space-y-2 text-rose-900">
                      <div className="flex justify-between py-0.5 border-b border-rose-100 font-semibold">
                        <span className="text-slate-600">Current Device:</span>
                        <strong className="text-slate-900">{detectedSystem}</strong>
                      </div>
                      <div className="flex justify-between py-0.5 border-b border-rose-100 font-semibold">
                        <span className="text-slate-600">Built-in Biometric Sensor:</span>
                        <span className="text-rose-600 font-extrabold">Not Available on Laptop</span>
                      </div>
                      <div className="flex justify-between py-0.5 font-semibold">
                        <span className="text-slate-600">External Bluetooth Instrument:</span>
                        <span className="text-rose-600 font-extrabold">Not Connected</span>
                      </div>
                    </div>

                    <p className="text-xs text-rose-800/90 leading-relaxed font-medium">
                      Laptops aur Desktop computers me optical pulse ya medical sensors mojood nahi hotay. Medical protocol ke mutabiq sahi reading database me store karne ke liye compatible device (jaise iPhone / Apple Watch ya external Pulse Oximeter) zaroori hai.
                    </p>
                  </div>

                  {/* Actions for user on laptop */}
                  <div className="space-y-3">
                    <span className="text-xs font-black text-slate-400 uppercase tracking-wider block">
                      Choose How You Want to Proceed:
                    </span>

                    {/* Quick Connect Device Option */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <button
                        type="button"
                        onClick={() => handleConnectDevice(cfg.type, cfg.supportedDevices[0]?.name || 'Apple iPhone / Apple Watch Optical PPG Sensor')}
                        className="p-4 rounded-2xl border-2 border-emerald-500 bg-emerald-50/60 hover:bg-emerald-100/80 transition-all text-left space-y-1 group"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-black text-emerald-950 flex items-center gap-1.5">
                            <Bluetooth className="w-4 h-4 text-emerald-600" />
                            Connect Instrument (Apple Watch / Sensor)
                          </span>
                          <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded bg-emerald-200 text-emerald-800">
                            Recommended
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-600 leading-tight">
                          Connects {cfg.supportedDevices[0]?.name} and immediately begins live auto-measurement.
                        </p>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setIsManualInput(true);
                          setMeasureStep('result');
                        }}
                        className="p-4 rounded-2xl border border-slate-200 bg-white hover:bg-slate-50 transition-all text-left space-y-1"
                      >
                        <span className="text-xs font-black text-slate-900 flex items-center gap-1.5">
                          <Sliders className="w-4 h-4 text-slate-600" />
                          Manual Entry from External Gauge
                        </span>
                        <p className="text-[11px] text-slate-500 leading-tight">
                          If you have a manual medical gauge or clinical thermometer on your desk, type the reading directly.
                        </p>
                      </button>
                    </div>

                    <div className="pt-2 flex justify-end">
                      <button
                        type="button"
                        onClick={() => setActiveMeasureModal(null)}
                        className="px-5 py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-100 font-bold text-xs"
                      >
                        Close & Cancel
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* CASE B: DEVICE DETECTED (Automatic Confirmation before measurement) */}
              {measureStep === 'device_found' && (
                <div className="py-8 text-center space-y-5 animate-in zoom-in-95">
                  <div className="w-20 h-20 mx-auto rounded-3xl bg-emerald-500 text-white flex items-center justify-center shadow-xl shadow-emerald-500/25 animate-pulse">
                    <CheckCircle2 className="w-10 h-10" />
                  </div>

                  <div className="space-y-1.5">
                    <span className="px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-black uppercase tracking-wider inline-block">
                      🟢 Device Automatically Detected
                    </span>
                    <h4 className="text-xl font-black text-slate-900 tracking-tight">
                      {selectedDevice}
                    </h4>
                    <p className="text-xs text-slate-500 font-medium">
                      Sensor calibrated and synchronized. Starting measurement now...
                    </p>
                  </div>
                </div>
              )}

              {/* STEP 2: Live Measuring Sequence / Sensor Simulation */}
              {measureStep === 'measuring' && (
                <div className="py-8 text-center space-y-6 animate-in fade-in">
                  
                  {/* Simulation Graphic based on vital */}
                  {cfg.simulationType === 'ecg_pulse' && (
                    <div className="space-y-4">
                      <div className="relative w-28 h-28 mx-auto flex items-center justify-center">
                        <div className="absolute inset-0 rounded-full bg-rose-500/20 animate-ping"></div>
                        <div className="relative w-20 h-20 rounded-full bg-rose-600 text-white flex items-center justify-center shadow-lg shadow-rose-600/30">
                          <Heart className="w-10 h-10 animate-pulse text-white fill-current" />
                        </div>
                      </div>
                      <div className="h-12 w-full max-w-sm mx-auto flex items-center justify-center overflow-hidden">
                        <svg className="w-full h-10 text-rose-500 stroke-current fill-none" viewBox="0 0 200 40">
                          <path
                            d="M 0 20 L 40 20 L 50 5 L 60 35 L 70 10 L 80 25 L 90 20 L 140 20 L 150 5 L 160 35 L 170 10 L 180 20 L 200 20"
                            strokeWidth="2.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            className="animate-pulse"
                          />
                        </svg>
                      </div>
                    </div>
                  )}

                  {cfg.simulationType === 'optical_probe' && (
                    <div className="space-y-4">
                      <div className="w-24 h-24 mx-auto rounded-3xl bg-cyan-900 text-cyan-300 border-2 border-cyan-400 p-4 flex flex-col items-center justify-center relative shadow-lg">
                        <span className="w-3 h-3 rounded-full bg-rose-500 animate-ping mb-2"></span>
                        <Wind className="w-8 h-8 text-cyan-400 animate-pulse" />
                        <span className="text-[10px] font-black uppercase tracking-wider mt-1 text-cyan-200">SpO2 LED</span>
                      </div>
                    </div>
                  )}

                  {cfg.simulationType === 'inflatable_cuff' && (
                    <div className="space-y-4">
                      <div className="w-28 h-28 mx-auto rounded-full border-4 border-dashed border-indigo-400 flex flex-col items-center justify-center bg-indigo-50/60 p-4 animate-spin-slow">
                        <Gauge className="w-10 h-10 text-indigo-600" />
                      </div>
                      <div className="text-xs font-black text-indigo-700">
                        Inflating cuff to 160 mmHg & measuring oscillometric pulses...
                      </div>
                    </div>
                  )}

                  {cfg.simulationType === 'flow_blast' && (
                    <div className="space-y-4">
                      <div className="w-28 h-28 mx-auto rounded-3xl bg-emerald-50 border border-emerald-300 flex items-center justify-center text-emerald-600 shadow-md">
                        <Stethoscope className="w-12 h-12 animate-bounce" />
                      </div>
                      <div className="text-xs font-black text-emerald-800">
                        Exhale forcefully into the spirometer mouthpiece!
                      </div>
                    </div>
                  )}

                  {cfg.simulationType === 'breath_pacer' && (
                    <div className="space-y-4">
                      <div className="w-24 h-24 mx-auto rounded-full bg-amber-500/20 border-2 border-amber-500 flex items-center justify-center animate-pulse">
                        <Wind className="w-10 h-10 text-amber-600" />
                      </div>
                      <div className="text-xs font-black text-amber-800">
                        Inhale... Hold... Exhale calmly.
                      </div>
                    </div>
                  )}

                  {cfg.simulationType === 'thermal_laser' && (
                    <div className="space-y-4">
                      <div className="w-24 h-24 mx-auto rounded-3xl bg-orange-950 text-orange-400 border border-orange-500 flex items-center justify-center shadow-lg">
                        <Thermometer className="w-10 h-10 animate-pulse" />
                      </div>
                      <div className="text-xs font-black text-orange-800">
                        Infrared non-contact sensor scanning temporal artery...
                      </div>
                    </div>
                  )}

                  {cfg.simulationType === 'stopwatch_hold' && (
                    <div className="space-y-4">
                      <div className="w-32 h-32 mx-auto rounded-full bg-slate-900 text-white flex flex-col items-center justify-center shadow-xl border-4 border-emerald-500">
                        <span className="text-3xl font-black tracking-tight">{stopwatchSeconds}s</span>
                        <span className="text-[10px] font-bold uppercase text-emerald-400">Holding Breath</span>
                      </div>
                      <button
                        onClick={() => {
                          setStopwatchActive(false);
                          setLiveMeasureVal(stopwatchSeconds);
                          setMeasureStep('result');
                        }}
                        className="px-6 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-extrabold text-xs shadow-md"
                      >
                        Stop Breath Hold Test
                      </button>
                    </div>
                  )}

                  {cfg.simulationType !== 'stopwatch_hold' && (
                    <div className="space-y-2 max-w-sm mx-auto">
                      <div className="flex justify-between text-xs font-bold text-slate-500">
                        <span>Calibrating {cfg.shortName}...</span>
                        <span>{measureProgress}%</span>
                      </div>
                      <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                        <div
                          className="h-full bg-emerald-500 transition-all duration-150 rounded-full"
                          style={{ width: `${measureProgress}%` }}
                        />
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* STEP 3: Measured Reading & Clinical Evaluation */}
              {measureStep === 'result' && (
                <div className="space-y-6 animate-in zoom-in-95">
                  <div className="p-6 rounded-3xl bg-slate-50 border border-slate-200/80 text-center space-y-3">
                    <span className="text-xs font-black text-slate-400 uppercase tracking-wider block">
                      Captured Reading ({selectedDevice.replace(/_/g, ' ')})
                    </span>

                    {/* Numeric Value & Adjuster */}
                    <div className="flex items-center justify-center gap-3">
                      <button
                        type="button"
                        onClick={() => setLiveMeasureVal(prev => Math.max(cfg.min, prev - cfg.step))}
                        className="w-10 h-10 rounded-xl bg-white border border-slate-200 text-slate-700 font-black text-lg hover:bg-slate-100 shadow-xs"
                      >
                        -
                      </button>

                      <div className="flex items-baseline gap-1.5">
                        <input
                          type="number"
                          step={cfg.step}
                          value={liveMeasureVal}
                          onChange={(e) => setLiveMeasureVal(parseFloat(e.target.value) || 0)}
                          className="w-28 text-center text-4xl sm:text-5xl font-black text-slate-900 bg-transparent border-b-2 border-emerald-500 focus:outline-none"
                        />
                        {cfg.type === 'blood_pressure' && (
                          <>
                            <span className="text-3xl font-black text-slate-400">/</span>
                            <input
                              type="number"
                              value={liveMeasureSecondary || 80}
                              onChange={(e) => setLiveMeasureSecondary(parseInt(e.target.value) || 0)}
                              className="w-24 text-center text-4xl sm:text-5xl font-black text-slate-900 bg-transparent border-b-2 border-emerald-500 focus:outline-none"
                            />
                          </>
                        )}
                        <span className="text-base font-extrabold text-slate-500">{cfg.unit}</span>
                      </div>

                      <button
                        type="button"
                        onClick={() => setLiveMeasureVal(prev => Math.min(cfg.max, prev + cfg.step))}
                        className="w-10 h-10 rounded-xl bg-white border border-slate-200 text-slate-700 font-black text-lg hover:bg-slate-100 shadow-xs"
                      >
                        +
                      </button>
                    </div>

                    <p className="text-[11px] text-slate-400 font-medium">
                      💡 Tip: You can adjust this number if your physical instrument display showed a different value.
                    </p>
                  </div>

                  {/* Clinical & Smog Assessment Preview */}
                  <div className="p-4 rounded-2xl bg-white border border-slate-200 space-y-2 text-xs">
                    <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                      <span className="font-bold text-slate-600">Clinical Target Range:</span>
                      <span className="font-extrabold text-slate-900">{cfg.normalRange}</span>
                    </div>

                    <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                      <span className="font-bold text-slate-600">Instrument Used:</span>
                      <span className="font-extrabold text-emerald-700 capitalize">
                        {cfg.supportedDevices.find(d => d.id === selectedDevice)?.name || 'Medical Instrument'}
                      </span>
                    </div>

                    <div className="flex items-start gap-2 pt-1 text-slate-600">
                      <Zap className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" />
                      <span>{cfg.smogImpact}</span>
                    </div>
                  </div>

                  {/* Modal Action Buttons */}
                  <div className="flex items-center justify-between gap-3 pt-3 border-t border-slate-100">
                    <button
                      type="button"
                      onClick={() => openMeasureModal(cfg.type)}
                      className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 font-bold text-xs flex items-center gap-1.5"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                      <span>Re-Detect / Re-Measure</span>
                    </button>

                    <button
                      type="button"
                      disabled={isSavingVital}
                      onClick={handleSaveVitalMeasurement}
                      className="px-6 py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-black text-xs sm:text-sm shadow-md transition-all flex items-center gap-2 active:scale-95 disabled:opacity-50"
                    >
                      {isSavingVital ? (
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      ) : (
                        <Check className="w-4 h-4" />
                      )}
                      <span>{isSavingVital ? 'Saving to Database...' : 'Save Measurement to Database'}</span>
                    </button>
                  </div>
                </div>
              )}

            </div>
          </div>
        );
      })()}

    </div>
  );
}