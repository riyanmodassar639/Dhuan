'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  MapPin,
  Clock,
  Calendar,
  Bell,
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
  Send,
  MessageSquare
} from 'lucide-react';

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
  smogStatus: 'Good' | 'Moderate' | 'Unhealthy' | 'Very Unhealthy' | 'Hazardous';
  advisory?: string;
  notifications: {
    enabled: boolean;
    leadTimeMins: number; // 15, 30, 45, 60
    smogSpikeAlert: boolean;
    channel: 'push' | 'whatsapp' | 'sms';
  };
  status: 'scheduled' | 'completed' | 'cancelled';
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

// Initial realistic default schedule for Lahore (10 stops on Monday as requested by user)
const DEFAULT_INITIAL_STOPS: PlannedStop[] = [
  {
    id: 'stop-1',
    name: 'Packages Mall, Walton Road',
    address: 'Walton Road, Gulshan-e-Mustafa, Lahore',
    lat: 31.4746,
    lng: 74.3547,
    time: '08:30 AM',
    day: 'Monday',
    tag: 'Work',
    vehicle: 'car',
    aqiForecast: 245,
    smogStatus: 'Very Unhealthy',
    advisory: 'Morning smog thermal inversion. Keep car AC on recirculation mode.',
    notifications: {
      enabled: true,
      leadTimeMins: 30,
      smogSpikeAlert: true,
      channel: 'push'
    },
    status: 'scheduled'
  },
  {
    id: 'stop-2',
    name: 'Kalma Chowk Underpass',
    address: 'Main Boulevard Gulberg, Lahore',
    lat: 31.5034,
    lng: 74.3318,
    time: '09:45 AM',
    day: 'Monday',
    tag: 'Meeting',
    vehicle: 'transit',
    aqiForecast: 210,
    smogStatus: 'Very Unhealthy',
    advisory: 'Heavy morning congestion corridor. Metrobus AC line recommended.',
    notifications: {
      enabled: true,
      leadTimeMins: 30,
      smogSpikeAlert: true,
      channel: 'whatsapp'
    },
    status: 'scheduled'
  },
  {
    id: 'stop-3',
    name: 'MM Alam Road, Gulberg III',
    address: 'Near Cafe Aylanto, Gulberg III, Lahore',
    lat: 31.5165,
    lng: 74.3508,
    time: '11:15 AM',
    day: 'Monday',
    tag: 'Dining',
    vehicle: 'car',
    aqiForecast: 135,
    smogStatus: 'Moderate',
    advisory: 'Air beginning to disperse with thermal rise. Moderate conditions.',
    notifications: {
      enabled: true,
      leadTimeMins: 15,
      smogSpikeAlert: false,
      channel: 'push'
    },
    status: 'scheduled'
  },
  {
    id: 'stop-4',
    name: 'Mall Road & Civil Secretariat',
    address: 'Shahrah-e-Quaid-e-Azam, Lahore',
    lat: 31.5601,
    lng: 74.3138,
    time: '12:45 PM',
    day: 'Monday',
    tag: 'Work',
    vehicle: 'car',
    aqiForecast: 115,
    smogStatus: 'Moderate',
    advisory: 'Midday thermal mixing active. Safest air window of the day.',
    notifications: {
      enabled: true,
      leadTimeMins: 30,
      smogSpikeAlert: true,
      channel: 'push'
    },
    status: 'scheduled'
  },
  {
    id: 'stop-5',
    name: 'Liberty Market Roundabout',
    address: 'Liberty Roundabout, Gulberg III, Lahore',
    lat: 31.5109,
    lng: 74.3444,
    time: '02:00 PM',
    day: 'Monday',
    tag: 'Shopping',
    vehicle: 'walk',
    aqiForecast: 108,
    smogStatus: 'Moderate',
    advisory: 'Optimal window for brief outdoor movement.',
    notifications: {
      enabled: false,
      leadTimeMins: 15,
      smogSpikeAlert: false,
      channel: 'push'
    },
    status: 'scheduled'
  },
  {
    id: 'stop-6',
    name: 'Lahore Gymkhana Club',
    address: 'Upper Mall Road, Lahore Cantt',
    lat: 31.5367,
    lng: 74.3644,
    time: '03:30 PM',
    day: 'Monday',
    tag: 'Fitness',
    vehicle: 'car',
    aqiForecast: 122,
    smogStatus: 'Moderate',
    advisory: 'Tree-lined green belt provides natural PM2.5 filtration.',
    notifications: {
      enabled: true,
      leadTimeMins: 30,
      smogSpikeAlert: false,
      channel: 'push'
    },
    status: 'scheduled'
  },
  {
    id: 'stop-7',
    name: 'Johar Town G1 Market',
    address: 'Khayaban-e-Firdousi, Johar Town, Lahore',
    lat: 31.4697,
    lng: 74.2988,
    time: '05:00 PM',
    day: 'Monday',
    tag: 'Meeting',
    vehicle: 'car',
    aqiForecast: 185,
    smogStatus: 'Unhealthy',
    advisory: 'Early evening temperature inversion beginning. Wear N95 mask.',
    notifications: {
      enabled: true,
      leadTimeMins: 45,
      smogSpikeAlert: true,
      channel: 'whatsapp'
    },
    status: 'scheduled'
  },
  {
    id: 'stop-8',
    name: 'Defence Raya Golf Resort',
    address: 'Sector M, DHA Phase 6, Lahore',
    lat: 31.4552,
    lng: 74.4371,
    time: '06:30 PM',
    day: 'Monday',
    tag: 'Meeting',
    vehicle: 'car',
    aqiForecast: 230,
    smogStatus: 'Very Unhealthy',
    advisory: 'Evening smog surge detected along Southern Ring Road corridor.',
    notifications: {
      enabled: true,
      leadTimeMins: 30,
      smogSpikeAlert: true,
      channel: 'push'
    },
    status: 'scheduled'
  },
  {
    id: 'stop-9',
    name: 'DHA Phase 5 Commercial Avenue',
    address: 'Main Commercial, Phase 5 DHA, Lahore',
    lat: 31.4722,
    lng: 74.4019,
    time: '08:00 PM',
    day: 'Monday',
    tag: 'Shopping',
    vehicle: 'car',
    aqiForecast: 175,
    smogStatus: 'Unhealthy',
    advisory: 'High vehicular emissions in commercial zone. Keep cabin sealed.',
    notifications: {
      enabled: true,
      leadTimeMins: 15,
      smogSpikeAlert: true,
      channel: 'push'
    },
    status: 'scheduled'
  },
  {
    id: 'stop-10',
    name: 'Askari 11 Gate 2',
    address: 'Bedian Road / Ring Road Interchange, Lahore',
    lat: 31.4485,
    lng: 74.4558,
    time: '09:15 PM',
    day: 'Monday',
    tag: 'Home',
    vehicle: 'car',
    aqiForecast: 145,
    smogStatus: 'Moderate',
    advisory: 'Traffic easing. Safe journey home.',
    notifications: {
      enabled: true,
      leadTimeMins: 30,
      smogSpikeAlert: false,
      channel: 'push'
    },
    status: 'scheduled'
  },
  // Tuesday Sample
  {
    id: 'stop-tue-1',
    name: 'Shaukat Khanum Memorial Hospital',
    address: 'Khayaban-e-Jinnah, Johar Town, Lahore',
    lat: 31.4645,
    lng: 74.2798,
    time: '10:00 AM',
    day: 'Tuesday',
    tag: 'Medical',
    vehicle: 'car',
    aqiForecast: 160,
    smogStatus: 'Unhealthy',
    advisory: 'Hospital precinct with HEPA clean-room access.',
    notifications: {
      enabled: true,
      leadTimeMins: 30,
      smogSpikeAlert: true,
      channel: 'push'
    },
    status: 'scheduled'
  },
  {
    id: 'stop-tue-2',
    name: 'Emporium Mall by Nishat',
    address: 'Abdul Haque Rd, Johar Town, Lahore',
    lat: 31.4674,
    lng: 74.2678,
    time: '02:30 PM',
    day: 'Tuesday',
    tag: 'Shopping',
    vehicle: 'car',
    aqiForecast: 110,
    smogStatus: 'Moderate',
    advisory: 'Indoor air filtered mall. Clean air haven.',
    notifications: {
      enabled: true,
      leadTimeMins: 15,
      smogSpikeAlert: false,
      channel: 'push'
    },
    status: 'scheduled'
  }
];

