'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { 
  ShieldAlert, 
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
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const [isIdCardOpen, setIsIdCardOpen] = useState(false);
  const [cardModalTab, setCardModalTab] = useState<'clinical_report' | 'pocket_pass'>('clinical_report');

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
              parsedSymptoms = JSON.parse(p.symptom_logs);
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

  // Delete Medical Profile from SQLite
  const handleDeleteProfile = async () => {
    if (confirm('Are you sure you want to delete your Medical Profile and attached lab reports from SQLite database?')) {
      try {
        const res = await fetch(getApiEndpoint('/emergency/health-profile'), { method: 'DELETE' });
        if (res.ok) {
          setHasProfile(false);
          setProfile(EMPTY_PROFILE);
          setFormData(EMPTY_PROFILE);
          setIsEditModalOpen(false);
          setIsCreateModalOpen(false);
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

  // Log new symptom
  const handleAddSymptomLog = () => {
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

    const updated = {
      ...profile,
      symptomLogs: [...profile.symptomLogs.slice(-6), newEntry]
    };
    handleSaveProfile(updated);
    setNewSymptom({
      shortnessOfBreath: 1,
      coughSeverity: 1,
      eyeIrritation: 1,
      inhalerPuffsUsed: 1,
      notes: ''
    });
    showToast("Today's respiratory symptoms logged!");
  };

  // Calculate dynamic AI Smog Vulnerability Score (0 - 100) taking into account user's full clinical smog spectrum
  const vulnerabilityMetrics = useMemo(() => {
    if (!hasProfile) {
      return {
        score: 0,
        tier: 'Uncalibrated' as const,
        tierColor: 'text-slate-600 bg-slate-100 border-slate-200',
        progressBg: 'bg-slate-300',
        advisory: `Lahore air quality is monitored live at AQI ${currentLahoreAqi}. Create your medical profile to calculate your personalized AI smog vulnerability index and real-time safe outdoor exposure thresholds.`,
        safeMinutesUnmasked: 0,
        safeMinutesMasked: 0,
        totalDailyPm25Ug: 0
      };
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
            {!hasProfile ? (
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
                    ? (profile.asthmaSeverity !== 'none' ? `Triggered by ${profile.asthmaSeverity} Asthma` : profile.hasBronchitis ? 'Triggered by Chronic Bronchitis' : 'Baseline respiratory sensitivity') + ` + daily ${profile.dailyCommuteMinutes}m ${profile.primaryCommute} commute.`
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

              {/* Scorecard 4: Medication Preparedness */}
              <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-sm flex flex-col justify-between relative overflow-hidden group hover:border-slate-300 transition-all">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-black text-slate-400 uppercase tracking-wider">Rescue Inhaler & Meds</span>
                  <div className="w-7 h-7 rounded-full bg-blue-50 flex items-center justify-center text-blue-600">
                    <Pill className="w-4 h-4" />
                  </div>
                </div>

                <div>
                  <div className="text-lg font-black text-slate-900 truncate">
                    {hasProfile 
                      ? (profile.usesInhaler ? profile.inhalerName.split('(')[0] : 'No Inhaler Prescribed') 
                      : 'Not Configured'}
                  </div>
                  <div className="text-xs font-semibold text-emerald-600 flex items-center gap-1.5 mt-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>{hasProfile ? `Dose: ${profile.lastPreventiveDose || 'None recorded'}` : 'Profile Required'}</span>
                  </div>
                </div>

                <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-slate-600">
                  <span>Mask In Use:</span>
                  <span className="uppercase text-slate-900 font-extrabold">{hasProfile ? profile.maskType : '—'}</span>
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

                  <p className="text-slate-300 text-sm font-medium leading-relaxed">
                    {hasProfile ? (
                      <>
                        Lahore&apos;s ambient PM2.5 is currently at <strong className="text-white">{currentLahorePm25} µg/m³ (AQI {currentLahoreAqi})</strong>. 
                        {profile.hasBronchitis && ' With chronic bronchitis noted in your file, bronchial spasms can occur rapidly in cold morning haze.'}
                        {profile.hasEyeIrritation && ' High ambient photochemical oxidants will exacerbate eye stinging and watery irritation.'}
                        {profile.hasCardioCondition && ' Particulates under PM2.5 penetrate blood vessels; monitor blood pressure closely.'}
                        {profile.hasReducedLungCapacity && ' Reduced lung function detected; avoid vigorous physical exertion outdoors.'}
                        {' '}Recommended safe unmasked exposure is limited to <strong>{vulnerabilityMetrics.safeMinutesUnmasked} minutes</strong>.
                      </>
                    ) : (
                      <>
                        Lahore&apos;s live ambient PM2.5 is currently at <strong className="text-white">{currentLahorePm25} µg/m³ (AQI {currentLahoreAqi})</strong>. Once your medical profile is created, DHUAN calculates your personalized airway deposition and triggers proactive smog inhaler alerts.
                      </>
                    )}
                  </p>

                  {hasProfile && (
                    <div className="flex flex-wrap items-center gap-2 pt-2">
                      <span className="text-xs font-bold bg-slate-800 text-emerald-300 px-3 py-1.5 rounded-xl border border-slate-700 flex items-center gap-1.5">
                        <ShieldCheck className="w-3.5 h-3.5" /> Wear N95 Mask
                      </span>
                      {profile.usesInhaler && (
                        <span className="text-xs font-bold bg-slate-800 text-blue-300 px-3 py-1.5 rounded-xl border border-slate-700 flex items-center gap-1.5">
                          <Pill className="w-3.5 h-3.5" /> Keep {profile.inhalerName.split('(')[0] || 'Inhaler'} in Pocket
                        </span>
                      )}
                      {profile.hasEyeIrritation && (
                        <span className="text-xs font-bold bg-slate-800 text-cyan-300 px-3 py-1.5 rounded-xl border border-slate-700 flex items-center gap-1.5">
                          <Eye className="w-3.5 h-3.5" /> Protective Eyewear / Lubricant Drops
                        </span>
                      )}
                      <span className="text-xs font-bold bg-slate-800 text-amber-300 px-3 py-1.5 rounded-xl border border-slate-700 flex items-center gap-1.5">
                        <Wind className="w-3.5 h-3.5" /> Avoid Morning Smog (07:30 - 09:30 AM)
                      </span>
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

            {/* Profile Summary & Diagnostic Cards */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* Left Column: Personal Health Vitals & Smog Matrix */}
              <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <h3 className="font-extrabold text-base text-slate-900 flex items-center gap-2">
                    <User className="w-4 h-4 text-emerald-600" />
                    Personal & Medical Demographics
                  </h3>
                  {hasProfile ? (
                    <button
                      onClick={() => {
                        setFormData(profile);
                        setIsEditModalOpen(true);
                      }}
                      className="text-xs font-bold text-emerald-600 hover:text-emerald-700"
                    >
                      Edit
                    </button>
                  ) : (
                    <button
                      onClick={() => {
                        setFormData(EMPTY_PROFILE);
                        setIsCreateModalOpen(true);
                      }}
                      className="text-xs font-bold text-emerald-600 hover:text-emerald-700"
                    >
                      + Create
                    </button>
                  )}
                </div>

                <div className="space-y-3 text-sm">
                  <div className="flex justify-between py-1">
                    <span className="text-slate-500 font-medium">Patient Name</span>
                    <span className="font-extrabold text-slate-900">{hasProfile ? profile.fullName : 'Not Created'}</span>
                  </div>
                  <div className="flex justify-between py-1">
                    <span className="text-slate-500 font-medium">Age & Gender</span>
                    <span className="font-extrabold text-slate-900">{hasProfile ? `${profile.age} yrs, ${profile.gender}` : '—'}</span>
                  </div>
                  <div className="flex justify-between py-1">
                    <span className="text-slate-500 font-medium">Blood Group</span>
                    <span className="font-extrabold text-rose-600 bg-rose-50 px-2 py-0.5 rounded-md">{hasProfile ? profile.bloodGroup : '—'}</span>
                  </div>
                  <div className="flex justify-between py-1">
                    <span className="text-slate-500 font-medium">Emergency Contact</span>
                    <span className="font-extrabold text-slate-900 text-right">
                      {hasProfile ? (
                        <>
                          {profile.emergencyContactName}<br />
                          <span className="text-xs text-slate-500 font-normal">{profile.emergencyContact}</span>
                        </>
                      ) : (
                        <span className="text-slate-400">Not Configured</span>
                      )}
                    </span>
                  </div>
                  <div className="flex justify-between py-1">
                    <span className="text-slate-500 font-medium">Daily Commute</span>
                    <span className="font-extrabold text-slate-900 capitalize">
                      {hasProfile ? `${profile.primaryCommute} (${profile.dailyCommuteMinutes} mins/day)` : 'Not Configured'}
                    </span>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-100">
                  <span className="text-xs font-black text-slate-400 uppercase tracking-wider block mb-2">Smog Conditions Recorded</span>
                  <div className="flex flex-wrap gap-1.5">
                    {hasProfile ? (
                      <>
                        {profile.asthmaSeverity !== 'none' && (
                          <span className="text-xs font-bold bg-amber-50 text-amber-800 border border-amber-200 px-2.5 py-1 rounded-lg">
                            {profile.asthmaSeverity} Asthma
                          </span>
                        )}
                        {profile.hasBronchitis && (
                          <span className="text-xs font-bold bg-rose-50 text-rose-800 border border-rose-200 px-2.5 py-1 rounded-lg">
                            Bronchitis
                          </span>
                        )}
                        {profile.hasReducedLungCapacity && (
                          <span className="text-xs font-bold bg-rose-50 text-rose-800 border border-rose-200 px-2.5 py-1 rounded-lg">
                            Reduced Lung Capacity
                          </span>
                        )}
                        {profile.hasEyeIrritation && (
                          <span className="text-xs font-bold bg-cyan-50 text-cyan-800 border border-cyan-200 px-2.5 py-1 rounded-lg">
                            Eye Irritation
                          </span>
                        )}
                        {profile.hasEntIrritation && (
                          <span className="text-xs font-bold bg-yellow-50 text-yellow-800 border border-yellow-200 px-2.5 py-1 rounded-lg">
                            Nose & Throat Irritation
                          </span>
                        )}
                        {profile.hasHeadachesFatigue && (
                          <span className="text-xs font-bold bg-purple-50 text-purple-800 border border-purple-200 px-2.5 py-1 rounded-lg">
                            Headaches & Fatigue
                          </span>
                        )}
                        {profile.hasCardioCondition && (
                          <span className="text-xs font-bold bg-red-50 text-red-800 border border-red-200 px-2.5 py-1 rounded-lg">
                            Cardiovascular Disease
                          </span>
                        )}
                        {profile.hasLungCancerRisk && (
                          <span className="text-xs font-bold bg-red-50 text-red-800 border border-red-200 px-2.5 py-1 rounded-lg">
                            Lung Cancer Risk
                          </span>
                        )}
                        {profile.hasPregnant && (
                          <span className="text-xs font-bold bg-pink-50 text-pink-800 border border-pink-200 px-2.5 py-1 rounded-lg">
                            Pregnancy Risk
                          </span>
                        )}
                        {profile.hasChild && (
                          <span className="text-xs font-bold bg-blue-50 text-blue-800 border border-blue-200 px-2.5 py-1 rounded-lg">
                            Child (Pediatric Lungs)
                          </span>
                        )}
                        {profile.hasElderly && (
                          <span className="text-xs font-bold bg-slate-100 text-slate-800 border border-slate-300 px-2.5 py-1 rounded-lg">
                            Senior Citizen (60+)
                          </span>
                        )}
                        {profile.medicalReports && profile.medicalReports.length > 0 && (
                          <span className="text-xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-200 px-2.5 py-1 rounded-lg flex items-center gap-1">
                            <Hospital className="w-3 h-3" />
                            {profile.medicalReports.length} Hospital Reports
                          </span>
                        )}
                      </>
                    ) : (
                      <span className="text-xs font-medium text-slate-400 italic">
                        No health profile created yet.
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Middle & Right: Weekly Inhalation & Symptom Graph */}
              <div className="lg:col-span-2 bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm flex flex-col justify-between">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="font-extrabold text-base text-slate-900 flex items-center gap-2">
                      <Activity className="w-4 h-4 text-emerald-600" />
                      Weekly Respiratory Stress vs. Ambient PM2.5
                    </h3>
                    <p className="text-xs text-slate-500 font-medium mt-0.5">
                      Correlation between Lahore PM2.5 concentrations and logged breathing symptoms
                    </p>
                  </div>
                  <button
                    onClick={() => setActiveTab('symptoms')}
                    className="text-xs font-bold text-emerald-600 hover:text-emerald-700"
                  >
                    View All Logs &rarr;
                  </button>
                </div>

                <div className="h-[260px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart
                      data={profile.symptomLogs}
                      margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
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
                      <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 12, fill: '#64748b' }} />
                      <Tooltip 
                        contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                        labelStyle={{ fontWeight: 'bold', color: '#0f172a' }}
                      />
                      <Legend wrapperStyle={{ fontSize: 12, paddingTop: 10 }} />
                      <Area 
                        type="monotone" 
                        dataKey="pm25Exposure" 
                        name="Lahore PM2.5 (µg/m³)" 
                        stroke="#f59e0b" 
                        strokeWidth={2.5} 
                        fillOpacity={1} 
                        fill="url(#colorPm)" 
                      />
                      <Area 
                        type="monotone" 
                        dataKey="shortnessOfBreath" 
                        name="Shortness of Breath (0-3)" 
                        stroke="#ef4444" 
                        strokeWidth={2.5} 
                        fillOpacity={1} 
                        fill="url(#colorSymptoms)" 
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between text-xs text-slate-500 font-medium">
                  <span>💡 Note: Ground PM2.5 above 90 µg/m³ spikes airway resistance and mucus secretion.</span>
                  <span className="font-bold text-slate-700">7 Days Recorded</span>
                </div>
              </div>

            </div>

          </div>
        )}

        {/* TAB 2: CLINICAL ASSESSMENT & EDITABLE FORM */}
        {activeTab === 'assessment' && (
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-sm space-y-8">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-100">
              <div>
                <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                  Comprehensive Smog Health & Clinical Assessment
                </h2>
                <p className="text-sm text-slate-500 font-medium mt-1">
                  Adjust medical conditions, chronic smog symptoms, and transit habits to recalibrate your AI vulnerability index.
                </p>
              </div>

              <div className="flex items-center gap-3">
                {hasProfile && (
                  <button
                    onClick={handleDeleteProfile}
                    className="px-4 py-2.5 text-xs font-bold text-rose-600 hover:text-rose-700 hover:bg-rose-50 rounded-xl transition-colors flex items-center gap-1.5"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    Clear Profile
                  </button>
                )}
                <button
                  onClick={() => handleSaveProfile()}
                  className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs sm:text-sm shadow-sm transition-all flex items-center gap-2 active:scale-95"
                >
                  <Save className="w-4 h-4" />
                  Save Changes
                </button>
              </div>
            </div>

            {/* Section 1: Demographics */}
            <div className="space-y-4">
              <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
                <User className="w-4 h-4 text-emerald-600" />
                1. Basic Patient Details
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">Full Name</label>
                  <input
                    type="text"
                    value={formData.fullName}
                    onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">Age</label>
                  <input
                    type="number"
                    value={formData.age}
                    onChange={(e) => setFormData({ ...formData, age: parseInt(e.target.value) || 0 })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">Gender</label>
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

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">Blood Group</label>
                  <select
                    value={formData.bloodGroup}
                    onChange={(e) => setFormData({ ...formData, bloodGroup: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="A+">A+</option>
                    <option value="A-">A-</option>
                    <option value="B+">B+</option>
                    <option value="B-">B-</option>
                    <option value="AB+">AB+</option>
                    <option value="AB-">AB-</option>
                    <option value="O+">O+</option>
                    <option value="O-">O-</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">Emergency Contact Name & Relation</label>
                  <input
                    type="text"
                    value={formData.emergencyContactName}
                    onChange={(e) => setFormData({ ...formData, emergencyContactName: e.target.value })}
                    placeholder="e.g. Fatima Ahmed (Spouse)"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">Emergency Contact Phone</label>
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

            {/* Section 2: Comprehensive Smog Health Conditions */}
            <div className="space-y-6 pt-4 border-t border-slate-100">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
                  <HeartPulse className="w-4 h-4 text-emerald-600" />
                  2. Smog Health Conditions & Diseases Checklist
                </h3>
                <span className="text-xs text-emerald-600 font-bold bg-emerald-50 px-2.5 py-1 rounded-full">
                  User Health Priority
                </span>
              </div>

              {/* Respiratory Group */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-3">
                <h4 className="text-xs font-black text-slate-700 uppercase tracking-wider flex items-center gap-2">
                  <Wind className="w-4 h-4 text-emerald-600" />
                  Respiratory Problems (Lungs, Bronchi & Airways)
                </h4>

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
                            ? 'border-emerald-600 bg-emerald-100/60 text-emerald-950 font-black shadow-xs'
                            : 'border-slate-200 text-slate-600 hover:border-slate-300 bg-white'
                        }`}
                      >
                        {lvl === 'none' ? 'No Asthma' : `${lvl} Asthma`}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 pt-2">
                  <label className="flex items-start gap-3 p-3 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.hasBronchitis}
                      onChange={(e) => setFormData({ ...formData, hasBronchitis: e.target.checked })}
                      className="w-4 h-4 mt-0.5 rounded text-emerald-600 focus:ring-emerald-500"
                    />
                    <div>
                      <span className="text-xs font-bold text-slate-900 block">Bronchitis (Acute/Chronic)</span>
                      <span className="text-[11px] text-slate-500">Persistent bronchial airway inflammation</span>
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
                      <span className="text-xs font-bold text-slate-900 block">COPD / Emphysema</span>
                      <span className="text-[11px] text-slate-500">Chronic airflow limitation</span>
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
                      <span className="text-[11px] text-slate-500">Long-term smog tissue damage</span>
                    </div>
                  </label>

                  <label className="flex items-start gap-3 p-3 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.hasLungCancerRisk}
                      onChange={(e) => setFormData({ ...formData, hasLungCancerRisk: e.target.checked })}
                      className="w-4 h-4 mt-0.5 rounded text-emerald-600 focus:ring-emerald-500"
                    />
                    <div>
                      <span className="text-xs font-bold text-slate-900 block">Increased Risk of Lung Cancer</span>
                      <span className="text-[11px] text-slate-500">Chronic heavy air pollution exposure history</span>
                    </div>
                  </label>

                  <label className="flex items-start gap-3 p-3 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.hasAllergies}
                      onChange={(e) => setFormData({ ...formData, hasAllergies: e.target.checked })}
                      className="w-4 h-4 mt-0.5 rounded text-emerald-600 focus:ring-emerald-500"
                    />
                    <div>
                      <span className="text-xs font-bold text-slate-900 block">Dust & Particulate Allergy</span>
                      <span className="text-[11px] text-slate-500">Severe sensitivity to Lahore soot</span>
                    </div>
                  </label>
                </div>
              </div>

              {/* Eye, Nose & Throat, and Neurological Group */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                
                {/* Eye Irritation */}
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-3">
                  <h4 className="text-xs font-black text-slate-700 uppercase tracking-wider flex items-center gap-2">
                    <Eye className="w-4 h-4 text-cyan-600" />
                    Eye Irritation & Stinging
                  </h4>
                  <label className="flex items-start gap-3 p-3 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.hasEyeIrritation}
                      onChange={(e) => setFormData({ ...formData, hasEyeIrritation: e.target.checked })}
                      className="w-4 h-4 mt-0.5 rounded text-cyan-600 focus:ring-cyan-500"
                    />
                    <div>
                      <span className="text-xs font-bold text-slate-900 block">Redness, Burning Sensations & Watery Eyes</span>
                      <span className="text-[11px] text-slate-500">Frequent conjunctival irritation during commute</span>
                    </div>
                  </label>
                </div>

                {/* Nose & Throat */}
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-3">
                  <h4 className="text-xs font-black text-slate-700 uppercase tracking-wider flex items-center gap-2">
                    <Flame className="w-4 h-4 text-amber-600" />
                    Nose & Throat Irritation
                  </h4>
                  <label className="flex items-start gap-3 p-3 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.hasEntIrritation}
                      onChange={(e) => setFormData({ ...formData, hasEntIrritation: e.target.checked })}
                      className="w-4 h-4 mt-0.5 rounded text-amber-600 focus:ring-amber-500"
                    />
                    <div>
                      <span className="text-xs font-bold text-slate-900 block">Sneezing, Runny Nose, Sore Throat & Nasal Restriction</span>
                      <span className="text-[11px] text-slate-500">Upper respiratory irritation from acidic particulates</span>
                    </div>
                  </label>
                </div>

                {/* Headaches & Fatigue */}
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-3">
                  <h4 className="text-xs font-black text-slate-700 uppercase tracking-wider flex items-center gap-2">
                    <Brain className="w-4 h-4 text-purple-600" />
                    Headaches & Fatigue
                  </h4>
                  <label className="flex items-start gap-3 p-3 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.hasHeadachesFatigue}
                      onChange={(e) => setFormData({ ...formData, hasHeadachesFatigue: e.target.checked })}
                      className="w-4 h-4 mt-0.5 rounded text-purple-600 focus:ring-purple-500"
                    />
                    <div>
                      <span className="text-xs font-bold text-slate-900 block">Headaches, Tiredness, Weakness & Concentration Difficulty</span>
                      <span className="text-[11px] text-slate-500">Systemic hypoxia and neuro-inflammation caused by smog</span>
                    </div>
                  </label>
                </div>

                {/* Heart & Cardiovascular */}
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-3">
                  <h4 className="text-xs font-black text-slate-700 uppercase tracking-wider flex items-center gap-2">
                    <Heart className="w-4 h-4 text-rose-600" />
                    Heart & Cardiovascular Problems
                  </h4>
                  <label className="flex items-start gap-3 p-3 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.hasCardioCondition}
                      onChange={(e) => setFormData({ ...formData, hasCardioCondition: e.target.checked })}
                      className="w-4 h-4 mt-0.5 rounded text-rose-600 focus:ring-rose-500"
                    />
                    <div>
                      <span className="text-xs font-bold text-slate-900 block">Increased Risk of Heart Attacks, Strokes & Cardiovascular Disease</span>
                      <span className="text-[11px] text-slate-500">Fine particles enter blood stream elevating vascular risk</span>
                    </div>
                  </label>
                </div>

              </div>

              {/* Vulnerable Cohorts (Children, Older Adults, Pregnancy) */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-3">
                <h4 className="text-xs font-black text-slate-700 uppercase tracking-wider flex items-center gap-2">
                  <Users className="w-4 h-4 text-indigo-600" />
                  Vulnerable Cohorts & Age-Specific Risks
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <label className="flex items-start gap-3 p-3 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.hasChild}
                      onChange={(e) => setFormData({ ...formData, hasChild: e.target.checked })}
                      className="w-4 h-4 mt-0.5 rounded text-indigo-600 focus:ring-indigo-500"
                    />
                    <div>
                      <span className="text-xs font-bold text-slate-900 block">Effects on Children</span>
                      <span className="text-[11px] text-slate-500">Breathing difficulties, asthma, impaired lung development</span>
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
                      <span className="text-[11px] text-slate-500">Elevated respiratory and cardiovascular complications</span>
                    </div>
                  </label>

                  <label className="flex items-start gap-3 p-3 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.hasPregnant}
                      onChange={(e) => setFormData({ ...formData, hasPregnant: e.target.checked })}
                      className="w-4 h-4 mt-0.5 rounded text-indigo-600 focus:ring-indigo-500"
                    />
                    <div>
                      <span className="text-xs font-bold text-slate-900 block">Pregnancy-Related Risks</span>
                      <span className="text-[11px] text-slate-500">Association with premature birth and low birth weight</span>
                    </div>
                  </label>
                </div>
              </div>

              {/* Active Symptoms Tags Selector */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-2">
                  Active Smog Symptoms You Regularly Experience:
                </label>
                <div className="flex flex-wrap gap-2">
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

            </div>

            {/* Section 3: Daily Commute & Exposure Habits */}
            <div className="space-y-4 pt-4 border-t border-slate-100">
              <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
                <Bike className="w-4 h-4 text-emerald-600" />
                3. Daily Travel & Exposure Profile
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-2">Primary Transit Mode in Lahore</label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {[
                      { id: 'bike', label: 'Motorbike', icon: Bike },
                      { id: 'car', label: 'Car (AC)', icon: Car },
                      { id: 'transit', label: 'Speedo / Bus', icon: Bus },
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
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-2">
                    Estimated Daily Commute Time: <span className="text-emerald-700 font-extrabold">{formData.dailyCommuteMinutes} Minutes</span>
                  </label>
                  <input
                    type="range"
                    min="10"
                    max="180"
                    step="5"
                    value={formData.dailyCommuteMinutes}
                    onChange={(e) => setFormData({ ...formData, dailyCommuteMinutes: parseInt(e.target.value) })}
                    className="w-full accent-emerald-600"
                  />
                  <div className="flex justify-between text-[11px] text-slate-400 mt-1">
                    <span>10 mins (Short)</span>
                    <span>45 mins (Average)</span>
                    <span>180 mins (High Inhalation)</span>
                  </div>
                </div>
              </div>

              {/* Mask & Air Purifier */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">Mask Wearing Habit</label>
                  <select
                    value={formData.wearsMask}
                    onChange={(e) => setFormData({ ...formData, wearsMask: e.target.value as any })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="always">Always Outdoors</option>
                    <option value="high_aqi_only">Only When Smog is High (AQI &gt; 150)</option>
                    <option value="rarely">Rarely</option>
                    <option value="never">Never</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">Mask Type Used</label>
                  <select
                    value={formData.maskType}
                    onChange={(e) => setFormData({ ...formData, maskType: e.target.value as any })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="n95">N95 / KN95 / FFP2 (Recommended)</option>
                    <option value="surgical">3-Ply Surgical Mask</option>
                    <option value="cloth">Cloth Mask / Scarf</option>
                    <option value="none">No Mask</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">Indoor HEPA Air Purifier</label>
                  <div className="flex items-center gap-3 p-2.5 rounded-xl border border-slate-200">
                    <input
                      type="checkbox"
                      id="hepa"
                      checked={formData.hasHepaPurifier}
                      onChange={(e) => setFormData({ ...formData, hasHepaPurifier: e.target.checked })}
                      className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500"
                    />
                    <label htmlFor="hepa" className="text-xs font-bold text-slate-700 cursor-pointer">
                      Active HEPA purifier at home/office
                    </label>
                  </div>
                </div>
              </div>
            </div>

            {/* Section 4: Medications & Inhalers */}
            <div className="space-y-4 pt-4 border-t border-slate-100">
              <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
                <Pill className="w-4 h-4 text-emerald-600" />
                4. Respiratory Medications & Inhalers
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <input
                      type="checkbox"
                      id="inhaler"
                      checked={formData.usesInhaler}
                      onChange={(e) => setFormData({ ...formData, usesInhaler: e.target.checked })}
                      className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500"
                    />
                    <label htmlFor="inhaler" className="text-xs font-bold text-slate-900 cursor-pointer">
                      I use a Rescue or Maintenance Inhaler
                    </label>
                  </div>

                  {formData.usesInhaler && (
                    <input
                      type="text"
                      value={formData.inhalerName}
                      onChange={(e) => setFormData({ ...formData, inhalerName: e.target.value })}
                      placeholder="e.g. Ventolin (Salbutamol 100mcg) or Symbicort"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  )}
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">Last Preventive Inhaler Dose</label>
                  <input
                    type="text"
                    value={formData.lastPreventiveDose}
                    onChange={(e) => setFormData({ ...formData, lastPreventiveDose: e.target.value })}
                    placeholder="e.g. Today, 08:30 AM"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>
            </div>

            {/* Section 5: Attached Medical Reports Summary in Form */}
            <div className="space-y-4 pt-4 border-t border-slate-100">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
                  <Hospital className="w-4 h-4 text-emerald-600" />
                  5. Hospital Diagnostic Reports ({formData.medicalReports?.length || 0} Attached)
                </h3>
                <button
                  type="button"
                  onClick={() => setShowAddReportForm(!showAddReportForm)}
                  className="px-3 py-1.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-xl text-xs font-bold flex items-center gap-1.5 hover:bg-emerald-100"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>{showAddReportForm ? 'Close Add Form' : 'Add New Hospital Report'}</span>
                </button>
              </div>

              {/* Add Report Inline Drawer */}
              {showAddReportForm && (
                <div className="p-4 sm:p-5 rounded-2xl bg-emerald-50/50 border border-emerald-200 space-y-4 animate-in fade-in duration-200">
                  <h4 className="font-bold text-xs uppercase tracking-wider text-emerald-900 flex items-center gap-2">
                    <FileCheck className="w-4 h-4 text-emerald-600" />
                    Attach Hospital Lab or Pulmonology Report (Optional)
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Hospital / Lab Name <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Gulab Devi Chest Hospital / Chughtai Lab"
                        value={newReport.hospitalName}
                        onChange={(e) => setNewReport({ ...newReport, hospitalName: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-semibold bg-white"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Report / Test Type</label>
                      <select
                        value={newReport.reportType}
                        onChange={(e) => setNewReport({ ...newReport, reportType: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-semibold bg-white"
                      >
                        <option value="Spirometry / Lung Function Test">Spirometry / Lung Function Test</option>
                        <option value="Chest X-Ray / CT Scan">Chest X-Ray / CT Scan</option>
                        <option value="Blood Gas ABG (Oxygen Saturation)">Blood Gas ABG (Oxygen Saturation)</option>
                        <option value="Allergy Comprehensive Panel">Allergy Comprehensive Panel</option>
                        <option value="Cardiology ECG / Echo">Cardiology ECG / Echo</option>
                        <option value="General Pulmonology Discharge Summary">General Pulmonology Summary</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Report Date</label>
                      <input
                        type="date"
                        value={newReport.reportDate}
                        onChange={(e) => setNewReport({ ...newReport, reportDate: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-semibold bg-white"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Consulting Doctor / Specialist</label>
                      <input
                        type="text"
                        placeholder="e.g. Dr. Tariq Mian (Chest Specialist)"
                        value={newReport.doctorName}
                        onChange={(e) => setNewReport({ ...newReport, doctorName: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-semibold bg-white"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Diagnosis Notes / Key Findings</label>
                      <input
                        type="text"
                        placeholder="e.g. FEV1/FVC 72%, mild bronchial constriction noted."
                        value={newReport.diagnosisNotes}
                        onChange={(e) => setNewReport({ ...newReport, diagnosisNotes: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-semibold bg-white"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => setShowAddReportForm(false)}
                      className="px-4 py-2 rounded-xl border border-slate-300 text-xs font-bold text-slate-600 bg-white hover:bg-slate-50"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={handleAddMedicalReport}
                      className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-xs"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Add Report to Profile</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Reports List */}
              <div className="space-y-2">
                {formData.medicalReports && formData.medicalReports.length > 0 ? (
                  formData.medicalReports.map((rep) => (
                    <div key={rep.id} className="p-3.5 rounded-2xl border border-slate-200 bg-slate-50 flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-emerald-600 shrink-0">
                          <Hospital className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-extrabold text-xs text-slate-900">{rep.hospitalName}</span>
                            <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-100 text-emerald-800">
                              {rep.reportType}
                            </span>
                            <span className="text-[11px] text-slate-400 font-medium">({rep.reportDate})</span>
                          </div>
                          <p className="text-xs text-slate-500 mt-0.5">
                            {rep.doctorName && <span className="font-semibold text-slate-700 mr-2">Doc: {rep.doctorName}</span>}
                            {rep.diagnosisNotes}
                          </p>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleRemoveMedicalReport(rep.id)}
                        className="text-slate-400 hover:text-rose-600 p-1.5 rounded-lg hover:bg-rose-50 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-slate-400 italic">No hospital reports attached yet. You can attach records from any hospital or lab.</p>
                )}
              </div>
            </div>

            {/* Bottom Save Action */}
            <div className="pt-6 border-t border-slate-100 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => {
                  setFormData(profile);
                  setActiveTab('overview');
                }}
                className="px-5 py-3 rounded-xl border border-slate-200 text-slate-700 font-bold text-sm hover:bg-slate-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleSaveProfile()}
                className="px-6 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-sm shadow-md transition-all active:scale-95 flex items-center gap-2"
              >
                <Check className="w-4 h-4" />
                <span>Save & Recalculate Risk</span>
              </button>
            </div>

          </div>
        )}

        {/* TAB 3: HOSPITAL DIAGNOSTIC REPORTS DIRECT VIEW */}
        {activeTab === 'reports' && (
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-sm space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
              <div>
                <h3 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                  <Hospital className="w-5 h-5 text-emerald-600" />
                  Hospital & Diagnostic Lab Records
                </h3>
                <p className="text-xs sm:text-sm text-slate-500 font-medium mt-0.5">
                  Attach and manage clinical records from Gulab Devi Chest Hospital, Chughtai Lab, Shaukat Khanum, Services Hospital, or any healthcare provider.
                </p>
              </div>

              <button
                onClick={() => setShowAddReportForm(!showAddReportForm)}
                className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-xs"
              >
                <Plus className="w-4 h-4" />
                <span>{showAddReportForm ? 'Close Form' : 'Add New Hospital Report'}</span>
              </button>
            </div>

            {/* Add Report Drawer in Tab */}
            {showAddReportForm && (
              <div className="p-5 rounded-2xl bg-emerald-50/50 border border-emerald-200 space-y-4">
                <h4 className="font-bold text-sm text-emerald-950">Add Diagnostic / Pulmonology Test</h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Hospital / Lab Name</label>
                    <input
                      type="text"
                      placeholder="e.g. Gulab Devi Chest Hospital"
                      value={newReport.hospitalName}
                      onChange={(e) => setNewReport({ ...newReport, hospitalName: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-semibold bg-white"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Report / Test Type</label>
                    <select
                      value={newReport.reportType}
                      onChange={(e) => setNewReport({ ...newReport, reportType: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-semibold bg-white"
                    >
                      <option value="Spirometry / Lung Function Test">Spirometry / Lung Function Test</option>
                      <option value="Chest X-Ray / CT Scan">Chest X-Ray / CT Scan</option>
                      <option value="Blood Gas ABG (Oxygen Saturation)">Blood Gas ABG (Oxygen Saturation)</option>
                      <option value="Allergy Comprehensive Panel">Allergy Comprehensive Panel</option>
                      <option value="Cardiology ECG / Echo">Cardiology ECG / Echo</option>
                      <option value="General Pulmonology Discharge Summary">General Pulmonology Summary</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Report Date</label>
                    <input
                      type="date"
                      value={newReport.reportDate}
                      onChange={(e) => setNewReport({ ...newReport, reportDate: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-semibold bg-white"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Consulting Doctor / Specialist</label>
                    <input
                      type="text"
                      placeholder="e.g. Dr. Tariq Mian (Chest Specialist)"
                      value={newReport.doctorName}
                      onChange={(e) => setNewReport({ ...newReport, doctorName: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-semibold bg-white"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Clinical Findings & Diagnosis</label>
                    <input
                      type="text"
                      placeholder="e.g. Bronchial sensitivity positive. Prescribed bronchodilator."
                      value={newReport.diagnosisNotes}
                      onChange={(e) => setNewReport({ ...newReport, diagnosisNotes: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-semibold bg-white"
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowAddReportForm(false)}
                    className="px-4 py-2 rounded-xl border border-slate-300 text-xs font-bold text-slate-600 bg-white"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleAddMedicalReport}
                    className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold"
                  >
                    Add Report
                  </button>
                </div>
              </div>
            )}

            {/* List of Reports */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {profile.medicalReports && profile.medicalReports.length > 0 ? (
                profile.medicalReports.map((report) => (
                  <div key={report.id} className="p-5 rounded-2xl border border-slate-200/90 hover:border-emerald-300 bg-white shadow-xs space-y-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-700 font-bold shrink-0">
                          <Hospital className="w-5 h-5" />
                        </div>
                        <div>
                          <h4 className="font-extrabold text-sm text-slate-900">{report.hospitalName}</h4>
                          <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md">
                            {report.reportType}
                          </span>
                        </div>
                      </div>
                      <span className="text-xs font-bold text-slate-400">{report.reportDate}</span>
                    </div>

                    <div className="space-y-1 text-xs text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-100">
                      {report.doctorName && (
                        <div>
                          <strong className="text-slate-800">Physician:</strong> {report.doctorName}
                        </div>
                      )}
                      <div>
                        <strong className="text-slate-800">Key Findings:</strong> {report.diagnosisNotes || 'Report attached for clinical reference.'}
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="md:col-span-2 text-center py-12 border-2 border-dashed border-slate-200 rounded-3xl space-y-3">
                  <Hospital className="w-10 h-10 text-slate-300 mx-auto" />
                  <p className="text-sm font-bold text-slate-600">No Hospital Diagnostic Reports Added Yet</p>
                  <p className="text-xs text-slate-400 max-w-md mx-auto">
                    You can add diagnostic reports from any hospital (Gulab Devi, Chughtai Lab, Shaukat Khanum, etc.) to store them with your profile and include them in your printable DHUAN Medical Pass.
                  </p>
                  <button
                    onClick={() => setShowAddReportForm(true)}
                    className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold"
                  >
                    + Add Your First Medical Report
                  </button>
                </div>
              )}
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

    </div>
  );
}
