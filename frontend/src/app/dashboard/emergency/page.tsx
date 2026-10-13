'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  PhoneCall,
  AlertTriangle,
  HeartPulse,
  MapPin,
  Clock,
  ShieldAlert,
  Navigation,
  Share2,
  Copy,
  Check,
  RotateCcw,
  Hospital,
  Info,
  ChevronRight,
  ShieldCheck,
  Send,
  Sparkles,
  Search,
  ExternalLink,
  Flame,
  Wind
} from 'lucide-react';
import { getApiEndpoint } from '@/lib/api';

interface HospitalItem {
  id: number;
  name: string;
  address: string;
  phone: string;
  emergency_dept: string;
  trauma_level: string;
  lat: number;
  lng: number;
  specialties: string;
  distance_km: number;
  estimated_drive_min: number;
}

interface SosBriefing {
  eventType: string;
  mode: string;
  timestamp: string;
  coordinates: { lat: number; lng: number };
  environment: { aqi: number; pm25: number; status: string };
  nearestHospital: {
    name: string;
    phone: string;
    distanceKm: number;
    lat: number;
    lng: number;
  };
  healthProfile: {
    bloodGroup: string;
    asthma: string;
    inhaler: string;
  };
  formattedText: string;
}

export default function EmergencyDashboardPage() {
  const [hospitals, setHospitals] = useState<HospitalItem[]>([]);
  const [filteredHospitals, setFilteredHospitals] = useState<HospitalItem[]>([]);
  const [selectedFilter, setSelectedFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [userCoords, setUserCoords] = useState<{ lat: number; lng: number }>({ lat: 31.5204, lng: 74.3587 });
  const [locationName, setLocationName] = useState<string>('Central Lahore (GPS Default)');
  
  // SOS State
  const [isSosCountingDown, setIsSosCountingDown] = useState<boolean>(false);
  const [sosCountdown, setSosCountdown] = useState<number>(10);
  const [sosActiveEvent, setSosActiveEvent] = useState<any>(null);
  const [briefing, setBriefing] = useState<SosBriefing | null>(null);
  const [copiedBriefing, setCopiedBriefing] = useState<boolean>(false);
  const [reportedSymptom, setReportedSymptom] = useState<string>('Acute smog respiratory distress / shortness of breath');

  // Load user geolocation
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const lat = pos.coords.latitude;
          const lng = pos.coords.longitude;
          setUserCoords({ lat, lng });
          setLocationName(`Your Location (${lat.toFixed(4)}, ${lng.toFixed(4)})`);
          fetchHospitals(lat, lng);
        },
        () => {
          fetchHospitals(31.5204, 74.3587);
        },
        { enableHighAccuracy: true, timeout: 8000 }
      );
    } else {
      fetchHospitals(31.5204, 74.3587);
    }
  }, []);

  const fetchHospitals = async (lat: number, lng: number) => {
    setIsLoading(true);
    try {
      const res = await fetch(getApiEndpoint(`/emergency/hospitals?lat=${lat}&lng=${lng}`));
      if (res.ok) {
        const data = await res.json();
        if (data.hospitals) {
          setHospitals(data.hospitals);
          setFilteredHospitals(data.hospitals);
        }
      }
    } catch (err) {
      console.error('Error fetching hospitals:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Filter hospitals
  useEffect(() => {
    let list = hospitals;
    if (selectedFilter === 'level1') {
      list = list.filter(h => h.trauma_level.includes('Level 1'));
    } else if (selectedFilter === 'cardiac') {
      list = list.filter(h => h.specialties.toLowerCase().includes('cardiac') || h.name.includes('Cardiology'));
    } else if (selectedFilter === 'pediatric') {
      list = list.filter(h => h.specialties.toLowerCase().includes('pediatric') || h.name.includes('Children'));
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(h => h.name.toLowerCase().includes(q) || h.address.toLowerCase().includes(q) || h.specialties.toLowerCase().includes(q));
    }
    setFilteredHospitals(list);
  }, [selectedFilter, searchQuery, hospitals]);

  // Handle SOS Countdown
  useEffect(() => {
    let timer: any = null;
    if (isSosCountingDown && sosCountdown > 0) {
      timer = setTimeout(() => {
        setSosCountdown(prev => prev - 1);
      }, 1000);
    } else if (isSosCountingDown && sosCountdown === 0) {
      triggerSosNow();
    }
    return () => clearTimeout(timer);
  }, [isSosCountingDown, sosCountdown]);

  const startSosCountdown = () => {
    setSosCountdown(10);
    setIsSosCountingDown(true);
  };

  const cancelSos = async () => {
    setIsSosCountingDown(false);
    setSosCountdown(10);
    if (sosActiveEvent?.eventId) {
      try {
        await fetch(getApiEndpoint('/emergency/sos/cancel'), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ eventId: sosActiveEvent.eventId })
        });
      } catch (e) {}
    }
    setSosActiveEvent(null);
  };

  const triggerSosNow = async () => {
    setIsSosCountingDown(false);
    try {
      // 1. Fetch briefing
      const briefRes = await fetch(getApiEndpoint('/emergency/sos/briefing'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          lat: userCoords.lat,
          lng: userCoords.lng,
          eventType: 'respiratory_distress',
          symptoms: reportedSymptom
        })
      });
      if (briefRes.ok) {
        const briefData = await briefRes.json();
        setBriefing(briefData.briefing);
      }

      // 2. Trigger SOS audit log
      const trigRes = await fetch(getApiEndpoint('/emergency/sos/trigger'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          lat: userCoords.lat,
          lng: userCoords.lng,
          eventType: 'respiratory_distress',
          address: locationName,
          symptoms: reportedSymptom
        })
      });
      if (trigRes.ok) {
        const trigData = await trigRes.json();
        setSosActiveEvent(trigData);
      }
    } catch (err) {
      console.error('Error during SOS action:', err);
    }
  };

  const copyBriefingText = () => {
    if (briefing?.formattedText) {
      navigator.clipboard.writeText(briefing.formattedText);
      setCopiedBriefing(true);
      setTimeout(() => setCopiedBriefing(false), 2500);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 pb-16">
      
      {/* 1. Official Rescue 1122 Header Banner */}
      <section className="bg-gradient-to-r from-rose-900 via-rose-800 to-red-900 text-white shadow-md border-b border-rose-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-rose-500/40 border border-rose-400 text-rose-100 uppercase tracking-wider flex items-center gap-1.5">
                  <ShieldAlert className="w-3.5 h-3.5" />
                  Mode A Prototype &bull; Emergency Coordination
                </span>
                <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-white/10 text-white/90">
                  Govt of Punjab
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white flex items-center gap-2">
                Punjab Emergency Rescue 1122 & Hospital Center
              </h1>
              <p className="text-sm text-rose-200/90 max-w-2xl">
                Immediate access to official emergency dispatch, nearby trauma facilities, and sensor-grounded SOS briefings during severe smog events.
              </p>
            </div>

            {/* Quick Action Buttons */}
            <div className="flex items-center gap-3 w-full sm:w-auto">
              <a
                href="tel:1122"
                className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-white text-rose-800 font-black text-base shadow-lg hover:bg-rose-50 active:scale-95 transition-all"
              >
                <PhoneCall className="w-5 h-5 text-rose-700 animate-bounce" />
                Call 1122 Now
              </a>
              <Link
                href="/dashboard/map"
                className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-rose-700/60 border border-rose-500/50 hover:bg-rose-700 text-white font-bold text-sm transition-all"
              >
                <MapPin className="w-4 h-4" />
                Map View
              </Link>
            </div>

          </div>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">

        {/* 2. Interactive SOS Emergency Assistance Card */}
        <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200 shadow-sm relative overflow-hidden">
          
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 pb-6 border-b border-slate-100">
            <div>
              <div className="flex items-center gap-2 text-rose-600 font-bold text-xs uppercase tracking-wider mb-1">
                <HeartPulse className="w-4 h-4" />
                Urgent Smog Distress / Severe Exposure
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-slate-900">
                User-Initiated Emergency SOS Workflow
              </h2>
              <p className="text-sm text-slate-500 mt-1 max-w-2xl">
                Triggers an emergency countdown, compiles verified GPS and atmospheric telemetry, generates an incident briefing, and prepares one-tap alerts for trusted contacts.
              </p>
            </div>

            {/* Big Red SOS Button */}
            <div className="w-full sm:w-auto flex flex-col items-center gap-2">
              {!isSosCountingDown && !sosActiveEvent ? (
                <button
                  onClick={startSosCountdown}
                  className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-gradient-to-r from-red-600 to-rose-600 text-white font-black text-lg shadow-[0_8px_24px_rgba(225,29,72,0.35)] hover:from-red-700 hover:to-rose-700 active:scale-95 transition-all flex items-center justify-center gap-3 cursor-pointer"
                >
                  <ShieldAlert className="w-6 h-6 animate-pulse" />
                  TRIGGER EMERGENCY SOS
                </button>
              ) : isSosCountingDown ? (
                <div className="flex items-center gap-4 bg-rose-50 border-2 border-rose-400 p-3 rounded-2xl">
                  <div className="w-14 h-14 rounded-full bg-rose-600 text-white flex items-center justify-center font-black text-2xl animate-pulse shadow-md">
                    {sosCountdown}s
                  </div>
                  <div className="text-left">
                    <div className="font-bold text-rose-900 text-sm">Countdown in Progress</div>
                    <div className="text-xs text-rose-700">Tap Cancel if this is a false alarm</div>
                  </div>
                  <button
                    onClick={cancelSos}
                    className="px-4 py-2 rounded-xl bg-slate-900 text-white text-xs font-bold hover:bg-slate-800 transition-colors"
                  >
                    Cancel SOS
                  </button>
                  <button
                    onClick={triggerSosNow}
                    className="px-4 py-2 rounded-xl bg-rose-600 text-white text-xs font-bold hover:bg-rose-700 transition-colors"
                  >
                    Send Now
                  </button>
                </div>
              ) : (
                <button
                  onClick={cancelSos}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-colors"
                >
                  <RotateCcw className="w-4 h-4" />
                  Reset SOS Protocol
                </button>
              )}
            </div>
          </div>

          {/* Quick Symptoms Selector */}
          <div className="mt-4 pt-2">
            <label className="text-xs font-bold text-slate-600 mb-2 block">
              Primary Respiratory / Emergency Symptom:
            </label>
            <div className="flex flex-wrap gap-2">
              {[
                'Acute smog respiratory distress / shortness of breath',
                'Severe asthma attack / inhaler ineffective',
                'Chest tightness & coughing fit',
                'Traffic collision / road accident in dense smog',
                'Eye burning & disorientation'
              ].map((sym, idx) => (
                <button
                  key={idx}
                  onClick={() => setReportedSymptom(sym)}
                  className={`text-xs px-3 py-1.5 rounded-lg border font-semibold transition-all ${
                    reportedSymptom === sym
                      ? 'bg-rose-50 border-rose-300 text-rose-700 shadow-xs'
                      : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  {sym}
                </button>
              ))}
            </div>
          </div>

          {/* SOS Active Incident Briefing Card */}
          {briefing && (
            <div className="mt-6 p-5 rounded-2xl bg-slate-900 text-white border border-slate-800 space-y-4 animate-in fade-in duration-300">
              
              <div className="flex items-center justify-between border-b border-slate-800 pb-3 flex-wrap gap-2">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
                  <span className="font-black text-sm text-emerald-400 uppercase tracking-wider">
                    Verified Emergency Briefing Ready
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={copyBriefingText}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-200 transition-colors"
                  >
                    {copiedBriefing ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    {copiedBriefing ? 'Copied to Clipboard' : 'Copy Briefing'}
                  </button>
                  <a
                    href={`tel:${briefing.nearestHospital.phone}`}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-xs font-bold text-white transition-colors"
                  >
                    <PhoneCall className="w-3.5 h-3.5" />
                    Call Hospital
                  </a>
                </div>
              </div>

              {/* Grid of Key Telemetry */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div className="bg-slate-800/80 p-3 rounded-xl">
                  <div className="text-slate-400 font-semibold">Incident Type</div>
                  <div className="font-bold text-white mt-0.5">{briefing.eventType}</div>
                </div>
                <div className="bg-slate-800/80 p-3 rounded-xl">
                  <div className="text-slate-400 font-semibold">Live Smog Index</div>
                  <div className="font-bold text-amber-400 mt-0.5">{briefing.environment.aqi} AQI ({briefing.environment.status})</div>
                </div>
                <div className="bg-slate-800/80 p-3 rounded-xl">
                  <div className="text-slate-400 font-semibold">Nearest Facility</div>
                  <div className="font-bold text-white mt-0.5 line-clamp-1">{briefing.nearestHospital.name}</div>
                </div>
                <div className="bg-slate-800/80 p-3 rounded-xl">
                  <div className="text-slate-400 font-semibold">Distance</div>
                  <div className="font-bold text-emerald-400 mt-0.5">{briefing.nearestHospital.distanceKm} km away</div>
                </div>
              </div>

              {/* Formatted Text Preview */}
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800/80 text-xs font-mono text-slate-300 whitespace-pre-wrap leading-relaxed select-all">
                {briefing.formattedText}
              </div>

              {/* Trusted Contact Notification Buttons */}
              {sosActiveEvent?.contactAlerts && sosActiveEvent.contactAlerts.length > 0 && (
                <div className="pt-2 border-t border-slate-800">
                  <div className="text-xs font-bold text-slate-400 mb-2">Notify Configured Trusted Contacts:</div>
                  <div className="flex flex-wrap gap-2">
                    {sosActiveEvent.contactAlerts.map((ca: any, cIdx: number) => (
                      <a
                        key={cIdx}
                        href={ca.whatsappUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition-colors"
                      >
                        <Send className="w-3.5 h-3.5" />
                        Alert {ca.name} via WhatsApp
                      </a>
                    ))}
                  </div>
                </div>
              )}

            </div>
          )}

          {/* Mode A Prototype Clarification Notice */}
          <div className="mt-4 flex items-start gap-2.5 p-3 rounded-xl bg-amber-50/70 border border-amber-200 text-xs text-amber-900">
            <Info className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold">Mode A Prototype Notice:</span> In compliance with safety regulations, automated dispatch to Rescue 1122 is simulated for testing. Real emergency calls must be placed via the verified <a href="tel:1122" className="underline font-bold">1122 helpline</a>.
            </div>
          </div>

        </div>

        {/* 3. Verified Emergency Hospitals in Lahore */}
        <div className="space-y-4">
          
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 text-emerald-600 font-bold text-xs uppercase tracking-wider">
                <Hospital className="w-4 h-4" />
                Verified Lahore Directory ({filteredHospitals.length} Facilities)
              </div>
              <h2 className="text-2xl font-black text-slate-900">
                Nearby Emergency & Trauma Hospitals
              </h2>
            </div>

            {/* Filter Pills */}
            <div className="flex items-center gap-2 overflow-x-auto no-scrollbar max-w-full pb-1">
              {[
                { id: 'all', label: 'All Hospitals' },
                { id: 'level1', label: 'Level 1 Trauma' },
                { id: 'cardiac', label: 'Cardiac Emergency (PIC)' },
                { id: 'pediatric', label: 'Pediatric Emergency' },
              ].map((f) => (
                <button
                  key={f.id}
                  onClick={() => setSelectedFilter(f.id)}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                    selectedFilter === f.id
                      ? 'bg-slate-900 text-white shadow-xs'
                      : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          {/* Hospital Search Bar */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
            <input
              type="text"
              placeholder="Search hospital by name, area (e.g. Jail Road, Ferozepur Road, Johar Town), or specialty..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 bg-white text-sm focus:outline-hidden focus:ring-2 focus:ring-slate-400 transition-all shadow-2xs"
            />
          </div>

          {/* Hospitals Grid */}
          {isLoading ? (
            <div className="p-12 text-center text-slate-400 text-sm font-semibold">
              Loading nearest verified Lahore hospitals...
            </div>
          ) : filteredHospitals.length === 0 ? (
            <div className="p-12 bg-white rounded-2xl border border-slate-200 text-center text-slate-500 text-sm">
              No hospitals matching your filter. Try selecting "All Hospitals".
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredHospitals.map((hosp) => (
                <div
                  key={hosp.id}
                  className="bg-white rounded-2xl p-5 border border-slate-200 shadow-2xs hover:shadow-md transition-all flex flex-col justify-between"
                >
                  <div>
                    {/* Header */}
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-rose-50 text-rose-700 border border-rose-200">
                          {hosp.trauma_level}
                        </span>
                        <h3 className="font-bold text-base text-slate-900 mt-2 line-clamp-1">
                          {hosp.name}
                        </h3>
                      </div>
                      <div className="text-right shrink-0">
                        <div className="text-sm font-black text-emerald-600">
                          {hosp.distance_km} km
                        </div>
                        <div className="text-[11px] font-semibold text-slate-400">
                          ~{hosp.estimated_drive_min}m drive
                        </div>
                      </div>
                    </div>

                    <div className="text-xs text-slate-500 mt-2 flex items-start gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                      <span className="line-clamp-2">{hosp.address}</span>
                    </div>

                    <div className="text-xs text-slate-600 font-semibold mt-3 p-2.5 rounded-xl bg-slate-50 border border-slate-100 space-y-1">
                      <div className="text-slate-400 text-[10px] font-bold uppercase tracking-wider">Emergency Dept:</div>
                      <div>{hosp.emergency_dept}</div>
                      <div className="text-[11px] text-slate-500 line-clamp-1">
                        <span className="font-bold text-slate-700">Specialties:</span> {hosp.specialties}
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 mt-4 pt-3 border-t border-slate-100">
                    <a
                      href={`tel:${hosp.phone}`}
                      className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs transition-colors"
                    >
                      <PhoneCall className="w-3.5 h-3.5" />
                      {hosp.phone}
                    </a>
                    <Link
                      href={`/dashboard/map?destLat=${hosp.lat}&destLng=${hosp.lng}&destName=${encodeURIComponent(hosp.name)}`}
                      className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs transition-colors"
                      title="Navigate on Map"
                    >
                      <Navigation className="w-3.5 h-3.5" />
                      Directions
                    </Link>
                  </div>

                </div>
              ))}
            </div>
          )}

        </div>

      </div>

    </div>
  );
}