export default function SmartRoutingPage() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [selectedDay, setSelectedDay] = useState('Monday');
  const [allStops, setAllStops] = useState<PlannedStop[]>([]);
  const [filterStatus, setFilterStatus] = useState<'all' | 'scheduled' | 'cancelled'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Manual Add Modal State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [manualName, setManualName] = useState('');
  const [manualAddress, setManualAddress] = useState('');
  const [manualTime, setManualTime] = useState('10:30 AM');
  const [manualTag, setManualTag] = useState('Work');
  const [manualVehicle, setManualVehicle] = useState<'car' | 'bike' | 'walk' | 'transit'>('car');
  const [manualLat, setManualLat] = useState(31.5204);
  const [manualLng, setManualLng] = useState(74.3587);
  const [photonQuery, setPhotonQuery] = useState('');
  const [photonSuggestions, setPhotonSuggestions] = useState<any[]>([]);
  const [isSearchingPhoton, setIsSearchingPhoton] = useState(false);

  // Edit Time Modal State
  const [editingStop, setEditingStop] = useState<PlannedStop | null>(null);
  const [newTimeVal, setNewTimeVal] = useState('');

  // Notification Toast State
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Load planned trips from localStorage on client mount
  useEffect(() => {
    setMounted(true);
    try {
      const stored = localStorage.getItem('dhuan_planned_trips');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setAllStops(parsed);
          return;
        }
      }
      // If nothing saved yet, seed with default Lahore tour schedule
      setAllStops(DEFAULT_INITIAL_STOPS);
      localStorage.setItem('dhuan_planned_trips', JSON.stringify(DEFAULT_INITIAL_STOPS));
    } catch (e) {
      console.error('Error loading planned trips:', e);
      setAllStops(DEFAULT_INITIAL_STOPS);
    }
  }, []);

  // Save changes to localStorage
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

  // Counts per day for badges
  const dayCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    DAYS_OF_WEEK.forEach(day => {
      counts[day] = allStops.filter(s => s.day === day && s.status !== 'cancelled').length;
    });
    return counts;
  }, [allStops]);

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

  // Handle Photon Search for Manual Add
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

  // Add Manual Stop
  const handleAddManualStop = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualName.trim()) return;

    // Simulate Spatial AQI
    const aqi = Math.floor(Math.random() * 120) + 110;
    let smogStatus: PlannedStop['smogStatus'] = 'Moderate';
    if (aqi > 150) smogStatus = 'Unhealthy';
    if (aqi > 200) smogStatus = 'Very Unhealthy';
    if (aqi > 300) smogStatus = 'Hazardous';

    const newStop: PlannedStop = {
      id: `stop-${Date.now()}`,
      name: manualName,
      address: manualAddress || manualName,
      lat: manualLat,
      lng: manualLng,
      time: manualTime,
      day: selectedDay,
      tag: manualTag,
      vehicle: manualVehicle,
      aqiForecast: aqi,
      smogStatus,
      advisory: aqi > 180 ? 'Heavy smog corridor. Mask & filtered vehicle cabin recommended.' : 'Optimal air window.',
      notifications: {
        enabled: true,
        leadTimeMins: 30,
        smogSpikeAlert: true,
        channel: 'push'
      },
      status: 'scheduled'
    };

    saveStops([...allStops, newStop]);
    setIsAddModalOpen(false);
    setManualName('');
    setManualAddress('');
    setPhotonQuery('');
    setPhotonSuggestions([]);
    showToast(`Added "${newStop.name}" to ${selectedDay}'s schedule!`);
  };

  // Toggle Notification for a Stop
  const toggleNotification = (id: string) => {
    const updated = allStops.map(s => {
      if (s.id === id) {
        return {
          ...s,
          notifications: {
            ...s.notifications,
            enabled: !s.notifications.enabled
          }
        };
      }
      return s;
    });
    saveStops(updated);
  };

  // Update Notification Lead Time
  const updateLeadTime = (id: string, mins: number) => {
    const updated = allStops.map(s => {
      if (s.id === id) {
        return {
          ...s,
          notifications: {
            ...s.notifications,
            leadTimeMins: mins
          }
        };
      }
      return s;
    });
    saveStops(updated);
  };

  // Update Notification Channel
  const updateChannel = (id: string, channel: 'push' | 'whatsapp' | 'sms') => {
    const updated = allStops.map(s => {
      if (s.id === id) {
        return {
          ...s,
          notifications: {
            ...s.notifications,
            channel
          }
        };
      }
      return s;
    });
    saveStops(updated);
  };

  // Cancel or Restore Stop
  const toggleCancelStop = (id: string) => {
    const updated = allStops.map(s => {
      if (s.id === id) {
        const nextStatus: PlannedStop['status'] = s.status === 'cancelled' ? 'scheduled' : 'cancelled';
        return { ...s, status: nextStatus };
      }
      return s;
    });
    saveStops(updated);
    showToast('Destination status updated');
  };

  // Permanently Delete Stop
  const handleDeleteStop = (id: string) => {
    const updated = allStops.filter(s => s.id !== id);
    saveStops(updated);
    showToast('Destination removed from schedule');
  };

  // Apply AI Departure Time Optimization
  const handleApplyAiOptimization = () => {
    const updated = allStops.map(s => {
      if (s.day !== selectedDay || s.status === 'cancelled') return s;

      // Shift peak morning rush (8-9 AM) to 10:30 AM
      if (s.time.includes('08:') || s.time.includes('8:')) {
        return {
          ...s,
          time: '10:30 AM',
          aqiForecast: Math.max(95, s.aqiForecast - 80),
          smogStatus: 'Moderate' as const,
          advisory: 'AI Optimized: Shifted past morning inversion. -42% PM2.5 exposure.'
        };
      }
      // Shift peak evening rush (6-7 PM) to 08:30 PM
      if (s.time.includes('06:') || s.time.includes('6:')) {
        return {
          ...s,
          time: '08:30 PM',
          aqiForecast: Math.max(120, s.aqiForecast - 60),
          smogStatus: 'Moderate' as const,
          advisory: 'AI Optimized: Shifted past evening peak rush.'
        };
      }
      return s;
    });
    saveStops(updated);
    showToast('AI Smog Optimization Applied! All departures aligned to clean air windows.');
  };

  // Reset to Default Lahore Tour
  const handleResetSchedule = () => {
    if (confirm('Reset to default Lahore multi-stop schedule?')) {
      saveStops(DEFAULT_INITIAL_STOPS);
      showToast('Restored default 10-stop Monday tour.');
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
          <div className="w-5 h-5 border-2 border-purple-600 border-t-transparent rounded-full animate-spin"></div>
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
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-50 border border-purple-200/60 text-purple-700 text-xs font-black tracking-wide uppercase mb-3">
              <Sparkles className="w-3.5 h-3.5" />
              Spatial AI Pre-Planning & Eco-Routing
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
              className="flex items-center gap-2 px-5 py-3.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white rounded-2xl font-black text-sm shadow-md hover:shadow-lg transition-all active:scale-95 group"
            >
              <MapPin className="w-4 h-4 text-purple-200 group-hover:scale-110 transition-transform" />
              <span>Add Destination from Map</span>
              <ExternalLink className="w-3.5 h-3.5 opacity-80" />
            </Link>

            {/* Manual Add Button */}
            <button
              onClick={() => setIsAddModalOpen(true)}
              className="flex items-center gap-2 px-4 py-3.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-2xl font-bold text-sm shadow-xs transition-colors"
            >
              <Plus className="w-4 h-4 text-emerald-600" />
              <span>Add Stop Manually</span>
            </button>

            {/* Launch Tour on Map */}
            {dayStops.filter(s => s.status === 'scheduled').length > 0 && (
              <Link
                href={`/dashboard/map?mode=tour&day=${selectedDay}`}
                className="flex items-center gap-2 px-4 py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl font-bold text-sm shadow-sm transition-all active:scale-95"
              >
                <Navigation className="w-4 h-4 fill-white" />
                <span>Launch {selectedDay} Tour</span>
              </Link>
            )}
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
                <Calendar className={`w-4 h-4 ${isSelected ? 'text-purple-400' : 'text-slate-400'}`} />
                <span>{day}</span>
                <span
                  className={`text-xs px-2 py-0.5 rounded-full font-black ${
                    isSelected
                      ? 'bg-purple-600 text-white'
                      : count > 0
                      ? 'bg-purple-100 text-purple-700'
                      : 'bg-slate-100 text-slate-400'
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* AI Smog Advisor & Optimization Card */}
        {aiStats && aiStats.total > 0 && (
          <div className="bg-gradient-to-br from-indigo-900 via-slate-900 to-purple-950 rounded-3xl p-6 text-white shadow-lg relative overflow-hidden">
            <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
              <div className="space-y-2 max-w-2xl">
                <div className="flex items-center gap-2 text-purple-300 font-extrabold text-xs uppercase tracking-wider">
                  <Sparkles className="w-4 h-4 text-purple-400" />
                  AI Smog & Departure Window Optimization ({selectedDay})
                </div>
                <h3 className="text-xl sm:text-2xl font-black tracking-tight">
                  {aiStats.hasMorningSpike
                    ? 'Morning Smog Surge Detected on Scheduled Route'
                    : 'Balanced Air Quality Window Available'}
                </h3>
                <p className="text-slate-300 text-xs sm:text-sm font-medium leading-relaxed">
                  {aiStats.hasMorningSpike
                    ? `Several of your destinations fall during Lahore's severe morning smog thermal inversion (08:00 - 09:45 AM). Shifting departure times into clean air windows saves approximately ${aiStats.exposureReductionPct}% in respiratory PM2.5 inhalation.`
                    : `Your itinerary successfully avoids the highest peak smog hours. Average exposure AQI is projected at ${aiStats.avgAqi}.`}
                </p>

                {/* Stat pills */}
                <div className="flex flex-wrap items-center gap-3 pt-2">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-white/10 text-xs font-bold border border-white/10">
                    <Clock className="w-3.5 h-3.5 text-purple-300" />
                    {aiStats.total} Scheduled Stops
                  </span>
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-white/10 text-xs font-bold border border-white/10">
                    <Wind className="w-3.5 h-3.5 text-emerald-400" />
                    Avg AQI: {aiStats.avgAqi}
                  </span>
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-white/10 text-xs font-bold border border-white/10">
                    <ShieldCheck className="w-3.5 h-3.5 text-indigo-400" />
                    Smog Reduction: -{aiStats.exposureReductionPct}%
                  </span>
                </div>
              </div>

              {/* Action Buttons inside AI banner */}
              <div className="flex flex-col sm:flex-row lg:flex-col gap-2.5 shrink-0">
                {aiStats.hasMorningSpike && (
                  <button
                    onClick={handleApplyAiOptimization}
                    className="flex items-center justify-center gap-2 px-5 py-3.5 bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-purple-600 hover:to-indigo-600 text-white rounded-xl font-bold text-xs shadow-md transition-all active:scale-95"
                  >
                    <Sparkles className="w-4 h-4" />
                    <span>Apply AI Clean Air Schedule</span>
                  </button>
                )}
                <button
                  onClick={() => {
                    showToast(
                      `Test Smart Alert: Your ${dayStops[0]?.time || '10:15 AM'} stop to ${
                        dayStops[0]?.name || 'Lahore'
                      } is approaching in 30m. AQI is ${dayStops[0]?.aqiForecast || 160}.`
                    );
                  }}
                  className="flex items-center justify-center gap-2 px-4 py-3 bg-white/10 hover:bg-white/20 text-white rounded-xl font-bold text-xs border border-white/15 transition-colors"
                >
                  <Bell className="w-3.5 h-3.5 text-purple-300" />
                  <span>Send Test Smog Alert</span>
                </button>
              </div>
            </div>
          </div>
        )}

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
                className="w-full pl-9 pr-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-900 outline-none focus:border-purple-500 transition-colors"
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
              onClick={handleResetSchedule}
              title="Reset to 10-stop Monday tour"
              className="p-2.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-xl transition-colors shrink-0"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Chronological Stop Timeline */}
        {dayStops.length === 0 ? (
          <div className="bg-white rounded-3xl p-12 text-center border border-slate-200/80 shadow-sm space-y-4">
            <div className="w-16 h-16 bg-purple-50 text-purple-600 rounded-2xl flex items-center justify-center mx-auto">
              <MapPin className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-black text-slate-900">No destinations scheduled for {selectedDay}</h3>
            <p className="text-slate-500 text-xs sm:text-sm max-w-md mx-auto">
              Pick stops directly on the interactive map or enter them manually to start building your eco-routing plan.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
              <Link
                href={`/dashboard/map?mode=preplan&day=${selectedDay}`}
                className="px-5 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-bold text-xs shadow-md transition-all"
              >
                Pick Destinations from Live Map
              </Link>
              <button
                onClick={() => setIsAddModalOpen(true)}
                className="px-5 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold text-xs transition-colors"
              >
                + Add Stop Manually
              </button>
              <button
                onClick={handleResetSchedule}
                className="px-5 py-3 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-xl font-bold text-xs transition-colors"
              >
                Load Sample 10 Stops
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {dayStops.map((stop, index) => {
              const isCancelled = stop.status === 'cancelled';
              const aqiColorClass =
                stop.aqiForecast < 100
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                  : stop.aqiForecast < 150
                  ? 'bg-yellow-50 text-yellow-700 border-yellow-200'
                  : stop.aqiForecast < 200
                  ? 'bg-orange-50 text-orange-700 border-orange-200'
                  : 'bg-rose-50 text-rose-700 border-rose-200';

              return (
                <div
                  key={stop.id}
                  className={`bg-white rounded-2xl border transition-all duration-200 shadow-xs hover:shadow-md ${
                    isCancelled
                      ? 'border-slate-200 opacity-60 bg-slate-50/50'
                      : 'border-slate-200/80 hover:border-purple-200'
                  }`}
                >
                  <div className="p-5 sm:p-6 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                    {/* Left: Index badge, details & timings */}
                    <div className="flex items-start gap-4">
                      {/* Step Number Circle */}
                      <div
                        className={`w-10 h-10 rounded-2xl font-black text-sm flex items-center justify-center shrink-0 shadow-xs ${
                          isCancelled
                            ? 'bg-slate-200 text-slate-500'
                            : 'bg-purple-600 text-white'
                        }`}
                      >
                        {index + 1}
                      </div>

                      <div className="space-y-1.5 flex-1 min-w-0">
                        {/* Time & Category Tag */}
                        <div className="flex flex-wrap items-center gap-2">
                          <button
                            onClick={() => {
                              setEditingStop(stop);
                              setNewTimeVal(stop.time);
                            }}
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 border border-slate-200 text-xs font-black text-slate-800 transition-colors"
                            title="Click to edit departure time"
                          >
                            <Clock className="w-3.5 h-3.5 text-purple-600" />
                            <span>{stop.time}</span>
                          </button>

                          {stop.tag && (
                            <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
                              {stop.tag}
                            </span>
                          )}

                          {stop.vehicle && (
                            <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200 flex items-center gap-1">
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

                        {/* Name & Address */}
                        <h4
                          className={`text-base sm:text-lg font-black text-slate-900 tracking-tight ${
                            isCancelled ? 'line-through text-slate-400' : ''
                          }`}
                        >
                          {stop.name}
                        </h4>
                        <p className="text-xs text-slate-500 font-medium truncate max-w-xl">
                          {stop.address}
                        </p>

                        {/* AQI Forecast & Advisory */}
                        <div className="flex flex-wrap items-center gap-2 pt-1">
                          <span
                            className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg text-xs font-black border ${aqiColorClass}`}
                          >
                            <Wind className="w-3.5 h-3.5" />
                            AQI {stop.aqiForecast} • {stop.smogStatus}
                          </span>
                          {stop.advisory && (
                            <span className="text-[11px] text-slate-500 font-medium flex items-center gap-1">
                              <Info className="w-3 h-3 text-slate-400 shrink-0" />
                              {stop.advisory}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Middle: Smart Notification Controls */}
                    <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-100 flex flex-col sm:flex-row sm:items-center gap-3 shrink-0">
                      {/* Toggle notification */}
                      <button
                        onClick={() => toggleNotification(stop.id)}
                        className={`flex items-center gap-2 px-3 py-1.5 rounded-xl font-bold text-xs transition-colors ${
                          stop.notifications.enabled
                            ? 'bg-purple-600 text-white shadow-xs'
                            : 'bg-slate-200 text-slate-500 hover:bg-slate-300'
                        }`}
                        title="Toggle smog departure alerts"
                      >
                        <Bell className="w-3.5 h-3.5" />
                        <span>{stop.notifications.enabled ? 'Alerts ON' : 'Alerts OFF'}</span>
                      </button>

                      {/* Lead time selection */}
                      {stop.notifications.enabled && (
                        <div className="flex items-center gap-1.5">
                          <span className="text-[11px] font-bold text-slate-500">Notice:</span>
                          {[15, 30, 45].map(mins => (
                            <button
                              key={mins}
                              onClick={() => updateLeadTime(stop.id, mins)}
                              className={`px-2 py-0.5 rounded-md text-[10px] font-black transition-colors ${
                                stop.notifications.leadTimeMins === mins
                                  ? 'bg-slate-900 text-white'
                                  : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                              }`}
                            >
                              {mins}m
                            </button>
                          ))}
                        </div>
                      )}

                      {/* Channel */}
                      {stop.notifications.enabled && (
                        <div className="flex items-center gap-1 border-l border-slate-200 pl-2">
                          <button
                            onClick={() => updateChannel(stop.id, 'push')}
                            className={`p-1.5 rounded-lg text-xs ${
                              stop.notifications.channel === 'push'
                                ? 'bg-purple-100 text-purple-700 font-bold'
                                : 'text-slate-400 hover:text-slate-600'
                            }`}
                            title="Push Notification"
                          >
                            <Bell className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => updateChannel(stop.id, 'whatsapp')}
                            className={`p-1.5 rounded-lg text-xs ${
                              stop.notifications.channel === 'whatsapp'
                                ? 'bg-emerald-100 text-emerald-700 font-bold'
                                : 'text-slate-400 hover:text-slate-600'
                            }`}
                            title="WhatsApp Alert"
                          >
                            <MessageSquare className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Right: Actions (Navigate, Cancel, Delete) */}
                    <div className="flex items-center gap-2 shrink-0">
                      {/* Navigate Now */}
                      {!isCancelled && (
                        <Link
                          href={`/dashboard/map?destLat=${stop.lat}&destLng=${stop.lng}&destName=${encodeURIComponent(
                            stop.name
                          )}`}
                          className="flex items-center gap-1.5 px-3.5 py-2.5 bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 rounded-xl font-bold text-xs transition-colors"
                          title="Navigate to destination now on live map"
                        >
                          <Navigation className="w-3.5 h-3.5" />
                          <span>Navigate</span>
                        </Link>
                      )}

                      {/* Cancel / Restore Button */}
                      <button
                        onClick={() => toggleCancelStop(stop.id)}
                        className={`px-3 py-2.5 rounded-xl font-bold text-xs transition-colors ${
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
                        className="p-2.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl border border-transparent hover:border-rose-100 transition-colors"
                        title="Delete stop permanently"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
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
                <p className="text-xs text-slate-500 font-medium">Scheduled for {selectedDay}</p>
              </div>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddManualStop} className="space-y-4">
              {/* Photon Autocomplete Place Search */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Location Search (Lahore)
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={photonQuery}
                    onChange={e => handlePhotonSearch(e.target.value)}
                    placeholder="Search e.g. Gulberg, DHA Phase 5, Mall Road..."
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-900 outline-none focus:bg-white focus:border-purple-600 transition-all"
                  />
                  {isSearchingPhoton && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 border-2 border-purple-600 border-t-transparent rounded-full animate-spin"></div>
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
                        className="p-3 hover:bg-purple-50 cursor-pointer text-xs transition-colors"
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
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-900 outline-none focus:bg-white focus:border-purple-600 transition-all"
                />
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
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-900 outline-none focus:bg-white focus:border-purple-600 transition-all"
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
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-900 outline-none focus:bg-white focus:border-purple-600 transition-all"
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
                            ? 'bg-purple-600 text-white border-purple-600 shadow-sm'
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
                  className="px-6 py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-bold text-xs shadow-md transition-all active:scale-95"
                >
                  Save to Schedule
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Departure Time Modal */}
      {editingStop && (
        <div className="fixed inset-0 z-[9990] bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-slate-200 animate-in zoom-in-95 duration-200 space-y-4">
            <h3 className="text-lg font-black text-slate-900">Adjust Departure Time</h3>
            <p className="text-xs text-slate-500 font-medium">{editingStop.name}</p>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Departure Time
              </label>
              <input
                type="text"
                value={newTimeVal}
                onChange={e => setNewTimeVal(e.target.value)}
                placeholder="e.g. 11:00 AM"
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-900 outline-none focus:bg-white focus:border-purple-600 transition-all"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setEditingStop(null)}
                className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl font-bold text-xs"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  if (newTimeVal.trim()) {
                    const updated = allStops.map(s => (s.id === editingStop.id ? { ...s, time: newTimeVal } : s));
                    saveStops(updated);
                    setEditingStop(null);
                    showToast('Departure time updated');
                  }
                }}
                className="px-5 py-2 bg-purple-600 text-white rounded-xl font-bold text-xs shadow-sm hover:bg-purple-700"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
