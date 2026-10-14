'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  MapPin,
  Pencil,
  Clock,
  Calendar,
  Bell,
  BellOff,
  Navigation,
  Plus,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  ShieldCheck,
  ArrowRight,
  Sparkles,
  Car,
  Bike,
  Footprints,
  Bus,
  Share2,
  SlidersHorizontal,
  RefreshCw,
  X,
  Search,
  ExternalLink,
  ChevronRight,
  Info,
  Check,
  Flame,
  Wind,
  ShieldAlert,
  Send
} from 'lucide-react';
import { getApiEndpoint } from '@/lib/api';

export interface PlannedStop {
  id: string;
  name: string;
  address: string;
  lat: number;
  lng: number;
  time: string;           // e.g. "09:30 AM"
  day: string;            // "Monday", "Tuesday", etc.
  tag?: string;           // "Work", "Meeting", "Shopping", "Medical", "Dining", "Fitness", "Home"
  vehicle?: 'car' | 'bike' | 'walk' | 'transit';
  aqiForecast: number;
  smogStatus: 'Clean Air' | 'Moderate Haze' | 'Smog Inversion Forming' | 'Dense Smog Inversion' | 'Severe Smog Event' | 'Hazardous Toxic Smog' | string;
  advisory?: string;
  notifications: {
    enabled: boolean;
    leadTimeMins: number; // 15, 30, 45, 60
    isSilent?: boolean;   // true = mute ringtone sound, false = ring on
    smogSpikeAlert: boolean;
    channel: 'push';
  };
  status: 'scheduled' | 'completed' | 'cancelled';
  startName?: string;
  startAddress?: string;
  startLat?: number;
  startLng?: number;
  startType?: 'current' | 'custom';
}

const DAYS_OF_WEEK = [
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
  'Sunday'
];

// Clean empty slate (no dummy hardcoded stops)
const DEFAULT_INITIAL_STOPS: PlannedStop[] = [];

// AI Ringtone Audio Chime Synthesizer (Web Audio API)
function playDhuanAlertChime(): Promise<void> {
  return new Promise((resolve) => {
    try {
      if (typeof window === 'undefined') {
        resolve();
        return;
      }
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) {
        resolve();
        return;
      }
      const ctx = new AudioCtx();
      if (ctx.state === 'suspended') {
        ctx.resume();
      }

      const now = ctx.currentTime;
      // Tone 1: 587.33 Hz (D5) - bright alert tone
      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(587.33, now);
      gain1.gain.setValueAtTime(0.3, now);
      gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
      osc1.connect(gain1);
      gain1.connect(ctx.destination);
      osc1.start(now);
      osc1.stop(now + 0.35);

      // Tone 2: 880 Hz (A5) - bell resonance
      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.type = 'triangle';
      osc2.frequency.setValueAtTime(880, now + 0.18);
      gain2.gain.setValueAtTime(0.35, now + 0.18);
      gain2.gain.exponentialRampToValueAtTime(0.0001, now + 0.7);
      osc2.connect(gain2);
      gain2.connect(ctx.destination);
      osc2.start(now + 0.18);
      osc2.stop(now + 0.7);

      setTimeout(() => {
        try { ctx.close(); } catch(e) {}
        resolve();
      }, 750);
    } catch (err) {
      resolve();
    }
  });
}

// AI Voice Speech Synthesizer (Speaks specific Day, Destination, Time, and Smog details)
function speakAiVoiceAnnouncement(text: string) {
  try {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.98;
      utterance.pitch = 1.05;
      utterance.lang = 'en-US';

      const voices = window.speechSynthesis.getVoices();
      const preferred = voices.find(
        v => (v.name.includes('Natural') || v.name.includes('Google') || v.name.includes('Samantha') || v.name.includes('David')) && v.lang.startsWith('en')
      );
      if (preferred) {
        utterance.voice = preferred;
      }
      window.speechSynthesis.speak(utterance);
    }
  } catch (err) {
    console.warn('Speech synthesis deferred:', err);
  }
}

// Compute exact notice trigger time string (e.g. 10:30 AM minus 15m = 10:15 AM)
export function computeNoticeAlertTimeString(departureTime: string, leadTimeMins: number): string {
  const match = departureTime.match(/(\d+):(\d+)\s*(AM|PM)/i);
  if (!match) return departureTime;
  let hours = parseInt(match[1], 10);
  const minutes = parseInt(match[2], 10);
  const meridiem = match[3].toUpperCase();

  if (meridiem === 'PM' && hours < 12) hours += 12;
  if (meridiem === 'AM' && hours === 12) hours = 0;

  let totalMins = hours * 60 + minutes - leadTimeMins;
  if (totalMins < 0) totalMins += 24 * 60;

  let alertHours = Math.floor(totalMins / 60) % 24;
  const alertMins = totalMins % 60;
  const alertMeridiem = alertHours >= 12 ? 'PM' : 'AM';
  if (alertHours > 12) alertHours -= 12;
  if (alertHours === 0) alertHours = 12;

  const paddedMins = alertMins < 10 ? `0${alertMins}` : alertMins;
  return `${alertHours}:${paddedMins} ${alertMeridiem}`;
}

// Device Notification Engine (Native OS Notification like WhatsApp Web + AI Ringtone Sound)
async function triggerDeviceSmogAlert(params: {
  day: string;
  destinationName: string;
  startName?: string;
  startType?: string;
  time: string;
  aqi: number;
  smogStatus: string;
  isSilent?: boolean;
  leadTimeMins?: number;
}) {
  const { day, destinationName, startName, startType, time, aqi, smogStatus, isSilent, leadTimeMins = 30 } = params;

  // Determine starting location display and spoken wording
  const isCurrentLoc = !startName || startType === 'current' || startName.toLowerCase().includes('current');
  const originDisplay = isCurrentLoc ? 'Current Location' : startName;
  const originSpoken = isCurrentLoc ? 'your current location' : startName;

  // 1. Send Device Notification (Appears on user's device/OS outside webpage like WhatsApp Web)
  if (typeof window !== 'undefined' && 'Notification' in window) {
    const notifBody = `${day} (${time}) • ${leadTimeMins}m notice\nFrom: ${originDisplay} ➔ To: ${destinationName}\nAhead Smog: AQI ${aqi} (${smogStatus}). Take protective travel measures.`;
    if (Notification.permission === 'granted') {
      try {
        new Notification(`DHUAN Alert: ${destinationName}`, {
          body: notifBody,
          icon: '/favicon.ico',
          tag: `dhuan-device-${Date.now()}`
        });
      } catch (e) {
        console.warn('Native notification error:', e);
      }
    } else if (Notification.permission !== 'denied') {
      try {
        const perm = await Notification.requestPermission();
        if (perm === 'granted') {
          new Notification(`DHUAN Alert: ${destinationName}`, {
            body: notifBody,
            icon: '/favicon.ico'
          });
        }
      } catch(e) {}
    }
  }

  // 2. Play AI Voice Ringtone Sound if NOT silenced by user
  if (!isSilent) {
    await playDhuanAlertChime();
    const spokenText = `Dhuan alert. ${day} schedule. ${leadTimeMins} minutes notice before departure from ${originSpoken} to ${destinationName} scheduled for ${time}. Ahead smog level is AQI ${aqi}, ${smogStatus}. Take protective travel precautions.`;
    speakAiVoiceAnnouncement(spokenText);
  }
}

