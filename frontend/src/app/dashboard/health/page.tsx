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
  Printer
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

const DEFAULT_PROFILE: HealthProfileData = {
  fullName: 'Ali Ahmed',
  age: 34,
  gender: 'Male',
  bloodGroup: 'O+',
  emergencyContact: '+92 300 4567890',
  emergencyContactName: 'Fatima Ahmed (Spouse)',
  primaryCommute: 'bike',
  dailyCommuteMinutes: 45,

  asthmaSeverity: 'moderate',
  hasCopd: false,
  hasAllergies: true,
  hasCardioCondition: false,
  smokerStatus: 'never',
  isVulnerableCohort: false,

  triggerAqiThreshold: 140,

  usesInhaler: true,
  inhalerName: 'Ventolin (Salbutamol 100mcg)',
  lastPreventiveDose: 'Today, 08:30 AM',
  dailyMedications: ['Ventolin Inhaler', 'Montelukast 10mg (Nightly)'],

  wearsMask: 'high_aqi_only',
  maskType: 'n95',
  hasHepaPurifier: true,

  symptomLogs: [
    { id: '1', date: '2026-10-06', dayLabel: 'Mon', shortnessOfBreath: 1, coughSeverity: 2, eyeIrritation: 1, inhalerPuffsUsed: 2, pm25Exposure: 65, notes: 'Felt slight chest tightness on Canal Road' },
    { id: '2', date: '2026-10-07', dayLabel: 'Tue', shortnessOfBreath: 2, coughSeverity: 2, eyeIrritation: 3, inhalerPuffsUsed: 3, pm25Exposure: 95, notes: 'Heavy smog near Gulberg; eye stinging' },
    { id: '3', date: '2026-10-08', dayLabel: 'Wed', shortnessOfBreath: 3, coughSeverity: 3, eyeIrritation: 2, inhalerPuffsUsed: 4, pm25Exposure: 135, notes: 'Peak morning inversion, needed rescue puff' },
    { id: '4', date: '2026-10-09', dayLabel: 'Thu', shortnessOfBreath: 2, coughSeverity: 1, eyeIrritation: 1, inhalerPuffsUsed: 2, pm25Exposure: 88, notes: 'Wore N95 mask; significantly better' },
    { id: '5', date: '2026-10-10', dayLabel: 'Fri', shortnessOfBreath: 1, coughSeverity: 1, eyeIrritation: 0, inhalerPuffsUsed: 1, pm25Exposure: 60, notes: 'Worked mostly indoors with HEPA purifier' },
    { id: '6', date: '2026-10-11', dayLabel: 'Sat', shortnessOfBreath: 0, coughSeverity: 0, eyeIrritation: 0, inhalerPuffsUsed: 0, pm25Exposure: 45, notes: 'Rain cleared the air slightly' },
    { id: '7', date: '2026-10-12', dayLabel: 'Sun', shortnessOfBreath: 1, coughSeverity: 2, eyeIrritation: 2, inhalerPuffsUsed: 2, pm25Exposure: 82, notes: 'Commute on Mall Road, slight cough' },
  ]
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
  const [profile, setProfile] = useState<HealthProfileData>(DEFAULT_PROFILE);
  const [activeTab, setActiveTab] = useState<'overview' | 'assessment' | 'symptoms' | 'emergency'>('overview');
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<HealthProfileData>(DEFAULT_PROFILE);
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

  // Current live environmental data for Lahore (synchronized with SQL & AI Model)
  const [currentLahoreAqi, setCurrentLahoreAqi] = useState<number>(81);
  const [currentLahorePm25, setCurrentLahorePm25] = useState<number>(25.2);

  // Load from localStorage on mount and sync atmospheric readings
  useEffect(() => {
    setMounted(true);
    // Fetch live environmental metrics from SQLite backend
    fetch(getApiEndpoint('/dashboard/overview'))
      .then(res => res.ok ? res.json() : null)
      .then(data => {
        if (data && data.metrics) {
          if (typeof data.metrics.current_aqi === 'number') setCurrentLahoreAqi(data.metrics.current_aqi);
          if (typeof data.metrics.pm25_level === 'number') setCurrentLahorePm25(data.metrics.pm25_level);
        }
      })
      .catch(() => {});

    try {
      const saved = localStorage.getItem('dhuan_user_health_profile');
      if (saved) {
        const parsed = JSON.parse(saved);
        setProfile(parsed);
        setFormData(parsed);
      }
    } catch (e) {
      console.error('Failed to load health profile:', e);
    }
  }, []);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3500);
  };

  // Save changes
  const handleSaveProfile = (dataToSave = formData) => {
    setProfile(dataToSave);
    setFormData(dataToSave);
    setIsEditing(false);
    try {
      localStorage.setItem('dhuan_user_health_profile', JSON.stringify(dataToSave));
      showToast('Health Profile updated successfully!');
    } catch (e) {
      console.error(e);
    }
  };

  // Reset to default
  const handleResetDefaults = () => {
    if (confirm('Reset your health profile to default sample data?')) {
      handleSaveProfile(DEFAULT_PROFILE);
      showToast('Reset to default profile.');
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
            <button
              onClick={() => setIsIdCardOpen(true)}
              className="flex items-center gap-2 px-4 py-3 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-2xl font-bold text-xs sm:text-sm transition-all active:scale-95 border border-slate-200"
            >
              <FileText className="w-4 h-4 text-slate-600" />
              <span>Medical Smog Card</span>
            </button>

            <button
              onClick={() => {
                if (isEditing) {
                  handleSaveProfile();
                } else {
                  setIsEditing(true);
                  setActiveTab('assessment');
                }
              }}
              className={`flex items-center gap-2 px-5 py-3 rounded-2xl font-black text-xs sm:text-sm shadow-md transition-all active:scale-95 ${
                isEditing 
                  ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-500/20' 
                  : 'bg-slate-900 hover:bg-slate-800 text-white'
              }`}
            >
              {isEditing ? (
                <>
                  <Save className="w-4 h-4" />
                  <span>Save All Changes</span>
                </>
              ) : (
                <>
                  <Sliders className="w-4 h-4 text-emerald-400" />
                  <span>Edit Medical Profile</span>
                </>
              )}
            </button>
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
            
            {/* Top Scorecard Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              
              {/* Scorecard 1: AI Vulnerability Index */}
              <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-sm flex flex-col justify-between relative overflow-hidden group hover:border-slate-300 transition-all">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-black text-slate-400 uppercase tracking-wider">AI Vulnerability Index</span>
                  <div className={`px-2.5 py-1 rounded-full text-[11px] font-black border ${vulnerabilityMetrics.tierColor}`}>
                    {vulnerabilityMetrics.tier} Risk
                  </div>
                </div>

                <div className="flex items-baseline gap-2 mb-2">
                  <span className="text-4xl font-black text-slate-900 tracking-tight">{vulnerabilityMetrics.score}</span>
                  <span className="text-sm font-bold text-slate-400">/ 100</span>
                </div>

                {/* Progress bar */}
                <div className="w-full bg-slate-100 rounded-full h-2 mb-3 overflow-hidden">
                  <div 
                    className={`h-full rounded-full transition-all duration-700 ${vulnerabilityMetrics.progressBg}`} 
                    style={{ width: `${vulnerabilityMetrics.score}%` }}
                  />
                </div>

                <p className="text-xs font-medium text-slate-500 line-clamp-2">
                  {profile.asthmaSeverity !== 'none' ? `Triggered by ${profile.asthmaSeverity} Asthma` : 'Moderate baseline sensitivity'} + daily {profile.dailyCommuteMinutes}m {profile.primaryCommute} commute.
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
                  <span className="text-4xl font-black text-slate-900 tracking-tight">{vulnerabilityMetrics.safeMinutesUnmasked}</span>
                  <span className="text-sm font-bold text-slate-500">Mins (Unmasked)</span>
                </div>

                <div className="text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-100 px-2.5 py-1.5 rounded-xl flex items-center justify-between">
                  <span>With N95 Mask:</span>
                  <span className="font-extrabold">{Math.floor(vulnerabilityMetrics.safeMinutesMasked / 60)}h {vulnerabilityMetrics.safeMinutesMasked % 60}m</span>
                </div>

                <p className="text-[11px] font-medium text-slate-400 mt-2">
                  Calculated against Lahore&apos;s current AQI 165.
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
                  <span className="text-4xl font-black text-slate-900 tracking-tight">{vulnerabilityMetrics.totalDailyPm25Ug}</span>
                  <span className="text-sm font-bold text-slate-400">µg / day</span>
                </div>

                <div className="text-xs font-bold text-orange-700 bg-orange-50 border border-orange-100 px-2.5 py-1.5 rounded-xl">
                  {Math.round((vulnerabilityMetrics.totalDailyPm25Ug / 15) * 10) / 10}x WHO Annual Guideline
                </div>

                <p className="text-[11px] font-medium text-slate-400 mt-2">
                  Includes commute & indoor HEPA filtration levels.
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
                    {profile.usesInhaler ? profile.inhalerName.split('(')[0] : 'No Inhaler Prescribed'}
                  </div>
                  <div className="text-xs font-semibold text-emerald-600 flex items-center gap-1.5 mt-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Dose Taken: {profile.lastPreventiveDose}</span>
                  </div>
                </div>

                <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-slate-600">
                  <span>Mask In Use:</span>
                  <span className="uppercase text-slate-900 font-extrabold">{profile.maskType}</span>
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
                    Lahore&apos;s ambient PM2.5 is currently at <strong className="text-white">82 µg/m³ (AQI 165)</strong> with strong ground-level thermal inversion. Because your profile indicates <strong>{profile.asthmaSeverity} Asthma</strong> and a <strong>{profile.dailyCommuteMinutes}-minute {profile.primaryCommute} commute</strong>, fine particulates will reach deep bronchioles within 30 minutes of unmasked exposure.
                  </p>

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
                </div>

                <div className="relative z-10 flex flex-col gap-3 shrink-0">
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
                  <button
                    onClick={() => {
                      setIsEditing(true);
                      setActiveTab('assessment');
                    }}
                    className="text-xs font-bold text-emerald-600 hover:text-emerald-700"
                  >
                    Edit
                  </button>
                </div>

                <div className="space-y-3 text-sm">
                  <div className="flex justify-between py-1">
                    <span className="text-slate-500 font-medium">Patient Name</span>
                    <span className="font-extrabold text-slate-900">{profile.fullName}</span>
                  </div>
                  <div className="flex justify-between py-1">
                    <span className="text-slate-500 font-medium">Age & Gender</span>
                    <span className="font-extrabold text-slate-900">{profile.age} yrs, {profile.gender}</span>
                  </div>
                  <div className="flex justify-between py-1">
                    <span className="text-slate-500 font-medium">Blood Group</span>
                    <span className="font-extrabold text-rose-600 bg-rose-50 px-2 py-0.5 rounded-md">{profile.bloodGroup}</span>
                  </div>
                  <div className="flex justify-between py-1">
                    <span className="text-slate-500 font-medium">Emergency Contact</span>
                    <span className="font-extrabold text-slate-900 text-right">
                      {profile.emergencyContactName}<br />
                      <span className="text-xs text-slate-500 font-normal">{profile.emergencyContact}</span>
                    </span>
                  </div>
                  <div className="flex justify-between py-1">
                    <span className="text-slate-500 font-medium">Daily Commute</span>
                    <span className="font-extrabold text-slate-900 capitalize">
                      {profile.primaryCommute} ({profile.dailyCommuteMinutes} mins/day)
                    </span>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-100">
                  <span className="text-xs font-black text-slate-400 uppercase tracking-wider block mb-2">Pre-Existing Conditions</span>
                  <div className="flex flex-wrap gap-1.5">
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
                <button
                  onClick={handleResetDefaults}
                  className="px-4 py-2.5 text-xs font-bold text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-colors flex items-center gap-1.5"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  Reset Defaults
                </button>
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
