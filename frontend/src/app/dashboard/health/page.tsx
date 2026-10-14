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
  ChevronRight, 
  Download, 
  Share2, 
  Save, 
  RotateCcw, 
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
  Trash2
} from 'lucide-react';
import { 
  AreaChart, 
  Area, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  Legend 
} from 'recharts';
import { getApiEndpoint } from '@/lib/api';

// Data types for health profile
interface SymptomLog {
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

interface HealthProfileData {
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
  isVulnerableCohort: boolean; // pregnant, elderly, child

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
  const [activeTab, setActiveTab] = useState<'overview' | 'assessment' | 'symptoms' | 'emergency'>('overview');
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<HealthProfileData>(EMPTY_PROFILE);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const [isIdCardOpen, setIsIdCardOpen] = useState(false);

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

          showToast('Medical Health Profile saved to SQLite database & synced!');
          return true;
        }
      }
    } catch (e) {
      console.error('Error saving health profile:', e);
      showToast('Error saving health profile to database.');
    }
    return false;
  };

  // Delete Medical Profile from SQLite
  const handleDeleteProfile = async () => {
    if (confirm('Are you sure you want to delete your Medical Profile from SQLite database?')) {
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
          showToast('Medical profile deleted from SQLite database. Back to initial new user state.');
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

  // Calculate dynamic AI Smog Vulnerability Score (0 - 100)
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
    if (profile.asthmaSeverity === 'mild') score += 20;
    if (profile.asthmaSeverity === 'moderate') score += 35;
    if (profile.asthmaSeverity === 'severe') score += 50;

    if (profile.hasCopd) score += 30;
    if (profile.hasAllergies) score += 12;
    if (profile.hasCardioCondition) score += 18;

    // Smoking
    if (profile.smokerStatus === 'active') score += 20;
    if (profile.smokerStatus === 'former') score += 6;

    // Age
    if (profile.age > 60 || profile.age < 12) score += 15;
    if (profile.isVulnerableCohort) score += 15;

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

    score = Math.max(5, Math.min(98, score));

    let tier: 'Low' | 'Moderate' | 'High' | 'Severe' = 'Low';
    let tierColor = 'text-emerald-700 bg-emerald-50 border-emerald-200';
    let progressBg = 'bg-emerald-500';
    let advisory = 'Normal precautions. Outdoor activities permitted with standard awareness.';

    if (score >= 75) {
      tier = 'Severe';
      tierColor = 'text-rose-700 bg-rose-50 border-rose-200';
      progressBg = 'bg-rose-600';
      advisory = 'High danger of acute airway constriction. Pre-medicate with inhaler and strictly wear N95 outdoors.';
    } else if (score >= 55) {
      tier = 'High';
      tierColor = 'text-orange-700 bg-orange-50 border-orange-200';
      progressBg = 'bg-orange-500';
      advisory = 'Elevated respiratory risk. Limit outdoor exposure during morning peak thermal inversions (07:30 - 10:00 AM).';
    } else if (score >= 35) {
      tier = 'Moderate';
      tierColor = 'text-yellow-700 bg-yellow-50 border-yellow-200';
      progressBg = 'bg-yellow-500';
      advisory = 'Sensitive lungs will experience coughing and irritation. Keep rescue medication readily accessible.';
    }

    // Safe unmasked outdoor tolerance window in minutes based on current Lahore AQI
    const safeMinutesUnmasked = Math.max(15, Math.round(180 * (1 - score / 100) * (100 / currentLahoreAqi)));
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
  }, [profile, currentLahoreAqi, currentLahorePm25]);

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
              Personal Air Health Intelligence
            </div>
            <h1 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight leading-tight">
              Respiratory & Smog Health Profile
            </h1>
            <p className="text-slate-500 text-sm sm:text-base mt-2 font-medium leading-relaxed">
              Personalized AI vulnerability assessment, clinical bronchial risk scoring, and real-time safe exposure thresholds synchronized with Lahore&apos;s live atmospheric particulate levels.
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
                  onClick={() => setIsIdCardOpen(true)}
                  className="flex items-center gap-2 px-4 py-3 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-2xl font-bold text-xs sm:text-sm transition-all active:scale-95 border border-slate-200"
                >
                  <FileText className="w-4 h-4 text-slate-600" />
                  <span>Medical Smog Card</span>
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
            <span>Clinical & Respiratory Assessment</span>
            {isEditing && <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse"></span>}
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
            <span>7-Day Symptom & Inhalation Log</span>
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
                      Create Your Respiratory Health Profile
                    </h3>
                    <p className="text-slate-300 text-xs sm:text-sm font-medium leading-relaxed">
                      Your medical profile has not been created yet in the database. Add your daily transit mode, lung health history, and emergency contacts to unlock real-time safe outdoor windows and your official Lahore Medical Smog Pass.
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
                    ? (profile.asthmaSeverity !== 'none' ? `Triggered by ${profile.asthmaSeverity} Asthma` : 'Moderate baseline sensitivity') + ` + daily ${profile.dailyCommuteMinutes}m ${profile.primaryCommute} commute.`
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
                  <span className="text-xs font-black text-slate-400 uppercase tracking-wider">Rescue Inhaler Status</span>
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
                        Lahore&apos;s ambient PM2.5 is currently at <strong className="text-white">{currentLahorePm25} µg/m³ (AQI {currentLahoreAqi})</strong> with strong ground-level thermal inversion. Because your profile indicates <strong>{profile.asthmaSeverity !== 'none' ? `${profile.asthmaSeverity} Asthma` : 'no chronic asthma'}</strong> and a <strong>{profile.dailyCommuteMinutes}-minute {profile.primaryCommute} commute</strong>, fine particulates will reach deep bronchioles within {vulnerabilityMetrics.safeMinutesUnmasked} minutes of unmasked exposure.
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
                      <span className="text-xs font-bold bg-slate-800 text-blue-300 px-3 py-1.5 rounded-xl border border-slate-700 flex items-center gap-1.5">
                        <Pill className="w-3.5 h-3.5" /> Keep Rescue Inhaler in Pocket
                      </span>
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
                      <Link
                        href="/dashboard/routing"
                        className="flex items-center justify-center gap-2 px-6 py-3.5 bg-emerald-500 hover:bg-emerald-400 text-slate-900 rounded-2xl font-black text-sm shadow-lg transition-transform active:scale-95"
                      >
                        <span>Route Around Smog Peaks</span>
                        <ArrowRight className="w-4 h-4" />
                      </Link>

                      <button
                        onClick={() => setActiveTab('emergency')}
                        className="flex items-center justify-center gap-2 px-6 py-3.5 bg-slate-800 hover:bg-slate-700 text-white rounded-2xl font-bold text-sm transition-colors border border-slate-700"
                      >
                        <ShieldAlert className="w-4 h-4 text-rose-400" />
                        <span>Emergency Protocol</span>
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Profile Summary & Diagnostic Cards */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* Left Column: Personal Health Vitals */}
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
                  <span className="text-xs font-black text-slate-400 uppercase tracking-wider block mb-2">Pre-Existing Conditions</span>
                  <div className="flex flex-wrap gap-1.5">
                    {hasProfile ? (
                      <>
                        {profile.asthmaSeverity !== 'none' && (
                          <span className="text-xs font-bold bg-amber-50 text-amber-800 border border-amber-200 px-2.5 py-1 rounded-lg">
                            {profile.asthmaSeverity} Asthma
                          </span>
                        )}
                        {profile.hasAllergies && (
                          <span className="text-xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-200 px-2.5 py-1 rounded-lg">
                            Allergic Rhinitis
                          </span>
                        )}
                        {profile.hasCopd && (
                          <span className="text-xs font-bold bg-rose-50 text-rose-800 border border-rose-200 px-2.5 py-1 rounded-lg">
                            COPD
                          </span>
                        )}
                        {profile.hasCardioCondition && (
                          <span className="text-xs font-bold bg-rose-50 text-rose-800 border border-rose-200 px-2.5 py-1 rounded-lg">
                            Cardiovascular Risk
                          </span>
                        )}
                        {profile.asthmaSeverity === 'none' && !profile.hasAllergies && !profile.hasCopd && (
                          <span className="text-xs font-bold bg-slate-100 text-slate-700 px-2.5 py-1 rounded-lg">
                            No chronic respiratory diagnosis
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
                  <span>💡 Note: PM2.5 above 90 µg/m³ triggered peak inhaler usage for your profile.</span>
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
                  Clinical & Environmental Assessment Form
                </h2>
                <p className="text-sm text-slate-500 font-medium mt-1">
                  Adjust medical parameters to recalibrate your AI vulnerability index and safe breathing thresholds.
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

            {/* Section 2: Respiratory Conditions */}
            <div className="space-y-4 pt-4 border-t border-slate-100">
              <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
                <HeartPulse className="w-4 h-4 text-emerald-600" />
                2. Chronic Respiratory & Lung Health
              </h3>

              {/* Asthma Severity */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-2">Asthma Severity</label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {(['none', 'mild', 'moderate', 'severe'] as const).map((lvl) => (
                    <button
                      key={lvl}
                      type="button"
                      onClick={() => setFormData({ ...formData, asthmaSeverity: lvl })}
                      className={`p-3 rounded-2xl border text-center transition-all font-bold text-xs capitalize ${
                        formData.asthmaSeverity === lvl
                          ? 'border-emerald-600 bg-emerald-50 text-emerald-900 shadow-sm'
                          : 'border-slate-200 text-slate-600 hover:border-slate-300'
                      }`}
                    >
                      {lvl === 'none' ? 'None (No Asthma)' : `${lvl} Asthma`}
                    </button>
                  ))}
                </div>
              </div>

              {/* Checkbox Conditions */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                <label className="flex items-center gap-3 p-3 rounded-2xl border border-slate-200 hover:bg-slate-50 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.hasAllergies}
                    onChange={(e) => setFormData({ ...formData, hasAllergies: e.target.checked })}
                    className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500"
                  />
                  <div>
                    <span className="text-xs font-bold text-slate-900 block">Allergic Rhinitis / Dust Allergy</span>
                    <span className="text-[11px] text-slate-500">Sensitive to airborne particulate allergens</span>
                  </div>
                </label>

                <label className="flex items-center gap-3 p-3 rounded-2xl border border-slate-200 hover:bg-slate-50 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.hasCopd}
                    onChange={(e) => setFormData({ ...formData, hasCopd: e.target.checked })}
                    className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500"
                  />
                  <div>
                    <span className="text-xs font-bold text-slate-900 block">COPD / Chronic Bronchitis</span>
                    <span className="text-[11px] text-slate-500">Long-term airway inflammation</span>
                  </div>
                </label>

                <label className="flex items-center gap-3 p-3 rounded-2xl border border-slate-200 hover:bg-slate-50 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.hasCardioCondition}
                    onChange={(e) => setFormData({ ...formData, hasCardioCondition: e.target.checked })}
                    className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500"
                  />
                  <div>
                    <span className="text-xs font-bold text-slate-900 block">Cardiovascular / High BP</span>
                    <span className="text-[11px] text-slate-500">Smog spikes blood pressure</span>
                  </div>
                </label>
              </div>

              {/* Smoker status & Vulnerable cohort */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">Smoking History</label>
                  <select
                    value={formData.smokerStatus}
                    onChange={(e) => setFormData({ ...formData, smokerStatus: e.target.value as any })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="never">Non-Smoker (Never)</option>
                    <option value="former">Former Smoker</option>
                    <option value="active">Active Smoker</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">Vulnerable Household Cohort</label>
                  <div className="flex items-center gap-3 p-2.5 rounded-xl border border-slate-200">
                    <input
                      type="checkbox"
                      id="vulnerable"
                      checked={formData.isVulnerableCohort}
                      onChange={(e) => setFormData({ ...formData, isVulnerableCohort: e.target.checked })}
                      className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500"
                    />
                    <label htmlFor="vulnerable" className="text-xs font-bold text-slate-700 cursor-pointer">
                      Pregnant, Senior (65+), or Infant in household
                    </label>
                  </div>
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
                      I have an active HEPA purifier at home/office
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
                      placeholder="e.g. Ventolin (Salbutamol 100mcg)"
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

        {/* TAB 3: 7-DAY SYMPTOM & INHALATION LOG */}
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
                  placeholder="Notes (e.g., Felt chest tightness near Jail Road smog corridor...)"
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

        {/* TAB 4: LAHORE EMERGENCY SMOG PROTOCOL */}
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
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl border border-slate-200 space-y-6 my-8 animate-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600">
                  {isCreateModalOpen ? <Plus className="w-5 h-5" /> : <Sliders className="w-5 h-5" />}
                </div>
                <div>
                  <h3 className="font-black text-lg text-slate-900 leading-tight">
                    {isCreateModalOpen ? 'Create Medical Health Profile' : 'Edit Medical Health Profile'}
                  </h3>
                  <p className="text-xs text-slate-500 font-medium">
                    {isCreateModalOpen 
                      ? 'Stored securely in SQLite database for AI risk modeling & emergency response.' 
                      : 'Update your medical demographics, transit habits, and emergency contacts.'}
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

              {/* Section 4: Respiratory Health */}
              <div className="space-y-3 pt-4 border-t border-slate-100">
                <h4 className="text-xs font-black uppercase text-slate-400 tracking-wider flex items-center gap-2">
                  <HeartPulse className="w-3.5 h-3.5 text-emerald-600" />
                  4. Chronic Respiratory Conditions
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

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1">
                  <label className="flex items-center gap-2 p-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.hasAllergies}
                      onChange={(e) => setFormData({ ...formData, hasAllergies: e.target.checked })}
                      className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500"
                    />
                    <span className="text-xs font-bold text-slate-800">Dust / Smog Allergy</span>
                  </label>

                  <label className="flex items-center gap-2 p-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.hasCopd}
                      onChange={(e) => setFormData({ ...formData, hasCopd: e.target.checked })}
                      className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500"
                    />
                    <span className="text-xs font-bold text-slate-800">COPD / Bronchitis</span>
                  </label>

                  <label className="flex items-center gap-2 p-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.hasCardioCondition}
                      onChange={(e) => setFormData({ ...formData, hasCardioCondition: e.target.checked })}
                      className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500"
                    />
                    <span className="text-xs font-bold text-slate-800">Cardio / High BP</span>
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

      {/* MEDICAL SMOG ID CARD MODAL */}
      {isIdCardOpen && (
        <div className="fixed inset-0 z-[9999] bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-slate-200 space-y-6 animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-emerald-100 flex items-center justify-center text-emerald-700">
                  <Wind className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-black text-base text-slate-900 leading-none">DHUAN Medical Smog Pass</h3>
                  <span className="text-[11px] text-slate-400 font-bold uppercase tracking-wider">Emergency Responder Reference</span>
                </div>
              </div>
              <button
                onClick={() => setIsIdCardOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-100 text-slate-400 hover:text-slate-900 flex items-center justify-center"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Badge Card Layout */}
            <div className="p-5 rounded-2xl bg-slate-900 text-white space-y-4 border border-slate-800 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/20 rounded-full blur-2xl"></div>

              <div className="flex justify-between items-start">
                <div>
                  <h4 className="text-xl font-black">{profile.fullName}</h4>
                  <p className="text-xs text-slate-400">{profile.age} yrs • {profile.gender} • Lahore, PK</p>
                </div>
                <span className="px-3 py-1 bg-rose-600 text-white font-black text-xs rounded-full shadow-xs">
                  {profile.bloodGroup}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs pt-2 border-t border-slate-800">
                <div>
                  <span className="text-slate-400 block text-[11px]">Respiratory Condition:</span>
                  <span className="font-bold text-amber-400">{profile.asthmaSeverity !== 'none' ? `${profile.asthmaSeverity} Asthma` : 'None'}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">Rescue Medication:</span>
                  <span className="font-bold text-emerald-400">{profile.usesInhaler ? profile.inhalerName.split('(')[0] : 'None'}</span>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-800 text-xs">
                <span className="text-slate-400 block text-[11px]">Emergency Contact:</span>
                <span className="font-bold text-white">{profile.emergencyContactName} — {profile.emergencyContact}</span>
              </div>
            </div>

            <p className="text-xs text-slate-500 leading-relaxed font-medium">
              Carry this pass or save it to your phone. In case of acute bronchospasm during high smog episodes, first responders and traffic wardens can identify your inhaler requirements immediately.
            </p>

            <div className="flex items-center gap-3 pt-2">
              <button
                onClick={() => {
                  window.print();
                }}
                className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs flex items-center justify-center gap-2 shadow-sm transition-all"
              >
                <Printer className="w-4 h-4" />
                <span>Print / Save PDF</span>
              </button>
              <button
                onClick={() => setIsIdCardOpen(false)}
                className="py-3 px-5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold text-xs transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