export default function SmartRoutingPage() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [selectedDay, setSelectedDay] = useState('Monday');
  const [allStops, setAllStops] = useState<PlannedStop[]>([]);
  const [filterStatus, setFilterStatus] = useState<'all' | 'scheduled' | 'cancelled'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isSqlSyncing, setIsSqlSyncing] = useState(false);
  const [backendDayCounts, setBackendDayCounts] = useState<Record<string, number>>({});

  // Manual Add Modal State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [manualName, setManualName] = useState('');
  const [manualAddress, setManualAddress] = useState('');
  const [manualTime, setManualTime] = useState('10:30 AM');
  const [manualTag, setManualTag] = useState('Work');
  const [manualVehicle, setManualVehicle] = useState<'car' | 'bike' | 'walk' | 'transit'>('car');
  const [manualLat, setManualLat] = useState(31.5204);
  const [manualDay, setManualDay] = useState('Monday');
  const [manualLng, setManualLng] = useState(74.3587);
  const [photonQuery, setPhotonQuery] = useState('');
  const [photonSuggestions, setPhotonSuggestions] = useState<any[]>([]);
  const [isSearchingPhoton, setIsSearchingPhoton] = useState(false);

  // Manual Starting Location State
  const [manualStartType, setManualStartType] = useState<'current' | 'custom'>('current');
  const [manualStartName, setManualStartName] = useState('My Current Location');
  const [manualStartAddress, setManualStartAddress] = useState('GPS Live Coordinates');
  const [manualStartLat, setManualStartLat] = useState(31.5204);
  const [manualStartLng, setManualStartLng] = useState(74.3587);
  const [startPhotonQuery, setStartPhotonQuery] = useState('');
  const [startPhotonSuggestions, setStartPhotonSuggestions] = useState<any[]>([]);
  const [isSearchingStartPhoton, setIsSearchingStartPhoton] = useState(false);

  // Dedicated Map Destination Modal State (Separate from manual modal!)
  const [isMapModalOpen, setIsMapModalOpen] = useState(false);
  const [mapDestName, setMapDestName] = useState('');
  const [mapDestAddress, setMapDestAddress] = useState('');
  const [mapDestLat, setMapDestLat] = useState(31.5204);
  const [mapDestLng, setMapDestLng] = useState(74.3587);
  const [mapDestDay, setMapDestDay] = useState('Monday');
  const [mapDestTime, setMapDestTime] = useState('10:30 AM');
  const [mapDestTag, setMapDestTag] = useState('Work');
  const [mapDestVehicle, setMapDestVehicle] = useState<'car' | 'bike' | 'walk' | 'transit'>('car');
  const [mapStartType, setMapStartType] = useState<'current' | 'custom'>('current');
  const [mapStartName, setMapStartName] = useState('My Current Location');
  const [mapStartAddress, setMapStartAddress] = useState('GPS Live Coordinates');
  const [mapStartLat, setMapStartLat] = useState(31.5204);
  const [mapStartLng, setMapStartLng] = useState(74.3587);

  // Full Edit Destination Modal State
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editStopId, setEditStopId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editAddress, setEditAddress] = useState('');
  const [editLat, setEditLat] = useState(31.5204);
  const [editLng, setEditLng] = useState(74.3587);
  const [editDay, setEditDay] = useState('Monday');
  const [editTime, setEditTime] = useState('10:30 AM');
  const [editTag, setEditTag] = useState('Work');
  const [editVehicle, setEditVehicle] = useState<'car' | 'bike' | 'walk' | 'transit'>('car');
  const [editStartType, setEditStartType] = useState<'current' | 'custom'>('current');
  const [editStartName, setEditStartName] = useState('My Current Location');
  const [editStartAddress, setEditStartAddress] = useState('GPS Live Coordinates');
  const [editStartLat, setEditStartLat] = useState(31.5204);
  const [editStartLng, setEditStartLng] = useState(74.3587);
  const [editLeadTime, setEditLeadTime] = useState(30);
  const [editPhotonQuery, setEditPhotonQuery] = useState('');
  const [editPhotonSuggestions, setEditPhotonSuggestions] = useState<any[]>([]);
  const [isSearchingEditPhoton, setIsSearchingEditPhoton] = useState(false);

  // Notification Toast State
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Fetch planned destinations from backend database database
  const fetchDestinations = useCallback(async () => {
    setIsSqlSyncing(true);
    try {
      const res = await fetch(getApiEndpoint('/routing/destinations?day=all'));
      if (res.ok) {
        const data = await res.json();
        if (data.destinations && Array.isArray(data.destinations)) {
          setAllStops(data.destinations);
          if (data.dayCounts) {
            setBackendDayCounts(data.dayCounts);
          }
          try {
            localStorage.setItem('dhuan_planned_trips', JSON.stringify(data.destinations));
          } catch (e) {}
          return;
        }
      }
    } catch (err) {
      console.warn('Backend database sync deferred, using local cache:', err);
    } finally {
      setIsSqlSyncing(false);
    }

    // Fallback to localStorage if backend fetch deferred
    try {
      const stored = localStorage.getItem('dhuan_planned_trips');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setAllStops(parsed);
          return;
        }
      }
      setAllStops(DEFAULT_INITIAL_STOPS);
    } catch (e) {
      setAllStops(DEFAULT_INITIAL_STOPS);
    }
  }, []);

  useEffect(() => {
    setMounted(true);
    try {
      const stored = localStorage.getItem('dhuan_planned_trips');
      if (stored && stored.includes('stop-1')) {
        localStorage.removeItem('dhuan_planned_trips');
      }
    } catch (e) {}
    fetchDestinations();

    // Check if redirected from Map View with picked location
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      if (params.get('addFromMap') === 'true') {
        const mName = params.get('name') || 'Selected Destination';
        const mAddress = params.get('address') || mName;
        const mLat = parseFloat(params.get('lat') || '31.5204');
        const mLng = parseFloat(params.get('lng') || '74.3587');
        const mDay = params.get('day') || 'Monday';

        const sType = (params.get('startType') === 'custom' ? 'custom' : 'current') as 'current' | 'custom';
        const sName = params.get('startName') || (sType === 'current' ? 'My Current Location' : 'Custom Starting Point');
        const sAddress = params.get('startAddress') || (sType === 'current' ? 'GPS Live Coordinates' : sName);
        const sLat = parseFloat(params.get('startLat') || '31.5204');
        const sLng = parseFloat(params.get('startLng') || '74.3587');

        setMapDestName(mName);
        setMapDestAddress(mAddress);
        setMapDestLat(mLat);
        setMapDestLng(mLng);
        setMapDestDay(mDay);
        setMapStartType(sType);
        setMapStartName(sName);
        setMapStartAddress(sAddress);
        setMapStartLat(sLat);
        setMapStartLng(sLng);

        if (DAYS_OF_WEEK.includes(mDay)) {
          setSelectedDay(mDay);
        }
        // User requested: Do NOT open manual modal. Open dedicated Map Modal!
        setIsMapModalOpen(true);
        window.history.replaceState({}, '', '/dashboard/routing');
      }
    }
  }, [fetchDestinations]);

  // Save changes to localStorage helper
  const saveStops = (updated: PlannedStop[]) => {
    setAllStops(updated);
    try {
      localStorage.setItem('dhuan_planned_trips', JSON.stringify(updated));
    } catch (e) {
      console.error(e);
    }
  };

  // Filter stops by selected Day and search/status
  const dayStops = useMemo(() => {
    return allStops.filter(s => {
      const matchDay = s.day === selectedDay;
      const matchStatus = filterStatus === 'all' || s.status === filterStatus;
      const matchQuery =
        !searchQuery ||
        s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.address.toLowerCase().includes(searchQuery.toLowerCase());
      return matchDay && matchStatus && matchQuery;
    });
  }, [allStops, selectedDay, filterStatus, searchQuery]);

  // Counts per day for badges (prioritizing verified SQL counts)
  const dayCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    DAYS_OF_WEEK.forEach(day => {
      if (backendDayCounts[day] !== undefined) {
        counts[day] = backendDayCounts[day];
      } else {
        counts[day] = allStops.filter(s => s.day === day && s.status !== 'cancelled').length;
      }
    });
    return counts;
  }, [allStops, backendDayCounts]);

  // AI Smog Advisor Statistics for Current Day
  const aiStats = useMemo(() => {
    const active = allStops.filter(s => s.day === selectedDay && s.status === 'scheduled');
    if (active.length === 0) return null;

    const avgAqi = Math.round(active.reduce((acc, s) => acc + s.aqiForecast, 0) / active.length);
    const highSmogCount = active.filter(s => s.aqiForecast > 180).length;
    const optimalCount = active.filter(s => s.aqiForecast <= 135).length;

    // Estimate reduction if morning trips shifted to clean air window
    const hasMorningSpike = active.some(s => {
      const h = parseInt(s.time.split(':')[0], 10);
      const isAm = s.time.toLowerCase().includes('am');
      return isAm && (h === 7 || h === 8 || h === 9);
    });

    return {
      total: active.length,
      avgAqi,
      highSmogCount,
      optimalCount,
      hasMorningSpike,
      exposureReductionPct: hasMorningSpike ? 38 : 15
    };
  }, [allStops, selectedDay]);

  // Handle Photon Search for Manual Add Destination
  const handlePhotonSearch = (val: string) => {
    setPhotonQuery(val);
    if (val.trim().length > 2) {
      setIsSearchingPhoton(true);
      fetch(`https://photon.komoot.io/api/?q=${encodeURIComponent(val.trim())}&lat=31.5204&lon=74.3587&limit=5`)
        .then(r => r.json())
        .then(data => {
          if (data.features) {
            setPhotonSuggestions(
              data.features.map((f: any) => ({
                lat: f.geometry.coordinates[1],
                lon: f.geometry.coordinates[0],
                name: f.properties.name || f.properties.street || val,
                address: [f.properties.name, f.properties.street, f.properties.city].filter(Boolean).join(', ')
              }))
            );
          }
          setIsSearchingPhoton(false);
        })
        .catch(() => {
          setIsSearchingPhoton(false);
          setPhotonSuggestions([]);
        });
    } else {
      setPhotonSuggestions([]);
    }
  };

  // Handle Photon Search for Starting Location
  const handleStartPhotonSearch = (val: string) => {
    setStartPhotonQuery(val);
    if (val.trim().length > 2) {
      setIsSearchingStartPhoton(true);
      fetch(`https://photon.komoot.io/api/?q=${encodeURIComponent(val.trim())}&lat=31.5204&lon=74.3587&limit=5`)
        .then(r => r.json())
        .then(data => {
          if (data.features) {
            setStartPhotonSuggestions(
              data.features.map((f: any) => ({
                lat: f.geometry.coordinates[1],
                lon: f.geometry.coordinates[0],
                name: f.properties.name || f.properties.street || val,
                address: [f.properties.name, f.properties.street, f.properties.city].filter(Boolean).join(', ')
              }))
            );
          }
          setIsSearchingStartPhoton(false);
        })
        .catch(() => {
          setIsSearchingStartPhoton(false);
          setStartPhotonSuggestions([]);
        });
    } else {
      setStartPhotonSuggestions([]);
    }
  };

  // Add Manual Destination into Backend Database & Spatial Engine
  const handleAddManualStop = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualName.trim()) return;

    setIsSqlSyncing(true);
    const startName = manualStartType === 'current' ? 'My Current Location' : (manualStartName.trim() || 'Custom Starting Location');
    const startAddress = manualStartType === 'current' ? 'GPS Live Coordinates' : (manualStartAddress.trim() || manualStartName.trim());
    const startLat = manualStartType === 'current' ? 31.5204 : manualStartLat;
    const startLng = manualStartType === 'current' ? 74.3587 : manualStartLng;

    try {
      const payload = {
        name: manualName.trim(),
        address: manualAddress.trim() || manualName.trim(),
        lat: manualLat,
        lng: manualLng,
        time: manualTime,
        day: manualDay,
        tag: manualTag,
        vehicle: manualVehicle,
        status: 'scheduled',
        startType: manualStartType,
        startName,
        startAddress,
        startLat,
        startLng,
        notifications: {
          enabled: true,
          leadTimeMins: 30,
          isSilent: false,
          smogSpikeAlert: true,
          channel: 'push'
        }
      };

      const res = await fetch(getApiEndpoint('/routing/destinations'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        const data = await res.json();
        const newlyAdded = data.destinations || (data.destination ? [data.destination] : []);
        if (newlyAdded.length > 0) {
          const updated = [...allStops, ...newlyAdded];
          setAllStops(updated);
          try {
            localStorage.setItem('dhuan_planned_trips', JSON.stringify(updated));
          } catch (e) {}

          if (manualDay !== 'All' && selectedDay !== manualDay && DAYS_OF_WEEK.includes(manualDay)) {
            setSelectedDay(manualDay);
          }

          showToast(
            manualDay === 'All'
              ? `Destination "${manualName.trim()}" added to ALL 7 days!`
              : `Destination "${manualName.trim()}" added to ${manualDay}! Projected AQI: ${newlyAdded[0].aqiForecast}`
          );
          setIsAddModalOpen(false);
          setManualName('');
          setManualAddress('');
          setPhotonQuery('');
          setPhotonSuggestions([]);
          setManualStartType('current');
          setManualStartName('My Current Location');
          setManualStartAddress('GPS Live Coordinates');
          setStartPhotonQuery('');
          setStartPhotonSuggestions([]);
          fetchDestinations();
          return;
        }
      }
    } catch (err) {
      console.error('Error adding stop to database:', err);
    } finally {
      setIsSqlSyncing(false);
    }

    // Offline / fallback addition
    const targetDays = manualDay === 'All' ? DAYS_OF_WEEK : [manualDay];
    const fallbackStops: PlannedStop[] = targetDays.map(d => ({
      id: `dest-${Date.now()}-${d.toLowerCase().slice(0, 3)}`,
      name: manualName,
      address: manualAddress || manualName,
      lat: manualLat,
      lng: manualLng,
      time: manualTime,
      day: d,
      tag: manualTag,
      vehicle: manualVehicle,
      aqiForecast: 110,
      smogStatus: 'Moderate Haze',
      advisory: 'Optimal window for travel.',
      startType: manualStartType,
      startName,
      startAddress,
      startLat,
      startLng,
      notifications: {
        enabled: true,
        leadTimeMins: 30,
        isSilent: false,
        smogSpikeAlert: true,
        channel: 'push'
      },
      status: 'scheduled'
    }));

    const updated = [...allStops, ...fallbackStops];
    saveStops(updated);
    if (manualDay !== 'All' && selectedDay !== manualDay && DAYS_OF_WEEK.includes(manualDay)) {
      setSelectedDay(manualDay);
    }
    setIsAddModalOpen(false);
    setManualName('');
    setManualAddress('');
    setManualStartType('current');
    setManualStartName('My Current Location');
    setManualStartAddress('GPS Live Coordinates');
    showToast(manualDay === 'All' ? 'Added destination to ALL 7 days!' : `Added "${manualName}" to ${manualDay}!`);
  };

  // Open Edit Modal with selected stop data
  const handleOpenEditModal = (stop: PlannedStop) => {
    setEditStopId(stop.id);
    setEditName(stop.name);
    setEditAddress(stop.address);
    setEditLat(stop.lat);
    setEditLng(stop.lng);
    setEditDay(stop.day);
    setEditTime(stop.time);
    setEditTag(stop.tag || 'Work');
    setEditVehicle(stop.vehicle || 'car');
    setEditStartType(stop.startType || 'current');
    setEditStartName(stop.startName || 'My Current Location');
    setEditStartAddress(stop.startAddress || 'GPS Live Coordinates');
    setEditStartLat(stop.startLat || 31.5204);
    setEditStartLng(stop.startLng || 74.3587);
    setEditLeadTime(stop.notifications?.leadTimeMins || 30);
    setEditPhotonQuery('');
    setEditPhotonSuggestions([]);
    setIsEditModalOpen(true);
  };

  // Search destination for Edit modal
  const handleEditPhotonSearch = (val: string) => {
    setEditPhotonQuery(val);
    if (val.trim().length > 2) {
      setIsSearchingEditPhoton(true);
      fetch(`https://photon.komoot.io/api/?q=${encodeURIComponent(val.trim())}&lat=31.5204&lon=74.3587&limit=5`)
        .then(r => r.json())
        .then(data => {
          if (data.features) {
            setEditPhotonSuggestions(
              data.features.map((f: any) => ({
                lat: f.geometry.coordinates[1],
                lon: f.geometry.coordinates[0],
                name: f.properties.name || f.properties.street || val,
                address: [f.properties.name, f.properties.street, f.properties.city].filter(Boolean).join(', ')
              }))
            );
          }
          setIsSearchingEditPhoton(false);
        })
        .catch(() => {
          setIsSearchingEditPhoton(false);
          setEditPhotonSuggestions([]);
        });
    } else {
      setEditPhotonSuggestions([]);
    }
  };

  // Save updated destination to backend database
  const handleSaveEditStop = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editStopId || !editName.trim()) return;

    setIsSqlSyncing(true);
    const startName = editStartType === 'current' ? 'My Current Location' : (editStartName.trim() || 'Custom Starting Location');
    const startAddress = editStartType === 'current' ? 'GPS Live Coordinates' : (editStartAddress.trim() || editStartName.trim());
    const startLat = editStartType === 'current' ? 31.5204 : editStartLat;
    const startLng = editStartType === 'current' ? 74.3587 : editStartLng;

    const payload = {
      name: editName.trim(),
      address: editAddress.trim() || editName.trim(),
      lat: editLat,
      lng: editLng,
      time: editTime.trim(),
      day: editDay,
      tag: editTag,
      vehicle: editVehicle,
      startType: editStartType,
      startName,
      startAddress,
      startLat,
      startLng,
      notifications: {
        leadTimeMins: editLeadTime
      }
    };

    try {
      const res = await fetch(getApiEndpoint(`/routing/destinations/${editStopId}`), {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        const data = await res.json();
        if (data.destination) {
          const updated = allStops.map(s => (s.id === editStopId ? data.destination : s));
          setAllStops(updated);
          try {
            localStorage.setItem('dhuan_planned_trips', JSON.stringify(updated));
          } catch (e) {}

          if (selectedDay !== editDay && DAYS_OF_WEEK.includes(editDay)) {
            setSelectedDay(editDay);
          }

          showToast(`Destination "${editName.trim()}" updated successfully!`);
          setIsEditModalOpen(false);
          fetchDestinations();
          return;
        }
      }
    } catch (err) {
      console.error('Error updating destination in DB:', err);
    } finally {
      setIsSqlSyncing(false);
    }

    // Fallback local update
    const updated = allStops.map(s => {
      if (s.id === editStopId) {
        return {
          ...s,
          name: editName.trim(),
          address: editAddress.trim() || editName.trim(),
          lat: editLat,
          lng: editLng,
          time: editTime.trim(),
          day: editDay,
          tag: editTag,
          vehicle: editVehicle,
          startType: editStartType,
          startName,
          startAddress,
          startLat,
          startLng,
          notifications: {
            ...s.notifications,
            leadTimeMins: editLeadTime
          }
        };
      }
      return s;
    });
    saveStops(updated);
    if (selectedDay !== editDay && DAYS_OF_WEEK.includes(editDay)) {
      setSelectedDay(editDay);
    }
    setIsEditModalOpen(false);
    showToast(`Destination "${editName.trim()}" updated!`);
  };

  // Add Dedicated Map Destination into Backend Database & Spatial Engine
  const handleAddMapStop = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!mapDestName.trim()) return;

    setIsSqlSyncing(true);
    const startName = mapStartType === 'current' ? 'My Current Location' : (mapStartName.trim() || 'Custom Starting Location');
    const startAddress = mapStartType === 'current' ? 'GPS Live Coordinates' : (mapStartAddress.trim() || mapStartName.trim());
    const startLat = mapStartType === 'current' ? 31.5204 : mapStartLat;
    const startLng = mapStartType === 'current' ? 74.3587 : mapStartLng;

    try {
      const payload = {
        name: mapDestName.trim(),
        address: mapDestAddress.trim() || mapDestName.trim(),
        lat: mapDestLat,
        lng: mapDestLng,
        time: mapDestTime,
        day: mapDestDay,
        tag: mapDestTag,
        vehicle: mapDestVehicle,
        status: 'scheduled',
        startType: mapStartType,
        startName,
        startAddress,
        startLat,
        startLng,
        notifications: {
          enabled: true,
          leadTimeMins: 30,
          isSilent: false,
          smogSpikeAlert: true,
          channel: 'push'
        }
      };

      const res = await fetch(getApiEndpoint('/routing/destinations'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        const data = await res.json();
        const newlyAdded = data.destinations || (data.destination ? [data.destination] : []);
        if (newlyAdded.length > 0) {
          const updated = [...allStops, ...newlyAdded];
          setAllStops(updated);
          try {
            localStorage.setItem('dhuan_planned_trips', JSON.stringify(updated));
          } catch (e) {}

          if (mapDestDay !== 'All' && selectedDay !== mapDestDay && DAYS_OF_WEEK.includes(mapDestDay)) {
            setSelectedDay(mapDestDay);
          }

          showToast(
            mapDestDay === 'All'
              ? `Map Destination "${mapDestName.trim()}" added to ALL 7 days!`
              : `Map Destination "${mapDestName.trim()}" added to ${mapDestDay}! Projected AQI: ${newlyAdded[0].aqiForecast}`
          );
          setIsMapModalOpen(false);
          fetchDestinations();
          return;
        }
      }
    } catch (err) {
      console.error('Error adding map destination to database:', err);
    } finally {
      setIsSqlSyncing(false);
    }

    // Fallback
    const targetDays = mapDestDay === 'All' ? DAYS_OF_WEEK : [mapDestDay];
    const fallbackStops: PlannedStop[] = targetDays.map(d => ({
      id: `dest-${Date.now()}-${d.toLowerCase().slice(0, 3)}`,
      name: mapDestName,
      address: mapDestAddress || mapDestName,
      lat: mapDestLat,
      lng: mapDestLng,
      time: mapDestTime,
      day: d,
      tag: mapDestTag,
      vehicle: mapDestVehicle,
      aqiForecast: 120,
      smogStatus: 'Moderate Haze',
      advisory: 'Optimal window for travel.',
      startType: mapStartType,
      startName,
      startAddress,
      startLat,
      startLng,
      notifications: {
        enabled: true,
        leadTimeMins: 30,
        isSilent: false,
        smogSpikeAlert: true,
        channel: 'push'
      },
      status: 'scheduled'
    }));

    const updated = [...allStops, ...fallbackStops];
    saveStops(updated);
    if (mapDestDay !== 'All' && selectedDay !== mapDestDay && DAYS_OF_WEEK.includes(mapDestDay)) {
      setSelectedDay(mapDestDay);
    }
    setIsMapModalOpen(false);
    showToast(mapDestDay === 'All' ? 'Added map destination to ALL 7 days!' : `Added "${mapDestName}" to ${mapDestDay}!`);
  };

  // Toggle Notification for a Destination in database
  const toggleNotification = async (id: string) => {
    const target = allStops.find(s => s.id === id);
    const newEnabled = target ? !target.notifications?.enabled : true;

    const updated = allStops.map(s => {
      if (s.id === id) {
        const notifs = s.notifications || {
          enabled: true,
          leadTimeMins: 30,
          smogSpikeAlert: true,
          channel: 'push'
        };
        return {
          ...s,
          notifications: {
            ...notifs,
            enabled: newEnabled
          }
        };
      }
      return s;
    });
    saveStops(updated);

    try {
      await fetch(getApiEndpoint(`/routing/destinations/${id}`), {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notifications: { enabled: newEnabled } })
      });
    } catch (err) {
      console.error('Error syncing notification toggle to DB:', err);
    }
  };

  // Update Notification Lead Time in database
  const updateLeadTime = async (id: string, mins: number) => {
    const target = allStops.find(s => s.id === id);
    const updated = allStops.map(s => {
      if (s.id === id) {
        const notifs = s.notifications || {
          enabled: true,
          leadTimeMins: 30,
          smogSpikeAlert: true,
          channel: 'push'
        };
        return {
          ...s,
          notifications: {
            ...notifs,
            leadTimeMins: mins
          }
        };
      }
      return s;
    });
    saveStops(updated);

    const alertTimeStr = target ? computeNoticeAlertTimeString(target.time, mins) : '';
    showToast(
      alertTimeStr
        ? `Notice set to ${mins}m! Device alert scheduled at ${alertTimeStr} (${mins} mins before ${target?.time || 'departure'}).`
        : `Notice set to ${mins} minutes before departure.`
    );

    try {
      await fetch(getApiEndpoint(`/routing/destinations/${id}`), {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notifications: { leadTimeMins: mins } })
      });
    } catch (err) {
      console.error('Error syncing lead time to DB:', err);
    }
  };

  // Toggle Silent Mode (Sound ON vs Silent) for a Destination
  const toggleSilentAlert = async (id: string) => {
    const target = allStops.find(s => s.id === id);
    const newIsSilent = target ? !target.notifications?.isSilent : true;

    const updated = allStops.map(s => {
      if (s.id === id) {
        const notifs = s.notifications || {
          enabled: true,
          leadTimeMins: 30,
          smogSpikeAlert: true,
          channel: 'push'
        };
        return {
          ...s,
          notifications: {
            ...notifs,
            isSilent: newIsSilent
          }
        };
      }
      return s;
    });
    saveStops(updated);

    try {
      await fetch(getApiEndpoint(`/routing/destinations/${id}`), {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notifications: { isSilent: newIsSilent } })
      });
    } catch (err) {
      console.error('Error syncing silent mode to DB:', err);
    }
  };

  // Test alert for a specific stop on user's device
  const handleTestStopAlert = async (stop: PlannedStop) => {
    if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'default') {
      try {
        await Notification.requestPermission();
      } catch (e) {}
    }

    await triggerDeviceSmogAlert({
      day: stop.day,
      destinationName: stop.name,
      startName: stop.startName,
      startType: stop.startType,
      time: stop.time,
      aqi: stop.aqiForecast,
      smogStatus: stop.smogStatus,
      leadTimeMins: stop.notifications?.leadTimeMins || 30,
      isSilent: stop.notifications?.isSilent ?? false
    });

    try {
      await fetch(getApiEndpoint('/routing/destinations/test-alert'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ day: stop.day, id: stop.id })
      });
    } catch (e) {}
  };

  // Proactive Real-Time Device Alert Monitor (Runs in background like WhatsApp Web)
  const alertedStopsRef = React.useRef<Set<string>>(new Set());

  useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'default') {
      try {
        Notification.requestPermission();
      } catch (e) {}
    }

    const checkInterval = setInterval(() => {
      if (allStops.length === 0) return;
      const now = new Date();
      const currentDay = DAYS_OF_WEEK[(now.getDay() + 6) % 7];
      const currentHours = now.getHours();
      const currentMinutes = now.getMinutes();
      const currentTimeInMins = currentHours * 60 + currentMinutes;

      allStops.forEach(stop => {
        if (!stop.notifications?.enabled || stop.status === 'cancelled') return;
        if (stop.day !== currentDay) return;

        const timeMatch = stop.time.match(/(\d+):(\d+)\s*(AM|PM)/i);
        if (!timeMatch) return;
        let stopHours = parseInt(timeMatch[1], 10);
        const stopMinutes = parseInt(timeMatch[2], 10);
        const meridiem = timeMatch[3].toUpperCase();

        if (meridiem === 'PM' && stopHours < 12) stopHours += 12;
        if (meridiem === 'AM' && stopHours === 12) stopHours = 0;

        const stopTimeInMins = stopHours * 60 + stopMinutes;
        const leadTime = stop.notifications?.leadTimeMins || 30;
        let targetAlertTimeInMins = stopTimeInMins - leadTime;
        if (targetAlertTimeInMins < 0) targetAlertTimeInMins += 24 * 60;

        const alertKey = `${stop.id}-${currentDay}-${stop.time}-${leadTime}-${now.toDateString()}`;
        if (
          currentTimeInMins >= targetAlertTimeInMins &&
          currentTimeInMins <= targetAlertTimeInMins + 1 &&
          !alertedStopsRef.current.has(alertKey)
        ) {
          alertedStopsRef.current.add(alertKey);
          triggerDeviceSmogAlert({
            day: stop.day,
            destinationName: stop.name,
            startName: stop.startName,
            startType: stop.startType,
            time: stop.time,
            aqi: stop.aqiForecast,
            smogStatus: stop.smogStatus,
            leadTimeMins: leadTime,
            isSilent: stop.notifications?.isSilent ?? false
          });
        }
      });
    }, 10000);

    return () => clearInterval(checkInterval);
  }, [allStops]);

  // Cancel or Restore Destination in database
  const toggleCancelStop = async (id: string) => {
    const target = allStops.find(s => s.id === id);
    const nextStatus: PlannedStop['status'] = target?.status === 'cancelled' ? 'scheduled' : 'cancelled';

    const updated = allStops.map(s => {
      if (s.id === id) {
        return { ...s, status: nextStatus };
      }
      return s;
    });
    saveStops(updated);
    showToast(nextStatus === 'cancelled' ? 'Destination cancelled' : 'Destination restored');

    try {
      await fetch(getApiEndpoint(`/routing/destinations/${id}`), {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: nextStatus })
      });
      fetchDestinations();
    } catch (err) {
      console.error('Error syncing cancel status to DB:', err);
    }
  };

  // Permanently Delete Destination from database
  const handleDeleteStop = async (id: string) => {
    const updated = allStops.filter(s => s.id !== id);
    saveStops(updated);
    showToast('Destination removed from schedule');

    try {
      await fetch(getApiEndpoint(`/routing/destinations/${id}`), {
        method: 'DELETE'
      });
      fetchDestinations();
    } catch (err) {
      console.error('Error deleting destination from DB:', err);
    }
  };

  // Apply AI Departure Time Optimization via Backend & AI Model
  const handleApplyAiOptimization = async () => {
    setIsSqlSyncing(true);
    try {
      const res = await fetch(getApiEndpoint('/routing/destinations/optimize'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ day: selectedDay })
      });

      if (res.ok) {
        const data = await res.json();
        if (data.success && data.destinations) {
          setAllStops(data.destinations);
          try {
            localStorage.setItem('dhuan_planned_trips', JSON.stringify(data.destinations));
          } catch (e) {}
          showToast(`AI Clean Air Schedule Applied! Shifted ${data.modifiedCount} stops past peak smog thermal inversion (-${data.summary?.netReductionPct || 38}% PM2.5).`);
          fetchDestinations();
          return;
        }
      }
    } catch (err) {
      console.error('Error applying AI optimization from backend:', err);
    } finally {
      setIsSqlSyncing(false);
    }

    // Fallback
    const updated = allStops.map(s => {
      if (s.day !== selectedDay || s.status === 'cancelled') return s;
      if (s.time.includes('08:') || s.time.includes('8:')) {
        return {
          ...s,
          time: '10:30 AM',
          aqiForecast: Math.max(95, s.aqiForecast - 80),
          smogStatus: 'Moderate Haze',
          advisory: 'AI Optimized: Shifted past morning inversion. -42% PM2.5 exposure.'
        };
      }
      if (s.time.includes('06:') || s.time.includes('6:')) {
        return {
          ...s,
          time: '08:30 PM',
          aqiForecast: Math.max(120, s.aqiForecast - 60),
          smogStatus: 'Smog Inversion Forming',
          advisory: 'AI Optimized: Shifted past evening peak rush.'
        };
      }
      return s;
    });
    saveStops(updated);
    showToast('AI Smog Optimization Applied! All departures aligned to clean air windows.');
  };

  // Send Proactive Smog Alert to Device
  const handleSendTestSmogAlert = async () => {
    if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'default') {
      try {
        await Notification.requestPermission();
      } catch (e) {}
    }

    try {
      const res = await fetch(getApiEndpoint('/routing/destinations/test-alert'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ day: selectedDay })
      });
      if (res.ok) {
        const data = await res.json();
        if (data.alert) {
          await triggerDeviceSmogAlert({
            day: data.alert.day || selectedDay,
            destinationName: data.alert.destinationName || dayStops[0]?.name || 'Lahore',
            startName: data.alert.startName || dayStops[0]?.startName,
            startType: data.alert.startType || dayStops[0]?.startType,
            time: data.alert.time || dayStops[0]?.time || '10:00 AM',
            aqi: data.alert.aqi || dayStops[0]?.aqiForecast || 160,
            smogStatus: data.alert.smogStatus || dayStops[0]?.smogStatus || 'Moderate Haze',
            leadTimeMins: data.alert.leadTimeMins || dayStops[0]?.notifications?.leadTimeMins || 30,
            isSilent: data.alert.isSilent ?? dayStops[0]?.notifications?.isSilent ?? false
          });
          return;
        }
      }
    } catch (err) {
      console.error('Error sending test alert:', err);
    }

    const firstActive = dayStops.find(s => s.status === 'scheduled') || dayStops[0];
    if (firstActive) {
      await triggerDeviceSmogAlert({
        day: firstActive.day,
        destinationName: firstActive.name,
        startName: firstActive.startName,
        startType: firstActive.startType,
        time: firstActive.time,
        aqi: firstActive.aqiForecast,
        smogStatus: firstActive.smogStatus,
        leadTimeMins: firstActive.notifications?.leadTimeMins || 30,
        isSilent: firstActive.notifications?.isSilent ?? false
      });
    }
  };

  // Clear Day Schedule
  const handleClearSchedule = async () => {
    if (confirm(`Clear all scheduled stops for ${selectedDay}?`)) {
      setIsSqlSyncing(true);
      try {
        const toDelete = allStops.filter(s => s.day === selectedDay);
        await Promise.all(
          toDelete.map(s =>
            fetch(getApiEndpoint(`/routing/destinations/${s.id}`), { method: 'DELETE' })
          )
        );
        fetchDestinations();
      } catch (err) {
        console.error('Error clearing schedule:', err);
      } finally {
        setIsSqlSyncing(false);
      }
    }
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4500);
  };

  if (!mounted) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
        <div className="flex items-center gap-3 text-slate-500 font-bold">
          <div className="w-5 h-5 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin"></div>
          Loading Smart Routing Itinerary...
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-full bg-slate-50 flex flex-col pb-16">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-20 right-6 z-[9999] bg-slate-900 text-white px-5 py-3.5 rounded-2xl shadow-2xl flex items-center gap-3 border border-slate-700 animate-in slide-in-from-top-4 duration-300">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <span className="text-xs font-bold">{toastMessage}</span>
          <button onClick={() => setToastMessage(null)} className="ml-2 text-slate-400 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Main Container */}
      <div className="max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 pt-6 space-y-6">
        {/* Header Section */}
        <div className="bg-white rounded-3xl p-6 md:p-8 border border-slate-200/80 shadow-sm flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative overflow-hidden">
          <div className="relative z-10 max-w-2xl">
            <div className="flex flex-wrap items-center gap-2 mb-3">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-black tracking-wide uppercase">
                <Wind className="w-3.5 h-3.5 text-emerald-600" />
                Spatial AI Pre-Planning & Eco-Routing
              </div>
              {isSqlSyncing && (
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-bold">
                  <div className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></div>
                  <span>Syncing...</span>
                </div>
              )}
            </div>
            <h1 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight leading-tight">
              Smart Routing & Trip Pre-Planner
            </h1>
            <p className="text-slate-500 text-sm sm:text-base mt-2 font-medium leading-relaxed">
              Pre-plan your multi-destination stops across Lahore for any day of the week. Avoid peak smog surges, receive proactive arrival advisories, and navigate with minimum PM2.5 exposure.
            </p>
          </div>

          {/* Quick Action Buttons */}
          <div className="relative z-10 flex flex-wrap items-center gap-3">
            {/* Pick from Live Map Button */}
            <Link
              href={`/dashboard/map?mode=preplan&day=${selectedDay}`}
              className="flex items-center gap-2 px-5 py-3.5 bg-slate-900 hover:bg-slate-800 text-white rounded-2xl font-black text-sm shadow-md hover:shadow-lg transition-all active:scale-95 group"
            >
              <MapPin className="w-4 h-4 text-emerald-400 group-hover:scale-110 transition-transform" />
              <span>Add Destination from Map</span>
              <ExternalLink className="w-3.5 h-3.5 text-slate-400 group-hover:text-emerald-400 transition-colors" />
            </Link>

            {/* Manual Add Button */}
            <button
              onClick={() => { setManualDay(selectedDay); setIsAddModalOpen(true); }}
              className="flex items-center gap-2 px-4 py-3.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-2xl font-bold text-sm shadow-xs transition-colors"
            >
              <Plus className="w-4 h-4 text-emerald-600" />
              <span>Add Destination Manually</span>
            </button>
          </div>
        </div>

        {/* Days of the Week Selector Bar */}
        <div className="bg-white rounded-2xl p-2 border border-slate-200/80 shadow-sm flex items-center gap-2 overflow-x-auto scrollbar-thin scrollbar-thumb-slate-200">
          {DAYS_OF_WEEK.map(day => {
            const count = dayCounts[day] || 0;
            const isSelected = selectedDay === day;
            return (
              <button
                key={day}
                onClick={() => setSelectedDay(day)}
                className={`flex items-center gap-2.5 px-5 py-3 rounded-xl font-bold text-sm transition-all whitespace-nowrap shrink-0 ${
                  isSelected
                    ? 'bg-slate-900 text-white shadow-md'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <Calendar className={`w-4 h-4 ${isSelected ? 'text-emerald-400' : 'text-slate-400'}`} />
                <span>{day}</span>
                <span
                  className={`text-xs px-2 py-0.5 rounded-full font-black ${
                    isSelected
                      ? 'bg-emerald-500 text-slate-900'
                      : count > 0
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/60'
                      : 'bg-slate-100 text-slate-400'
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>



        {/* Filter and Search Toolbar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="text-xs font-black text-slate-500 uppercase tracking-wider">Status:</span>
            <div className="inline-flex p-1 bg-white rounded-xl border border-slate-200">
              <button
                onClick={() => setFilterStatus('all')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                  filterStatus === 'all' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                All ({allStops.filter(s => s.day === selectedDay).length})
              </button>
              <button
                onClick={() => setFilterStatus('scheduled')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                  filterStatus === 'scheduled' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Active ({allStops.filter(s => s.day === selectedDay && s.status === 'scheduled').length})
              </button>
              <button
                onClick={() => setFilterStatus('cancelled')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                  filterStatus === 'cancelled' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Cancelled ({allStops.filter(s => s.day === selectedDay && s.status === 'cancelled').length})
              </button>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Search Input */}
            <div className="relative flex-1 sm:w-64">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Filter destination name..."
                className="w-full pl-9 pr-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-900 outline-none focus:border-emerald-500 transition-colors"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Reset to Default Button */}
            <button
              onClick={() => fetchDestinations()}
              title="Refresh Itinerary"
              className="p-2.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-xl transition-colors shrink-0"
            >
              <RefreshCw className={`w-4 h-4 ${isSqlSyncing ? 'animate-spin text-emerald-600' : ''}`} />
            </button>
          </div>
        </div>

        {/* Chronological Stop Timeline */}
        {dayStops.length === 0 ? (
          <div className="bg-white rounded-3xl p-12 text-center border border-slate-200/80 shadow-sm space-y-4">
            <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center mx-auto">
              <MapPin className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-black text-slate-900">No destinations scheduled for {selectedDay}</h3>
            <p className="text-slate-500 text-xs sm:text-sm max-w-md mx-auto">
              Pick stops directly on the interactive map or enter them manually to start building your eco-routing plan.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
              <Link
                href={`/dashboard/map?mode=preplan&day=${selectedDay}`}
                className="px-5 py-3 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold text-xs shadow-md transition-all flex items-center gap-2"
              >
                <MapPin className="w-4 h-4 text-emerald-400" />
                <span>Pick Destinations from Live Map</span>
              </Link>
              <button
                onClick={() => setIsAddModalOpen(true)}
                className="px-5 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold text-xs transition-colors"
              >
                + Add Destination Manually
              </button>
              
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {dayStops.map((stop, index) => {
              const isCancelled = stop.status === 'cancelled';
              const aqiColorClass =
                stop.aqiForecast <= 50
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                  : stop.aqiForecast <= 100
                  ? 'bg-amber-50 text-amber-800 border-amber-300'
                  : stop.aqiForecast <= 150
                  ? 'bg-orange-50 text-orange-800 border-orange-300'
                  : stop.aqiForecast <= 200
                  ? 'bg-rose-50 text-rose-800 border-rose-300'
                  : stop.aqiForecast <= 300
                  ? 'bg-purple-50 text-purple-800 border-purple-300'
                  : 'bg-rose-950 text-rose-200 border-rose-800';

              return (
                <div
                  key={stop.id}
                  className={`bg-white rounded-2xl border transition-all duration-200 shadow-xs hover:shadow-md overflow-hidden ${
                    isCancelled
                      ? 'border-slate-200 opacity-60 bg-slate-50/50'
                      : 'border-slate-200/80 hover:border-emerald-200'
                  }`}
                >
                  <div className="p-4 sm:p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4 overflow-hidden">
                    {/* Left Column: Number + Info (with min-w-0 and truncate to prevent button overflow) */}
                    <div className="flex items-start gap-3.5 min-w-0 flex-1 overflow-hidden">
                      {/* Step Number Circle */}
                      <div
                        className={`w-9 h-9 rounded-2xl font-black text-xs sm:text-sm flex items-center justify-center shrink-0 shadow-xs ${
                          isCancelled
                            ? 'bg-slate-200 text-slate-500'
                            : 'bg-slate-900 text-white border border-slate-800'
                        }`}
                      >
                        {index + 1}
                      </div>

                      <div className="space-y-1.5 min-w-0 flex-1 overflow-hidden">
                        {/* Time & Category Tag */}
                        <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                          <button
                            onClick={() => handleOpenEditModal(stop)}
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 border border-slate-200 text-xs font-black text-slate-800 transition-colors"
                            title="Click to edit schedule"
                          >
                            <Clock className="w-3.5 h-3.5 text-emerald-600" />
                            <span>{stop.time}</span>
                          </button>

                          {stop.tag && (
                            <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
                              {stop.tag}
                            </span>
                          )}

                          {stop.vehicle && (
                            <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200 flex items-center gap-1">
                              {stop.vehicle === 'car' && <Car className="w-3 h-3 text-slate-500" />}
                              {stop.vehicle === 'bike' && <Bike className="w-3 h-3 text-slate-500" />}
                              {stop.vehicle === 'walk' && <Footprints className="w-3 h-3 text-slate-500" />}
                              {stop.vehicle === 'transit' && <Bus className="w-3 h-3 text-yellow-600" />}
                              <span className="capitalize">{stop.vehicle}</span>
                            </span>
                          )}

                          {isCancelled && (
                            <span className="text-[11px] font-black px-2 py-0.5 rounded-full bg-rose-100 text-rose-700">
                              Cancelled
                            </span>
                          )}
                        </div>

                        {/* Name & Address & Route Segment (with strict truncate so long text NEVER overflows) */}
                        <h4
                          className={`text-base sm:text-lg font-black text-slate-900 tracking-tight truncate max-w-full ${
                            isCancelled ? 'line-through text-slate-400' : ''
                          }`}
                          title={stop.name}
                        >
                          {stop.name}
                        </h4>
                        <p className="text-xs text-slate-500 font-medium truncate max-w-full" title={stop.address}>
                          {stop.address}
                        </p>

                        {/* Starting Location -> Destination Segment */}
                        <div className="flex flex-wrap items-center gap-1.5 text-[11px] pt-0.5">
                          <span
                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-800 font-bold border border-emerald-200 max-w-[260px] truncate"
                            title={stop.startName || 'Current Location'}
                          >
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0"></span>
                            <span className="truncate">From: {stop.startName || (stop.startType === 'custom' ? 'Custom Origin' : 'Current Location')}</span>
                          </span>
                          <ArrowRight className="w-3 h-3 text-slate-400 shrink-0" />
                          <span
                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-100 text-slate-800 font-bold border border-slate-200 max-w-[260px] truncate"
                            title={stop.name}
                          >
                            <span className="w-1.5 h-1.5 rounded-full bg-rose-500 shrink-0"></span>
                            <span className="truncate">To: {stop.name}</span>
                          </span>
                        </div>

                        {/* AQI Forecast & Advisory */}
                        <div className="flex flex-wrap items-center gap-2 pt-0.5">
                          <span
                            className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg text-xs font-black border ${aqiColorClass}`}
                          >
                            <Wind className="w-3.5 h-3.5" />
                            AQI {stop.aqiForecast} • {stop.smogStatus}
                          </span>
                          {stop.advisory && (
                            <span className="text-[11px] text-slate-500 font-medium flex items-center gap-1 truncate max-w-md">
                              <Info className="w-3 h-3 text-slate-400 shrink-0" />
                              <span className="truncate">{stop.advisory}</span>
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Right Column: 2 Clean Rows (Notice timing on top, Action buttons on bottom) - Never overflows! */}
                    <div className="flex flex-col items-start lg:items-end gap-2.5 shrink-0 pt-3 lg:pt-0 border-t lg:border-t-0 border-slate-100">
                      {/* Row 1: Notice Timing & Live Alert Badge */}
                      <div className="flex flex-wrap items-center gap-1.5">
                        <div className="bg-slate-50 px-2 py-0.5 rounded-xl border border-slate-200/80 flex items-center gap-1">
                          <span className="text-[11px] font-bold text-slate-500">Notice:</span>
                          {[15, 30, 45].map(mins => (
                            <button
                              key={mins}
                              onClick={() => updateLeadTime(stop.id, mins)}
                              className={`px-2 py-0.5 rounded-md text-[10px] font-black transition-colors ${
                                (stop.notifications?.leadTimeMins || 30) === mins
                                  ? 'bg-slate-900 text-white shadow-xs'
                                  : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                              }`}
                              title={`Set notice alert to ${mins} minutes before departure`}
                            >
                              {mins}m
                            </button>
                          ))}
                        </div>

                        {/* Calculated Alert Time Badge (Click to preview voice alert!) */}
                        <button
                          type="button"
                          onClick={() => handleTestStopAlert(stop)}
                          className="text-[10px] font-extrabold px-2.5 py-1 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 transition-colors shrink-0 flex items-center gap-1 active:scale-95 cursor-pointer shadow-2xs"
                          title={`Click to preview AI voice announcement! Scheduled to fire at ${computeNoticeAlertTimeString(stop.time, stop.notifications?.leadTimeMins || 30)}`}
                        >
                          <span>⏰ Alert at {computeNoticeAlertTimeString(stop.time, stop.notifications?.leadTimeMins || 30)}</span>
                        </button>
                      </div>

                      {/* Row 2: Action Buttons (Sound Toggle, Edit, Navigate, Cancel, Delete) */}
                      <div className="flex flex-wrap items-center gap-1.5 justify-start lg:justify-end">
                        {/* Sound / Silent Toggle */}
                        <button
                          onClick={() => toggleSilentAlert(stop.id)}
                          className={`p-1.5 rounded-xl transition-all border ${
                            !stop.notifications?.isSilent
                              ? 'bg-emerald-50 border-emerald-200 text-emerald-700 hover:bg-emerald-100'
                              : 'bg-slate-100 border-slate-200 text-slate-500 hover:bg-slate-200'
                          }`}
                          title={
                            !stop.notifications?.isSilent
                              ? 'Sound alert active (Device notification + AI Voice). Click to mute.'
                              : 'Silent mode active. Click to enable sound.'
                          }
                        >
                          {!stop.notifications?.isSilent ? (
                            <Bell className="w-3.5 h-3.5 text-emerald-600 animate-pulse" />
                          ) : (
                            <BellOff className="w-3.5 h-3.5 text-slate-500" />
                          )}
                        </button>

                        {/* Edit Destination Button */}
                        <button
                          onClick={() => handleOpenEditModal(stop)}
                          className="flex items-center gap-1 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 rounded-xl font-bold text-xs transition-colors shrink-0 active:scale-95"
                          title="Edit destination details & schedule"
                        >
                          <Pencil className="w-3 h-3 text-slate-600" />
                          <span>Edit</span>
                        </button>

                        {/* Navigate Now */}
                        {!isCancelled && (
                          <Link
                            href={`/dashboard/map?destLat=${stop.lat}&destLng=${stop.lng}&destName=${encodeURIComponent(
                              stop.name
                            )}${
                              stop.startType === 'custom' && stop.startLat && stop.startLng
                                ? `&originLat=${stop.startLat}&originLng=${stop.startLng}&originName=${encodeURIComponent(stop.startName || '')}`
                                : ''
                            }`}
                            className="flex items-center gap-1 px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-xl font-bold text-xs transition-colors shrink-0"
                            title="Navigate to destination now on live map"
                          >
                            <Navigation className="w-3 h-3" />
                            <span>Navigate</span>
                          </Link>
                        )}

                        {/* Cancel / Restore Button */}
                        <button
                          onClick={() => toggleCancelStop(stop.id)}
                          className={`px-3 py-1.5 rounded-xl font-bold text-xs transition-colors shrink-0 ${
                            isCancelled
                              ? 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200'
                              : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200'
                          }`}
                          title={isCancelled ? 'Reactivate stop' : 'Cancel this destination'}
                        >
                          {isCancelled ? 'Restore' : 'Cancel'}
                        </button>

                        {/* Delete Stop */}
                        <button
                          onClick={() => handleDeleteStop(stop.id)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl border border-transparent hover:border-rose-100 transition-colors shrink-0"
                          title="Delete stop permanently"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Manual Add Destination Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-[9990] bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-slate-200 animate-in zoom-in-95 duration-200 space-y-6">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <h3 className="text-xl font-black text-slate-900">Add Destination Manually</h3>
                <p className="text-xs text-slate-500 font-medium">Scheduled for {manualDay === 'All' ? 'All Days' : manualDay}</p>
              </div>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddManualStop} className="space-y-4">
              {/* STARTING LOCATION SECTION */}
              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl space-y-2.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-extrabold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Starting Location</span>
                  </label>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800">
                    {manualStartType === 'current' ? '📍 GPS Current Location' : '🗺️ Custom Location'}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setManualStartType('current');
                      setManualStartName('My Current Location');
                      setManualStartAddress('GPS Live Coordinates');
                    }}
                    className={`py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 border ${
                      manualStartType === 'current'
                        ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    <MapPin className="w-3.5 h-3.5" />
                    <span>Current Location</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setManualStartType('custom')}
                    className={`py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 border ${
                      manualStartType === 'custom'
                        ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    <Search className="w-3.5 h-3.5" />
                    <span>Custom Origin</span>
                  </button>
                </div>

                {manualStartType === 'custom' && (
                  <div className="pt-1.5 space-y-2">
                    <div className="relative">
                      <input
                        type="text"
                        value={startPhotonQuery}
                        onChange={e => handleStartPhotonSearch(e.target.value)}
                        placeholder="Search starting place (e.g. Home, Thokar, Gulberg)..."
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-900 outline-none focus:border-emerald-600"
                      />
                      {isSearchingStartPhoton && (
                        <div className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin"></div>
                      )}
                    </div>

                    {startPhotonSuggestions.length > 0 && (
                      <div className="bg-white border border-slate-200 rounded-xl shadow-lg divide-y divide-slate-100 max-h-36 overflow-y-auto">
                        {startPhotonSuggestions.map((sug, i) => (
                          <div
                            key={i}
                            onClick={() => {
                              setManualStartName(sug.name);
                              setManualStartAddress(sug.address);
                              setManualStartLat(sug.lat);
                              setManualStartLng(sug.lon);
                              setStartPhotonQuery(sug.name);
                              setStartPhotonSuggestions([]);
                            }}
                            className="p-2 hover:bg-emerald-50 cursor-pointer text-xs"
                          >
                            <p className="font-bold text-slate-900">{sug.name}</p>
                            <p className="text-[10px] text-slate-500 truncate">{sug.address}</p>
                          </div>
                        ))}
                      </div>
                    )}

                    <div className="flex items-center gap-2 text-[11px] text-slate-600 font-medium px-1">
                      <span className="font-bold text-slate-800">Selected:</span>
                      <span className="truncate">{manualStartName} ({manualStartAddress})</span>
                    </div>
                  </div>
                )}
              </div>

              {/* DESTINATION SECTION */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Destination Location Search (Lahore)
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={photonQuery}
                    onChange={e => handlePhotonSearch(e.target.value)}
                    placeholder="Search e.g. Gulberg, DHA Phase 5, Mall Road..."
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-900 outline-none focus:bg-white focus:border-emerald-600 transition-all"
                  />
                  {isSearchingPhoton && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin"></div>
                  )}
                </div>

                {/* Suggestions Dropdown */}
                {photonSuggestions.length > 0 && (
                  <div className="mt-1.5 bg-white border border-slate-200 rounded-xl shadow-lg divide-y divide-slate-100 max-h-48 overflow-y-auto">
                    {photonSuggestions.map((sug, i) => (
                      <div
                        key={i}
                        onClick={() => {
                          setManualName(sug.name);
                          setManualAddress(sug.address);
                          setManualLat(sug.lat);
                          setManualLng(sug.lon);
                          setPhotonQuery(sug.name);
                          setPhotonSuggestions([]);
                        }}
                        className="p-3 hover:bg-emerald-50 cursor-pointer text-xs transition-colors"
                      >
                        <p className="font-bold text-slate-900">{sug.name}</p>
                        <p className="text-[11px] text-slate-500 truncate">{sug.address}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Destination Name */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Destination Title
                </label>
                <input
                  type="text"
                  value={manualName}
                  onChange={e => setManualName(e.target.value)}
                  placeholder="e.g. Office HQ, Client Meeting, Liberty Market"
                  required
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-900 outline-none focus:bg-white focus:border-emerald-600 transition-all"
                />
              </div>

              {/* Day Selector (Specific day or All days) */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Scheduled Day
                  </label>
                  <span className="text-[11px] font-bold text-emerald-600">
                    {manualDay === 'All' ? '🌟 All 7 Days' : manualDay}
                  </span>
                </div>
                <div className="grid grid-cols-4 sm:grid-cols-8 gap-1.5">
                  {[...DAYS_OF_WEEK, 'All'].map(d => {
                    const isSel = manualDay === d;
                    return (
                      <button
                        key={d}
                        type="button"
                        onClick={() => setManualDay(d)}
                        className={`py-2 px-1 text-center rounded-xl text-xs font-extrabold transition-all ${
                          isSel
                            ? 'bg-slate-900 text-white shadow-xs'
                            : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200'
                        }`}
                      >
                        {d === 'All' ? '🌟 All' : d.slice(0, 3)}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Departure Time */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Scheduled Time
                  </label>
                  <input
                    type="text"
                    value={manualTime}
                    onChange={e => setManualTime(e.target.value)}
                    placeholder="e.g. 10:30 AM"
                    required
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-900 outline-none focus:bg-white focus:border-emerald-600 transition-all"
                  />
                </div>

                {/* Purpose Tag */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Category Tag
                  </label>
                  <select
                    value={manualTag}
                    onChange={e => setManualTag(e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-900 outline-none focus:bg-white focus:border-emerald-600 transition-all"
                  >
                    <option value="Work">Work</option>
                    <option value="Meeting">Meeting</option>
                    <option value="Shopping">Shopping</option>
                    <option value="Medical">Medical</option>
                    <option value="Dining">Dining</option>
                    <option value="Fitness">Fitness</option>
                    <option value="Home">Home</option>
                    <option value="Personal">Personal</option>
                  </select>
                </div>
              </div>

              {/* Vehicle Selection */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Travel Vehicle Mode
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {[
                    { key: 'car', label: 'Car', icon: Car },
                    { key: 'bike', label: 'Bike', icon: Bike },
                    { key: 'walk', label: 'Walk', icon: Footprints },
                    { key: 'transit', label: 'Transit', icon: Bus }
                  ].map(v => {
                    const Icon = v.icon;
                    const isSel = manualVehicle === v.key;
                    return (
                      <button
                        key={v.key}
                        type="button"
                        onClick={() => setManualVehicle(v.key as any)}
                        className={`flex flex-col items-center justify-center p-2.5 rounded-xl border text-xs font-bold transition-all ${
                          isSel
                            ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                            : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        <Icon className="w-4 h-4 mb-1" />
                        <span>{v.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Modal Actions */}
              <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold text-xs transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs shadow-md transition-all active:scale-95"
                >
                  Save to Schedule
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DEDICATED MAP DESTINATION MODAL (Separate from Manual Modal) */}
      {isMapModalOpen && (
        <div className="fixed inset-0 z-[9990] bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-slate-200 animate-in zoom-in-95 duration-200 space-y-6">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 text-[10px] font-black uppercase tracking-wider mb-1">
                  <MapPin className="w-3 h-3 text-emerald-600" />
                  <span>Sourced from Interactive Map</span>
                </div>
                <h3 className="text-xl font-black text-slate-900">Add Map Destination</h3>
                <p className="text-xs text-slate-500 font-medium">Configure schedule & trip details for this location</p>
              </div>
              <button
                onClick={() => setIsMapModalOpen(false)}
                className="p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddMapStop} className="space-y-4">
              {/* ROUTE OVERVIEW BOX (START -> DESTINATION) */}
              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
                {/* 1. Origin (Starting Location) */}
                <div className="flex items-start gap-2.5">
                  <div className="w-6 h-6 rounded-lg bg-slate-900 text-white flex items-center justify-center font-black text-xs shrink-0 mt-0.5">
                    A
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold text-slate-500 uppercase">Starting Point</span>
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => {
                            setMapStartType('current');
                            setMapStartName('My Current Location');
                            setMapStartAddress('GPS Live Coordinates');
                          }}
                          className={`px-2 py-0.5 rounded text-[10px] font-bold transition-colors ${
                            mapStartType === 'current'
                              ? 'bg-emerald-600 text-white'
                              : 'bg-white text-slate-600 border border-slate-200'
                          }`}
                        >
                          Current GPS
                        </button>
                        <button
                          type="button"
                          onClick={() => setMapStartType('custom')}
                          className={`px-2 py-0.5 rounded text-[10px] font-bold transition-colors ${
                            mapStartType === 'custom'
                              ? 'bg-emerald-600 text-white'
                              : 'bg-white text-slate-600 border border-slate-200'
                          }`}
                        >
                          Custom
                        </button>
                      </div>
                    </div>
                    <p className="text-xs font-black text-slate-900 truncate mt-0.5">{mapStartName}</p>
                    <p className="text-[10px] text-slate-500 truncate">{mapStartAddress}</p>
                  </div>
                </div>

                <div className="border-l-2 border-dashed border-slate-300 ml-3 h-3"></div>

                {/* 2. Destination */}
                <div className="flex items-start gap-2.5">
                  <div className="w-6 h-6 rounded-lg bg-emerald-600 text-white flex items-center justify-center font-black text-xs shrink-0 mt-0.5">
                    B
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className="text-[11px] font-bold text-slate-500 uppercase">Map Destination</span>
                    <p className="text-xs font-black text-slate-900 truncate mt-0.5">{mapDestName}</p>
                    <p className="text-[10px] text-slate-500 truncate">{mapDestAddress}</p>
                  </div>
                </div>
              </div>

              {/* Destination Title / Custom Label */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Destination Title / Label
                </label>
                <input
                  type="text"
                  value={mapDestName}
                  onChange={e => setMapDestName(e.target.value)}
                  placeholder="e.g. Office HQ, Mall of Lahore, Hospital"
                  required
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-900 outline-none focus:bg-white focus:border-emerald-600 transition-all"
                />
              </div>

              {/* Day Selector (Specific day or All days) */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Scheduled Day
                  </label>
                  <span className="text-[11px] font-bold text-emerald-600">
                    {mapDestDay === 'All' ? '🌟 All 7 Days' : mapDestDay}
                  </span>
                </div>
                <div className="grid grid-cols-4 sm:grid-cols-8 gap-1.5">
                  {[...DAYS_OF_WEEK, 'All'].map(d => {
                    const isSel = mapDestDay === d;
                    return (
                      <button
                        key={d}
                        type="button"
                        onClick={() => setMapDestDay(d)}
                        className={`py-2 px-1 text-center rounded-xl text-xs font-extrabold transition-all ${
                          isSel
                            ? 'bg-slate-900 text-white shadow-xs'
                            : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200'
                        }`}
                      >
                        {d === 'All' ? '🌟 All' : d.slice(0, 3)}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Scheduled Time & Category Tag */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Scheduled Time
                  </label>
                  <input
                    type="text"
                    value={mapDestTime}
                    onChange={e => setMapDestTime(e.target.value)}
                    placeholder="e.g. 10:30 AM"
                    required
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-900 outline-none focus:bg-white focus:border-emerald-600 transition-all"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Category Tag
                  </label>
                  <select
                    value={mapDestTag}
                    onChange={e => setMapDestTag(e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-900 outline-none focus:bg-white focus:border-emerald-600 transition-all"
                  >
                    <option value="Work">Work</option>
                    <option value="Meeting">Meeting</option>
                    <option value="Shopping">Shopping</option>
                    <option value="Medical">Medical</option>
                    <option value="Dining">Dining</option>
                    <option value="Fitness">Fitness</option>
                    <option value="Home">Home</option>
                    <option value="Personal">Personal</option>
                  </select>
                </div>
              </div>

              {/* Vehicle Mode */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Travel Vehicle Mode
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {[
                    { key: 'car', label: 'Car', icon: Car },
                    { key: 'bike', label: 'Bike', icon: Bike },
                    { key: 'walk', label: 'Walk', icon: Footprints },
                    { key: 'transit', label: 'Transit', icon: Bus }
                  ].map(v => {
                    const Icon = v.icon;
                    const isSel = mapDestVehicle === v.key;
                    return (
                      <button
                        key={v.key}
                        type="button"
                        onClick={() => setMapDestVehicle(v.key as any)}
                        className={`flex flex-col items-center justify-center p-2.5 rounded-xl border text-xs font-bold transition-all ${
                          isSel
                            ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                            : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        <Icon className="w-4 h-4 mb-1" />
                        <span>{v.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Modal Actions */}
              <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsMapModalOpen(false)}
                  className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold text-xs transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs shadow-md transition-all active:scale-95"
                >
                  Save to Schedule
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Departure Time Modal */}
      {/* FULL EDIT DESTINATION SCHEDULE MODAL */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-[9990] bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-slate-200 animate-in zoom-in-95 duration-200 space-y-5 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 text-[10px] font-black uppercase">
                  <Pencil className="w-3 h-3 text-emerald-600" />
                  <span>Edit Schedule & Route</span>
                </div>
                <h3 className="text-xl font-black text-slate-900 mt-1">Edit Destination</h3>
              </div>
              <button
                onClick={() => setIsEditModalOpen(false)}
                className="p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEditStop} className="space-y-4">
              {/* 1. STARTING LOCATION SECTION */}
              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-extrabold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Starting Point</span>
                  </label>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800">
                    {editStartType === 'current' ? '📍 GPS Current Location' : '🗺️ Custom Location'}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setEditStartType('current');
                      setEditStartName('My Current Location');
                      setEditStartAddress('GPS Live Coordinates');
                    }}
                    className={`py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 border ${
                      editStartType === 'current'
                        ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    <MapPin className="w-3.5 h-3.5" />
                    <span>Current Location</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setEditStartType('custom')}
                    className={`py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 border ${
                      editStartType === 'custom'
                        ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    <Search className="w-3.5 h-3.5" />
                    <span>Custom Origin</span>
                  </button>
                </div>

                {editStartType === 'custom' && (
                  <div className="pt-1.5 space-y-1.5">
                    <input
                      type="text"
                      value={editStartName}
                      onChange={e => setEditStartName(e.target.value)}
                      placeholder="e.g. Home, Office, Garden Town..."
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-900 outline-none focus:border-emerald-600"
                    />
                  </div>
                )}
              </div>

              {/* 2. DESTINATION DETAILS */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Destination Title
                </label>
                <input
                  type="text"
                  value={editName}
                  onChange={e => setEditName(e.target.value)}
                  placeholder="e.g. Office HQ, Mall of Lahore"
                  required
                  className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-900 outline-none focus:bg-white focus:border-emerald-600 transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Address / Landmark
                </label>
                <input
                  type="text"
                  value={editAddress}
                  onChange={e => setEditAddress(e.target.value)}
                  placeholder="e.g. Main Boulevard, Gulberg"
                  className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-700 outline-none focus:bg-white focus:border-emerald-600 transition-all"
                />
              </div>

              {/* 3. SCHEDULED DAY SELECTOR */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Scheduled Day
                  </label>
                  <span className="text-[11px] font-bold text-emerald-600">
                    {editDay}
                  </span>
                </div>
                <div className="grid grid-cols-7 gap-1">
                  {DAYS_OF_WEEK.map(d => {
                    const isSel = editDay === d;
                    return (
                      <button
                        key={d}
                        type="button"
                        onClick={() => setEditDay(d)}
                        className={`py-1.5 px-1 text-center rounded-xl text-xs font-extrabold transition-all ${
                          isSel
                            ? 'bg-slate-900 text-white shadow-xs'
                            : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200'
                        }`}
                      >
                        {d.slice(0, 3)}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 4. TIME & CATEGORY TAG */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Scheduled Time
                  </label>
                  <input
                    type="text"
                    value={editTime}
                    onChange={e => setEditTime(e.target.value)}
                    placeholder="e.g. 10:30 AM"
                    required
                    className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-900 outline-none focus:bg-white focus:border-emerald-600 transition-all"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Category Tag
                  </label>
                  <select
                    value={editTag}
                    onChange={e => setEditTag(e.target.value)}
                    className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-900 outline-none focus:bg-white focus:border-emerald-600 transition-all"
                  >
                    <option value="Work">Work</option>
                    <option value="Meeting">Meeting</option>
                    <option value="Shopping">Shopping</option>
                    <option value="Medical">Medical</option>
                    <option value="Dining">Dining</option>
                    <option value="Fitness">Fitness</option>
                    <option value="Home">Home</option>
                    <option value="Personal">Personal</option>
                  </select>
                </div>
              </div>

              {/* 5. VEHICLE MODE */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Travel Vehicle Mode
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {[
                    { key: 'car', label: 'Car', icon: Car },
                    { key: 'bike', label: 'Bike', icon: Bike },
                    { key: 'walk', label: 'Walk', icon: Footprints },
                    { key: 'transit', label: 'Transit', icon: Bus }
                  ].map(v => {
                    const Icon = v.icon;
                    const isSel = editVehicle === v.key;
                    return (
                      <button
                        key={v.key}
                        type="button"
                        onClick={() => setEditVehicle(v.key as any)}
                        className={`flex flex-col items-center justify-center p-2 rounded-xl border text-xs font-bold transition-all ${
                          isSel
                            ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                            : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        <Icon className="w-3.5 h-3.5 mb-0.5" />
                        <span>{v.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 6. NOTICE LEAD TIME */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Notice Alert Lead Time
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[15, 30, 45].map(mins => (
                    <button
                      key={mins}
                      type="button"
                      onClick={() => setEditLeadTime(mins)}
                      className={`py-2 rounded-xl text-xs font-extrabold border transition-all ${
                        editLeadTime === mins
                          ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                          : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      {mins} Minutes
                    </button>
                  ))}
                </div>
              </div>

              {/* Actions */}
              <div className="pt-3 flex items-center justify-end gap-2.5 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold text-xs transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs shadow-md transition-all active:scale-95"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
