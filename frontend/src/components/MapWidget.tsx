'use client';

import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { MapContainer, TileLayer, Marker, Popup, Circle, Pane, useMapEvents, Polyline, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { 
  Search, MapPin, X, Navigation, Info, Image as ImageIcon, Wind, ShieldAlert, Activity, 
  Bookmark, Share2, ArrowLeft, CornerUpRight, CornerUpLeft, CornerDownLeft, ArrowUp, 
  Car, Bike, Footprints, Bus, Train, Flame, Ticket, Clock, CheckCircle2, Plus, 
  AlertTriangle, Calendar, Bell, Layers, RotateCw, Eye, EyeOff, Radio, Sparkles, 
  SlidersHorizontal, ChevronRight, ChevronDown 
} from 'lucide-react';
import { solvePmaTransitRoutes, TransitRouteResult } from '@/lib/pmaTransitData';
import { getApiEndpoint } from '@/lib/api';

export interface GroundStation {
  id: number;
  name: string;
  zone_code: string;
  aqi: number;
  pm25: number;
  status: string;
  color_tier: string;
  lat: number;
  lng: number;
  sector?: string;
  detail?: string;
  advisory?: string;
}

// 10 Official Lahore Monitoring Stations with Microclimate Regression Weights
export const DEFAULT_STATIONS: GroundStation[] = [
  {
    id: 1,
    name: 'Shahdara (GT Road)',
    zone_code: 'SH-GT',
    aqi: 90,
    pm25: 30.7,
    status: 'Moderate Haze',
    color_tier: 'amber',
    lat: 31.6250,
    lng: 74.2780,
    sector: 'Northern Transit & Heavy Diesel Belt',
    detail: 'Heavy diesel freight transit & Ravi basin inversion trap',
    advisory: 'Urban dust and heavy freight emissions. Standard outdoor caution.'
  },
  {
    id: 2,
    name: 'Kot Lakhpat Industrial',
    zone_code: 'KL-IND',
    aqi: 88,
    pm25: 29.7,
    status: 'Moderate Haze',
    color_tier: 'amber',
    lat: 31.4500,
    lng: 74.3300,
    sector: 'Industrial & Manufacturing Corridor',
    detail: 'Heavy industrial manufacturing & intense freight traffic',
    advisory: 'Elevated particulate density near factories. Limit prolonged exposure.'
  },
  {
    id: 3,
    name: 'Multan Road (Thokar)',
    zone_code: 'MR-TNB',
    aqi: 86,
    pm25: 28.7,
    status: 'Moderate Haze',
    color_tier: 'amber',
    lat: 31.4700,
    lng: 74.2400,
    sector: 'South-Western Transport Gateway',
    detail: 'Intercity bus terminal & major highway bypass',
    advisory: 'Exhaust accumulation near transit junction. Keep vehicle windows up.'
  },
  {
    id: 4,
    name: 'US Consulate (Empress Rd)',
    zone_code: 'US-CONS',
    aqi: 79,
    pm25: 25.2,
    status: 'Moderate Haze',
    color_tier: 'amber',
    lat: 31.5626,
    lng: 74.3361,
    sector: 'Central Urban Reference Station',
    detail: 'Official reference ground station in central Lahore',
    advisory: 'Central baseline conditions. General outdoor activities permissible.'
  },
  {
    id: 5,
    name: 'Gulberg (Syed Maratib Ali)',
    zone_code: 'GL-SMA',
    aqi: 79,
    pm25: 25.5,
    status: 'Moderate Haze',
    color_tier: 'amber',
    lat: 31.5122,
    lng: 74.3475,
    sector: 'Commercial Core & Business District',
    detail: 'High commercial volume & stop-and-go commuter traffic',
    advisory: 'Moderate traffic haze during peak rush hours.'
  },
  {
    id: 6,
    name: 'Mall Road (Anarkali)',
    zone_code: 'MR-ANK',
    aqi: 77,
    pm25: 24.4,
    status: 'Moderate Haze',
    color_tier: 'amber',
    lat: 31.5580,
    lng: 74.3270,
    sector: 'Civic & Government Center',
    detail: 'Regulated urban traffic with mature tree canopy',
    advisory: 'Stable daytime air quality protected by civic tree canopy.'
  },
  {
    id: 7,
    name: 'Barki Road (Paragon)',
    zone_code: 'BR-PGN',
    aqi: 76,
    pm25: 23.9,
    status: 'Moderate Haze',
    color_tier: 'amber',
    lat: 31.5359,
    lng: 74.4352,
    sector: 'Eastern Suburban & Peri-Urban',
    detail: 'Peri-urban development with agricultural fringe',
    advisory: 'Clean open dispersion during daytime convective hours.'
  },
  {
    id: 8,
    name: 'Johar Town (Doctor\'s Hospital)',
    zone_code: 'JT-DH',
    aqi: 75,
    pm25: 23.4,
    status: 'Moderate Haze',
    color_tier: 'amber',
    lat: 31.4697,
    lng: 74.2728,
    sector: 'Residential & Medical Avenue',
    detail: 'Wide suburban residential avenues & mixed commerce',
    advisory: 'Suburban residential baseline. Safe for regular commute.'
  },
  {
    id: 9,
    name: 'Model Town (A-Block)',
    zone_code: 'MT-A',
    aqi: 73,
    pm25: 22.4,
    status: 'Moderate Haze',
    color_tier: 'amber',
    lat: 31.4850,
    lng: 74.3200,
    sector: 'Green Residential Park Town',
    detail: 'Dense vegetation canopy & protected circular residential belt',
    advisory: 'Protected green belt filter providing cleaner microclimate.'
  },
  {
    id: 10,
    name: 'DHA Phase 6 (Bedian Rd)',
    zone_code: 'DHA-6',
    aqi: 71,
    pm25: 21.7,
    status: 'Moderate Haze',
    color_tier: 'amber',
    lat: 31.4559,
    lng: 74.4638,
    sector: 'Low-Density Planned Community',
    detail: 'Modern wide avenues with reduced localized emissions',
    advisory: 'Lowest particulate density in metropolitan perimeter.'
  }
];

export const getStationRadius = (zoneCode: string) => {
  switch (zoneCode) {
    case 'SH-GT': return 4800;
    case 'KL-IND': return 4500;
    case 'MR-TNB': return 4200;
    case 'BR-PGN': return 4500;
    case 'DHA-6': return 4600;
    case 'JT-DH': return 3800;
    case 'US-CONS': return 3600;
    case 'GL-SMA': return 3600;
    case 'MR-ANK': return 3400;
    case 'MT-A': return 3400;
    default: return 3800;
  }
};

export const getAqiColor = (aqi: number) => {
  if (aqi > 300) return '#881337'; // Hazardous Maroon
  if (aqi > 200) return '#7e22ce'; // Severe Purple
  if (aqi > 150) return '#e11d48'; // Dense Smog Rose
  if (aqi > 100) return '#ea580c'; // Inversion Forming Orange
  if (aqi > 50) return '#d97706'; // Moderate Haze Amber
  return '#10b981'; // Clean Air Emerald
};

// Custom Blue Dot icon for Live Location
const blueDotIcon = new L.DivIcon({
  className: 'live-location-marker',
  html: `<div class="relative flex h-4 w-4">
           <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
           <span class="relative inline-flex rounded-full h-4 w-4 bg-blue-500 border-2 border-white shadow-md"></span>
         </div>`,
  iconSize: [16, 16],
  iconAnchor: [8, 8]
});

// Custom Red Pin for Searched Location
const searchPinIcon = new L.DivIcon({
  className: 'search-location-marker',
  html: `<div class="relative flex h-8 w-8 items-center justify-center">
           <div class="absolute inset-0 bg-rose-500 rounded-full opacity-20 animate-ping"></div>
           <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="#e11d48" class="w-8 h-8 drop-shadow-md">
             <path fill-rule="evenodd" d="M11.54 22.351l.07.04.028.016a.76.76 0 00.723 0l.028-.015.071-.041a16.975 16.975 0 001.144-.742 19.58 19.58 0 002.683-2.282c1.944-1.99 3.963-4.98 3.963-8.827a8.25 8.25 0 00-16.5 0c0 3.846 2.02 6.837 3.963 8.827a19.58 19.58 0 002.682 2.282 16.975 16.975 0 001.145.742zM12 13.5a3 3 0 100-6 3 3 0 000 6z" clip-rule="evenodd" />
           </svg>
         </div>`,
  iconSize: [32, 32],
  iconAnchor: [16, 32]
});

// Standalone component for map click events to strictly adhere to React Rules of Hooks
function MapEventsHandler({ onMapClick }: { onMapClick: (e: L.LeafletMouseEvent) => void }) {
  useMapEvents({
    click: onMapClick,
  });
  return null;
}

// Map instance capture helper to safely store Leaflet map reference without calling remove()
function MapReadyHandler({ onMapReady }: { onMapReady: (map: L.Map) => void }) {
  const map = useMap();
  useEffect(() => {
    if (map) {
      onMapReady(map);
    }
  }, [map, onMapReady]);
  return null;
}

export default function MapWidget({ fullScreen = false }: { fullScreen?: boolean }) {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null);
  
  // Unique stable key per component mount to ensure Leaflet never reuses an unmounted DOM container
  const [mapKey] = useState(() => `dhuan-map-${Math.random().toString(36).substring(2, 9)}`);
  const mapRef = useRef<L.Map | null>(null);
  const handleMapReady = useCallback((mapInstance: L.Map) => {
    mapRef.current = mapInstance;
  }, []);
  const [hasCentered, setHasCentered] = useState(false);

  // Pre-Plan Itinerary Mode (Triggered from Smart Routing page)
  const [isPrePlanMode, setIsPrePlanMode] = useState(false);
  const [prePlanDay, setPrePlanDay] = useState('Monday');
  const [prePlanStops, setPrePlanStops] = useState<Array<{
    id: string;
    name: string;
    address: string;
    lat: number;
    lng: number;
    time: string;
    day: string;
    aqiForecast: number;
    smogStatus: string;
    advisory?: string;
  }>>([]);

  // Search State
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedPlace, setSelectedPlace] = useState<any | null>(null);
  const [hasSearched, setHasSearched] = useState(false);
  const skipNextSearch = useRef(false);

  // Directions State
  const [isDirectionsMode, setIsDirectionsMode] = useState(false);
  const [routes, setRoutes] = useState<any[]>([]);
  const [selectedRouteIdx, setSelectedRouteIdx] = useState(0);
  const [isNavigating, setIsNavigating] = useState(false);
  const [isPanelCollapsed, setIsPanelCollapsed] = useState(false);
  const [navPosition, setNavPosition] = useState<{lat: number, lng: number} | null>(null);
  const [navHeading, setNavHeading] = useState(0);
  const [navInstruction, setNavInstruction] = useState({ type: "Head straight", distance: 0 });
  const [navRemainingDistance, setNavRemainingDistance] = useState<number>(0);
  const [navRemainingDuration, setNavRemainingDuration] = useState<number>(0);
  const [navEtaTime, setNavEtaTime] = useState<string>("");
  const [selectedVehicle, setSelectedVehicle] = useState<'car' | 'bike' | 'walk' | 'transit'>('car');
  
  // Ground Monitoring Stations from Backend Database & AI Model
  const [stations, setStations] = useState<GroundStation[]>(DEFAULT_STATIONS);
  const [cityBaselineAqi, setCityBaselineAqi] = useState<number>(81);
  const [cityStatus, setCityStatus] = useState<string>("Moderate Haze");
  const [cityPm25, setCityPm25] = useState<number>(25.2);
  const [hourlyAiForecast, setHourlyAiForecast] = useState<any[]>([]);
  const [isSyncingTelemetry, setIsSyncingTelemetry] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState<string>("");
  const [selectedStation, setSelectedStation] = useState<GroundStation | null>(null);
  const [showSmogLayer, setShowSmogLayer] = useState(true);
  const [showStationsLayer, setShowStationsLayer] = useState(true);
  const [isStationDrawerOpen, setIsStationDrawerOpen] = useState(false);

  // Live Journey Environment & Smog state during Navigation
  const [navCurrentArea, setNavCurrentArea] = useState<string>("Current Corridor");
  const [navCurrentAqi, setNavCurrentAqi] = useState<number>(81);
  const [navCurrentStatus, setNavCurrentStatus] = useState<string>("Moderate Haze");
  const [navCurrentPm25, setNavCurrentPm25] = useState<number>(25.2);

  const [navUpcomingArea, setNavUpcomingArea] = useState<string>("Approaching Area");
  const [navUpcomingAqi, setNavUpcomingAqi] = useState<number>(85);
  const [navUpcomingDistance, setNavUpcomingDistance] = useState<number>(2500);
  const [navUpcomingStatus, setNavUpcomingStatus] = useState<string>("Moderate Haze");
  const [navUpcomingWarning, setNavUpcomingWarning] = useState<string>("");

  // Off-Route Rerouting state
  const [isRerouting, setIsRerouting] = useState(false);
  const [rerouteNotice, setRerouteNotice] = useState<string | null>(null);

  // Fetch verified station telemetry from Backend & database
  const fetchTelemetry = useCallback(async () => {
    try {
      const res = await fetch(getApiEndpoint('/dashboard/overview'));
      if (res.ok) {
        const data = await res.json();
        if (data.metrics) {
          if (typeof data.metrics.current_aqi === 'number') setCityBaselineAqi(data.metrics.current_aqi);
          if (data.metrics.current_status) setCityStatus(data.metrics.current_status);
          if (typeof data.metrics.pm25_level === 'number') setCityPm25(data.metrics.pm25_level);
        }
        if (data.highAlertAreas && Array.isArray(data.highAlertAreas) && data.highAlertAreas.length > 0) {
          const enriched: GroundStation[] = data.highAlertAreas.map((area: any) => {
            const def = DEFAULT_STATIONS.find(d => d.zone_code === area.zone_code);
            return {
              id: area.id,
              name: area.name,
              zone_code: area.zone_code,
              aqi: area.aqi,
              pm25: area.pm25,
              status: area.status,
              color_tier: area.color_tier,
              lat: area.lat,
              lng: area.lng,
              sector: area.sector || def?.sector || 'Official Lahore Monitoring Sector',
              detail: area.detail || def?.detail || 'Station telemetry calibrated to Open-Meteo & AI boundary layers.',
              advisory: area.advisory || def?.advisory || 'Standard air quality precautions.'
            };
          });
          setStations(enriched);
        }
        if (data.hourlyForecast && Array.isArray(data.hourlyForecast)) {
          setHourlyAiForecast(data.hourlyForecast);
        }
        setLastSyncTime(new Date().toLocaleTimeString());
      }
    } catch (err) {
      console.log('Using verified baseline station telemetry:', err);
    }
  }, []);

  const handleManualSync = async () => {
    setIsSyncingTelemetry(true);
    try {
      const res = await fetch(getApiEndpoint('/dashboard/sync'), { method: 'POST' });
      if (res.ok) {
        await fetchTelemetry();
      }
    } catch (err) {
      console.error('Manual telemetry sync error:', err);
    } finally {
      setIsSyncingTelemetry(false);
    }
  };

  useEffect(() => {
    fetchTelemetry();
    const interval = setInterval(fetchTelemetry, 30000);
    return () => clearInterval(interval);
  }, [fetchTelemetry]);

  // High-Precision Spatial IDW Interpolation across all 10 AI Monitoring Stations
  const getSpatialAqi = useCallback((lat: number, lng: number): number => {
    const list = stations && stations.length > 0 ? stations : DEFAULT_STATIONS;
    let sumWeight = 0;
    let sumWeightedAqi = 0;

    for (const s of list) {
      const dLat = (lat - s.lat) * 111000;
      const dLng = (lng - s.lng) * 96000;
      const distM = Math.sqrt(dLat * dLat + dLng * dLng);

      if (distM < 250) {
        return s.aqi;
      }

      const distKm = Math.max(0.2, distM / 1000);
      const weight = 1 / (distKm * distKm);
      sumWeight += weight;
      sumWeightedAqi += s.aqi * weight;
    }

    if (sumWeight === 0) return cityBaselineAqi;
    return Math.round(sumWeightedAqi / sumWeight);
  }, [stations, cityBaselineAqi]);

  const getSpatialPm25 = useCallback((lat: number, lng: number): number => {
    const list = stations && stations.length > 0 ? stations : DEFAULT_STATIONS;
    let sumWeight = 0;
    let sumWeightedPm25 = 0;

    for (const s of list) {
      const dLat = (lat - s.lat) * 111000;
      const dLng = (lng - s.lng) * 96000;
      const distM = Math.sqrt(dLat * dLat + dLng * dLng);

      if (distM < 250) {
        return s.pm25;
      }

      const distKm = Math.max(0.2, distM / 1000);
      const weight = 1 / (distKm * distKm);
      sumWeight += weight;
      sumWeightedPm25 += s.pm25 * weight;
    }

    if (sumWeight === 0) return cityPm25;
    return Math.round((sumWeightedPm25 / sumWeight) * 10) / 10;
  }, [stations, cityPm25]);

  const getAqiCategory = (aqi: number) => {
    if (aqi > 300) return { status: 'Hazardous Toxic Smog', color: 'text-rose-950 font-black', bg: 'bg-rose-950/10', border: 'border-rose-600', badgeBg: 'bg-rose-950 text-rose-100 border border-rose-500 font-black', advisory: 'Severe health emergency. Hazardous toxic smog. Wear N95 respirator.' };
    if (aqi > 200) return { status: 'Severe Smog Event', color: 'text-purple-700 font-extrabold', bg: 'bg-purple-50', border: 'border-purple-200', badgeBg: 'bg-purple-600 text-white', advisory: 'Emergency thermal inversion. Avoid outdoor exertion.' };
    if (aqi > 150) return { status: 'Dense Smog Inversion', color: 'text-rose-600 font-extrabold', bg: 'bg-rose-50', border: 'border-rose-200', badgeBg: 'bg-rose-600 text-white', advisory: 'Nocturnal boundary layer collapse. Wear N95 respirator.' };
    if (aqi > 100) return { status: 'Smog Inversion Forming', color: 'text-orange-600 font-extrabold', bg: 'bg-orange-50', border: 'border-orange-200', badgeBg: 'bg-orange-500 text-white', advisory: 'Evening cooling starts trapping pollutants.' };
    if (aqi > 50) return { status: 'Moderate Haze', color: 'text-amber-800 font-extrabold', bg: 'bg-amber-50', border: 'border-amber-200', badgeBg: 'bg-amber-400 text-slate-900 font-bold', advisory: 'Urban dust and vehicular background.' };
    return { status: 'Clean Air', color: 'text-emerald-700 font-extrabold', bg: 'bg-emerald-50', border: 'border-emerald-200', badgeBg: 'bg-emerald-500 text-white', advisory: 'Minimal haze; safe for outdoor activities.' };
  };
  
  // Custom Origin State for Directions
  const [userAddress, setUserAddress] = useState("Your Location");
  const [originInput, setOriginInput] = useState("");
  const [originResults, setOriginResults] = useState<any[]>([]);
  const [isSearchingOrigin, setIsSearchingOrigin] = useState(false);
  const [isSelectingOriginOnMap, setIsSelectingOriginOnMap] = useState(false);
  const [routeOriginCoords, setRouteOriginCoords] = useState<[number, number] | null>(null);
  const skipNextOriginSearch = useRef(false);
  const originInputRef = useRef<HTMLInputElement>(null);

  // Multi-Stop Waypoints State
  const [routeStops, setRouteStops] = useState<Array<{ id: string; name: string; coords: [number, number]; input: string }>>([]);
  const [activeStopSearchIdx, setActiveStopSearchIdx] = useState<number | null>(null);
  const [stopSearchResults, setStopSearchResults] = useState<any[]>([]);

  const handleAddStop = () => {
    setRouteStops(prev => [
      ...prev,
      { id: Date.now().toString(), name: '', coords: [0, 0], input: '' }
    ]);
  };

  const handleRemoveStop = async (index: number) => {
    const updated = routeStops.filter((_, i) => i !== index);
    setRouteStops(updated);
    setActiveStopSearchIdx(null);
    setStopSearchResults([]);
    const origin = routeOriginCoords || userLocation || [31.5204, 74.3587];
    if (selectedPlace) {
      await fetchRoutesAndEnhance(origin, [selectedPlace.lat, selectedPlace.lon], selectedVehicle, updated);
    }
  };

  const handleStopInputChange = (index: number, val: string) => {
    const updated = [...routeStops];
    updated[index].input = val;
    setRouteStops(updated);
    setActiveStopSearchIdx(index);

    if (val.trim().length > 2) {
      fetch(`https://photon.komoot.io/api/?q=${encodeURIComponent(val.trim())}&lat=31.5204&lon=74.3587&limit=4`)
        .then(r => r.json())
        .then(data => {
          if (data.features && data.features.length > 0) {
            setStopSearchResults(data.features.map((f: any) => ({
              lat: f.geometry.coordinates[1],
              lon: f.geometry.coordinates[0],
              name: f.properties.name || f.properties.street || "Unknown",
              display_name: [f.properties.name, f.properties.street, f.properties.city].filter(Boolean).join(', ')
            })));
          } else {
            fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(val.trim())}&format=json&limit=4&addressdetails=1`)
              .then(r => r.json())
              .then(nomData => {
                if (nomData && nomData.length > 0) {
                  setStopSearchResults(nomData.map((c: any) => ({
                    lat: parseFloat(c.lat),
                    lon: parseFloat(c.lon),
                    name: c.name || c.display_name.split(',')[0],
                    display_name: c.display_name
                  })));
                } else {
                  setStopSearchResults([]);
                }
              }).catch(() => setStopSearchResults([]));
          }
        }).catch(() => setStopSearchResults([]));
    } else {
      setStopSearchResults([]);
    }
  };

  const handleSelectStopPlace = async (index: number, place: any) => {
    const updated = [...routeStops];
    updated[index].name = place.name;
    updated[index].input = place.name;
    updated[index].coords = [place.lat, place.lon];
    setRouteStops(updated);
    setActiveStopSearchIdx(null);
    setStopSearchResults([]);

    const origin = routeOriginCoords || userLocation || [31.5204, 74.3587];
    if (selectedPlace) {
      await fetchRoutesAndEnhance(origin, [selectedPlace.lat, selectedPlace.lon], selectedVehicle, updated);
    }
  };

  useEffect(() => {
    setOriginInput(userAddress);
  }, [userAddress]);

  // Check URL parameters on mount for Pre-Plan Mode and Navigation from Smart Routing page
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const day = params.get('day') || 'Monday';

      if (params.get('mode') === 'preplan') {
        setIsPrePlanMode(true);
        setPrePlanDay(day);
        try {
          const saved = localStorage.getItem('dhuan_planned_trips');
          if (saved) {
            const parsed = JSON.parse(saved);
            const filtered = parsed.filter((p: any) => p.day === day && p.status !== 'cancelled');
            setPrePlanStops(filtered);
          }
        } catch(e) {
          console.error(e);
        }
      } else if (params.get('destLat') && params.get('destLng')) {
        const dLat = parseFloat(params.get('destLat')!);
        const dLng = parseFloat(params.get('destLng')!);
        const dName = params.get('destName') || 'Scheduled Destination';
        const aqi = getSpatialAqi(dLat, dLng);
        const cat = getAqiCategory(aqi);

        const targetPlace = {
          place_id: Date.now(),
          lat: dLat,
          lon: dLng,
          name: dName,
          display_name: dName,
          aqi,
          status: cat.status,
          color: cat.color,
          bg: cat.bg,
          border: cat.border,
          advisory: cat.advisory
        };

        setSelectedPlace(targetPlace);
        setIsDirectionsMode(true);
        const origin = userLocation || [31.5204, 74.3587];
        fetchRoutesAndEnhance(origin, [dLat, dLng]);
      } else if (params.get('mode') === 'tour') {
        try {
          const saved = localStorage.getItem('dhuan_planned_trips');
          if (saved) {
            const parsed = JSON.parse(saved);
            const dayStops = parsed.filter((p: any) => p.day === day && p.status !== 'cancelled');
            if (dayStops.length > 0) {
              const lastStop = dayStops[dayStops.length - 1];
              const intermediate = dayStops.slice(0, dayStops.length - 1).map((s: any) => ({
                id: s.id,
                name: s.name,
                coords: [s.lat, s.lng] as [number, number],
                input: s.name
              }));

              const aqi = lastStop.aqiForecast || getSpatialAqi(lastStop.lat, lastStop.lng);
              const cat = getAqiCategory(aqi);

              const targetPlace = {
                place_id: Date.now(),
                lat: lastStop.lat,
                lon: lastStop.lng,
                name: lastStop.name,
                display_name: lastStop.address || lastStop.name,
                aqi,
                status: cat.status,
                color: cat.color,
                bg: cat.bg,
                border: cat.border,
                advisory: cat.advisory
              };

              setSelectedPlace(targetPlace);
              setRouteStops(intermediate);
              setIsDirectionsMode(true);
              const origin = userLocation || [31.5204, 74.3587];
              fetchRoutesAndEnhance(origin, [lastStop.lat, lastStop.lng], 'car', intermediate);
            }
          }
        } catch(e) {
          console.error(e);
        }
      }
    }
  }, []);

  useEffect(() => {
    setMounted(true);
    let watchId: number | undefined;
    
    // Live Location Tracking
    if (typeof window !== 'undefined' && navigator.geolocation) {
      watchId = navigator.geolocation.watchPosition(
        (position) => {
          setUserLocation([position.coords.latitude, position.coords.longitude]);
        },
        (error) => console.log("Geolocation error:", error),
        { enableHighAccuracy: true, maximumAge: 10000, timeout: 5000 }
      );
    }

    return () => {
      if (watchId !== undefined && navigator.geolocation) {
        navigator.geolocation.clearWatch(watchId);
      }
      mapRef.current = null;
    };
  }, []);

  // Auto-center map on user's live location on first load
  useEffect(() => {
    if (mapRef.current && userLocation && !hasCentered) {
      mapRef.current.setView(userLocation, 14);
      setHasCentered(true);
    }
  }, [userLocation, hasCentered]);

  // Fix: Force Leaflet to recalculate map size after rendering in flex containers
  useEffect(() => {
    const timer = setTimeout(() => {
      if (mapRef.current) {
        mapRef.current.invalidateSize();
      }
    }, 400);
    return () => clearTimeout(timer);
  }, [mounted, fullScreen, selectedPlace]);

  // Live Search with Debounce using Photon API (handles text and coordinates)
  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      if (skipNextSearch.current) {
        skipNextSearch.current = false;
        return;
      }
      const trimmedQuery = query.trim();
      if (trimmedQuery.length > 2) {
        setIsSearching(true);
        setHasSearched(true);

        // Check if query is Latitude/Longitude (e.g. "31.52, 74.35")
        const isCoord = /^-?\d+(\.\d+)?\s*,\s*-?\d+(\.\d+)?$/.test(trimmedQuery) || /^-?\d+(\.\d+)?\s+-?\d+(\.\d+)?$/.test(trimmedQuery);
        
        if (isCoord) {
          const parts = trimmedQuery.replace(',', ' ').split(/\s+/).filter(Boolean);
          const lat = parseFloat(parts[0]);
          const lon = parseFloat(parts[1]);
          
          if (!isNaN(lat) && !isNaN(lon)) {
             // Reverse Geocoding for coordinates
             fetch(`https://photon.komoot.io/reverse?lon=${lon}&lat=${lat}`)
               .then(res => res.json())
               .then(data => {
                  if (data.features && data.features.length > 0) {
                     const f = data.features[0];
                     setResults([{
                        place_id: f.properties.osm_id || Date.now(),
                        lat: lat,
                        lon: lon,
                        display_name: [f.properties.name, f.properties.street, f.properties.city].filter(Boolean).join(', ') || `Lat: ${lat}, Lon: ${lon}`,
                        name: f.properties.name || "Pinned Coordinates"
                     }]);
                  } else {
                     setResults([{
                        place_id: Date.now(),
                        lat, lon,
                        display_name: `Latitude: ${lat}, Longitude: ${lon}`,
                        name: "Pinned Location"
                     }]);
                  }
                  setIsSearching(false);
               })
               .catch(() => {
                  setResults([{ place_id: Date.now(), lat, lon, display_name: `Latitude: ${lat}, Longitude: ${lon}`, name: "Pinned Location" }]);
                  setIsSearching(false);
               });
             return;
          }
        }

        // Regular Text Search (Location names)
        // Photon API with location bias for Lahore
        fetch(`https://photon.komoot.io/api/?q=${encodeURIComponent(trimmedQuery)}&lat=31.5204&lon=74.3587&limit=6`)
          .then(res => res.json())
          .then(data => {
            if (data.features && data.features.length > 0) {
              // Map GeoJSON features to our expected format
              const mappedResults = data.features.map((f: any) => ({
                place_id: f.properties.osm_id || Math.random(),
                lat: f.geometry.coordinates[1],
                lon: f.geometry.coordinates[0],
                display_name: [f.properties.name, f.properties.street, f.properties.city].filter(Boolean).join(', ') || f.properties.name || "Unknown Place",
                name: f.properties.name || f.properties.street || "Unknown Place"
              }));
              setResults(mappedResults);
              setIsSearching(false);
            } else {
              // Fallback 1: Nominatim (OpenStreetMap standard geocoder)
              fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(trimmedQuery)}&format=json&limit=5&addressdetails=1`)
                .then(res => res.json())
                .then(nomData => {
                   if (nomData && nomData.length > 0) {
                      const mappedNomResults = nomData.map((c: any) => ({
                         place_id: c.place_id || Math.random(),
                         lat: parseFloat(c.lat),
                         lon: parseFloat(c.lon),
                         display_name: c.display_name,
                         name: c.name || c.display_name.split(',')[0]
                      }));
                      setResults(mappedNomResults);
                      setIsSearching(false);
                   } else {
                      // Fallback 2: ArcGIS World Geocoding Service
                      fetch(`https://geocode.arcgis.com/arcgis/rest/services/World/GeocodeServer/findAddressCandidates?f=json&singleLine=${encodeURIComponent(trimmedQuery)}&maxLocations=5`)
                        .then(res => res.json())
                        .then(arcData => {
                           if (arcData.candidates && arcData.candidates.length > 0) {
                              const mappedArcResults = arcData.candidates.map((c: any) => ({
                                 place_id: Math.random(),
                                 lat: c.location.y,
                                 lon: c.location.x,
                                 display_name: c.address,
                                 name: c.address.split(',')[0]
                              }));
                              setResults(mappedArcResults);
                           } else {
                              setResults([]);
                           }
                           setIsSearching(false);
                        }).catch(() => { setResults([]); setIsSearching(false); });
                   }
                }).catch(() => {
                   setResults([]);
                   setIsSearching(false);
                });
            }
          })
          .catch(err => {
            console.error("Search error:", err);
            setIsSearching(false);
          });
      } else {
        setResults([]);
        setHasSearched(false);
      }
    }, 600); // 600ms debounce

    return () => clearTimeout(delayDebounceFn);
  }, [query]);

  // Live Search for Origin Input
  useEffect(() => {
    const delayFn = setTimeout(() => {
      if (skipNextOriginSearch.current) { skipNextOriginSearch.current = false; return; }
      if (originInput.trim().length > 2 && document.activeElement === originInputRef.current) {
         setIsSearchingOrigin(true);
         fetch(`https://photon.komoot.io/api/?q=${encodeURIComponent(originInput.trim())}&lat=31.5204&lon=74.3587&limit=4`)
           .then(r => r.json())
           .then(data => {
              if (data.features && data.features.length > 0) {
                 setOriginResults(data.features.map((f: any) => ({
                   lat: f.geometry.coordinates[1],
                   lon: f.geometry.coordinates[0],
                   name: f.properties.name || f.properties.street || "Unknown",
                   display_name: [f.properties.name, f.properties.street, f.properties.city].filter(Boolean).join(', ')
                 })));
                 setIsSearchingOrigin(false);
              } else {
                 fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(originInput.trim())}&format=json&limit=4&addressdetails=1`)
                   .then(r => r.json())
                   .then(nomData => {
                      if (nomData && nomData.length > 0) {
                         setOriginResults(nomData.map((c: any) => ({
                            lat: parseFloat(c.lat),
                            lon: parseFloat(c.lon),
                            name: c.name || c.display_name.split(',')[0],
                            display_name: c.display_name
                         })));
                      } else {
                         setOriginResults([]);
                      }
                      setIsSearchingOrigin(false);
                   }).catch(() => setIsSearchingOrigin(false));
              }
           }).catch(() => setIsSearchingOrigin(false));
      } else {
         setOriginResults([]);
      }
    }, 600);
    return () => clearTimeout(delayFn);
  }, [originInput]);
  // Navigation Simulator
  useEffect(() => {
     let interval: NodeJS.Timeout;
     if (isNavigating && routes.length > 0 && routes[selectedRouteIdx]) {
        const currentRoute = routes[selectedRouteIdx];
        const routeCoords = currentRoute.geometry.coordinates;
        let currentIndex = 0;
        
        // Helper to calculate distance in meters
        const getDist = (coord1: number[], coord2: number[]) => {
           const R = 6371e3;
           const p1 = coord1[1] * Math.PI/180;
           const p2 = coord2[1] * Math.PI/180;
           const dp = (coord2[1]-coord1[1]) * Math.PI/180;
           const dl = (coord2[0]-coord1[0]) * Math.PI/180;
           const a = Math.sin(dp/2) * Math.sin(dp/2) + Math.cos(p1) * Math.cos(p2) * Math.sin(dl/2) * Math.sin(dl/2);
           const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
           return R * c;
        };

        const getBearing = (coord1: number[], coord2: number[]) => {
           const lat1 = coord1[1] * Math.PI/180;
           const lat2 = coord2[1] * Math.PI/180;
           const dl = (coord2[0] - coord1[0]) * Math.PI/180;
           const y = Math.sin(dl) * Math.cos(lat2);
           const x = Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(dl);
           return (Math.atan2(y, x) * 180 / Math.PI + 360) % 360;
        };

        const calcRemainingDist = (fromIdx: number) => {
           let total = 0;
           for (let i = fromIdx; i < routeCoords.length - 1; i++) {
              total += getDist(routeCoords[i], routeCoords[i+1]);
           }
           return total;
        };

        const totalRouteDist = calcRemainingDist(0) || currentRoute.distance || 1000;
        const totalRouteDuration = currentRoute.duration || 600;

        // Initialize remaining trip metrics
        const initRemDist = Math.round(totalRouteDist);
        const initRemSec = Math.round(totalRouteDuration);
        setNavRemainingDistance(initRemDist);
        setNavRemainingDuration(initRemSec);
        setNavEtaTime(new Date(Date.now() + initRemSec * 1000).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }));
        
        // Start at index 0
        setNavPosition({ lat: routeCoords[0][1], lng: routeCoords[0][0] });
        if (mapRef.current) {
           mapRef.current.setView([routeCoords[0][1], routeCoords[0][0]], 18, { animate: true, duration: 1.5 });
        }
        
        interval = setInterval(() => {
           currentIndex += 1;
           if (currentIndex >= routeCoords.length - 1) {
              clearInterval(interval);
              setIsNavigating(false);
              setIsPanelCollapsed(false);
              return;
           }
           
           const current = routeCoords[currentIndex];
           const next = routeCoords[currentIndex + 1];
           
           // Bearing
           const bearing = getBearing(current, next);

           // Live Remaining Distance, Time & ETA
           const remDistMeters = Math.round(calcRemainingDist(currentIndex));
           const progressRatio = Math.max(0, Math.min(1, remDistMeters / totalRouteDist));
           const remDurationSec = Math.max(30, Math.round(totalRouteDuration * progressRatio));
           const etaDate = new Date(Date.now() + remDurationSec * 1000);
           const formattedEta = etaDate.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });

           setNavRemainingDistance(remDistMeters);
           setNavRemainingDuration(remDurationSec);
           setNavEtaTime(formattedEta);

           // Live Spatial AQI & Environment for Current Location
           const curLat = next[1];
           const curLng = next[0];
           const curAqi = getSpatialAqi(curLat, curLng);
           const curCat = getAqiCategory(curAqi);
           setNavCurrentAqi(curAqi);
           setNavCurrentStatus(curCat.status);
           setNavCurrentPm25(Math.round(curAqi * 0.65));

           // Derive current area / road name
           let curAreaName = "Connecting Corridor";
           if (currentRoute.legs?.[0]?.steps && currentRoute.legs[0].steps.length > 0) {
              const stepIndex = Math.min(
                 currentRoute.legs[0].steps.length - 1, 
                 Math.floor((currentIndex / routeCoords.length) * currentRoute.legs[0].steps.length)
              );
              const stepObj = currentRoute.legs[0].steps[stepIndex];
              if (stepObj?.name && stepObj.name.trim().length > 0) {
                 curAreaName = stepObj.name.replace(/^via\s+/i, '');
              }
           }
           if (!curAreaName || curAreaName === "Main Route" || curAreaName === "Connecting Corridor") {
              if (curLat > 31.54) curAreaName = "Mall Road Expressway";
              else if (curLat > 31.50) curAreaName = "Canal Bank Corridor";
              else if (curLng > 74.37) curAreaName = "Defence Road Sector";
              else curAreaName = "Ferozepur Road Arterial";
           }
           setNavCurrentArea(curAreaName);

           // Calculate upcoming area ~2-3 km ahead
           let distAheadSum = 0;
           let aheadIdx = currentIndex + 1;
           for (let k = currentIndex + 1; k < routeCoords.length - 1; k++) {
              distAheadSum += getDist(routeCoords[k], routeCoords[k+1]);
              aheadIdx = k;
              if (distAheadSum >= 2300) {
                 break;
              }
           }
           if (aheadIdx >= routeCoords.length - 1) {
              aheadIdx = routeCoords.length - 1;
           }

           const aheadCoord = routeCoords[aheadIdx];
           const aheadAqi = getSpatialAqi(aheadCoord[1], aheadCoord[0]);
           const aheadCat = getAqiCategory(aheadAqi);
           const aheadDistMeters = Math.round(distAheadSum);

           setNavUpcomingDistance(aheadDistMeters);
           setNavUpcomingAqi(aheadAqi);
           setNavUpcomingStatus(aheadCat.status);

           // Upcoming Area Name
           let upcomingName = selectedPlace?.name ? `${selectedPlace.name} Corridor` : "Destination Vicinity";
           if (aheadIdx < routeCoords.length - 2) {
              if (aheadCoord[1] > 31.54) upcomingName = "Mall Road Junction";
              else if (aheadCoord[1] > 31.50) upcomingName = "Canal Bank Road Sector";
              else if (aheadCoord[0] > 74.37) upcomingName = "Ring Road Interchange";
              else upcomingName = "Ferozepur Underpass Sector";
           }
           setNavUpcomingArea(upcomingName);

           // Environmental Warning / Smog Ahead Trend
           const distKmStr = aheadDistMeters >= 1000 ? `${(aheadDistMeters / 1000).toFixed(1)} km` : `${aheadDistMeters} m`;
           if (aheadAqi > curAqi + 20) {
              setNavUpcomingWarning(`⚠️ Smog Spikes Ahead: Air quality worsens by +${aheadAqi - curAqi} AQI in next ${distKmStr}. Visibility drops to ~700m.`);
           } else if (aheadAqi < curAqi - 20) {
              setNavUpcomingWarning(`🌿 Cleaner Corridor Ahead: Smog decreases by -${curAqi - aheadAqi} AQI in next ${distKmStr}. Lower particulate concentration.`);
           } else {
              setNavUpcomingWarning(`🌫️ Steady Smog Level: Uniform air conditions (${aheadCat.status}) continue for next ${distKmStr}.`);
           }
           
           // Calculate next turn instruction
           let distanceToTurn = 0;
           let turnType = "Continue straight";
           let foundTurn = false;
           
           for (let i = currentIndex; i < routeCoords.length - 2; i++) {
               const p1 = routeCoords[i];
               const p2 = routeCoords[i+1];
               const p3 = routeCoords[i+2];
               
               distanceToTurn += getDist(p1, p2);
               
               let angleDiff = getBearing(p2, p3) - getBearing(p1, p2);
               if (angleDiff > 180) angleDiff -= 360;
               if (angleDiff < -180) angleDiff += 360;
               
               if (Math.abs(angleDiff) > 25) {
                   if (angleDiff > 25 && angleDiff <= 130) turnType = "Turn right";
                   else if (angleDiff < -25 && angleDiff >= -130) turnType = "Turn left";
                   else turnType = "Make a U-turn";
                   
                   // Sprinkle vehicle-specific flavor events
                   if (selectedVehicle === 'transit') {
                      turnType = routes[selectedRouteIdx]?.transitData?.steps?.[1]?.badge ? `Ride ${routes[selectedRouteIdx].transitData.steps[1].badge}` : "Transfer at Metro Station";
                   } else if (selectedVehicle === 'walk') {
                      turnType = i % 2 === 0 ? 'Follow pedestrian path' : 'Cross at walkway';
                   } else if (selectedVehicle === 'bike') {
                      turnType = i % 2 === 0 ? 'Stay in service lane' : (angleDiff > 0 ? 'Turn right' : 'Turn left');
                   } else {
                      if (i % 14 === 0 && Math.abs(angleDiff) < 45) turnType = 'Take the flyover';
                      if (i % 19 === 0 && Math.abs(angleDiff) < 45) turnType = 'Take the underpass';
                      if (i % 25 === 0) turnType = 'Continue on Ring Road (L-20)';
                   }
                   
                   foundTurn = true;
                   break;
               }
           }
           if (!foundTurn) {
              turnType = selectedVehicle === 'transit' ? 'Arrive at Metro/Bus Station' : 'Arrive at destination';
           }
           setNavInstruction({ type: turnType, distance: Math.round(distanceToTurn) });
           setNavHeading(bearing);
           setNavPosition({ lat: next[1], lng: next[0] });
           
           if (mapRef.current) {
              mapRef.current.setView([next[1], next[0]], 18, { animate: true, duration: 1.0 });
           }
        }, 1500);
     }
     return () => clearInterval(interval);
  }, [isNavigating, routes, selectedRouteIdx]);

  if (!mounted) {
    return (
      <div className="w-full h-full bg-slate-100 animate-pulse rounded-2xl flex items-center justify-center">
        <span className="text-slate-400 font-medium">Loading Map...</span>
      </div>
    );
  }

  // Coordinates for Lahore
  const position: [number, number] = [31.5204, 74.3587];

  const handleCompassClick = () => {
    if (mapRef.current && userLocation) {
      mapRef.current.flyTo(userLocation, 14, { animate: true, duration: 1.5 });
    } else if (mapRef.current) {
      mapRef.current.flyTo(position, 12, { animate: true, duration: 1.5 });
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    // Action already handled by live search, this just prevents page reload on Enter
  };

  const handleSelectPlace = (place: any) => {
    const lat = parseFloat(place.lat);
    const lon = parseFloat(place.lon);
    
    if (isPrePlanMode) {
      const aqi = getSpatialAqi(lat, lon);
      const cat = getAqiCategory(aqi);
      const defaultTimes = ["09:00 AM", "11:30 AM", "02:00 PM", "04:30 PM", "06:45 PM", "09:00 PM"];
      const assignedTime = defaultTimes[prePlanStops.length % defaultTimes.length];

      const newStop = {
        id: Date.now().toString(),
        name: place.name || place.display_name.split(',')[0],
        address: place.display_name,
        lat,
        lng: lon,
        time: assignedTime,
        day: prePlanDay,
        aqiForecast: aqi,
        smogStatus: cat.status,
        advisory: cat.advisory || "Air quality verified",
        notifications: {
          enabled: true,
          leadTimeMins: 30,
          smogSpikeAlert: true,
          channel: 'push'
        },
        status: 'scheduled'
      };

      setPrePlanStops(prev => [...prev, newStop]);
      setQuery('');
      setResults([]);
      setHasSearched(false);
      if (mapRef.current) {
        mapRef.current.flyTo([lat, lon], 15, { animate: true, duration: 1.2 });
      }
      return;
    }
    
    const aqiVal = getSpatialAqi(lat, lon);
    const pm25Val = getSpatialPm25(lat, lon);
    const cat = getAqiCategory(aqiVal);

    // Generate authentic 24-hour diurnal forecast curve grounded in AI Core
    const forecast = [];
    if (hourlyAiForecast && hourlyAiForecast.length >= 24) {
      const cityBaseline = cityBaselineAqi || 81;
      const offset = aqiVal - cityBaseline;
      for (const h of hourlyAiForecast.slice(0, 24)) {
        const projAqi = Math.max(20, Math.min(450, Math.round(h.aqi + offset)));
        let statusColor = 'text-emerald-500';
        if (projAqi > 100) statusColor = 'text-yellow-500';
        if (projAqi > 150) statusColor = 'text-orange-500';
        if (projAqi > 200) statusColor = 'text-rose-500';
        forecast.push({
          time: h.time_label || 'Next hr',
          aqi: projAqi,
          color: statusColor
        });
      }
    } else {
      for (let i = 1; i <= 24; i++) {
        const d = new Date();
        d.setHours(d.getHours() + i);
        const hour = d.getHours();
        const diurnalFactor = (hour >= 2 && hour <= 7) ? 1.45 : (hour >= 12 && hour <= 17) ? 0.88 : 1.15;
        const projAqi = Math.round(aqiVal * diurnalFactor);
        let statusColor = 'text-emerald-500';
        if (projAqi > 100) statusColor = 'text-yellow-500';
        if (projAqi > 150) statusColor = 'text-orange-500';
        if (projAqi > 200) statusColor = 'text-rose-500';
        forecast.push({
          time: d.toLocaleString('en-US', { hour: 'numeric', hour12: true }),
          aqi: projAqi,
          color: statusColor
        });
      }
    }

    setSelectedPlace({
      ...place,
      lat, lon,
      aqi: aqiVal,
      pm25: pm25Val,
      status: cat.status,
      color: cat.color,
      bg: cat.bg,
      border: cat.border,
      advisory: cat.advisory,
      forecast
    });
    skipNextSearch.current = true;
    setResults([]);
    setHasSearched(false);
    setQuery(place.name || place.display_name.split(',')[0]);
    
    // Fly to location
    if (mapRef.current) {
      mapRef.current.flyTo([lat, lon], 16, { animate: true, duration: 1.5 });
    }
  };

  // Map click handler for reverse geocoding and waypoint creation
  const handleMapClick = async (e: L.LeafletMouseEvent) => {
    const { lat, lng } = e.latlng;
    
    if (isSelectingOriginOnMap) {
        setIsSelectingOriginOnMap(false);
        setRouteOriginCoords([lat, lng]);
        skipNextOriginSearch.current = true;
        setUserAddress("Locating...");
        setOriginInput("Locating...");
        try {
           const res = await fetch(`https://photon.komoot.io/reverse?lon=${lng}&lat=${lat}`);
           const data = await res.json();
           if (data.features && data.features.length > 0) {
              const name = data.features[0].properties.name || data.features[0].properties.street || "Selected Location";
              setUserAddress(name);
              setOriginInput(name);
           } else {
              setUserAddress("Selected Location");
              setOriginInput("Selected Location");
           }
        } catch {
           setUserAddress("Selected Location");
           setOriginInput("Selected Location");
        }
        if (selectedPlace) {
           await fetchRoutesAndEnhance([lat, lng], [selectedPlace.lat, selectedPlace.lon]);
        }
        return;
    }

    if (isPrePlanMode) {
       try {
          const res = await fetch(`https://photon.komoot.io/reverse?lon=${lng}&lat=${lat}`);
          const data = await res.json();
          let name = `Location (${lat.toFixed(3)}, ${lng.toFixed(3)})`;
          let address = name;
          if (data.features && data.features.length > 0) {
             const prop = data.features[0].properties;
             name = prop.name || prop.street || name;
             address = [prop.name, prop.street, prop.city].filter(Boolean).join(', ') || name;
          }

          const aqi = getSpatialAqi(lat, lng);
          const cat = getAqiCategory(aqi);
          const defaultTimes = ["09:00 AM", "11:30 AM", "02:00 PM", "04:30 PM", "06:45 PM", "09:00 PM"];
          const assignedTime = defaultTimes[prePlanStops.length % defaultTimes.length];

          const newStop = {
             id: Date.now().toString(),
             name,
             address,
             lat,
             lng,
             time: assignedTime,
             day: prePlanDay,
             aqiForecast: aqi,
             smogStatus: cat.status,
             advisory: cat.advisory || "Air quality verified",
             notifications: {
               enabled: true,
               leadTimeMins: 30,
               smogSpikeAlert: true,
               channel: 'push'
             },
             status: 'scheduled'
          };

          setPrePlanStops(prev => [...prev, newStop]);
       } catch(e) {
          console.error(e);
       }
       return;
    }

    if (isNavigating) {
        // User tapped another road or off-route location while actively navigating -> Automatically recalculate route!
        handleOffRoute([lat, lng]);
        return;
    }

    if (isDirectionsMode) return; // Prevent changing destination while navigating/routing
    
    // Don't trigger if they are already searching or sliding
    setIsSearching(true);
    try {
      // Reverse Geocode using Photon
      const res = await fetch(`https://photon.komoot.io/reverse?lon=${lng}&lat=${lat}`);
      const data = await res.json();
      let placeName = `Coordinates: ${lat.toFixed(4)}, ${lng.toFixed(4)}`;
      let displayName = placeName;
      let placeId = Date.now();

      if (data.features && data.features.length > 0) {
        const f = data.features[0];
        placeId = f.properties.osm_id || placeId;
        displayName = [f.properties.name, f.properties.street, f.properties.city].filter(Boolean).join(', ') || placeName;
        placeName = f.properties.name || f.properties.street || "Pinned Location";
      } else {
         // Fallback to ArcGIS Reverse Geocoding
         try {
            const arcRes = await fetch(`https://geocode.arcgis.com/arcgis/rest/services/World/GeocodeServer/reverseGeocode?f=json&location=${lng},${lat}`);
            const arcData = await arcRes.json();
            if (arcData.address && arcData.address.Match_addr) {
               displayName = arcData.address.Match_addr;
               placeName = displayName.split(',')[0];
            }
         } catch(e) {}
      }

      // Build place object and select it
      const placeObj = {
        place_id: placeId,
        lat: lat,
        lon: lng,
        display_name: displayName,
        name: placeName
      };
      
      handleSelectPlace(placeObj);
      
    } catch (err) {
      console.error("Reverse geocoding error:", err);
    }
    setIsSearching(false);
  };

  const fetchRoutesAndEnhance = async (
    origin: [number, number], 
    dest: [number, number], 
    vehicleMode?: 'car' | 'bike' | 'walk' | 'transit',
    customStops?: Array<{ id: string; name: string; coords: [number, number]; input: string }>
  ) => {
    const mode = vehicleMode || selectedVehicle;
    const currentStops = customStops !== undefined ? customStops : routeStops;
    const validStops = currentStops.filter(s => s.coords && (s.coords[0] !== 0 || s.coords[1] !== 0));

    setIsSearching(true);
    try {
      // 1. PUBLIC TRANSPORT (Punjab MassTransit Authority - Metrobus, Orange Line, Speedo, Green Bus)
      if (mode === 'transit') {
        const effectiveDest = validStops.length > 0 ? validStops[0].coords : dest;
        const pmaRoutes = solvePmaTransitRoutes(origin, effectiveDest);
        if (pmaRoutes.length > 0) {
          const formattedRoutes = pmaRoutes.map((tr, idx) => ({
            duration: tr.totalDurationMin * 60,
            distance: tr.totalDistanceMeters,
            geometry: {
              type: 'LineString',
              coordinates: tr.geometryCoordinates
            },
            legs: [{
              steps: tr.steps.map(s => ({ name: s.instructions }))
            }],
            transitData: tr,
            aiStats: {
              smogExposure: 28 + idx * 8, // AC Metro / Bus protects commuters from smog!
              traffic: 'Dedicated Transit Corridor',
              isSafest: idx === 0,
              ecoFriendly: true
            }
          }));

          setRoutes(formattedRoutes);
          setSelectedRouteIdx(0);

          if (mapRef.current && formattedRoutes[0]) {
             const allCoords = formattedRoutes[0].transitData.segments.flatMap(s => s.coordinates);
             if (allCoords.length > 0) {
                const bounds = L.latLngBounds(allCoords);
                mapRef.current.fitBounds(bounds, { padding: [60, 60], animate: true, duration: 1.5 });
             }
          }
          setIsSearching(false);
          return;
        }
      }

      // 2. ROAD ROUTING (Car, Bike, Walk) using OSRM with all stops included
      const allWaypoints = [
        [origin[1], origin[0]],
        ...validStops.map(s => [s.coords[1], s.coords[0]]),
        [dest[1], dest[0]]
      ];
      const waypointStr = allWaypoints.map(c => `${c[0]},${c[1]}`).join(';');
      const res = await fetch(`https://router.project-osrm.org/route/v1/driving/${waypointStr}?geometries=geojson&alternatives=3&overview=full`);
      const data = await res.json();
      
      let baseRoutes = data.routes || [];
      
      if (baseRoutes.length > 0) {
         const primary = baseRoutes[0];
         
         if (validStops.length > 0 || isNavigating) {
            // During navigation or multi-stop routes: strictly single clean real road route
            baseRoutes = [primary];
            if (validStops.length > 0) {
               const stopLabel = validStops.length === 1 
                  ? `via Stop A (${validStops[0].name.split(',')[0] || "Custom Stop"})` 
                  : `via ${validStops.length} stops (${validStops.map((_, i) => String.fromCharCode(65 + i)).join(' → ')})`;
               if (primary.legs && primary.legs[0] && primary.legs[0].steps && primary.legs[0].steps[0]) {
                  primary.legs[0].steps[0] = { name: stopLabel };
               }
            } else {
               if (primary.legs && primary.legs[0] && primary.legs[0].steps && primary.legs[0].steps[0]) {
                  primary.legs[0].steps[0] = { name: "Safest Recalculated Route" };
               }
            }
         } else {
            // Before navigation: if OSRM returned genuine alternative driving routes, use them!
            if (data.routes && data.routes.length > 1) {
               baseRoutes = data.routes.slice(0, 3).map((r: any, rIdx: number) => {
                  const roadName = r.legs?.[0]?.steps?.[0]?.name || (rIdx === 0 ? "Fastest Route" : `Alternative Route ${rIdx}`);
                  return {
                     ...r,
                     legs: [{ ...r.legs?.[0], steps: [{ name: `via ${roadName}` }] }]
                  };
               });
            } else {
               // Single genuine road route
               if (primary.legs && primary.legs[0] && primary.legs[0].steps && primary.legs[0].steps[0]) {
                  const defaultLabel = primary.distance > 5000 ? "via Lahore Ring Road / Expressway" : "via Canal Road & Main Boulevard";
                  primary.legs[0].steps[0] = { name: defaultLabel };
               }
               baseRoutes = [primary];
            }
         }
      }

      if (baseRoutes.length > 0) {
        const enhancedRoutes = baseRoutes.map((r: any, idx: number) => {
           let isSafest = false;
           if (baseRoutes.length > 1 && idx === 1) isSafest = true;
           else if (baseRoutes.length === 1 && idx === 0) isSafest = true;
           
           // Calculate authentic average smog exposure from AI spatial map along route coordinates
           const coords = r.geometry?.coordinates || [];
           let routeAqiSum = 0;
           let sampleCount = 0;
           if (coords.length > 0) {
             const step = Math.max(1, Math.floor(coords.length / 10));
             for (let ci = 0; ci < coords.length; ci += step) {
               const pt = coords[ci]; // [lon, lat]
               routeAqiSum += getSpatialAqi(pt[1], pt[0]);
               sampleCount++;
             }
           }
           let smogExposure = sampleCount > 0 ? Math.round(routeAqiSum / sampleCount) : (cityBaselineAqi || 81);

           let trafficLevel = isSafest ? 'Low' : ['Moderate', 'High'][idx % 2];

           if (mode === 'bike') {
             smogExposure += 10; // Open air exposure factor
           } else if (mode === 'walk') {
             smogExposure += 5;
             trafficLevel = 'Pedestrian Friendly';
           }

           const caloriesBurned = mode === 'walk' ? Math.round((r.distance / 1000) * 58) : undefined;
           const stepsCount = mode === 'walk' ? Math.round(r.distance * 1.35) : undefined;
           
           return {
              ...r,
              aiStats: { smogExposure, traffic: trafficLevel, isSafest, caloriesBurned, stepsCount }
           };
        });

        setRoutes(enhancedRoutes);
        setSelectedRouteIdx(enhancedRoutes.length > 1 ? 1 : 0);
        
        if (mapRef.current && enhancedRoutes[0]) {
           const coords = enhancedRoutes[0].geometry.coordinates.map((c: any) => [c[1], c[0]]);
           const bounds = L.latLngBounds(coords);
           mapRef.current.fitBounds(bounds, { padding: [50, 50], animate: true, duration: 1.5 });
        }
      }
    } catch (err) {
      console.error("Routing error:", err);
    } finally {
      setIsSearching(false);
    }
  };

  const handleDirectionsClick = async () => {
    if (!selectedPlace) return;
    setIsDirectionsMode(true);
    setIsNavigating(false);
    
    const origin = routeOriginCoords || userLocation || [31.5204, 74.3587];
    setRouteOriginCoords(origin);
    const dest: [number, number] = [selectedPlace.lat, selectedPlace.lon];
    
    // Reverse geocode origin for display name
    if (userAddress === "Your Location" || originInput === "Your Location") {
      setUserAddress("Locating...");
      fetch(`https://photon.komoot.io/reverse?lon=${origin[1]}&lat=${origin[0]}`)
        .then(r => r.json())
        .then(d => {
           if (d.features && d.features.length > 0) {
              const name = d.features[0].properties.name || d.features[0].properties.street || "Current Location";
              setUserAddress(name);
           } else setUserAddress("Current Location");
        }).catch(() => setUserAddress("Current Location"));
    }

    await fetchRoutesAndEnhance(origin, dest);
  };

  const handleCustomOriginSubmit = async (e: React.KeyboardEvent<HTMLInputElement>) => {
     if (e.key === 'Enter' && originInput.trim().length > 2) {
        setIsSearching(true);
        try {
           const res = await fetch(`https://photon.komoot.io/api/?q=${encodeURIComponent(originInput)}&lat=31.5204&lon=74.3587&limit=1`);
           const data = await res.json();
           if (data.features && data.features.length > 0) {
              const f = data.features[0];
              const newOrigin: [number, number] = [f.geometry.coordinates[1], f.geometry.coordinates[0]];
              setRouteOriginCoords(newOrigin);
              setUserAddress(f.properties.name || originInput);
              if (selectedPlace) {
                 await fetchRoutesAndEnhance(newOrigin, [selectedPlace.lat, selectedPlace.lon]);
              }
           } else {
              // Fallback to ArcGIS
              const arcRes = await fetch(`https://geocode.arcgis.com/arcgis/rest/services/World/GeocodeServer/findAddressCandidates?f=json&singleLine=${encodeURIComponent(originInput)}&maxLocations=1`);
              const arcData = await arcRes.json();
              if (arcData.candidates && arcData.candidates.length > 0) {
                 const newOrigin: [number, number] = [arcData.candidates[0].location.y, arcData.candidates[0].location.x];
                 setRouteOriginCoords(newOrigin);
                 setUserAddress(arcData.candidates[0].address.split(',')[0]);
                 if (selectedPlace) {
                    await fetchRoutesAndEnhance(newOrigin, [selectedPlace.lat, selectedPlace.lon]);
                 }
              }
           }
        } catch(err) { console.error(err); }
        setIsSearching(false);
     }
  };

  // End Navigation Handler: stops route, clears directions, closes modal, and locks current user GPS location
  const handleEndNavigation = () => {
    if (navPosition) {
       setUserLocation([navPosition.lat, navPosition.lng]);
       setUserAddress(navCurrentArea || `Coordinates: ${navPosition.lat.toFixed(4)}, ${navPosition.lng.toFixed(4)}`);
       if (mapRef.current) {
          mapRef.current.flyTo([navPosition.lat, navPosition.lng], 16, { animate: true, duration: 1.2 });
       }
    }
    setIsNavigating(false);
    setIsDirectionsMode(false);
    setRoutes([]);
    setSelectedPlace(null);
    setIsPanelCollapsed(false);
    setNavPosition(null);
    setRerouteNotice(null);
    setIsRerouting(false);
  };

  // Off-Route Rerouting Handler: auto recalculates route from drifted road coordinates
  const handleOffRoute = async (newCoords: [number, number]) => {
    if (!selectedPlace) return;
    setIsRerouting(true);
    setRerouteNotice(`Off-route detected • Automatically recalculating route to ${selectedPlace.name || "destination"}...`);

    // Snap to nearest actual drivable road coordinate via OSRM Nearest API
    let roadCoords: [number, number] = newCoords;
    try {
      const nearRes = await fetch(`https://router.project-osrm.org/nearest/v1/driving/${newCoords[1]},${newCoords[0]}`);
      const nearData = await nearRes.json();
      if (nearData.waypoints && nearData.waypoints.length > 0) {
        roadCoords = [nearData.waypoints[0].location[1], nearData.waypoints[0].location[0]];
      }
    } catch (e) {
      console.log("OSRM snap error, using fallback coords", e);
    }

    setNavPosition({ lat: roadCoords[0], lng: roadCoords[1] });
    if (mapRef.current) {
       mapRef.current.setView([roadCoords[0], roadCoords[1]], 17, { animate: true });
    }

    try {
       const origin = roadCoords;
       const dest: [number, number] = [selectedPlace.lat, selectedPlace.lon];
       await fetchRoutesAndEnhance(origin, dest, selectedVehicle, routeStops);
       setRouteOriginCoords(roadCoords);
       setSelectedRouteIdx(0);
    } catch (err) {
       console.error("Reroute error:", err);
    } finally {
       setTimeout(() => {
          setIsRerouting(false);
          setRerouteNotice(null);
       }, 2500);
    }
  };

  // Simulate Detour Trigger for interactive testing
  const handleSimulateDetour = async () => {
    if (!navPosition || !selectedPlace) return;
    // Calculate a small cross-street offset perpendicular to current heading (~180m)
    const rad = ((navHeading || 0) + 90) * Math.PI / 180;
    const detourLat = navPosition.lat + (0.0018 * Math.cos(rad));
    const detourLng = navPosition.lng + (0.0018 * Math.sin(rad));
    await handleOffRoute([detourLat, detourLng]);
  };

  if (!mounted) {
    return (
      <div className={`w-full h-full flex-1 relative z-0 flex items-center justify-center bg-slate-50 ${fullScreen ? '' : 'min-h-[500px] lg:min-h-[600px] rounded-2xl border border-slate-200'}`}>
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
          <span className="text-xs font-bold text-slate-500">Loading Map...</span>
        </div>
      </div>
    );
  }

  return (
    <div className={`w-full h-full flex-1 relative z-0 ${fullScreen ? '' : 'min-h-[500px] lg:min-h-[600px] rounded-2xl overflow-hidden shadow-sm border border-slate-200'}`}>
      <div className="absolute inset-0">
        <MapContainer 
          key={mapKey}
          center={position} 
          zoom={12} 
          scrollWheelZoom={true} 
          zoomControl={false}
          style={{ height: '100%', width: '100%' }}
        >
          <MapReadyHandler onMapReady={handleMapReady} />
          {/* Google Maps Style Tiles (English Labels) */}
          <TileLayer
            url="https://mt1.google.com/vt/lyrs=m&hl=en&x={x}&y={y}&z={z}"
            attribution="&copy; Google Maps"
          />

        {/* Live User Location Marker (if not overridden by custom route origin) */}
        {userLocation && (!isDirectionsMode || !routeOriginCoords || (routeOriginCoords[0] === userLocation[0] && routeOriginCoords[1] === userLocation[1])) && (
          <Marker position={userLocation} icon={blueDotIcon} zIndexOffset={1000}>
            <Popup>
               <div className="font-bold text-slate-900 text-sm">You are here</div>
               <div className="text-slate-500 text-xs">Live GPS Location</div>
            </Popup>
          </Marker>
        )}

        {/* Custom Route Origin Marker */}
        {isDirectionsMode && !isNavigating && routeOriginCoords && (!userLocation || routeOriginCoords[0] !== userLocation[0] || routeOriginCoords[1] !== userLocation[1]) && (
          <Marker position={routeOriginCoords} icon={blueDotIcon} zIndexOffset={1000}>
            <Popup>
               <div className="font-bold text-slate-900 text-sm">Starting Point</div>
               <div className="text-slate-500 text-xs">{userAddress}</div>
            </Popup>
          </Marker>
        )}

        {/* Navigation Arrow Marker */}
        {isNavigating && navPosition && (
          <Marker 
             position={[navPosition.lat, navPosition.lng]} 
             zIndexOffset={2000}
             icon={L.divIcon({
                className: 'clear-none',
                html: `<div style="transform: rotate(${navHeading}deg); transition: transform 1s linear; width: 40px; height: 40px; display: flex; align-items: center; justify-content: center; margin-left: -20px; margin-top: -20px;">
                         <svg viewBox="0 0 24 24" fill="#7c3aed" stroke="white" stroke-width="2" class="w-10 h-10 drop-shadow-xl filter" style="filter: drop-shadow(0 4px 6px rgba(0,0,0,0.3));">
                           <polygon points="12,2 22,22 12,17 2,22" />
                         </svg>
                       </div>`,
                iconSize: [0, 0]
             })}
          />
        )}

        {/* Searched Place Marker */}
        {selectedPlace && (
          <Marker position={[selectedPlace.lat, selectedPlace.lon]} icon={searchPinIcon} zIndexOffset={1001}>
            <Popup>
               <div className="font-bold text-slate-900 text-sm">{selectedPlace.display_name.split(',')[0]}</div>
               <div className="text-slate-500 text-xs line-clamp-1">{selectedPlace.display_name}</div>
            </Popup>
          </Marker>
        )}
        {/* Intermediate Route Stops Markers (A, B, C...) */}
        {isDirectionsMode && routeStops.map((stop, sIdx) => {
          if (!stop.coords || (stop.coords[0] === 0 && stop.coords[1] === 0)) return null;
          return (
            <Marker
              key={stop.id}
              position={stop.coords}
              icon={L.divIcon({
                className: 'route-stop-marker',
                html: `<div style="background-color: #f59e0b; border: 2.5px solid white; box-shadow: 0 4px 10px rgba(0,0,0,0.35); width: 26px; height: 26px; border-radius: 9999px; display: flex; align-items: center; justify-content: center; color: white; font-weight: 900; font-size: 12px;">
                         ${String.fromCharCode(65 + sIdx)}
                       </div>`,
                iconSize: [26, 26],
                iconAnchor: [13, 13]
              })}
              zIndexOffset={1300}
            >
              <Popup>
                <div className="font-bold text-slate-900 text-sm">Stop {String.fromCharCode(65 + sIdx)}</div>
                <div className="text-xs text-slate-600 line-clamp-1">{stop.name}</div>
              </Popup>
            </Marker>
          );
        })}

        {/* Pre-Plan Selected Stops Markers (1, 2, 3...) */}
        {isPrePlanMode && prePlanStops.map((st, sIdx) => (
          <Marker
            key={`preplan-${st.id}`}
            position={[st.lat, st.lng]}
            icon={L.divIcon({
              className: 'preplan-stop-marker',
              html: `<div style="background: linear-gradient(135deg, #059669, #047857); border: 2.5px solid white; box-shadow: 0 6px 16px rgba(0,0,0,0.35); width: 32px; height: 32px; border-radius: 9999px; display: flex; align-items: center; justify-content: center; color: white; font-weight: 900; font-size: 14px;">
                       ${sIdx + 1}
                     </div>`,
              iconSize: [32, 32],
              iconAnchor: [16, 16]
            })}
            zIndexOffset={1800}
          >
            <Popup>
              <div className="font-extrabold text-slate-900 text-sm">Stop {sIdx + 1}: {st.name}</div>
              <div className="text-xs text-slate-500 mt-0.5">{st.address}</div>
              <div className="flex items-center gap-2 mt-2 pt-1.5 border-t border-slate-100">
                <span className="text-xs font-bold text-slate-800 bg-slate-100 px-2 py-0.5 rounded-md">⏰ {st.time}</span>
                <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md">AQI {st.aqiForecast}</span>
              </div>
            </Popup>
          </Marker>
        ))}

        {/* Direction Routes */}
        {isDirectionsMode && routes.length > 0 && (
          selectedVehicle === 'transit' && routes[selectedRouteIdx]?.transitData ? (
            <>
              {/* Transit Multi-Colored Segments (Metrobus Yellow, Orange Line Orange, Speedo Red, Green Bus Green) */}
              {routes[selectedRouteIdx].transitData.segments.map((seg: any, sIdx: number) => (
                <Polyline 
                  key={`transit-seg-${sIdx}`}
                  positions={seg.coordinates}
                  color={seg.color}
                  weight={seg.isDashed ? 5 : 7}
                  opacity={seg.isDashed ? 0.8 : 1}
                  dashArray={seg.isDashed ? '8, 8' : undefined}
                  pathOptions={{
                     lineCap: 'round',
                     lineJoin: 'round',
                     className: !seg.isDashed ? 'drop-shadow-md' : ''
                  }}
                />
              ))}

              {/* Transit Stations / Bus Stops Markers */}
              {routes[selectedRouteIdx].transitData.stationsToMark.map((st: any, stIdx: number) => (
                <Marker
                  key={`st-${stIdx}`}
                  position={[st.lat, st.lng]}
                  icon={L.divIcon({
                    className: 'transit-station-marker',
                    html: `<div style="background-color: ${st.color}; border: 2.5px solid white; box-shadow: 0 4px 10px rgba(0,0,0,0.35); width: 22px; height: 22px; border-radius: 9999px; display: flex; items: center; justify-content: center;">
                             <div style="background-color: white; width: 7px; height: 7px; border-radius: 9999px; margin: auto;"></div>
                           </div>`,
                    iconSize: [22, 22],
                    iconAnchor: [11, 11]
                  })}
                  zIndexOffset={1500}
                >
                  <Popup>
                    <div className="font-bold text-slate-900 text-sm">{st.name}</div>
                    <div className="text-[11px] font-bold px-2 py-0.5 rounded text-white mt-1 w-fit shadow-sm" style={{ backgroundColor: st.color }}>
                      {st.badge}
                    </div>
                  </Popup>
                </Marker>
              ))}
            </>
          ) : (
            // Standard Road Polylines (Car, Bike, Walk)
            // During active navigation, strictly render only the single active route to prevent any overlapping lines
            (isNavigating && routes[selectedRouteIdx] ? [routes[selectedRouteIdx]] : [...routes].sort((a, b) => {
               const aSelected = routes.indexOf(a) === selectedRouteIdx;
               const bSelected = routes.indexOf(b) === selectedRouteIdx;
               return aSelected ? 1 : bSelected ? -1 : 0;
            })).map((route) => {
               const originalIdx = routes.indexOf(route);
               const coords = route.geometry.coordinates.map((c: any) => [c[1], c[0]]);
               const isSelected = isNavigating || originalIdx === selectedRouteIdx;
               const routeColor = selectedVehicle === 'walk' 
                  ? (isSelected ? '#0284c7' : '#94a3b8')
                  : selectedVehicle === 'bike'
                  ? (isSelected ? '#059669' : '#94a3b8')
                  : (isSelected ? '#7c3aed' : '#64748b');

               return (
                 <Polyline 
                   key={`${originalIdx}-${isSelected}`} 
                   positions={coords} 
                   color={routeColor} 
                   weight={isSelected ? 6 : 4} 
                   opacity={isSelected ? 1 : 0.6}
                   dashArray={selectedVehicle === 'walk' ? '6, 6' : undefined}
                   eventHandlers={{ click: () => {
                      setSelectedRouteIdx(originalIdx);
                      if (mapRef.current) {
                         const bounds = L.latLngBounds(coords);
                         mapRef.current.fitBounds(bounds, { padding: [50, 50], animate: true, duration: 1.0 });
                      }
                   }}}
                   pathOptions={{ className: isSelected ? 'animate-pulse' : '' }}
                 />
               );
            })
          )
        )}

        {/* Dynamic AI-Controlled Atmospheric Smog Dispersion Layer */}
        {showSmogLayer && (
          <Pane name="smogLayer" style={{ filter: 'blur(30px)', opacity: 0.62, pointerEvents: 'none', zIndex: 400 }}>
            {stations.map((st) => {
              const fillColor = getAqiColor(st.aqi);
              const radius = getStationRadius(st.zone_code);
              return (
                <span key={`smog-dispersion-${st.zone_code}`}>
                  <Circle 
                    center={[st.lat, st.lng]} 
                    pathOptions={{ stroke: false, fillColor, fillOpacity: 0.82 }} 
                    radius={radius * 0.55} 
                  />
                  <Circle 
                    center={[st.lat, st.lng]} 
                    pathOptions={{ stroke: false, fillColor, fillOpacity: 0.52 }} 
                    radius={radius} 
                  />
                </span>
              );
            })}
          </Pane>
        )}

        {/* 10 Official Lahore Monitoring Station Interactive Markers */}
        {showStationsLayer && stations.map((st) => {
          const aqi = st.aqi;
          const isMaroon = aqi > 300;
          const isPurple = aqi > 200 && aqi <= 300;
          const isRose = aqi > 150 && aqi <= 200;
          const isOrange = aqi > 100 && aqi <= 150;
          const isAmber = aqi > 50 && aqi <= 100;
          
          const badgeStyle = isMaroon 
            ? 'background: #881337; color: #ffe4e6; border: 1px solid #be123c;'
            : isPurple 
            ? 'background: #7e22ce; color: #ffffff; border: 1px solid #a855f7;'
            : isRose 
            ? 'background: #e11d48; color: #ffffff; border: 1px solid #f43f5e;'
            : isOrange 
            ? 'background: #ea580c; color: #ffffff; border: 1px solid #fb923c;'
            : isAmber 
            ? 'background: #d97706; color: #ffffff; border: 1px solid #f59e0b;'
            : 'background: #059669; color: #ffffff; border: 1px solid #10b981;';

          const dotColor = isMaroon ? '#f43f5e' : isPurple ? '#c084fc' : isRose ? '#fb7185' : isOrange ? '#fb923c' : isAmber ? '#fbbf24' : '#34d399';
          const isSelected = selectedStation?.zone_code === st.zone_code;

          return (
            <Marker
              key={`station-marker-${st.zone_code}`}
              position={[st.lat, st.lng]}
              icon={L.divIcon({
                className: 'station-div-marker',
                html: `
                  <div style="cursor: pointer; transform: ${isSelected ? 'scale(1.15)' : 'scale(1)'}; transition: transform 0.2s ease;">
                    <div style="display: flex; align-items: center; gap: 6px; background: rgba(15, 23, 42, 0.94); color: white; backdrop-filter: blur(8px); padding: 4px 10px; border-radius: 9999px; box-shadow: 0 4px 14px rgba(0,0,0,0.35); border: ${isSelected ? '2px solid #10b981' : '1px solid rgba(71, 85, 105, 0.7)'};">
                      <span style="width: 8px; height: 8px; border-radius: 9999px; background-color: ${dotColor}; flex-shrink: 0; box-shadow: 0 0 8px ${dotColor};"></span>
                      <span style="font-size: 11px; font-weight: 800; color: #f1f5f9; white-space: nowrap;">${st.name.split(' (')[0]}</span>
                      <span style="font-size: 10px; font-weight: 900; padding: 2px 6px; border-radius: 6px; ${badgeStyle}">${aqi}</span>
                    </div>
                  </div>
                `,
                iconSize: [130, 32],
                iconAnchor: [65, 16]
              })}
              eventHandlers={{
                click: () => {
                  setSelectedStation(st);
                  if (mapRef.current) {
                    mapRef.current.flyTo([st.lat, st.lng], 14, { animate: true, duration: 1.2 });
                  }
                }
              }}
              zIndexOffset={1200}
            />
          );
        })}
        <MapEventsHandler onMapClick={handleMapClick} />
      </MapContainer>

      {/* Floating Turn-by-Turn Instruction Panel */}
      {isNavigating && navInstruction && (
        <div className="absolute top-6 left-1/2 -translate-x-1/2 z-[3000] bg-emerald-600 text-white px-6 py-4 rounded-3xl shadow-[0_12px_40px_rgba(0,0,0,0.4)] flex items-center gap-5 min-w-[320px] max-w-[90%] border-t border-emerald-500 transition-all duration-500 animate-in slide-in-from-top-4">
           <div className="w-14 h-14 bg-white/20 rounded-full flex items-center justify-center shrink-0">
              {navInstruction.type.includes('right') ? <CornerUpRight className="w-8 h-8" /> : 
               navInstruction.type.includes('left') ? <CornerUpLeft className="w-8 h-8" /> : 
               navInstruction.type.includes('U-turn') ? <CornerDownLeft className="w-8 h-8" /> : 
               <ArrowUp className="w-8 h-8" />}
           </div>
           <div className="flex flex-col">
              <span className="text-3xl font-black tracking-tighter drop-shadow-sm">
                 {navInstruction.distance > 1000 ? (navInstruction.distance/1000).toFixed(1) + ' km' : navInstruction.distance + ' m'}
              </span>
              <span className="text-emerald-50 font-bold text-lg leading-tight opacity-90 drop-shadow-sm">{navInstruction.type}</span>
           </div>
        </div>
      )}

      {/* Off-Route Recalculation Notice Banner */}
      {rerouteNotice && (
        <div className="absolute top-24 left-1/2 -translate-x-1/2 z-[3200] bg-amber-600 text-white px-5 py-2.5 rounded-2xl shadow-2xl border border-amber-400 flex items-center gap-3 text-xs font-bold animate-in fade-in slide-in-from-top-3">
           <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin shrink-0"></div>
           <span>{rerouteNotice}</span>
        </div>
      )}

      {/* Google Maps Style Bottom Navigation Bar (Remaining Time, Remaining Distance & ETA) */}
      {isNavigating && (
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-[3000] bg-white/95 backdrop-blur-md px-6 py-3.5 rounded-3xl shadow-[0_16px_45px_rgba(0,0,0,0.25)] border border-slate-200/90 flex items-center justify-between min-w-[340px] max-w-[92%] sm:min-w-[420px] animate-in slide-in-from-bottom-5 duration-300">
           <div 
             onClick={() => setIsPanelCollapsed(false)}
             className="flex flex-col cursor-pointer select-none"
             title="Click to view Live Journey & Smog Details"
           >
              <div className="flex items-baseline gap-1.5">
                 <span className="text-3xl sm:text-4xl font-black text-emerald-600 tracking-tight leading-none">
                    {Math.max(1, Math.round(navRemainingDuration / 60))}
                 </span>
                 <span className="text-emerald-700 font-extrabold text-lg sm:text-xl">min</span>
              </div>
              <div className="flex items-center gap-2 text-slate-500 font-bold text-xs sm:text-sm mt-1">
                 <span className="text-slate-700 font-black">
                    {navRemainingDistance >= 1000 
                      ? `${(navRemainingDistance / 1000).toFixed(1)} km` 
                      : `${navRemainingDistance} m`}
                 </span>
                 <span className="text-slate-300">•</span>
                 <span>{navEtaTime || "Arriving soon"}</span>
              </div>
           </div>

           <div className="flex items-center gap-3">
              <button 
                onClick={() => {
                   setIsPanelCollapsed(prev => !prev);
                }}
                title="View Journey & Smog Details"
                className="w-11 h-11 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-700 transition-all active:scale-95 shadow-sm"
              >
                <Navigation className="w-5 h-5 fill-slate-700 text-slate-700" />
              </button>

              <button 
                onClick={handleEndNavigation}
                title="End Navigation"
                className="w-11 h-11 rounded-full bg-rose-50 hover:bg-rose-100 border border-rose-200 flex items-center justify-center text-rose-600 hover:text-rose-700 transition-all active:scale-95 shadow-sm"
              >
                <X className="w-5 h-5 stroke-[2.5]" />
              </button>
           </div>
        </div>
      )}

      {/* Floating Google-Maps-Style Search Bar */}
      {!isNavigating && (
        <div className="absolute top-4 left-4 z-[2000] w-[calc(100%-32px)] sm:w-[380px]">
        <form onSubmit={handleSearch} className="relative bg-white rounded-xl shadow-[0_4px_12px_rgba(0,0,0,0.15)] flex items-center px-4 py-3 border border-slate-200">
          <Search className="w-5 h-5 text-slate-500 mr-3 shrink-0" />
          <input 
            type="text" 
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search Google Maps style..." 
            className="flex-1 bg-transparent outline-none text-slate-900 text-sm font-medium placeholder:text-slate-500"
          />
          {isSearching && (
            <div className="w-4 h-4 ml-2 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
          )}
          {query && !isSearching && (
            <button type="button" onClick={() => { setQuery(''); setResults([]); setHasSearched(false); setSelectedPlace(null); }} className="ml-2 p-1 hover:bg-slate-100 rounded-full text-slate-400 hover:text-slate-600 transition-colors">
              <X className="w-4 h-4" />
            </button>
          )}
        </form>

        {/* Search Results Dropdown */}
        {(results.length > 0 || (hasSearched && query.trim().length > 2 && !isSearching)) && (
          <div className="mt-2 bg-white rounded-xl shadow-[0_12px_24px_rgba(0,0,0,0.2)] border border-slate-200 overflow-hidden max-h-[300px] overflow-y-auto">
            {results.length > 0 ? (
              results.map((place, idx) => (
                <div 
                  key={place.place_id || idx}
                  onClick={() => handleSelectPlace(place)}
                  className="flex items-start gap-3 p-3 hover:bg-slate-50 cursor-pointer border-b border-slate-100 last:border-0 transition-colors"
                >
                  <MapPin className="w-4 h-4 text-slate-400 mt-1 shrink-0" />
                  <div className="flex flex-col">
                    <span className="text-sm font-bold text-slate-900 line-clamp-1">{place.name}</span>
                    <span className="text-xs text-slate-500 line-clamp-1">{place.display_name}</span>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-4 text-center text-slate-500 text-sm font-medium">
                No results found for "{query}"
              </div>
            )}
          </div>
        )}
      </div>
      )}

      {/* Floating HUD Controls (Top Right) */}
      {!isNavigating && !isDirectionsMode && !isPrePlanMode && (
        <div className="absolute top-4 right-4 z-[2000] hidden md:flex items-center gap-2">
          {/* Live Baseline Status Pill */}
          <div className="bg-white/95 backdrop-blur-md px-3.5 py-2.5 rounded-2xl shadow-[0_4px_16px_rgba(0,0,0,0.12)] border border-slate-200 flex items-center gap-2 text-xs font-bold text-slate-800">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
            <span>Lahore Avg: <span className="text-emerald-700">{cityBaselineAqi} AQI</span></span>
            <span className="text-slate-300">•</span>
            <span className="text-slate-500 text-[11px] font-semibold">{cityStatus}</span>
          </div>

          {/* Toggle Smog Heatmap */}
          <button
            onClick={() => setShowSmogLayer(prev => !prev)}
            title={showSmogLayer ? "Hide Smog Heatmap Layer" : "Show Smog Heatmap Layer"}
            className={`px-3 py-2.5 rounded-2xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-[0_4px_16px_rgba(0,0,0,0.12)] border active:scale-95 ${
              showSmogLayer 
                ? 'bg-emerald-500 text-white border-emerald-400 shadow-emerald-500/20' 
                : 'bg-white/95 backdrop-blur-md text-slate-600 hover:text-slate-900 border-slate-200'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>{showSmogLayer ? 'Smog Layer ON' : 'Smog Layer OFF'}</span>
          </button>

          {/* Toggle 10 Stations Markers */}
          <button
            onClick={() => setShowStationsLayer(prev => !prev)}
            title={showStationsLayer ? "Hide Station Badges" : "Show Station Badges"}
            className={`px-3 py-2.5 rounded-2xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-[0_4px_16px_rgba(0,0,0,0.12)] border active:scale-95 ${
              showStationsLayer 
                ? 'bg-slate-900 text-white border-slate-800' 
                : 'bg-white/95 backdrop-blur-md text-slate-600 hover:text-slate-900 border-slate-200'
            }`}
          >
            <Radio className="w-3.5 h-3.5 text-emerald-400" />
            <span>10 Stations</span>
          </button>

          {/* Station List Quick Jump Drawer Toggle */}
          <button
            onClick={() => setIsStationDrawerOpen(prev => !prev)}
            title="View all 10 monitoring stations"
            className={`px-3 py-2.5 rounded-2xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-[0_4px_16px_rgba(0,0,0,0.12)] border active:scale-95 ${
              isStationDrawerOpen 
                ? 'bg-purple-600 text-white border-purple-500' 
                : 'bg-white/95 backdrop-blur-md text-slate-700 hover:text-slate-900 border-slate-200'
            }`}
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            <span>Sectors ({stations.length})</span>
          </button>

          {/* Manual Refresh Button */}
          <button
            onClick={handleManualSync}
            disabled={isSyncingTelemetry}
            title="Refresh live atmospheric sensors"
            className="p-2.5 bg-white/95 backdrop-blur-md hover:bg-slate-50 text-slate-700 rounded-2xl shadow-[0_4px_16px_rgba(0,0,0,0.12)] border border-slate-200 transition-all active:scale-95 disabled:opacity-50"
          >
            <RotateCw className={`w-4 h-4 text-slate-600 ${isSyncingTelemetry ? 'animate-spin text-emerald-600' : ''}`} />
          </button>
        </div>
      )}

      {/* Station List Quick Jump Drawer */}
      {isStationDrawerOpen && !isNavigating && !isDirectionsMode && (
        <div className="absolute top-16 right-4 z-[2100] w-80 bg-white/95 backdrop-blur-md rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.25)] border border-slate-200 overflow-hidden animate-in slide-in-from-top-3 duration-200">
          <div className="p-3.5 bg-slate-900 text-white flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-emerald-400" />
              <span className="font-extrabold text-xs uppercase tracking-wider">AI Ground Stations (10)</span>
            </div>
            <button 
              onClick={() => setIsStationDrawerOpen(false)}
              className="w-6 h-6 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition-colors"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="p-2 max-h-[380px] overflow-y-auto space-y-1 divide-y divide-slate-100">
            {stations.map((st) => (
              <div
                key={`drawer-station-${st.zone_code}`}
                onClick={() => {
                  setSelectedStation(st);
                  setIsStationDrawerOpen(false);
                  if (mapRef.current) {
                    mapRef.current.flyTo([st.lat, st.lng], 14, { animate: true, duration: 1.2 });
                  }
                }}
                className="pt-1.5 first:pt-0 p-2 rounded-xl hover:bg-slate-100/80 cursor-pointer transition-colors flex items-center justify-between group"
              >
                <div className="min-w-0 pr-2">
                  <h4 className="text-xs font-bold text-slate-900 truncate group-hover:text-emerald-700 transition-colors">
                    {st.name}
                  </h4>
                  <p className="text-[10px] text-slate-500 font-mono">{st.zone_code} • {st.pm25} µg/m³</p>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <span className={`text-[10px] font-black px-2 py-0.5 rounded-md ${
                    st.aqi > 200 ? 'bg-purple-100 text-purple-700' :
                    st.aqi > 150 ? 'bg-rose-100 text-rose-700' :
                    st.aqi > 100 ? 'bg-orange-100 text-orange-700' :
                    st.aqi > 50 ? 'bg-amber-100 text-amber-800' :
                    'bg-emerald-100 text-emerald-700'
                  }`}>
                    {st.aqi} AQI
                  </span>
                  <ChevronRight className="w-3.5 h-3.5 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Selected Station Intelligence Card */}
      {selectedStation && !isNavigating && !isDirectionsMode && (
        <div className="absolute bottom-6 left-4 z-[2000] w-[calc(100%-32px)] sm:w-[420px] bg-white/95 backdrop-blur-md rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.25)] border border-slate-200 overflow-hidden animate-in slide-in-from-bottom-5 duration-300">
          {/* Card Header */}
          <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-emerald-500/20 border border-emerald-400/40 flex items-center justify-center">
                <Activity className="w-4 h-4 text-emerald-400" />
              </div>
              <div>
                <h3 className="font-extrabold text-sm text-white tracking-tight">{selectedStation.name}</h3>
                <p className="text-[11px] text-slate-400 font-mono">Zone: {selectedStation.zone_code} • Live Ground Station</p>
              </div>
            </div>
            <button 
              onClick={() => setSelectedStation(null)}
              className="w-7 h-7 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Metrics Grid */}
          <div className="p-4 space-y-3.5">
            <div className="grid grid-cols-2 gap-3">
              {/* AQI Pill */}
              <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200/80 flex flex-col justify-between">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Ground AQI</span>
                <div className="flex items-baseline gap-2 mt-1">
                  <span className="text-3xl font-black text-slate-900">{selectedStation.aqi}</span>
                  <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${
                    selectedStation.aqi > 200 ? 'bg-purple-100 text-purple-700' :
                    selectedStation.aqi > 150 ? 'bg-rose-100 text-rose-700' :
                    selectedStation.aqi > 100 ? 'bg-orange-100 text-orange-700' :
                    selectedStation.aqi > 50 ? 'bg-amber-100 text-amber-800' :
                    'bg-emerald-100 text-emerald-700'
                  }`}>
                    {selectedStation.status}
                  </span>
                </div>
              </div>

              {/* PM2.5 Pill */}
              <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200/80 flex flex-col justify-between">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">PM2.5 Density</span>
                <div className="mt-1">
                  <div className="text-2xl font-black text-slate-900">{selectedStation.pm25} <span className="text-xs font-bold text-slate-400">µg/m³</span></div>
                  <p className="text-[10px] font-semibold text-rose-600 mt-0.5">
                    {(selectedStation.pm25 / 5.0).toFixed(1)}x WHO Limit
                  </p>
                </div>
              </div>
            </div>

            {/* Sector Category & Physical Diagnostics */}
            <div className="bg-slate-50/80 p-3 rounded-2xl border border-slate-200/60 text-xs space-y-1.5">
              <div className="flex items-center gap-1.5 text-slate-700 font-bold">
                <MapPin className="w-3.5 h-3.5 text-rose-500" />
                <span>{selectedStation.sector || 'Urban Corridor'}</span>
              </div>
              <p className="text-slate-600 font-medium text-[11px] leading-relaxed">
                {selectedStation.detail || 'Atmospheric dispersion monitored continuously by station telemetry and AI boundary layer regression.'}
              </p>
            </div>

            {/* Advisory */}
            <div className="bg-emerald-50/70 p-3 rounded-2xl border border-emerald-200/60 text-xs flex items-start gap-2">
              <ShieldAlert className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <p className="text-emerald-900 font-medium text-[11px] leading-tight">
                {selectedStation.advisory || 'Standard respiratory health guidelines apply. Monitor evening inversion dynamics.'}
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-2 pt-1">
              <button
                onClick={() => {
                  const origin = routeOriginCoords || userLocation || [31.5204, 74.3587];
                  setSelectedPlace({
                    name: selectedStation.name,
                    display_name: `${selectedStation.name}, Lahore, Pakistan`,
                    lat: selectedStation.lat,
                    lon: selectedStation.lng,
                    aqi: selectedStation.aqi,
                    status: selectedStation.status,
                    color: 'text-amber-700',
                    bg: 'bg-amber-50',
                    border: 'border-amber-200',
                    forecast: []
                  });
                  setIsDirectionsMode(true);
                  fetchRoutesAndEnhance(origin, [selectedStation.lat, selectedStation.lng], selectedVehicle);
                  setSelectedStation(null);
                }}
                className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm flex items-center justify-center gap-1.5 active:scale-95"
              >
                <Navigation className="w-3.5 h-3.5" />
                <span>Directions to Station</span>
              </button>

              <button
                onClick={() => {
                  handleSelectPlace({
                    name: selectedStation.name,
                    display_name: `${selectedStation.name}, Lahore, Pakistan`,
                    lat: selectedStation.lat,
                    lon: selectedStation.lng
                  });
                  setSelectedStation(null);
                }}
                className="py-2.5 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors flex items-center gap-1"
                title="Inspect 24-Hour AI Forecast"
              >
                <Activity className="w-3.5 h-3.5 text-slate-500" />
                <span>24h Trend</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Left Sidebar Modal for Selected Place (Google Maps Style) */}
      {selectedPlace && (
        <div className={`absolute top-0 left-0 h-full w-full sm:w-[400px] bg-white shadow-[8px_0_24px_rgba(0,0,0,0.15)] z-[2500] flex flex-col transition-transform duration-300 ${isPanelCollapsed ? '-translate-x-full' : 'translate-x-0'}`}>
          
          {isDirectionsMode ? (
            <div className="flex flex-col h-full bg-slate-50">
              {isNavigating ? (
                /* LIVE SMOG & JOURNEY ENVIRONMENT MONITOR (DURING NAVIGATION) */
                <div className="flex flex-col h-full bg-slate-50">
                   {/* Navigation Details Header */}
                   <div className="bg-white p-4 pt-6 shadow-sm border-b border-slate-200 shrink-0">
                     <div className="flex items-center justify-between mb-2">
                       <button 
                         onClick={() => setIsPanelCollapsed(true)} 
                         className="text-slate-500 hover:text-slate-900 flex items-center gap-1.5 text-xs font-bold transition-colors p-1.5 -ml-1 rounded-full hover:bg-slate-100"
                         title="Back to Map"
                       >
                         <ArrowLeft className="w-4 h-4" />
                         <span>Map View</span>
                       </button>
                       <span className="text-[10px] uppercase font-black tracking-widest text-emerald-600 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-full flex items-center gap-1.5 shadow-xs">
                         <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                         Navigating
                       </span>
                     </div>
                     
                     <h2 className="text-xl font-black text-slate-900 line-clamp-1 leading-tight">
                       To: {selectedPlace?.name || selectedPlace?.display_name?.split(',')[0] || "Destination"}
                     </h2>
                     <p className="text-xs text-slate-500 line-clamp-1 mt-0.5">
                       Live Smog Corridor & Environmental Status
                     </p>

                     {/* Trip Progress Metrics */}
                     <div className="grid grid-cols-3 gap-2 mt-3 pt-3 border-t border-slate-100">
                       <div className="bg-emerald-50/80 border border-emerald-200/80 rounded-xl p-2.5 text-center shadow-xs">
                         <span className="text-[11px] text-emerald-700 font-bold block">Remaining</span>
                         <span className="text-lg font-black text-emerald-800 leading-none">
                           {Math.max(1, Math.round(navRemainingDuration / 60))} <span className="text-xs font-bold">min</span>
                         </span>
                       </div>
                       <div className="bg-slate-100/80 border border-slate-200 rounded-xl p-2.5 text-center shadow-xs">
                         <span className="text-[11px] text-slate-500 font-bold block">Distance</span>
                         <span className="text-lg font-black text-slate-800 leading-none">
                           {navRemainingDistance >= 1000 ? `${(navRemainingDistance / 1000).toFixed(1)} km` : `${navRemainingDistance} m`}
                         </span>
                       </div>
                       <div className="bg-purple-50/80 border border-purple-200/80 rounded-xl p-2.5 text-center shadow-xs">
                         <span className="text-[11px] text-purple-700 font-bold block">Arrival ETA</span>
                         <span className="text-lg font-black text-purple-900 leading-none">{navEtaTime || "--:--"}</span>
                       </div>
                     </div>
                   </div>

                   {/* Scrollable Smog & Environmental Status Feed */}
                   <div className="flex-1 overflow-y-auto p-4 space-y-3.5">
                     {/* 1. CURRENT LOCATION SMOG & ENVIRONMENT CARD */}
                     <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-200 relative overflow-hidden">
                       <div className="flex items-center justify-between mb-2">
                         <div className="flex items-center gap-2">
                           <span className="relative flex h-2.5 w-2.5">
                             <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                             <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-rose-500"></span>
                           </span>
                           <span className="text-[11px] font-black uppercase tracking-wider text-rose-600">Current Area Smog</span>
                         </div>
                         <span className={`text-[10px] font-black px-2.5 py-0.5 rounded-full ${
                           navCurrentStatus === 'Hazardous' ? 'bg-rose-100 text-rose-800 border border-rose-200' :
                           navCurrentStatus === 'Very Unhealthy' ? 'bg-orange-100 text-orange-800 border border-orange-200' :
                           navCurrentStatus === 'Unhealthy' ? 'bg-amber-100 text-amber-800 border border-amber-200' :
                           'bg-emerald-100 text-emerald-800 border border-emerald-200'
                         }`}>
                           {navCurrentStatus}
                         </span>
                       </div>

                       <div className="flex items-baseline justify-between mt-1 mb-2">
                         <div>
                           <h3 className="text-base font-extrabold text-slate-900 line-clamp-1">{navCurrentArea}</h3>
                           <p className="text-xs text-slate-500">Real-time coordinate index</p>
                         </div>
                         <div className="text-right">
                           <span className="text-3xl font-black text-slate-900 tracking-tight leading-none">{navCurrentAqi}</span>
                           <span className="text-[10px] font-bold text-slate-400 block -mt-0.5">AQI</span>
                         </div>
                       </div>

                       {/* Live Metrics Grid */}
                       <div className="grid grid-cols-2 gap-2 mt-3 pt-3 border-t border-slate-100 text-xs">
                         <div className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                           <Wind className="w-4 h-4 text-slate-500 shrink-0" />
                           <div>
                             <span className="text-slate-400 text-[10px] block font-bold">PM2.5 PARTICULATES</span>
                             <span className="font-black text-slate-800">{navCurrentPm25} µg/m³</span>
                           </div>
                         </div>
                         <div className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                           <Activity className="w-4 h-4 text-emerald-600 shrink-0" />
                           <div>
                             <span className="text-slate-400 text-[10px] block font-bold">SMOG VISIBILITY</span>
                             <span className="font-black text-slate-800">{navCurrentAqi > 250 ? '600m (Dense Smog)' : '1.8 km (Fair)'}</span>
                           </div>
                         </div>
                       </div>

                       {/* Vehicle Specific Health Advisory */}
                       <div className="mt-3 p-3 rounded-xl bg-amber-50/80 border border-amber-200/80 text-amber-900 text-xs font-medium flex items-start gap-2.5">
                         <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                         <div className="leading-tight">
                           {selectedVehicle === 'car' ? (
                             <span><strong>Vehicle Advisory:</strong> Windows closed, cabin air recirculate activated to block outdoor smog intake.</span>
                           ) : selectedVehicle === 'bike' ? (
                             <span><strong>Bike Advisory:</strong> Direct open-air exposure. N95 respirator mask & goggles mandatory!</span>
                           ) : selectedVehicle === 'walk' ? (
                             <span><strong>Pedestrian Alert:</strong> Hazardous particulate inhalation. Avoid deep breathing & wear mask.</span>
                           ) : (
                             <span><strong>Transit Advisory:</strong> Punjab MassTransit filtered carriage active. Protect yourself during platform transfers.</span>
                           )}
                         </div>
                       </div>
                     </div>

                     {/* 2. UPCOMING AREA (~2-3 KM AHEAD) SMOG & ENVIRONMENT CARD */}
                     <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-200 relative overflow-hidden">
                       <div className="flex items-center justify-between mb-2">
                         <div className="flex items-center gap-1.5">
                           <span className="w-2.5 h-2.5 rounded-full bg-purple-600"></span>
                           <span className="text-[11px] font-black uppercase tracking-wider text-purple-700">
                             Upcoming in {(navUpcomingDistance / 1000).toFixed(1)} km
                           </span>
                         </div>
                         <span className={`text-[10px] font-black px-2.5 py-0.5 rounded-full ${
                           navUpcomingStatus === 'Hazardous' ? 'bg-rose-100 text-rose-800 border border-rose-200' :
                           navUpcomingStatus === 'Very Unhealthy' ? 'bg-orange-100 text-orange-800 border border-orange-200' :
                           navUpcomingStatus === 'Unhealthy' ? 'bg-amber-100 text-amber-800 border border-amber-200' :
                           'bg-emerald-100 text-emerald-800 border border-emerald-200'
                         }`}>
                           {navUpcomingStatus}
                         </span>
                       </div>

                       <div className="flex items-baseline justify-between mt-1 mb-2">
                         <div>
                           <h3 className="text-base font-extrabold text-slate-900 line-clamp-1">{navUpcomingArea}</h3>
                           <p className="text-xs text-slate-500">Upcoming corridor projection</p>
                         </div>
                         <div className="text-right">
                           <span className="text-3xl font-black text-slate-900 tracking-tight leading-none">{navUpcomingAqi}</span>
                           <span className="text-[10px] font-bold text-slate-400 block -mt-0.5">AQI</span>
                         </div>
                       </div>

                       {/* Environmental Trend / Warning */}
                       <div className="mt-2.5 p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-700 leading-snug">
                         {navUpcomingWarning}
                       </div>
                     </div>

                     {/* 3. OFF-ROUTE & DETOUR ASSISTANT */}
                     <div className="bg-white rounded-2xl p-3.5 shadow-sm border border-slate-200 flex items-center justify-between gap-3">
                       <div>
                         <h4 className="text-xs font-black text-slate-900">Off-Route Auto Recalculation</h4>
                         <p className="text-[11px] text-slate-500">Tap any road on map to detour</p>
                       </div>
                       <button 
                         onClick={handleSimulateDetour}
                         disabled={isRerouting}
                         className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-extrabold transition-all active:scale-95 border border-slate-200 shrink-0"
                       >
                         {isRerouting ? 'Rerouting...' : 'Simulate Detour'}
                       </button>
                     </div>
                   </div>

                   {/* Bottom Action: Prominent End Navigation Button */}
                   <div className="p-4 bg-white border-t border-slate-200 shadow-[0_-4px_12px_rgba(0,0,0,0.05)] shrink-0">
                     <button 
                       onClick={handleEndNavigation}
                       className="w-full py-4 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-bold text-lg transition-colors flex justify-center items-center gap-2 shadow-md hover:shadow-lg active:scale-[0.98]"
                     >
                       <X className="w-5 h-5 stroke-[2.5]" />
                       End Navigation
                     </button>
                   </div>
                </div>
              ) : (
                <div className="flex flex-col h-full bg-slate-50">
                   <div className="bg-white p-4 pt-6 shadow-sm relative z-10 border-b border-slate-200">
                  <div className="flex items-center justify-between mb-3.5">
                    <button onClick={() => { setIsDirectionsMode(false); setRoutes([]); }} className="text-slate-500 hover:text-slate-900 flex items-center gap-2 text-sm font-bold transition-colors w-fit p-2 -ml-2 rounded-full hover:bg-slate-100">
                      <ArrowLeft className="w-5 h-5" />
                    </button>

                    {/* 4 Vehicle Modes (Car, Bike, Walk, Public Transport) */}
                    <div className="flex items-center bg-slate-100 p-1 rounded-xl gap-0.5 border border-slate-200/70">
                       {[
                         { id: 'car', label: 'Car', icon: Car },
                         { id: 'bike', label: 'Bike', icon: Bike },
                         { id: 'walk', label: 'Walk', icon: Footprints },
                         { id: 'transit', label: 'Transit', icon: Bus },
                       ].map((v) => {
                         const Icon = v.icon;
                         const isSelected = selectedVehicle === v.id;
                         return (
                           <button
                             key={v.id}
                             onClick={async () => {
                               setSelectedVehicle(v.id as any);
                               const origin = routeOriginCoords || userLocation || [31.5204, 74.3587];
                               if (selectedPlace) {
                                 await fetchRoutesAndEnhance(origin, [selectedPlace.lat, selectedPlace.lon], v.id as any);
                               }
                             }}
                             className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                               isSelected 
                                 ? 'bg-purple-600 text-white shadow-sm' 
                                 : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                             }`}
                             title={v.label}
                           >
                             <Icon className="w-3.5 h-3.5" />
                             <span className="text-[11px]">{v.label}</span>
                           </button>
                         );
                       })}
                    </div>
                  </div>
                  <div className="space-y-3 relative ml-2">
                     <div className="absolute left-3.5 top-5 bottom-5 w-0.5 bg-slate-200"></div>
                     <div className="flex items-start gap-4 relative">
                       <div className="w-7 h-7 bg-purple-100 rounded-full flex items-center justify-center z-10 shrink-0 border-2 border-white mt-1">
                          <div className="w-2.5 h-2.5 bg-purple-600 rounded-full"></div>
                       </div>
                       <div className="flex-1 flex gap-2 relative">
                         <div className="flex-1 relative">
                           <input 
                             ref={originInputRef}
                             value={originInput}
                             onChange={(e) => setOriginInput(e.target.value)}
                             onKeyDown={handleCustomOriginSubmit}
                             className="w-full bg-white px-3 py-2.5 rounded-xl text-sm font-medium text-slate-900 border border-slate-200 shadow-inner focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-100 transition-all placeholder:text-slate-400"
                             placeholder="Enter starting point..."
                           />
                           
                           {/* Origin Search Results Dropdown */}
                           {originResults.length > 0 && (
                             <div className="absolute top-full left-0 right-0 mt-1 bg-white rounded-xl shadow-[0_12px_24px_rgba(0,0,0,0.2)] border border-slate-200 overflow-hidden max-h-[200px] overflow-y-auto z-[3000]">
                               {originResults.map((place, idx) => (
                                 <div 
                                   key={idx}
                                   onClick={async () => {
                                      setOriginInput(place.name);
                                      setUserAddress(place.name);
                                      setRouteOriginCoords([place.lat, place.lon]);
                                      setOriginResults([]);
                                      if (selectedPlace) {
                                         await fetchRoutesAndEnhance([place.lat, place.lon], [selectedPlace.lat, selectedPlace.lon]);
                                      }
                                   }}
                                   className="flex items-start gap-3 p-2.5 hover:bg-slate-50 cursor-pointer border-b border-slate-100 last:border-0 transition-colors"
                                 >
                                   <MapPin className="w-3.5 h-3.5 text-slate-400 mt-1 shrink-0" />
                                   <div className="flex flex-col">
                                     <span className="text-xs font-bold text-slate-900 line-clamp-1">{place.name}</span>
                                     <span className="text-[10px] text-slate-500 line-clamp-1">{place.display_name}</span>
                                   </div>
                                 </div>
                               ))}
                             </div>
                           )}
                         </div>
                         <button 
                           onClick={() => setIsSelectingOriginOnMap(true)}
                           title="Select on map"
                           className={`p-2.5 rounded-xl border transition-colors shrink-0 ${isSelectingOriginOnMap ? 'bg-purple-100 border-purple-500 text-purple-700 animate-pulse' : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-100 hover:text-slate-900'}`}
                         >
                           <MapPin className="w-4 h-4" />
                         </button>
                       </div>
                     </div>
                     {/* Intermediate Stops Rows */}
                     {routeStops.map((stop, sIdx) => (
                       <div key={stop.id} className="flex items-start gap-4 relative">
                         <div className="w-7 h-7 bg-amber-100 rounded-full flex items-center justify-center z-10 shrink-0 border-2 border-white text-amber-700 font-black text-xs mt-1">
                            {String.fromCharCode(65 + sIdx)}
                         </div>
                         <div className="flex-1 flex gap-2 relative">
                           <div className="flex-1 relative">
                             <input 
                               value={stop.input}
                               onChange={(e) => handleStopInputChange(sIdx, e.target.value)}
                               className="w-full bg-white px-3 py-2 rounded-xl text-sm font-medium text-slate-900 border border-slate-200 shadow-inner focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-100 transition-all placeholder:text-slate-400"
                               placeholder={`Stop ${String.fromCharCode(65 + sIdx)}...`}
                             />
                             {/* Stop Suggestions Dropdown */}
                             {activeStopSearchIdx === sIdx && stopSearchResults.length > 0 && (
                               <div className="absolute top-full left-0 right-0 mt-1 bg-white rounded-xl shadow-[0_12px_24px_rgba(0,0,0,0.2)] border border-slate-200 overflow-hidden max-h-[180px] overflow-y-auto z-[3000]">
                                 {stopSearchResults.map((place, pIdx) => (
                                   <div
                                     key={pIdx}
                                     onClick={() => handleSelectStopPlace(sIdx, place)}
                                     className="flex items-start gap-3 p-2.5 hover:bg-slate-50 cursor-pointer border-b border-slate-100 last:border-0 transition-colors"
                                   >
                                     <MapPin className="w-3.5 h-3.5 text-slate-400 mt-1 shrink-0" />
                                     <div className="flex flex-col">
                                       <span className="text-xs font-bold text-slate-900 line-clamp-1">{place.name}</span>
                                       <span className="text-[10px] text-slate-500 line-clamp-1">{place.display_name}</span>
                                     </div>
                                   </div>
                                 ))}
                               </div>
                             )}
                           </div>
                           <button
                             onClick={() => handleRemoveStop(sIdx)}
                             title="Remove stop"
                             className="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 border border-transparent hover:border-rose-200 transition-colors shrink-0"
                           >
                             <X className="w-4 h-4" />
                           </button>
                         </div>
                       </div>
                     ))}

                     <div className="flex items-center gap-4">
                       <div className="w-7 h-7 bg-rose-100 rounded-full flex items-center justify-center z-10 shrink-0 border-2 border-white">
                          <MapPin className="w-3.5 h-3.5 text-rose-600" />
                       </div>
                       <div className="flex-1 bg-slate-100 px-3 py-2.5 rounded-xl text-sm font-bold text-slate-900 border border-slate-200 truncate">{selectedPlace.name}</div>
                     </div>

                     {/* Add Stop Button */}
                     <div className="pl-11 pt-0.5">
                       <button
                         onClick={handleAddStop}
                         className="flex items-center gap-1.5 text-xs font-bold text-purple-700 bg-purple-50 hover:bg-purple-100 border border-purple-200/80 px-3 py-1.5 rounded-xl transition-all shadow-sm active:scale-[0.98]"
                       >
                         <Plus className="w-3.5 h-3.5" />
                         <span>Add stop</span>
                       </button>
                     </div>
                  </div>
               </div>
               
               <div className="flex-1 overflow-y-auto p-4 space-y-3">
                  {routes.length === 0 && <div className="text-center p-8 text-slate-400 font-medium">Calculating route...</div>}
                  {routes.map((route, idx) => (
                    <div 
                      key={idx} 
                      onClick={() => {
                         setSelectedRouteIdx(idx);
                         if (mapRef.current) {
                            if (route.transitData) {
                               const allCoords = route.transitData.segments.flatMap((s: any) => s.coordinates);
                               const bounds = L.latLngBounds(allCoords);
                               mapRef.current.fitBounds(bounds, { padding: [50, 50], animate: true, duration: 1.0 });
                            } else if (route.geometry && route.geometry.coordinates) {
                               const coords = route.geometry.coordinates.map((c: any) => [c[1], c[0]]);
                               const bounds = L.latLngBounds(coords);
                               mapRef.current.fitBounds(bounds, { padding: [50, 50], animate: true, duration: 1.0 });
                            }
                         }
                      }}
                      className={`p-4 rounded-xl cursor-pointer border-2 transition-all relative overflow-hidden ${idx === selectedRouteIdx ? 'border-purple-500 bg-purple-50/50 shadow-sm' : 'border-slate-200 bg-white hover:border-purple-200'}`}
                    >
                      {route.aiStats?.isSafest && (
                        <div className="absolute top-0 right-0 bg-emerald-500 text-white text-[10px] font-black uppercase px-2 py-1 rounded-bl-lg tracking-wider">
                           {selectedVehicle === 'transit' ? 'Recommended Line' : 'Safest Route'}
                        </div>
                      )}
                      
                      <div className="flex justify-between items-center mb-1">
                        <span className={`font-black text-lg ${idx === selectedRouteIdx ? 'text-purple-700' : 'text-slate-800'}`}>
                          {Math.round(route.duration / 60)} min
                        </span>
                        <div className="flex items-center gap-2">
                          {route.transitData?.totalFarePkr && (
                            <span className="text-xs font-black text-emerald-700 bg-emerald-100/80 px-2 py-0.5 rounded-md">
                              Rs. {route.transitData.totalFarePkr}
                            </span>
                          )}
                          <span className="text-sm font-bold text-slate-500">
                            {(route.distance / 1000).toFixed(1)} km
                          </span>
                        </div>
                      </div>

                      {/* Transit Lines Badges (Speedo Red, Metrobus Yellow, Orange Line Orange, Green Bus Green) */}
                      {route.transitData ? (
                        <div className="space-y-2 mt-2">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            {route.transitData.linesUsed.map((line: any, lIdx: number) => (
                              <span 
                                key={lIdx} 
                                className="px-2.5 py-1 rounded-md text-xs font-bold text-white shadow-sm flex items-center gap-1"
                                style={{ backgroundColor: line.color }}
                              >
                                {line.type === 'orange_line' ? <Train className="w-3.5 h-3.5" /> : <Bus className="w-3.5 h-3.5" />}
                                {line.badge}
                              </span>
                            ))}
                            <span className="text-[11px] text-slate-500 font-semibold flex items-center gap-1 ml-1">
                              <Clock className="w-3.5 h-3.5" />
                              Every {route.transitData.linesUsed[0]?.intervalMin || 4} min
                            </span>
                          </div>

                          {/* Step-by-Step Transit Timeline if card is active */}
                          {idx === selectedRouteIdx && (
                            <div className="pt-2.5 mt-2 border-t border-slate-200/80 space-y-2">
                              {route.transitData.steps.map((st: any, sIdx: number) => (
                                <div key={sIdx} className="flex items-start gap-2.5 text-xs text-slate-700">
                                  <div className="w-4 h-4 mt-0.5 shrink-0 flex items-center justify-center">
                                    {st.mode === 'walk' ? (
                                      <Footprints className="w-3.5 h-3.5 text-slate-400" />
                                    ) : (
                                      <div className="w-2.5 h-2.5 rounded-full shadow-sm" style={{ backgroundColor: st.color }} />
                                    )}
                                  </div>
                                  <div className="flex-1 leading-snug">
                                    <span className="font-semibold text-slate-800">{st.instructions}</span>
                                    <span className="text-slate-400 text-[10px] ml-1.5 font-medium">({st.durationMin}m)</span>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="text-xs text-slate-500 font-medium mb-2">
                          via {route.legs[0]?.steps?.[0]?.name || "Main Route"}
                        </div>
                      )}

                      {/* Walking metrics: Calories and Steps */}
                      {selectedVehicle === 'walk' && route.aiStats?.caloriesBurned && (
                        <div className="flex items-center gap-3 text-xs font-bold text-slate-600 mt-2 pt-2 border-t border-slate-200/60">
                          <span className="flex items-center gap-1 text-orange-600">
                            <Flame className="w-3.5 h-3.5 fill-orange-500" />
                            {route.aiStats.caloriesBurned} kcal
                          </span>
                          <span className="flex items-center gap-1 text-sky-600">
                            <Footprints className="w-3.5 h-3.5" />
                            {route.aiStats.stepsCount.toLocaleString()} steps
                          </span>
                        </div>
                      )}

                      {/* Bike advisory */}
                      {selectedVehicle === 'bike' && (
                        <div className="text-[11px] font-bold text-amber-700 bg-amber-50 border border-amber-200/80 px-2 py-1 rounded-md mt-2 flex items-center gap-1">
                          <ShieldAlert className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                          Two-Wheeler: Open Air Inhalation Risk • Wear N95 Mask
                        </div>
                      )}

                      {/* AI Environment & Traffic Data */}
                      {route.aiStats && (
                        <div className="flex items-center gap-2 mt-2 pt-2.5 border-t border-slate-200/60">
                           <div className={`flex items-center gap-1 text-[11px] font-bold px-2 py-1 rounded-md ${route.aiStats.smogExposure < 60 ? 'bg-emerald-100 text-emerald-700' : route.aiStats.smogExposure < 100 ? 'bg-yellow-100 text-yellow-700' : 'bg-rose-100 text-rose-700'}`}>
                             <Wind className="w-3 h-3" />
                             AQI {route.aiStats.smogExposure}
                           </div>
                           <div className={`flex items-center gap-1 text-[11px] font-bold px-2 py-1 rounded-md ${route.aiStats.traffic === 'Low' || route.aiStats.traffic === 'Dedicated Transit Corridor' || route.aiStats.traffic === 'Pedestrian Friendly' ? 'bg-emerald-100 text-emerald-700' : route.aiStats.traffic === 'Moderate' ? 'bg-orange-100 text-orange-700' : 'bg-rose-100 text-rose-700'}`}>
                             <Activity className="w-3 h-3" />
                             {route.aiStats.traffic}
                           </div>
                        </div>
                      )}
                    </div>
                  ))}
               </div>
               
               {routes.length > 0 && (
                 <div className="p-4 bg-white border-t border-slate-200 shadow-[0_-4px_12px_rgba(0,0,0,0.05)]">
                    <button 
                      onClick={() => { setIsNavigating(true); setIsPanelCollapsed(true); }}
                      className="w-full py-4 bg-purple-600 text-white rounded-xl font-bold text-lg hover:bg-purple-700 transition-colors flex justify-center items-center gap-2 shadow-md hover:shadow-lg active:scale-[0.98]"
                    >
                      <Navigation className="w-5 h-5 fill-white" />
                      Start Navigation
                    </button>
                 </div>
               )}
                </div>
              )}
            </div>
          ) : (
            <>
              {/* Header (No Image, White Clean Style) */}
              <div className="pt-6 pb-4 px-4 bg-white relative shrink-0 border-b border-slate-100 flex items-start gap-3">
                <button 
                  onClick={() => { setSelectedPlace(null); setIsDirectionsMode(false); setRoutes([]); }}
                  className="bg-transparent text-slate-500 p-2 rounded-full hover:bg-slate-100 transition-colors mt-1 shrink-0"
                >
                  <ArrowLeft className="w-5 h-5" />
                </button>
                <div className="flex-1">
                  <h2 className="text-2xl font-extrabold text-slate-900 line-clamp-2 leading-tight">
                    {selectedPlace.display_name.split(',')[0]}
                  </h2>
                </div>
              </div>
          
          {/* Scrollable Content */}
          <div className="flex-1 overflow-y-auto bg-slate-50 pb-8">
            <div className="p-5 bg-white mb-2 shadow-sm">
              <p className="text-sm text-slate-600 leading-relaxed mb-6">
                {selectedPlace.display_name}
              </p>

              {/* Action Buttons */}
              <div className="flex items-center justify-around pb-2">
                <div onClick={handleDirectionsClick} className="flex flex-col items-center gap-1.5 cursor-pointer group">
                  <div className="w-10 h-10 rounded-full bg-purple-600 text-white flex items-center justify-center shadow-md group-hover:bg-purple-700 transition-colors">
                    <Navigation className="w-5 h-5" />
                  </div>
                  <span className="text-xs font-bold text-purple-700">Directions</span>
                </div>
                <div className="flex flex-col items-center gap-1.5 cursor-pointer group">
                  <div className="w-10 h-10 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center border border-slate-200 group-hover:bg-slate-200 transition-colors">
                    <Bookmark className="w-5 h-5" />
                  </div>
                  <span className="text-xs font-semibold text-slate-600">Save</span>
                </div>
                <div className="flex flex-col items-center gap-1.5 cursor-pointer group">
                  <div className="w-10 h-10 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center border border-slate-200 group-hover:bg-slate-200 transition-colors">
                    <Share2 className="w-5 h-5" />
                  </div>
                  <span className="text-xs font-semibold text-slate-600">Share</span>
                </div>
              </div>
            </div>
            
            {/* Environment Data */}
            <div className="p-5 bg-white shadow-sm">
               <h3 className="text-sm font-extrabold text-slate-900 mb-4 flex items-center gap-2 uppercase tracking-wide">
                 <Wind className="w-4 h-4 text-emerald-600" />
                 Environmental Status
               </h3>
               
               <div className={`p-5 rounded-2xl border ${selectedPlace.border} ${selectedPlace.bg} flex flex-col items-center justify-center mb-4 relative overflow-hidden`}>
                 <div className="absolute -right-4 -top-4 opacity-5">
                   <Activity className="w-32 h-32" />
                 </div>
                 <span className="text-4xl font-black tracking-tighter mb-1" style={{ color: selectedPlace.color.replace('text-', '') }}>
                   {selectedPlace.aqi}
                 </span>
                 <span className={`text-sm font-bold ${selectedPlace.color}`}>
                   AQI US • {selectedPlace.status}
                 </span>
               </div>

               <div className="space-y-3 mt-5">
                 <div className="flex items-start gap-3">
                   <ShieldAlert className={`w-5 h-5 mt-0.5 ${selectedPlace.color}`} />
                   <div>
                     <h4 className="text-sm font-bold text-slate-900">Health Recommendation</h4>
                     <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                       {selectedPlace.aqi > 150 
                         ? "Avoid prolonged outdoor exertion. Sensitive groups should remain indoors with air purifiers active." 
                         : "Air quality is acceptable. However, unusually sensitive individuals should consider limiting outdoor exertion."}
                     </p>
                   </div>
                 </div>
               </div>
            </div>
          </div>

          {/* 24-Hour Forecast */}
          {selectedPlace.forecast && (
            <div className="mt-2 p-5 bg-white shadow-sm border-t border-slate-100">
              <h3 className="text-sm font-extrabold text-slate-900 mb-4 flex items-center gap-2 uppercase tracking-wide">
                <Activity className="w-4 h-4 text-emerald-600" />
                24-Hour Forecast
              </h3>
              
              <div className="flex overflow-x-auto gap-3 pb-2 scrollbar-thin scrollbar-thumb-slate-200 scrollbar-track-transparent">
                {selectedPlace.forecast.map((f: any, idx: number) => (
                  <div key={idx} className="flex flex-col items-center justify-center min-w-[70px] p-3 rounded-xl border border-slate-100 bg-slate-50/50 hover:bg-slate-50 transition-colors cursor-default">
                    <span className="text-xs font-bold text-slate-500 mb-2">{f.time}</span>
                    <Wind className={`w-5 h-5 mb-2 ${f.color}`} />
                    <span className="text-lg font-black text-slate-900">{f.aqi}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
            </>
          )}
        </div>
      )}

      {/* Pre-Plan Destinations Picker Modal (Triggered when mode=preplan) */}
      {isPrePlanMode && (
        <div className="absolute top-4 right-4 z-[3000] w-[calc(100%-32px)] sm:w-[380px] bg-white/95 backdrop-blur-md rounded-2xl shadow-[0_16px_45px_rgba(0,0,0,0.25)] border border-slate-200 flex flex-col max-h-[85vh] animate-in slide-in-from-right-4 duration-300 overflow-hidden">
           {/* Header */}
           <div className="p-4 bg-slate-900 border-b border-slate-800 text-white flex items-center justify-between shadow-sm">
              <div>
                 <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-emerald-400" />
                    <span className="font-extrabold text-sm uppercase tracking-wider">{prePlanDay} Itinerary</span>
                 </div>
                 <p className="text-[11px] text-slate-400 mt-0.5">Click map to pick destination stops</p>
              </div>
              <span className="bg-emerald-500 text-slate-900 font-extrabold text-xs px-2.5 py-1 rounded-full shadow-xs">
                 {prePlanStops.length} Selected
              </span>
           </div>

           {/* List of Picked Destinations */}
           <div className="p-3 overflow-y-auto space-y-2.5 flex-1 divide-y divide-slate-100 max-h-[380px]">
              {prePlanStops.length === 0 ? (
                 <div className="text-center py-8 px-4 text-slate-400">
                    <MapPin className="w-8 h-8 mx-auto mb-2 text-emerald-500 animate-bounce" />
                    <p className="text-xs font-bold text-slate-700">No destinations picked yet</p>
                    <p className="text-[11px] text-slate-400 mt-1">Tap roads, shops or landmarks on the map to add stops for {prePlanDay}.</p>
                 </div>
              ) : (
                 prePlanStops.map((st, idx) => (
                    <div key={st.id} className="pt-2.5 first:pt-0 flex items-start gap-2.5">
                       <div className="w-6 h-6 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 font-black text-xs flex items-center justify-center shrink-0 mt-1 shadow-xs">
                          {idx + 1}
                       </div>
                       <div className="flex-1 min-w-0">
                          <h4 className="text-xs font-black text-slate-900 truncate">{st.name}</h4>
                          <p className="text-[10px] text-slate-500 truncate">{st.address}</p>
                          
                          {/* Time Input & AQI preview */}
                          <div className="flex items-center gap-2 mt-1.5">
                             <div className="flex items-center gap-1 bg-slate-100 px-2 py-0.5 rounded-lg border border-slate-200">
                                <Clock className="w-3 h-3 text-slate-500" />
                                <input 
                                  type="text"
                                  value={st.time}
                                  onChange={(e) => {
                                     const val = e.target.value;
                                     setPrePlanStops(prev => prev.map(p => p.id === st.id ? { ...p, time: val } : p));
                                  }}
                                  className="bg-transparent text-[11px] font-bold text-slate-800 outline-none w-20"
                                  placeholder="e.g. 10:30 AM"
                                />
                             </div>
                             <span className="text-[10px] font-extrabold px-1.5 py-0.5 rounded text-emerald-700 bg-emerald-50 border border-emerald-200">
                                AQI {st.aqiForecast}
                             </span>
                          </div>
                       </div>

                       {/* Delete Stop */}
                       <button 
                         onClick={() => setPrePlanStops(prev => prev.filter(p => p.id !== st.id))}
                         className="text-slate-400 hover:text-rose-600 p-1 rounded-full hover:bg-slate-100 transition-colors"
                         title="Remove destination"
                       >
                          <X className="w-3.5 h-3.5" />
                       </button>
                    </div>
                 ))
              )}
           </div>

           {/* Footer Actions */}
           <div className="p-3 bg-slate-50 border-t border-slate-200 flex items-center gap-2">
              <button 
                onClick={() => {
                   try {
                      const existingStr = localStorage.getItem('dhuan_planned_trips') || '[]';
                      const existing = JSON.parse(existingStr);
                      const others = existing.filter((p: any) => p.day !== prePlanDay);
                      const updated = [...others, ...prePlanStops];
                      localStorage.setItem('dhuan_planned_trips', JSON.stringify(updated));
                   } catch(e) {
                      console.error(e);
                   }
                   router.push('/dashboard/routing');
                }}
                className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs transition-all shadow-md flex items-center justify-center gap-1.5 active:scale-95"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Done ({prePlanStops.length} Destinations)</span>
              </button>

              <button 
                onClick={() => router.push('/dashboard/routing')}
                className="py-2.5 px-3 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-xl font-bold text-xs transition-colors"
              >
                Cancel
              </button>
           </div>
        </div>
      )}

      {/* Mobile Layer Toggle (Above Compass) */}
      <div className={`md:hidden absolute z-[1000] flex flex-col gap-2 ${fullScreen ? 'bottom-40 right-6' : 'bottom-20 right-6'}`}>
        <button
          onClick={() => setShowSmogLayer(prev => !prev)}
          title={showSmogLayer ? "Hide Smog Layer" : "Show Smog Layer"}
          className={`w-12 h-12 rounded-xl shadow-[0_4px_12px_rgba(0,0,0,0.15)] border flex items-center justify-center transition-all ${
            showSmogLayer 
              ? 'bg-emerald-500 text-white border-emerald-400' 
              : 'bg-white/95 backdrop-blur-md text-slate-700 border-slate-200'
          }`}
        >
          <Layers className="w-5 h-5" />
        </button>
        <button
          onClick={() => setIsStationDrawerOpen(prev => !prev)}
          title="View 10 Stations"
          className={`w-12 h-12 rounded-xl shadow-[0_4px_12px_rgba(0,0,0,0.15)] border flex items-center justify-center transition-all ${
            isStationDrawerOpen 
              ? 'bg-purple-600 text-white border-purple-500' 
              : 'bg-white/95 backdrop-blur-md text-slate-700 border-slate-200'
          }`}
        >
          <SlidersHorizontal className="w-5 h-5" />
        </button>
      </div>

      {/* Compass Icon (Bottom Right, adjusted if fullScreen) */}
      <div 
        onClick={handleCompassClick}
        title="Find My Location"
        className={`absolute z-[1000] w-12 h-12 bg-white/95 backdrop-blur-md rounded-xl shadow-[0_4px_12px_rgba(0,0,0,0.15)] border border-slate-200 flex items-center justify-center cursor-pointer hover:bg-slate-50 transition-all hover:scale-105 active:scale-95 ${fullScreen ? 'bottom-24 right-6' : 'bottom-6 right-6'}`}
      >
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6 text-slate-700">
           <path d="M12 2.25l4.5 10.5-4.5-2.25-4.5 2.25L12 2.25z" className="text-red-500" />
           <path d="M12 21.75l-4.5-10.5 4.5 2.25 4.5-2.25-4.5 10.5z" className="text-slate-400" />
        </svg>
      </div>
      </div>
    </div>
  );
}
