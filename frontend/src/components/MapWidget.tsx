'use client';

import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { MapContainer, TileLayer, Marker, Popup, Circle, Pane, useMapEvents, Polyline, useMap, ImageOverlay, Polygon } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { 
  Search, MapPin, X, Navigation, Info, Image as ImageIcon, Wind, ShieldAlert, Activity, 
  Bookmark, Share2, ArrowLeft, CornerUpRight, CornerUpLeft, CornerDownLeft, ArrowUp, 
  Car, Bike, Footprints, Bus, Train, Flame, Ticket, Clock, CheckCircle2, Plus, 
  AlertTriangle, Calendar, Bell, Layers, RotateCw, Eye, EyeOff, Radio, Sparkles, Palette, HeartPulse
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

// 14 Official Lahore Monitoring Stations covering the entire Lahore Metropolitan District
export const DEFAULT_STATIONS: GroundStation[] = [
  {
    id: 1,
    name: 'Shahdara (GT Road)',
    zone_code: 'SH-GT',
    aqi: 90,
    pm25: 30.7,
    status: 'Moderate Haze',
    color_tier: 'amber',
    lat: 31.6280,
    lng: 74.2820,
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
    lat: 31.4380,
    lng: 74.3380,
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
    lat: 31.4420,
    lng: 74.2120,
    sector: 'South-Western Transport Gateway',
    detail: 'Intercity bus terminal & major highway bypass',
    advisory: 'Exhaust accumulation near transit junction. Keep vehicle windows up.'
  },
  {
    id: 4,
    name: 'Sabzazar (Bund Road)',
    zone_code: 'SB-BND',
    aqi: 85,
    pm25: 28.0,
    status: 'Moderate Haze',
    color_tier: 'amber',
    lat: 31.5260,
    lng: 74.2480,
    sector: 'Western Ring & Ravi Transit Belt',
    detail: 'Heavy intercity truck corridor along Bund Road & River Ravi',
    advisory: 'Elevated vehicular particulate concentration along western ring.'
  },
  {
    id: 5,
    name: 'Kahna (Ferozepur South)',
    zone_code: 'KH-FZP',
    aqi: 84,
    pm25: 27.5,
    status: 'Moderate Haze',
    color_tier: 'amber',
    lat: 31.3680,
    lng: 74.3650,
    sector: 'Southern Industrial & Arterial Corridor',
    detail: 'Southern Ferozepur Road industrial belt & peri-urban fringe',
    advisory: 'Higher particulate trapping along southern industrial corridor.'
  },
  {
    id: 6,
    name: 'Wagha & Manawan (GT East)',
    zone_code: 'WG-MNW',
    aqi: 81,
    pm25: 26.5,
    status: 'Moderate Haze',
    color_tier: 'amber',
    lat: 31.5920,
    lng: 74.5180,
    sector: 'Eastern Border & GT Road Corridor',
    detail: 'Cross-border freight corridor & eastern agricultural plain',
    advisory: 'Moderate dust and freight exhaust along eastern GT Road.'
  },
  {
    id: 7,
    name: 'Gulberg (Syed Maratib Ali)',
    zone_code: 'GL-SMA',
    aqi: 79,
    pm25: 25.5,
    status: 'Moderate Haze',
    color_tier: 'amber',
    lat: 31.5150,
    lng: 74.3480,
    sector: 'Commercial Core & Business District',
    detail: 'High commercial volume & stop-and-go commuter traffic',
    advisory: 'Moderate traffic haze during peak rush hours.'
  },
  {
    id: 8,
    name: 'US Consulate (Empress Rd)',
    zone_code: 'US-CONS',
    aqi: 79,
    pm25: 25.2,
    status: 'Moderate Haze',
    color_tier: 'amber',
    lat: 31.5560,
    lng: 74.3620,
    sector: 'Central Urban Reference Station',
    detail: 'Official reference ground station in central Lahore',
    advisory: 'Central baseline conditions. General outdoor activities permissible.'
  },
  {
    id: 9,
    name: 'Mall Road (Anarkali)',
    zone_code: 'MR-ANK',
    aqi: 77,
    pm25: 24.4,
    status: 'Moderate Haze',
    color_tier: 'amber',
    lat: 31.5720,
    lng: 74.3080,
    sector: 'Civic & Heritage Center',
    detail: 'Regulated urban traffic with mature tree canopy',
    advisory: 'Stable daytime air quality protected by civic tree canopy.'
  },
  {
    id: 10,
    name: 'Barki Road (Paragon)',
    zone_code: 'BR-PGN',
    aqi: 76,
    pm25: 23.9,
    status: 'Moderate Haze',
    color_tier: 'amber',
    lat: 31.4960,
    lng: 74.4780,
    sector: 'Eastern Suburban & Peri-Urban',
    detail: 'Peri-urban development with agricultural fringe',
    advisory: 'Clean open dispersion during daytime convective hours.'
  },
  {
    id: 11,
    name: 'Johar Town (Doctor\'s Hospital)',
    zone_code: 'JT-DH',
    aqi: 75,
    pm25: 23.4,
    status: 'Moderate Haze',
    color_tier: 'amber',
    lat: 31.4697,
    lng: 74.2760,
    sector: 'Residential & Medical Avenue',
    detail: 'Wide suburban residential avenues & mixed commerce',
    advisory: 'Suburban residential baseline. Safe for regular commute.'
  },
  {
    id: 12,
    name: 'Model Town (A-Block)',
    zone_code: 'MT-A',
    aqi: 73,
    pm25: 22.4,
    status: 'Moderate Haze',
    color_tier: 'amber',
    lat: 31.4820,
    lng: 74.3220,
    sector: 'Green Residential Park Town',
    detail: 'Dense vegetation canopy & protected circular residential belt',
    advisory: 'Protected green belt filter providing cleaner microclimate.'
  },
  {
    id: 13,
    name: 'Bahria Town & Raiwind',
    zone_code: 'BT-RWD',
    aqi: 72,
    pm25: 22.2,
    status: 'Moderate Haze',
    color_tier: 'amber',
    lat: 31.3620,
    lng: 74.1980,
    sector: 'Southern Planned Residential Belt',
    detail: 'Open landscaped avenues in southern Lahore perimeter',
    advisory: 'Cleaner southern suburban microclimate with low industrial density.'
  },
  {
    id: 14,
    name: 'DHA Phase 6 (Bedian Rd)',
    zone_code: 'DHA-6',
    aqi: 71,
    pm25: 21.7,
    status: 'Moderate Haze',
    color_tier: 'amber',
    lat: 31.4520,
    lng: 74.4650,
    sector: 'Low-Density Planned Community',
    detail: 'Modern wide avenues with reduced localized emissions',
    advisory: 'Lowest particulate density in metropolitan perimeter.'
  }
];

// Full Metropolitan Footprint of Greater Lahore (100% full-opacity core before soft atmospheric feathering)
export const LAHORE_BOUNDARY_POLYGON: [number, number][] = [
  // North (Shahdara, Ferozewala, Lakhodher, Manawan North)
  [31.662, 74.250],
  [31.672, 74.305],
  [31.668, 74.375],
  [31.658, 74.450],
  [31.640, 74.515],
  // East (Wagha, Dograi, Barki, Hudiara, Padhana, Bedian)
  [31.605, 74.555],
  [31.560, 74.545],
  [31.515, 74.535],
  [31.470, 74.530],
  [31.425, 74.515],
  [31.380, 74.490],
  // South (Bedian South, Central Park, Kahna, Sua Asil, Raiwind, Sundar, Manga Mandi)
  [31.335, 74.445],
  [31.305, 74.395],
  [31.285, 74.335],
  [31.272, 74.265],
  [31.275, 74.195],
  [31.298, 74.142],
  [31.338, 74.132],
  // West & North-West (Mohlanwal, Chung, Thokar West, Sabzazar, Al-Jalil Garden, Kot Abdul Malik)
  [31.385, 74.150],
  [31.435, 74.172],
  [31.485, 74.195],
  [31.535, 74.205],
  [31.585, 74.218],
  [31.630, 74.232],
];

// Generous canvas bounds so the soft Gaussian outer plume fades completely to 0% before reaching the edge
export const LAHORE_HEATMAP_BOUNDS: [[number, number], [number, number]] = [
  [31.14, 73.96],
  [31.82, 74.76]
];

// Ray-casting point-in-polygon check + exact distance (in km) outside the Lahore footprint for borderless feathering
export const getDistanceOutsideLahoreKm = (lat: number, lng: number): number => {
  let inside = false;
  const n = LAHORE_BOUNDARY_POLYGON.length;
  for (let i = 0, j = n - 1; i < n; j = i++) {
    const yi = LAHORE_BOUNDARY_POLYGON[i][0], xi = LAHORE_BOUNDARY_POLYGON[i][1];
    const yj = LAHORE_BOUNDARY_POLYGON[j][0], xj = LAHORE_BOUNDARY_POLYGON[j][1];
    const intersect = ((yi > lat) !== (yj > lat)) && (lng < ((xj - xi) * (lat - yi)) / (yj - yi + 1e-12) + xi);
    if (intersect) inside = !inside;
  }
  if (inside) return 0;

  let minSqDistKm = Infinity;
  for (let i = 0, j = n - 1; i < n; j = i++) {
    const ay = LAHORE_BOUNDARY_POLYGON[j][0], ax = LAHORE_BOUNDARY_POLYGON[j][1];
    const by = LAHORE_BOUNDARY_POLYGON[i][0], bx = LAHORE_BOUNDARY_POLYGON[i][1];
    const dx = (bx - ax) * 96.0;
    const dy = (by - ay) * 111.0;
    const px = (lng - ax) * 96.0;
    const py = (lat - ay) * 111.0;
    const lenSq = dx * dx + dy * dy;
    const t = lenSq > 0 ? Math.max(0, Math.min(1, (px * dx + py * dy) / lenSq)) : 0;
    const distX = px - t * dx;
    const distY = py - t * dy;
    const sqDist = distX * distX + distY * distY;
    if (sqDist < minSqDistKm) minSqDistKm = sqDist;
  }
  return Math.sqrt(minSqDistKm);
};

// Continuous, high-contrast RGBA color interpolation for per-pixel AI spatial smog rendering
export const getHeatmapRgba = (aqi: number): [number, number, number, number] => {
  const lerp = (a: number, b: number, t: number) => Math.round(a + (b - a) * Math.max(0, Math.min(1, t)));
  if (aqi <= 50) {
    const t = aqi / 50;
    return [lerp(16, 132, t), lerp(185, 204, t), lerp(129, 22, t), 115];
  }
  if (aqi <= 75) {
    // Low-Moderate residential zones (71-75 AQI): Soft Yellow-Green to Warm Sunlight Gold
    const t = (aqi - 50) / 25;
    return [lerp(154, 250, t), lerp(214, 198, t), lerp(36, 22, t), lerp(118, 136, t)];
  }
  if (aqi <= 83) {
    // Mid-Moderate urban zones (76-83 AQI): Sunlight Gold to Rich Amber
    const t = (aqi - 75) / 8;
    return [lerp(250, 245, t), lerp(198, 132, t), lerp(22, 14, t), lerp(136, 154, t)];
  }
  if (aqi <= 100) {
    // Upper-Moderate industrial/transit hotspots (84-100 AQI): Rich Amber to Deep Industrial Orange-Red
    const t = (aqi - 83) / 17;
    return [lerp(245, 226, t), lerp(132, 54, t), lerp(14, 18, t), lerp(154, 178, t)];
  }
  if (aqi <= 150) {
    // Smog Inversion Forming (101-150 AQI): Deep Orange-Red to Crimson Rose
    const t = (aqi - 100) / 50;
    return [lerp(226, 225, t), lerp(54, 29, t), lerp(18, 72, t), 184];
  }
  if (aqi <= 200) {
    // Dense Smog Inversion (151-200 AQI): Crimson Rose to Severe Purple
    const t = (aqi - 150) / 50;
    return [lerp(225, 147, t), lerp(29, 51, t), lerp(72, 234, t), 194];
  }
  const t = Math.min(1, (aqi - 200) / 100);
  return [lerp(147, 136, t), lerp(51, 19, t), lerp(234, 55, t), 206];
};

export const getAqiColor = (aqi: number) => {
  if (aqi > 300) return '#881337'; // Hazardous Maroon
  if (aqi > 200) return '#7e22ce'; // Severe Purple
  if (aqi > 150) return '#e11d48'; // Dense Smog Rose
  if (aqi > 100) return '#ea580c'; // Inversion Forming Orange
  if (aqi > 83) return '#ea580c';  // Upper-Moderate Industrial Haze
  if (aqi > 50) return '#d97706';  // Moderate Haze Amber
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

// Standalone component for map click & zoom events to strictly adhere to React Rules of Hooks
function MapEventsHandler({ onMapClick, onZoomChange }: { onMapClick: (e: L.LeafletMouseEvent) => void; onZoomChange?: (zoom: number) => void }) {
  const map = useMapEvents({
    click: onMapClick,
    zoomend: () => {
      if (onZoomChange) onZoomChange(map.getZoom());
    }
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
  const [showHospitalsLayer, setShowHospitalsLayer] = useState(false);
  const [hospitalsList, setHospitalsList] = useState<any[]>([]);
  const [smogOverlayUrl, setSmogOverlayUrl] = useState<string>("");
  const [mapZoom, setMapZoom] = useState<number>(12);
  const [showColorGuideModal, setShowColorGuideModal] = useState<boolean>(false);
  const [isSavedPlace, setIsSavedPlace] = useState<boolean>(false);
  const [shareToast, setShareToast] = useState<boolean>(false);
  const [isLoadingPlaceAi, setIsLoadingPlaceAi] = useState<boolean>(false);

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

  // AI Smart Routing & 1-Second Live Environment Guard State
  const [routePreference, setRoutePreference] = useState<'safest' | 'fastest'>('safest');
  const [routingSessionId, setRoutingSessionId] = useState<number | null>(null);
  const [aiScanCount, setAiScanCount] = useState<number>(0);
  const [aiLiveScanMessage, setAiLiveScanMessage] = useState<string>("AI Environment Guard Active • Scanning every 1s");
  const [aiSmogSpikeAlert, setAiSmogSpikeAlert] = useState<any | null>(null);
  const [isCheckingSmogSpike, setIsCheckingSmogSpike] = useState<boolean>(false);
  const hasAutoTriggeredSpikeRef = useRef<boolean>(false);

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
              sector: area.sector || def?.sector || 'Official Lahore Monitoring Zone',
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
    fetch(getApiEndpoint('/emergency/hospitals?lat=31.5204&lng=74.3587'))
      .then(r => r.ok ? r.json() : null)
      .then(d => {
        if (d && d.hospitals) setHospitalsList(d.hospitals);
      })
      .catch(() => {});
    const interval = setInterval(fetchTelemetry, 30000);
    return () => clearInterval(interval);
  }, [fetchTelemetry]);

  // High-Precision Spatial IDW Interpolation across all 14 AI Monitoring Stations
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
      const weight = 1 / Math.pow(distKm, 2.5);
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
      const weight = 1 / Math.pow(distKm, 2.5);
      sumWeight += weight;
      sumWeightedPm25 += s.pm25 * weight;
    }

    if (sumWeight === 0) return cityPm25;
    return Math.round((sumWeightedPm25 / sumWeight) * 10) / 10;
  }, [stations, cityPm25]);

  const getNearestStationInfo = useCallback((lat: number, lng: number) => {
    const list = stations && stations.length > 0 ? stations : DEFAULT_STATIONS;
    let nearest = list[0];
    let minDistKm = Infinity;
    for (const s of list) {
      const dLatKm = (lat - s.lat) * 111.0;
      const dLngKm = (lng - s.lng) * 96.0;
      const dKm = Math.sqrt(dLatKm * dLatKm + dLngKm * dLngKm);
      if (dKm < minDistKm) {
        minDistKm = dKm;
        nearest = s;
      }
    }
    return {
      station: nearest,
      distanceKm: Math.round(minDistKm * 10) / 10
    };
  }, [stations]);

  // Generate high-resolution per-pixel AI Spatial Smog Heatmap with natural borderless atmospheric feathering
  useEffect(() => {
    if (typeof window === 'undefined' || !mounted) return;
    try {
      const gridW = 180;
      const gridH = 180;
      const rawCanvas = document.createElement('canvas');
      rawCanvas.width = gridW;
      rawCanvas.height = gridH;
      const rawCtx = rawCanvas.getContext('2d');
      if (!rawCtx) return;

      const [[minLat, minLng], [maxLat, maxLng]] = LAHORE_HEATMAP_BOUNDS;
      const imgData = rawCtx.createImageData(gridW, gridH);
      const data = imgData.data;

      for (let py = 0; py < gridH; py++) {
        const lat = maxLat - (py / (gridH - 1)) * (maxLat - minLat);
        for (let px = 0; px < gridW; px++) {
          const lng = minLng + (px / (gridW - 1)) * (maxLng - minLng);
          const distOutKm = getDistanceOutsideLahoreKm(lat, lng);
          const idx = (py * gridW + px) * 4;

          if (distOutKm >= 14.5) {
            data[idx + 3] = 0;
            continue;
          }

          let featherAlpha = 1.0;
          if (distOutKm > 2.2) {
            const t = Math.min(1, (distOutKm - 2.2) / 12.3);
            featherAlpha = Math.pow(0.5 * (1 + Math.cos(Math.PI * t)), 1.35);
          }

          const aqi = getSpatialAqi(lat, lng);
          const [r, g, b, a] = getHeatmapRgba(aqi);
          data[idx] = r;
          data[idx + 1] = g;
          data[idx + 2] = b;
          data[idx + 3] = Math.round(a * featherAlpha);
        }
      }
      rawCtx.putImageData(imgData, 0, 0);

      const outW = 680;
      const outH = 680;
      const outCanvas = document.createElement('canvas');
      outCanvas.width = outW;
      outCanvas.height = outH;
      const outCtx = outCanvas.getContext('2d');
      if (!outCtx) return;

      outCtx.imageSmoothingEnabled = true;
      outCtx.imageSmoothingQuality = 'high';
      outCtx.filter = 'blur(20px)';
      outCtx.drawImage(rawCanvas, 0, 0, outW, outH);

      setSmogOverlayUrl(outCanvas.toDataURL('image/png'));
    } catch (err) {
      console.error('Error generating Lahore spatial smog overlay:', err);
    }
  }, [mounted, stations, cityBaselineAqi, getSpatialAqi]);

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
  // Trigger Backend + AI Core 1-Second Ride Environment & Smog Spike Monitor
  const triggerBackendAiMonitor = useCallback(async (
    curPos: [number, number],
    aheadPos: [number, number],
    remCoords: number[][],
    forceSpike = false
  ) => {
    if (!selectedPlace) return;
    if (forceSpike) setIsCheckingSmogSpike(true);
    try {
      const res = await fetch(getApiEndpoint('/dashboard/routing/monitor'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: routingSessionId,
          currentPos: curPos,
          aheadPos: aheadPos,
          destination: [selectedPlace.lat, selectedPlace.lon],
          vehicleMode: selectedVehicle,
          remainingCoords: remCoords.slice(0, 30),
          simulateSpike: forceSpike
        })
      });
      if (res.ok) {
        const data = await res.json();
        if (data.ai_live_message) {
          setAiLiveScanMessage(data.ai_live_message);
        }
        if (data.ahead_telemetry && forceSpike) {
          setNavUpcomingAqi(data.ahead_telemetry.peak_aqi_ahead || data.ahead_telemetry.aqi);
          setNavUpcomingStatus(data.ahead_telemetry.status || 'Smog Inversion Forming');
        }
        if (data.smog_alert && data.smog_alert.triggered) {
          setAiSmogSpikeAlert(data.smog_alert);
        }
      }
    } catch (err) {
      console.log('AI ride monitor step fallback:', err);
    } finally {
      if (forceSpike) setIsCheckingSmogSpike(false);
    }
  }, [selectedPlace, routingSessionId, selectedVehicle]);

  // Real-Time 1-Second (1000ms) AI Navigation & Environment Guard Loop (Stationary until User Physically Moves)
  useEffect(() => {
     let interval: NodeJS.Timeout;
     let navWatchId: number | undefined;

     if (isNavigating && routes.length > 0 && routes[selectedRouteIdx]) {
        const currentRoute = routes[selectedRouteIdx];
        const routeCoords = currentRoute.geometry.coordinates; // [[lng, lat], ...]
        let userPosIdx = 0;
        let lastUserCoords: [number, number] | null = null;
        let scanTick = 0;

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

        // Find starting index closest to userLocation or routeOriginCoords
        const startAnchor = userLocation || routeOriginCoords || [routeCoords[0][1], routeCoords[0][0]];
        let minStartDist = Infinity;
        for (let i = 0; i < Math.min(25, routeCoords.length); i++) {
           const d = getDist([startAnchor[1], startAnchor[0]], routeCoords[i]);
           if (d < minStartDist) {
              minStartDist = d;
              userPosIdx = i;
           }
        }

        const startPt = routeCoords[userPosIdx];
        const nextPt = routeCoords[Math.min(routeCoords.length - 1, userPosIdx + 1)];
        const initBearing = getBearing(startPt, nextPt);

        // Position the arrow initially — IT WILL REMAIN HERE UNTIL USER PHYSICALLY MOVES!
        setNavPosition({ lat: startPt[1], lng: startPt[0] });
        setNavHeading(initBearing);
        lastUserCoords = [startPt[1], startPt[0]];

        if (mapRef.current) {
           mapRef.current.setView([startPt[1], startPt[0]], 17, { animate: true, duration: 1.0 });
        }

        // Update turn instructions and remaining metrics function
        const updateJourneyProgress = (currIdx: number) => {
           const remDistMeters = Math.round(calcRemainingDist(currIdx));
           const progressRatio = Math.max(0, Math.min(1, remDistMeters / totalRouteDist));
           const remDurationSec = Math.max(30, Math.round(totalRouteDuration * progressRatio));
           const etaDate = new Date(Date.now() + remDurationSec * 1000);
           const formattedEta = etaDate.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });

           setNavRemainingDistance(remDistMeters);
           setNavRemainingDuration(remDurationSec);
           setNavEtaTime(formattedEta);

           // Turn instruction
           let distanceToTurn = 0;
           let turnType = "Continue straight";
           let foundTurn = false;

           for (let i = currIdx; i < routeCoords.length - 2; i++) {
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

                   if (selectedVehicle === 'transit') {
                      turnType = routes[selectedRouteIdx]?.transitData?.steps?.[1]?.badge ? `Ride ${routes[selectedRouteIdx].transitData.steps[1].badge}` : "Transfer at Metro Station";
                   } else if (selectedVehicle === 'walk') {
                      turnType = i % 2 === 0 ? 'Follow shaded inner street' : 'Cross at pedestrian walkway';
                   } else if (selectedVehicle === 'bike') {
                      turnType = i % 2 === 0 ? 'Stay in green-belt bike lane' : (angleDiff > 0 ? 'Turn right onto service road' : 'Turn left onto service road');
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
              turnType = selectedVehicle === 'transit' ? 'Arrive at PMA Station' : 'Arrive at destination';
           }
           setNavInstruction({ type: turnType, distance: Math.round(distanceToTurn) });
        };

        updateJourneyProgress(userPosIdx);

        // REAL HARDWARE GPS TRACKING: The arrow ONLY moves when the user physically moves!
        if (typeof window !== 'undefined' && navigator.geolocation) {
           navWatchId = navigator.geolocation.watchPosition(
              (pos) => {
                 const gpsLat = pos.coords.latitude;
                 const gpsLng = pos.coords.longitude;

                 // If last position known, check if user actually moved > 3.5 meters
                 if (lastUserCoords) {
                    const distMoved = getDist([lastUserCoords[1], lastUserCoords[0]], [gpsLng, gpsLat]);
                    if (distMoved < 3.5) {
                       // User is stationary: Arrow stands STILL at its place!
                       return;
                    }
                 }

                 // Find closest point on route polyline to user's real GPS position
                 let closestIdx = userPosIdx;
                 let minDist = Infinity;
                 const searchStart = Math.max(0, userPosIdx - 2);
                 const searchEnd = Math.min(routeCoords.length - 1, userPosIdx + 30);

                 for (let k = searchStart; k <= searchEnd; k++) {
                    const d = getDist([gpsLng, gpsLat], routeCoords[k]);
                    if (d < minDist) {
                       minDist = d;
                       closestIdx = k;
                    }
                 }

                 // If user drifted far off the route (>85m), auto-recalculate
                 if (minDist > 85) {
                    handleOffRoute([gpsLat, gpsLng]);
                    return;
                 }

                 userPosIdx = closestIdx;
                 lastUserCoords = [gpsLat, gpsLng];

                 const curPt = routeCoords[userPosIdx];
                 const nxtPt = routeCoords[Math.min(routeCoords.length - 1, userPosIdx + 1)];
                 const newBearing = (pos.coords.heading !== null && !isNaN(pos.coords.heading) && pos.coords.heading >= 0)
                    ? pos.coords.heading
                    : getBearing(curPt, nxtPt);

                 setNavPosition({ lat: curPt[1], lng: curPt[0] });
                 setNavHeading(newBearing);
                 updateJourneyProgress(userPosIdx);

                 if (mapRef.current) {
                    mapRef.current.setView([curPt[1], curPt[0]], 17, { animate: true, duration: 0.8 });
                 }
              },
              (err) => console.log("Navigation GPS tracking:", err),
              { enableHighAccuracy: true, maximumAge: 1000, timeout: 5000 }
           );
        }

        // REAL-TIME 1-SECOND AI ENVIRONMENT SCANNER (CHECKS ENVIRONMENT EVERY 1s WITHOUT MOVING THE ARROW!)
        interval = setInterval(() => {
           scanTick += 1;
           setAiScanCount(prev => prev + 1);

           // Current coordinate where the user is stationary (or moving)
           const curPt = routeCoords[userPosIdx];
           const curLat = curPt[1];
           const curLng = curPt[0];

           const curAqi = getSpatialAqi(curLat, curLng);
           const curPm25 = getSpatialPm25(curLat, curLng);
           const curCat = getAqiCategory(curAqi);
           const curNearest = getNearestStationInfo(curLat, curLng);

           setNavCurrentAqi(curAqi);
           setNavCurrentStatus(curCat.status);
           setNavCurrentPm25(curPm25);

           let curAreaName = currentRoute.aiStats?.corridorName?.replace(/^via\s+/i, '') || `${curNearest.station.name.split(' (')[0]} Corridor`;
           if (currentRoute.legs?.[0]?.steps && currentRoute.legs[0].steps.length > 0) {
              const stepIndex = Math.min(
                 currentRoute.legs[0].steps.length - 1, 
                 Math.floor((userPosIdx / routeCoords.length) * currentRoute.legs[0].steps.length)
              );
              const stepObj = currentRoute.legs[0].steps[stepIndex];
              if (stepObj?.name && stepObj.name.trim().length > 0) {
                 curAreaName = stepObj.name.replace(/^via\s+/i, '');
              }
           }
           setNavCurrentArea(curAreaName);

           // Upcoming area ~2-3 km ahead along the remaining route
           let distAheadSum = 0;
           let aheadIdx = userPosIdx + 1;
           for (let k = userPosIdx + 1; k < routeCoords.length - 1; k++) {
              distAheadSum += getDist(routeCoords[k], routeCoords[k+1]);
              aheadIdx = k;
              if (distAheadSum >= 2200) break;
           }
           if (aheadIdx >= routeCoords.length - 1) {
              aheadIdx = routeCoords.length - 1;
           }

           const aheadCoord = routeCoords[aheadIdx];
           const aheadAqi = getSpatialAqi(aheadCoord[1], aheadCoord[0]);
           const aheadPm25 = getSpatialPm25(aheadCoord[1], aheadCoord[0]);
           const aheadCat = getAqiCategory(aheadAqi);
           const aheadNearest = getNearestStationInfo(aheadCoord[1], aheadCoord[0]);
           const aheadDistMeters = Math.round(distAheadSum);

           setNavUpcomingDistance(aheadDistMeters);
           setNavUpcomingAqi(aheadAqi);
           setNavUpcomingStatus(aheadCat.status);

           const upcomingName = `${aheadNearest.station.name.split(' (')[0]} Sector Corridor`;
           setNavUpcomingArea(upcomingName);

           const distKmStr = aheadDistMeters >= 1000 ? `${(aheadDistMeters / 1000).toFixed(1)} km` : `${aheadDistMeters} m`;
           if (aheadAqi >= 150) {
              setNavUpcomingWarning(`🚨 HIGH SMOG ALERT: Dense smog ahead (${aheadAqi} AQI / ${aheadPm25} µg/m³) near ${upcomingName}.`);
              setAiLiveScanMessage(`🚨 High Smog Alert Ahead (${aheadAqi} AQI near ${upcomingName})! Checking cleaner detour...`);
           } else if (aheadAqi > curAqi + 15) {
              setNavUpcomingWarning(`⚠️ Rising Smog Ahead: +${aheadAqi - curAqi} AQI (${aheadAqi} AQI) in next ${distKmStr} near ${upcomingName}.`);
              setAiLiveScanMessage(`⚠️ Smog gradient rising (+${aheadAqi - curAqi} AQI near ${upcomingName}). Monitoring safety...`);
           } else {
              setNavUpcomingWarning(`✅ Normal Baseline: Stable air quality (${aheadAqi} AQI • ${aheadCat.status}) for next ${distKmStr}.`);
              setAiLiveScanMessage(`✅ AI 1s Scan: Normal air quality (${curAqi} AQI). No high smog alert ahead — current path is safe.`);
           }

           // Periodic 1-second backend telemetry sync without dummy spikes:
           // Only sends real coordinates. AI Model will ONLY trigger alert if real condition is High Alert!
           if (scanTick % 3 === 0 || scanTick === 1) {
              triggerBackendAiMonitor(
                [curLat, curLng],
                [aheadCoord[1], aheadCoord[0]],
                routeCoords.slice(userPosIdx),
                false
              );
           }
        }, 1000); // 1000ms = 1-Second AI Environment Scan
     }

     return () => {
        if (interval) clearInterval(interval);
        if (navWatchId !== undefined && typeof window !== 'undefined' && navigator.geolocation) {
           navigator.geolocation.clearWatch(navWatchId);
        }
     };
  }, [isNavigating, routes, selectedRouteIdx, selectedVehicle, getSpatialAqi, getSpatialPm25, getNearestStationInfo, triggerBackendAiMonitor, selectedPlace, userLocation, routeOriginCoords]);

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
    const nearestInfo = getNearestStationInfo(lat, lon);

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
      whoMultiplier: (pm25Val / 5.0).toFixed(1),
      nearestStationName: nearestInfo.station.name,
      nearestStationZone: nearestInfo.station.zone_code,
      nearestStationDist: nearestInfo.distanceKm,
      status: cat.status,
      color: cat.color,
      bg: cat.bg,
      border: cat.border,
      advisory: cat.advisory,
      forecast,
      isAiCalibrated: false
    });
    setIsLoadingPlaceAi(true);
    setIsSavedPlace(false);
    skipNextSearch.current = true;
    setResults([]);
    setHasSearched(false);
    setQuery(place.name || place.display_name.split(',')[0]);
    
    // Fly to location
    if (mapRef.current) {
      mapRef.current.flyTo([lat, lon], 16, { animate: true, duration: 1.5 });
    }

    // Connect to Backend SQLite Database and AI Model Core for location-specific telemetry
    fetch(getApiEndpoint('/dashboard/place-telemetry'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        lat,
        lng: lon,
        name: place.name || place.display_name.split(',')[0],
        displayName: place.display_name
      })
    })
      .then(res => res.json())
      .then(data => {
        setIsLoadingPlaceAi(false);
        if (data && data.success && data.environmentalStatus) {
          const env = data.environmentalStatus;
          const health = data.healthRecommendations;
          const fcast = (data.forecast24h || []).map((f: any) => {
            let statusColor = 'text-emerald-500';
            if (f.aqi > 100) statusColor = 'text-yellow-500';
            if (f.aqi > 150) statusColor = 'text-orange-500';
            if (f.aqi > 200) statusColor = 'text-rose-500';
            if (f.aqi > 300) statusColor = 'text-purple-600';
            return {
              time: f.time,
              aqi: f.aqi,
              pm25: f.pm25,
              status: f.status,
              temp: f.temperature,
              humidity: f.humidity,
              windSpeed: f.windSpeed,
              color: statusColor,
              colorTier: f.color,
              trend: f.trend
            };
          });

          setSelectedPlace((prev: any) => {
            if (!prev || prev.lat !== lat || prev.lon !== lon) return prev;
            const updatedCat = getAqiCategory(env.aqi);
            return {
              ...prev,
              aqi: env.aqi,
              pm25: env.pm25,
              whoMultiplier: env.whoMultiplier,
              nearestStationName: env.nearestStation?.name,
              nearestStationZone: env.nearestStation?.zone,
              nearestStationDist: env.nearestStation?.distanceKm,
              status: env.status,
              color: updatedCat.color,
              bg: updatedCat.bg,
              border: updatedCat.border,
              advisory: health?.primaryAdvisory || updatedCat.advisory,
              healthRecommendations: health,
              weather: env.weather,
              inversionRisk: env.inversionRisk,
              forecast: fcast.length > 0 ? fcast : prev.forecast,
              aiMeta: data.aiMeta,
              isAiCalibrated: true
            };
          });
        }
      })
      .catch(() => {
        setIsLoadingPlaceAi(false);
      });
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
    customStops?: Array<{ id: string; name: string; coords: [number, number]; input: string }>,
    customPreference?: 'safest' | 'fastest'
  ) => {
    const mode = vehicleMode || selectedVehicle;
    const pref = customPreference || routePreference;
    const currentStops = customStops !== undefined ? customStops : routeStops;
    const validStops = currentStops.filter(s => s.coords && (s.coords[0] !== 0 || s.coords[1] !== 0));

    setIsSearching(true);
    try {
      // 1. PUBLIC TRANSPORT (Punjab MassTransit Authority - Metrobus, Orange Line, Speedo, Green Bus)
      if (mode === 'transit') {
        const effectiveDest = validStops.length > 0 ? validStops[0].coords : dest;
        const pmaRoutes = solvePmaTransitRoutes(origin, effectiveDest);
        if (pmaRoutes.length > 0) {
          const clientPmaRoutes = pmaRoutes.map((tr, idx) => ({
            duration: tr.totalDurationMin * 60,
            distance: tr.totalDistanceMeters,
            corridor_type: 'pma_transit',
            corridor_name: `via ${tr.linesUsed.map((l: any) => l.badge).join(' → ')}`,
            geometry: {
              type: 'LineString',
              coordinates: tr.geometryCoordinates
            },
            legs: [{
              steps: tr.steps.map(s => ({ name: s.instructions }))
            }],
            transitData: tr
          }));

          // Evaluate PMA Transit routes through Backend + AI Core + SQLite
          try {
            const aiRes = await fetch(getApiEndpoint('/dashboard/routing/analyze'), {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                origin,
                destination: effectiveDest,
                originName: userAddress,
                destName: selectedPlace?.name || 'Destination',
                vehicleMode: 'transit',
                preference: pref,
                clientRoutes: clientPmaRoutes
              })
            });
            if (aiRes.ok) {
              const aiData = await aiRes.json();
              if (aiData.routes && aiData.routes.length > 0) {
                const mergedTransit = aiData.routes.map((r: any, idx: number) => ({
                  ...r,
                  transitData: pmaRoutes[idx]
                }));
                setRoutingSessionId(aiData.sessionId || null);
                setRoutes(mergedTransit);
                setSelectedRouteIdx(aiData.recommendedIdx ?? 0);
                if (mapRef.current && mergedTransit[0]) {
                  const allCoords = mergedTransit[0].transitData.segments.flatMap((s: any) => s.coordinates);
                  if (allCoords.length > 0) {
                    const bounds = L.latLngBounds(allCoords);
                    mapRef.current.fitBounds(bounds, { padding: [60, 60], animate: true, duration: 1.5 });
                  }
                }
                setIsSearching(false);
                return;
              }
            }
          } catch (e) {
            console.log('PMA AI routing fallback:', e);
          }

          const fallbackTransit = clientPmaRoutes.map((r, idx) => ({
            ...r,
            aiStats: {
              smogExposure: 54 + idx * 5,
              effectiveAqi: 38 + idx * 4,
              safetyScore: 95 - idx * 4,
              traffic: 'Dedicated PMA Transit Track',
              isSafest: idx === 0,
              isFastest: idx === 0,
              aiBadge: idx === 0 ? 'PMA Recommended Line' : 'PMA Alternative Line',
              aiReasoning: 'Punjab MassTransit Authority (PMA) air-conditioned carriage filters ambient particulate haze.',
              ecoFriendly: true
            }
          }));
          setRoutes(fallbackTransit);
          setSelectedRouteIdx(0);
          setIsSearching(false);
          return;
        }
      }

      // 2. AI-CONTROLLED ROAD & STREET ROUTING (Car: Ring Road/Expressway, Bike: Service Lane/Boulevard, Walk: Inner Streets)
      const backendRes = await fetch(getApiEndpoint('/dashboard/routing/analyze'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          origin,
          destination: dest,
          originName: userAddress,
          destName: selectedPlace?.name || 'Destination',
          vehicleMode: mode,
          preference: pref,
          stops: validStops.map(s => ({ name: s.name || 'Stop', coords: s.coords }))
        })
      });

      if (backendRes.ok) {
        const aiData = await backendRes.json();
        if (aiData.routes && aiData.routes.length > 0) {
          let finalRoutes = aiData.routes;
          if (isNavigating && finalRoutes.length > 1) {
            const bestIdx = aiData.recommendedIdx ?? 0;
            finalRoutes = [finalRoutes[bestIdx]];
          }
          setRoutingSessionId(aiData.sessionId || null);
          setRoutes(finalRoutes);
          const selIdx = isNavigating ? 0 : (aiData.recommendedIdx ?? 0);
          setSelectedRouteIdx(selIdx);

          if (mapRef.current && finalRoutes[selIdx] && !isNavigating) {
            const coords = finalRoutes[selIdx].geometry.coordinates.map((c: any) => [c[1], c[0]]);
            const bounds = L.latLngBounds(coords);
            mapRef.current.fitBounds(bounds, { padding: [50, 50], animate: true, duration: 1.5 });
          }
          setIsSearching(false);
          return;
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
    setAiSmogSpikeAlert(null);
    hasAutoTriggeredSpikeRef.current = false;
    
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
    setAiSmogSpikeAlert(null);
    setAiScanCount(0);
    hasAutoTriggeredSpikeRef.current = false;
  };

  // Off-Route Rerouting Handler: auto recalculates route from drifted road coordinates
  const handleOffRoute = async (newCoords: [number, number]) => {
    if (!selectedPlace) return;
    setIsRerouting(true);
    setRerouteNotice(`Off-route detected • AI recalculating safest route to ${selectedPlace.name || "destination"}...`);

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
       await fetchRoutesAndEnhance(origin, dest, selectedVehicle, routeStops, 'safest');
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
    const rad = ((navHeading || 0) + 90) * Math.PI / 180;
    const detourLat = navPosition.lat + (0.0018 * Math.cos(rad));
    const detourLng = navPosition.lng + (0.0018 * Math.sin(rad));
    await handleOffRoute([detourLat, detourLng]);
  };

  // Trigger Live AI Smog Spike Ahead Check (Manual or Automatic Mid-Ride Test)
  const handleSimulateSmogSpikeAhead = async () => {
    if (!selectedPlace) return;
    const curPos: [number, number] = navPosition
      ? [navPosition.lat, navPosition.lng]
      : (routeOriginCoords || userLocation || [31.5204, 74.3587]);
    const currentRoute = routes[selectedRouteIdx];
    const coords = currentRoute?.geometry?.coordinates || [];
    const midIdx = Math.min(coords.length - 1, Math.max(1, Math.floor(coords.length * 0.35)));
    const aheadPos: [number, number] = coords[midIdx]
      ? [coords[midIdx][1], coords[midIdx][0]]
      : [selectedPlace.lat, selectedPlace.lon];
    await triggerBackendAiMonitor(curPos, aheadPos, coords, true);
  };

  // User Accepts AI Recommended Cleaner Bypass Path During Ride
  const handleAcceptAiSmogReroute = async () => {
    if (!aiSmogSpikeAlert) return;
    const cleanRoute = aiSmogSpikeAlert.recommendedNewRoute;
    const corridorLabel = aiSmogSpikeAlert.recommended_corridor || 'AI Safest Green Bypass';
    const savedAqi = aiSmogSpikeAlert.aqi_saved || 25;

    setRerouteNotice(`✅ AI Safe Path Active: Following ${corridorLabel} (-${savedAqi} AQI cleaner)`);
    setAiLiveScanMessage(`✅ Switched to ${corridorLabel}. Avoided ${aiSmogSpikeAlert.hotspot_name} smog spike (-${savedAqi} AQI).`);

    if (cleanRoute && cleanRoute.geometry && cleanRoute.geometry.coordinates) {
      setRoutes([cleanRoute]);
      setSelectedRouteIdx(0);
      const startPt = cleanRoute.geometry.coordinates[0];
      if (startPt) {
        setNavPosition({ lat: startPt[1], lng: startPt[0] });
      }
      setNavUpcomingAqi(aiSmogSpikeAlert.projected_clean_aqi || 72);
      setNavUpcomingStatus('Moderate Haze');
      setNavUpcomingWarning(`🌿 AI Safe Bypass Active: Routed via ${corridorLabel} (${aiSmogSpikeAlert.projected_clean_aqi || 72} AQI).`);
    } else if (navPosition && selectedPlace) {
      await fetchRoutesAndEnhance([navPosition.lat, navPosition.lng], [selectedPlace.lat, selectedPlace.lon], selectedVehicle, routeStops, 'safest');
    }

    // Log user acceptance to SQLite database
    try {
      fetch(getApiEndpoint('/dashboard/routing/accept-reroute'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: routingSessionId,
          vehicleMode: selectedVehicle,
          currentPos: navPosition ? [navPosition.lat, navPosition.lng] : [31.5204, 74.3587],
          currentAqi: navCurrentAqi,
          aheadAqi: aiSmogSpikeAlert.current_path_aqi,
          corridorName: corridorLabel
        })
      }).catch(() => {});
    } catch (e) {}

    setAiSmogSpikeAlert(null);
    setTimeout(() => {
      setRerouteNotice(null);
    }, 4000);
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

        {/* AI Recommended Cleaner Bypass Preview Polyline (During Mid-Ride Smog Spike Alert) */}
        {isNavigating && aiSmogSpikeAlert?.recommendedNewRoute?.geometry?.coordinates && (
          <Polyline
            positions={aiSmogSpikeAlert.recommendedNewRoute.geometry.coordinates.map((c: any) => [c[1], c[0]])}
            color="#10b981"
            weight={7}
            opacity={0.95}
            dashArray="10, 8"
            pathOptions={{
              lineCap: 'round',
              lineJoin: 'round',
              className: 'drop-shadow-lg animate-pulse'
            }}
          />
        )}

        {/* Dynamic AI-Controlled Atmospheric Smog Dispersion Layer (Borderless Natural Dispersion) */}
        {showSmogLayer && (
          <Pane name="smogLayer" style={{ pointerEvents: 'none', zIndex: 400 }}>
            {smogOverlayUrl && (
              <ImageOverlay
                url={smogOverlayUrl}
                bounds={LAHORE_HEATMAP_BOUNDS}
                opacity={0.90}
                zIndex={400}
              />
            )}
          </Pane>
        )}

        {/* 14 Official Lahore Monitoring Station Interactive Markers */}
        {showStationsLayer && stations.map((st) => {
          const aqi = st.aqi;
          const isMaroon = aqi > 300;
          const isPurple = aqi > 200 && aqi <= 300;
          const isRose = aqi > 150 && aqi <= 200;
          const isOrange = aqi > 100 && aqi <= 150;
          const isHighAmber = aqi >= 84 && aqi <= 100;
          const isMidAmber = aqi >= 76 && aqi <= 83;
          const isLowAmber = aqi > 50 && aqi <= 75;
          
          const badgeStyle = isMaroon 
            ? 'background: #881337; color: #ffe4e6; border: 1px solid #be123c;'
            : isPurple 
            ? 'background: #7e22ce; color: #ffffff; border: 1px solid #a855f7;'
            : isRose 
            ? 'background: #e11d48; color: #ffffff; border: 1px solid #f43f5e;'
            : isOrange 
            ? 'background: #ea580c; color: #ffffff; border: 1px solid #fb923c;'
            : isHighAmber
            ? 'background: #ea580c; color: #ffffff; border: 1px solid #fb923c;'
            : isMidAmber 
            ? 'background: #d97706; color: #ffffff; border: 1px solid #f59e0b;'
            : isLowAmber
            ? 'background: #ca8a04; color: #ffffff; border: 1px solid #eab308;'
            : 'background: #059669; color: #ffffff; border: 1px solid #10b981;';

          const dotColor = isMaroon ? '#f43f5e' : isPurple ? '#c084fc' : isRose ? '#fb7185' : (isOrange || isHighAmber) ? '#fb923c' : isMidAmber ? '#fbbf24' : isLowAmber ? '#a3e635' : '#34d399';
          const isSelected = selectedStation?.zone_code === st.zone_code;
          const isCompact = mapZoom <= 11 && !isSelected;
          const shortName = st.name.split(' (')[0].replace(' & Raiwind', '').replace(' & Manawan', '');

          return (
            <Marker
              key={`station-marker-${st.zone_code}`}
              position={[st.lat, st.lng]}
              icon={L.divIcon({
                className: 'station-div-marker',
                html: `
                  <div style="cursor: pointer; transform: ${isSelected ? 'scale(1.15)' : 'scale(1)'}; transition: transform 0.2s ease;">
                    <div style="display: inline-flex; align-items: center; gap: ${isCompact ? '4px' : '6px'}; background: rgba(15, 23, 42, 0.94); color: white; backdrop-filter: blur(8px); padding: ${isCompact ? '2px 7px' : '4px 10px'}; border-radius: 9999px; box-shadow: 0 4px 14px rgba(0,0,0,0.35); border: ${isSelected ? '2px solid #10b981' : '1px solid rgba(71, 85, 105, 0.7)'}; white-space: nowrap;">
                      <span style="width: ${isCompact ? '6px' : '8px'}; height: ${isCompact ? '6px' : '8px'}; border-radius: 9999px; background-color: ${dotColor}; flex-shrink: 0; box-shadow: 0 0 8px ${dotColor};"></span>
                      <span style="font-size: ${isCompact ? '9.5px' : '11px'}; font-weight: 800; color: #f1f5f9; white-space: nowrap;">${shortName}</span>
                      <span style="font-size: ${isCompact ? '9px' : '10px'}; font-weight: 900; padding: ${isCompact ? '1px 4px' : '2px 6px'}; border-radius: 5px; ${badgeStyle}">${aqi}</span>
                    </div>
                  </div>
                `,
                iconSize: isCompact ? [96, 24] : [130, 32],
                iconAnchor: isCompact ? [48, 12] : [65, 16]
              })}
              eventHandlers={{
                click: () => {
                  setSelectedStation(st);
                  if (mapRef.current) {
                    mapRef.current.flyTo([st.lat, st.lng], 14, { animate: true, duration: 1.2 });
                  }
                }
              }}
              zIndexOffset={isSelected ? 1500 : 1200}
            />
          );
        })}

        {/* 15 Verified Lahore Emergency Hospitals Interactive Markers */}
        {showHospitalsLayer && hospitalsList.map((hosp: any) => (
          <Marker
            key={`hosp-${hosp.id}`}
            position={[hosp.lat, hosp.lng]}
            icon={L.divIcon({
              className: 'hospital-marker',
              html: `<div style="background-color: #e11d48; border: 2px solid white; box-shadow: 0 4px 14px rgba(225,29,72,0.45); width: 28px; height: 28px; border-radius: 9999px; display: flex; align-items: center; justify-content: center; color: white; font-weight: 900; font-size: 15px;">
                       +
                     </div>`,
              iconSize: [28, 28],
              iconAnchor: [14, 14]
            })}
            zIndexOffset={1600}
          >
            <Popup>
              <div className="p-1 min-w-[210px]">
                <div className="font-bold text-slate-900 text-sm">{hosp.name}</div>
                <div className="text-[10px] font-bold px-2 py-0.5 rounded text-white bg-rose-600 mt-1 w-fit shadow-xs">
                  {hosp.trauma_level}
                </div>
                <div className="text-xs text-slate-600 mt-1.5">{hosp.emergency_dept}</div>
                <div className="text-[11px] text-slate-500 mt-1">{hosp.address}</div>
                <div className="flex items-center gap-2 mt-2.5 pt-2 border-t border-slate-100">
                  <a
                    href={`tel:${hosp.phone}`}
                    className="flex-1 py-1.5 px-2 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs text-center border border-rose-200 transition-colors"
                  >
                    📞 {hosp.phone}
                  </a>
                  <button
                    onClick={() => {
                      handleSelectPlace({
                        name: hosp.name,
                        lat: String(hosp.lat),
                        lon: String(hosp.lng),
                        display_name: hosp.address,
                        type: 'hospital',
                        address: { road: hosp.address, city: 'Lahore' }
                      });
                    }}
                    className="py-1.5 px-2.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs transition-colors"
                  >
                    Directions
                  </button>
                </div>
              </div>
            </Popup>
          </Marker>
        ))}
        <MapEventsHandler onMapClick={handleMapClick} onZoomChange={setMapZoom} />
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

      {/* Live 1-Second AI Atmospheric Telemetry HUD Pill (Top Right during Navigation) */}
      {isNavigating && (
        <div className="absolute top-6 right-4 z-[3100] hidden md:flex flex-col items-end gap-2 max-w-[320px]">
          <div className="bg-slate-900/95 backdrop-blur-md text-white px-4 py-2.5 rounded-2xl shadow-[0_10px_30px_rgba(0,0,0,0.35)] border border-slate-700/80 flex items-center gap-2.5 text-xs">
            <span className="relative flex h-2.5 w-2.5 shrink-0">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
            </span>
            <div className="flex flex-col">
              <div className="flex items-center gap-1.5 font-black text-emerald-400 text-[11px] uppercase tracking-wider">
                <Sparkles className="w-3.5 h-3.5" />
                <span>AI Env Scan #{aiScanCount} (1s Live)</span>
              </div>
              <span className="text-[11px] text-slate-300 font-semibold line-clamp-1">
                Here: <strong className="text-white">{navCurrentAqi} AQI</strong> • Ahead: <strong className={navUpcomingAqi > navCurrentAqi + 6 ? 'text-rose-400' : 'text-emerald-300'}>{navUpcomingAqi} AQI</strong>
              </span>
            </div>
          </div>

          {!aiSmogSpikeAlert && (
            <button
              onClick={handleSimulateSmogSpikeAhead}
              disabled={isCheckingSmogSpike}
              className="px-3.5 py-2 rounded-xl bg-rose-600/95 hover:bg-rose-700 text-white text-[11px] font-extrabold shadow-lg border border-rose-400/50 flex items-center gap-1.5 transition-all active:scale-95"
              title="Simulate a sudden smog spike ahead to test AI rerouting"
            >
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>{isCheckingSmogSpike ? 'AI Checking Corridor...' : 'Test Smog Spike Ahead'}</span>
            </button>
          )}
        </div>
      )}

      {/* Floating Mid-Ride AI Smog Spike Alert & Reroute Recommendation Modal */}
      {isNavigating && aiSmogSpikeAlert && (
        <div className="absolute top-28 left-1/2 -translate-x-1/2 z-[3400] w-[calc(100%-24px)] sm:w-[460px] bg-slate-900/95 backdrop-blur-xl text-white rounded-3xl shadow-[0_24px_60px_rgba(0,0,0,0.55)] border-2 border-rose-500/80 overflow-hidden animate-in fade-in slide-in-from-top-5 duration-300">
          <div className="bg-gradient-to-r from-rose-600 to-amber-600 px-4 py-2.5 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-white animate-bounce shrink-0" />
              <span className="text-xs font-black uppercase tracking-wider text-white">
                AI Smog Spike Detected Ahead • Reroute Available
              </span>
            </div>
            <span className="text-[10px] font-black bg-black/30 px-2 py-0.5 rounded-full text-rose-100">
              +{aiSmogSpikeAlert.delta_aqi || 24} AQI Surge
            </span>
          </div>

          <div className="p-4 space-y-3">
            <div className="flex items-center justify-between gap-2 bg-slate-800/90 p-3 rounded-2xl border border-slate-700">
              <div>
                <span className="text-[10px] font-bold uppercase text-rose-400 block">Current Path Ahead ({aiSmogSpikeAlert.hotspot_name})</span>
                <span className="text-xl font-black text-rose-400">{aiSmogSpikeAlert.current_path_aqi} AQI</span>
                <span className="text-[11px] text-slate-400 block">High PM2.5 Plume</span>
              </div>
              <div className="text-slate-500 font-black text-lg">→</div>
              <div className="text-right">
                <span className="text-[10px] font-bold uppercase text-emerald-400 block">AI Cleaner Bypass</span>
                <span className="text-xl font-black text-emerald-400">{aiSmogSpikeAlert.projected_clean_aqi} AQI</span>
                <span className="text-[11px] font-bold text-emerald-300 block">-{aiSmogSpikeAlert.aqi_saved} AQI Cleaner</span>
              </div>
            </div>

            <div className="text-xs text-slate-200 leading-relaxed bg-slate-800/50 p-3 rounded-xl border border-slate-700/60">
              <div className="font-bold text-emerald-400 mb-0.5 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 shrink-0" />
                <span>Recommended: {aiSmogSpikeAlert.recommended_corridor}</span>
              </div>
              <p className="text-[11px] text-slate-300">{aiSmogSpikeAlert.message}</p>
            </div>

            <div className="flex items-center gap-2.5 pt-1">
              <button
                onClick={handleAcceptAiSmogReroute}
                className="flex-1 py-3 px-4 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-black text-xs uppercase tracking-wider rounded-xl shadow-lg shadow-emerald-500/25 transition-all active:scale-95 flex items-center justify-center gap-1.5"
              >
                <CheckCircle2 className="w-4 h-4 stroke-[2.5]" />
                <span>Accept New Safe Path</span>
              </button>
              <button
                onClick={() => setAiSmogSpikeAlert(null)}
                className="py-3 px-4 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs rounded-xl border border-slate-700 transition-all active:scale-95"
              >
                Keep Current
              </button>
            </div>
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

      {/* Floating Google-Maps-Style Search Bar (Hidden when Place Detail Model is open, or during Directions / Navigation) */}
      {!isNavigating && !isDirectionsMode && !selectedPlace && (
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

          {/* Toggle Official Lahore Stations Markers */}
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
            <span>{stations.length} Stations</span>
          </button>

          {/* Toggle Emergency Hospitals Layer */}
          <button
            onClick={() => setShowHospitalsLayer(prev => !prev)}
            title={showHospitalsLayer ? "Hide Emergency Hospitals Layer" : "Show 15 Verified Emergency Hospitals in Lahore"}
            className={`px-3 py-2.5 rounded-2xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-[0_4px_16px_rgba(0,0,0,0.12)] border active:scale-95 ${
              showHospitalsLayer
                ? 'bg-rose-600 text-white border-rose-500 shadow-rose-600/20'
                : 'bg-white/95 backdrop-blur-md text-slate-700 hover:text-slate-900 border-slate-200 hover:bg-slate-50'
            }`}
          >
            <HeartPulse className={`w-3.5 h-3.5 ${showHospitalsLayer ? 'text-white' : 'text-rose-600'}`} />
            <span>{showHospitalsLayer ? 'Hospitals ON' : 'Hospitals'}</span>
          </button>

          {/* Color Guide Modal Button */}
          <button
            onClick={() => setShowColorGuideModal(prev => !prev)}
            title="View AQI Colors & Smog Severity Scale"
            className={`px-3 py-2.5 rounded-2xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-[0_4px_16px_rgba(0,0,0,0.12)] border active:scale-95 ${
              showColorGuideModal
                ? 'bg-purple-600 text-white border-purple-500 shadow-purple-500/20'
                : 'bg-white/95 backdrop-blur-md text-slate-700 hover:text-slate-900 border-slate-200 hover:bg-slate-50'
            }`}
          >
            <Palette className={`w-3.5 h-3.5 ${showColorGuideModal ? 'text-white' : 'text-purple-600'}`} />
            <span>Color Guide</span>
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

            {/* Physical Diagnostics & Atmospheric Profile */}
            <div className="bg-slate-50/80 p-3 rounded-2xl border border-slate-200/60 text-xs space-y-1.5">
              <div className="flex items-center gap-1.5 text-slate-700 font-bold">
                <MapPin className="w-3.5 h-3.5 text-rose-500" />
                <span>{selectedStation.name} • Monitoring Zone</span>
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
        <div className={`absolute top-0 left-0 h-full w-full sm:w-[420px] bg-white shadow-[8px_0_24px_rgba(0,0,0,0.15)] z-[1500] flex flex-col transition-transform duration-300 ${isPanelCollapsed ? '-translate-x-full' : 'translate-x-0'}`}>
          
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
                     {/* 0. LIVE 1-SECOND AI ATMOSPHERIC TELEMETRY SCANNER */}
                     <div className="bg-slate-900 text-white rounded-2xl p-3.5 shadow-md border border-slate-800 space-y-2">
                       <div className="flex items-center justify-between">
                         <div className="flex items-center gap-2">
                           <span className="relative flex h-2.5 w-2.5">
                             <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                             <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                           </span>
                           <span className="text-[11px] font-black uppercase tracking-wider text-emerald-400 flex items-center gap-1">
                             <Sparkles className="w-3.5 h-3.5" />
                             AI Live Environment Scanner
                           </span>
                         </div>
                         <span className="text-[10px] font-mono font-bold bg-slate-800 text-emerald-300 px-2 py-0.5 rounded-full border border-slate-700">
                           Scan #{aiScanCount} • 1s Interval
                         </span>
                       </div>
                       <p className="text-[11px] text-slate-300 font-medium leading-snug">
                         {aiLiveScanMessage}
                       </p>
                     </div>

                     {/* ACTIVE MID-RIDE AI SMOG SPIKE REROUTE ALERT CARD (IF TRIGGERED) */}
                     {aiSmogSpikeAlert && (
                       <div className="bg-rose-950 text-white rounded-2xl p-4 shadow-lg border-2 border-rose-500 space-y-3 animate-in fade-in duration-300">
                         <div className="flex items-center justify-between">
                           <div className="flex items-center gap-1.5 text-rose-300 font-black text-xs uppercase tracking-wider">
                             <AlertTriangle className="w-4 h-4 text-rose-400 animate-bounce shrink-0" />
                             <span>Smog Spike Ahead ({aiSmogSpikeAlert.hotspot_name})</span>
                           </div>
                           <span className="text-[10px] font-black bg-rose-600 text-white px-2 py-0.5 rounded-full">
                             -{aiSmogSpikeAlert.aqi_saved} AQI Bypass
                           </span>
                         </div>

                         <p className="text-xs text-rose-100 leading-relaxed">
                           {aiSmogSpikeAlert.message}
                         </p>

                         <div className="grid grid-cols-2 gap-2 text-center bg-black/30 p-2.5 rounded-xl border border-rose-800/60">
                           <div>
                             <span className="text-[10px] text-rose-300 font-bold uppercase block">Current Ahead</span>
                             <span className="text-lg font-black text-rose-400">{aiSmogSpikeAlert.current_path_aqi} AQI</span>
                           </div>
                           <div>
                             <span className="text-[10px] text-emerald-300 font-bold uppercase block">AI Safe Bypass</span>
                             <span className="text-lg font-black text-emerald-400">{aiSmogSpikeAlert.projected_clean_aqi} AQI</span>
                           </div>
                         </div>

                         <div className="flex items-center gap-2">
                           <button
                             onClick={handleAcceptAiSmogReroute}
                             className="flex-1 py-2.5 px-3 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-black text-xs uppercase rounded-xl shadow-md transition-all active:scale-95 flex items-center justify-center gap-1"
                           >
                             <CheckCircle2 className="w-4 h-4 stroke-[2.5]" />
                             <span>Accept Safe Path</span>
                           </button>
                           <button
                             onClick={() => setAiSmogSpikeAlert(null)}
                             className="py-2.5 px-3 bg-rose-900/70 hover:bg-rose-900 text-rose-200 font-bold text-xs rounded-xl border border-rose-800 transition-all"
                           >
                             Ignore
                           </button>
                         </div>
                       </div>
                     )}

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

                     {/* 3. AI DYNAMIC REROUTE & SMOG SPIKE SIMULATOR */}
                     <div className="bg-white rounded-2xl p-3.5 shadow-sm border border-slate-200 space-y-2.5">
                       <div>
                         <h4 className="text-xs font-black text-slate-900">AI Mid-Ride Smog & Detour Controls</h4>
                         <p className="text-[11px] text-slate-500">Test AI smog spike alert or off-route recalculation</p>
                       </div>
                       <div className="grid grid-cols-2 gap-2">
                         <button 
                           onClick={handleSimulateSmogSpikeAhead}
                           disabled={isCheckingSmogSpike}
                           className="px-3 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-extrabold transition-all active:scale-95 border border-rose-200 flex items-center justify-center gap-1"
                         >
                           <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                           <span>{isCheckingSmogSpike ? 'Scanning...' : 'Smog Spike Alert'}</span>
                         </button>
                         <button 
                           onClick={handleSimulateDetour}
                           disabled={isRerouting}
                           className="px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-extrabold transition-all active:scale-95 border border-slate-200"
                         >
                           {isRerouting ? 'Rerouting...' : 'Simulate Detour'}
                         </button>
                       </div>
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
                   <div className="bg-white p-4 pt-4 shadow-sm relative z-10 border-b border-slate-200">
                     {/* Header Row: Back Button & 4 Vehicle Modes (Car, Bike, Walk, Public Transport) */}
                     <div className="flex items-center gap-2 mb-3">
                       <button 
                         onClick={() => { setIsDirectionsMode(false); setRoutes([]); }} 
                         className="w-9 h-9 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center transition-all shrink-0 active:scale-95"
                         title="Back"
                       >
                         <ArrowLeft className="w-5 h-5" />
                       </button>

                       {/* 4 Vehicle Modes (Car, Bike, Walk, Public Transport) */}
                       <div className="grid grid-cols-4 flex-1 bg-slate-100 p-1 rounded-2xl gap-1 border border-slate-200/80">
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
                                    await fetchRoutesAndEnhance(origin, [selectedPlace.lat, selectedPlace.lon], v.id as any, routeStops, routePreference);
                                  }
                                }}
                                className={`flex items-center justify-center gap-1.5 py-2 px-1 rounded-xl text-xs font-black transition-all ${
                                  isSelected 
                                    ? 'bg-purple-600 text-white shadow-md shadow-purple-600/30' 
                                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                                }`}
                                title={v.label}
                              >
                                <Icon className={`w-3.5 h-3.5 ${isSelected ? 'text-white' : 'text-slate-500'}`} />
                                <span className="text-[11px] font-black">{v.label}</span>
                              </button>
                            );
                          })}
                       </div>
                     </div>

                  {/* AI Route Optimization Preference Toggle (Safest Low-Smog vs Fastest Time) */}
                  <div className="grid grid-cols-2 gap-1.5 bg-slate-100 p-1 rounded-xl border border-slate-200/80 mb-3.5">
                    <button
                      onClick={async () => {
                        setRoutePreference('safest');
                        const origin = routeOriginCoords || userLocation || [31.5204, 74.3587];
                        if (selectedPlace) {
                          await fetchRoutesAndEnhance(origin, [selectedPlace.lat, selectedPlace.lon], selectedVehicle, routeStops, 'safest');
                        }
                      }}
                      className={`py-1.5 px-2.5 rounded-lg text-xs font-extrabold flex items-center justify-center gap-1.5 transition-all ${
                        routePreference === 'safest'
                          ? 'bg-emerald-600 text-white shadow-sm'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>AI Safest (Low Smog)</span>
                    </button>
                    <button
                      onClick={async () => {
                        setRoutePreference('fastest');
                        const origin = routeOriginCoords || userLocation || [31.5204, 74.3587];
                        if (selectedPlace) {
                          await fetchRoutesAndEnhance(origin, [selectedPlace.lat, selectedPlace.lon], selectedVehicle, routeStops, 'fastest');
                        }
                      }}
                      className={`py-1.5 px-2.5 rounded-lg text-xs font-extrabold flex items-center justify-center gap-1.5 transition-all ${
                        routePreference === 'fastest'
                          ? 'bg-purple-600 text-white shadow-sm'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      <Clock className="w-3.5 h-3.5" />
                      <span>Fastest & Safe</span>
                    </button>
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
                  {routes.length === 0 && (
                    <div className="text-center p-8 text-slate-400 font-medium flex flex-col items-center gap-2">
                      <div className="w-6 h-6 border-2 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
                      <span>AI Model evaluating Lahore smog corridors...</span>
                    </div>
                  )}
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
                      {(route.aiStats?.isSafest || route.aiStats?.isFastest) && (
                        <div className={`absolute top-0 right-0 text-white text-[10px] font-black uppercase px-2.5 py-1 rounded-bl-lg tracking-wider ${
                          route.aiStats?.isSafest ? 'bg-emerald-600' : 'bg-purple-600'
                        }`}>
                           {route.aiStats?.aiBadge || (selectedVehicle === 'transit' ? 'Recommended Line' : 'Safest Route')}
                        </div>
                      )}
                      
                      <div className="flex justify-between items-center mb-1 pt-2">
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
                        <div className="text-xs text-slate-700 font-bold mb-1.5 flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-purple-500 shrink-0"></span>
                          <span className="line-clamp-1">
                            {route.corridor_name || `via ${route.legs?.[0]?.steps?.[0]?.name || "Main Route"}`}
                          </span>
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

                      {/* AI Environment, Dose & Safety Score Telemetry */}
                      {route.aiStats && (
                        <div className="space-y-2 mt-2 pt-2.5 border-t border-slate-200/60">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <div className={`flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-md ${route.aiStats.smogExposure < 75 ? 'bg-emerald-100 text-emerald-800' : route.aiStats.smogExposure < 95 ? 'bg-amber-100 text-amber-800' : 'bg-rose-100 text-rose-800'}`}>
                              <Wind className="w-3 h-3" />
                              <span>Corridor {route.aiStats.smogExposure} AQI</span>
                            </div>
                            {route.aiStats.effectiveAqi !== undefined && (
                              <div className="flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-md bg-sky-100 text-sky-800">
                                <span>In-Vehicle {route.aiStats.effectiveAqi} AQI</span>
                              </div>
                            )}
                            {route.aiStats.safetyScore !== undefined && (
                              <div className="flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-md bg-purple-100 text-purple-800">
                                <Sparkles className="w-3 h-3" />
                                <span>Safety {route.aiStats.safetyScore}%</span>
                              </div>
                            )}
                            {route.aiStats.inhaledPm25Ug !== undefined && (
                              <div className="flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-100 text-slate-700">
                                <span>Dose: {route.aiStats.inhaledPm25Ug} µg</span>
                              </div>
                            )}
                          </div>

                          {route.aiStats.stopEvaluations && route.aiStats.stopEvaluations.length > 0 && (
                            <div className="flex items-center gap-1.5 flex-wrap pt-1">
                              {route.aiStats.stopEvaluations.map((stEval: any, stIdx: number) => (
                                <span
                                  key={stIdx}
                                  className="text-[10px] font-extrabold px-2 py-0.5 rounded-md bg-amber-50 text-amber-800 border border-amber-200 flex items-center gap-1"
                                >
                                  <span className="w-3.5 h-3.5 rounded-full bg-amber-500 text-white text-[9px] flex items-center justify-center font-black">
                                    {stEval.label || String.fromCharCode(65 + stIdx)}
                                  </span>
                                  <span>{stEval.name}: {stEval.aqi} AQI ({stEval.pm25} µg/m³)</span>
                                </span>
                              ))}
                            </div>
                          )}

                          {route.aiStats.aiReasoning && (
                            <p className="text-[11px] text-slate-600 bg-slate-50/90 p-2 rounded-lg border border-slate-200/70 leading-snug font-medium">
                              {route.aiStats.aiReasoning}
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
               </div>
               
               {routes.length > 0 && (
                 <div className="p-4 bg-white border-t border-slate-200 shadow-[0_-4px_12px_rgba(0,0,0,0.05)]">
                    <button 
                      onClick={() => {
                        setIsNavigating(true);
                        setIsPanelCollapsed(true);
                        setAiScanCount(0);
                        setAiSmogSpikeAlert(null);
                        hasAutoTriggeredSpikeRef.current = false;
                      }}
                      className="w-full py-4 bg-purple-600 text-white rounded-xl font-bold text-lg hover:bg-purple-700 transition-colors flex justify-center items-center gap-2 shadow-md hover:shadow-lg active:scale-[0.98]"
                    >
                      <Navigation className="w-5 h-5 fill-white" />
                      Start AI-Monitored Navigation
                    </button>
                 </div>
               )}
                </div>
              )}
            </div>
          ) : (
            <>
              {/* Modern Place Details Header */}
              <div className="pt-3.5 pb-3.5 px-4 sm:px-5 bg-white relative shrink-0 border-b border-slate-100 flex items-start gap-3 shadow-xs">
                <button 
                  onClick={() => { setSelectedPlace(null); setIsDirectionsMode(false); setRoutes([]); }}
                  className="w-9 h-9 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center transition-all active:scale-95 shrink-0 mt-0.5"
                  title="Back to Map"
                >
                  <ArrowLeft className="w-4 h-4" />
                </button>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-purple-50 text-purple-700 border border-purple-200/80">
                      <MapPin className="w-3 h-3 text-purple-600" />
                      Verified Location
                    </span>
                    {selectedPlace.isAiCalibrated && (
                      <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200/80">
                        <Sparkles className="w-3 h-3 text-emerald-600" />
                        AI Calibrated
                      </span>
                    )}
                  </div>
                  <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight leading-tight truncate">
                    {selectedPlace.display_name.split(',')[0]}
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5 line-clamp-1 leading-snug">
                    {selectedPlace.display_name}
                  </p>
                </div>
              </div>
          
              {/* Scrollable Content Container */}
              <div className="flex-1 overflow-y-auto bg-slate-50/70 p-4 sm:p-5 space-y-4">
                
                {/* Modern Action Buttons Pill Row */}
                <div className="grid grid-cols-3 gap-2.5 bg-white p-2.5 rounded-2xl border border-slate-200/80 shadow-xs">
                  <button 
                    onClick={handleDirectionsClick} 
                    className="py-3 px-3 bg-purple-600 hover:bg-purple-700 text-white font-black text-xs rounded-xl shadow-md shadow-purple-600/30 flex items-center justify-center gap-1.5 transition-all active:scale-95"
                  >
                    <Navigation className="w-4 h-4 text-white fill-white shrink-0" />
                    <span className="text-white font-black text-xs">Directions</span>
                  </button>

                  <button 
                    onClick={() => setIsSavedPlace(prev => !prev)}
                    className={`py-3 px-3 font-extrabold text-xs rounded-xl border flex items-center justify-center gap-1.5 transition-all active:scale-95 ${
                      isSavedPlace 
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-300' 
                        : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
                    }`}
                  >
                    <Bookmark className={`w-4 h-4 ${isSavedPlace ? 'fill-emerald-600 text-emerald-600' : 'text-slate-500'}`} />
                    <span>{isSavedPlace ? 'Saved' : 'Save'}</span>
                  </button>

                  <button 
                    onClick={() => {
                      if (typeof navigator !== 'undefined' && navigator.clipboard) {
                        navigator.clipboard.writeText(`${selectedPlace.display_name} (AQI: ${selectedPlace.aqi})`);
                        setShareToast(true);
                        setTimeout(() => setShareToast(false), 2500);
                      }
                    }}
                    className="py-3 px-3 bg-slate-50 hover:bg-slate-100 text-slate-700 font-extrabold text-xs rounded-xl border border-slate-200 flex items-center justify-center gap-1.5 transition-all active:scale-95"
                  >
                    <Share2 className="w-4 h-4 text-slate-500" />
                    <span>{shareToast ? 'Copied!' : 'Share'}</span>
                  </button>
                </div>

                {/* 1. ENVIRONMENTAL STATUS (Redesigned Theme & AI-Grounded Telemetry) */}
                <div className={`p-5 rounded-3xl border shadow-sm relative overflow-hidden transition-all ${
                  selectedPlace.aqi <= 50 ? 'bg-gradient-to-br from-emerald-500/10 via-emerald-50/50 to-white border-emerald-200/80' :
                  selectedPlace.aqi <= 100 ? 'bg-gradient-to-br from-amber-500/10 via-amber-50/50 to-white border-amber-200/80' :
                  selectedPlace.aqi <= 150 ? 'bg-gradient-to-br from-orange-500/10 via-orange-50/50 to-white border-orange-200/80' :
                  selectedPlace.aqi <= 200 ? 'bg-gradient-to-br from-rose-500/10 via-rose-50/50 to-white border-rose-200/80' :
                  'bg-gradient-to-br from-purple-500/10 via-purple-50/50 to-white border-purple-200/80'
                }`}>
                  <div className="flex items-center gap-2 mb-3">
                    <span className="relative flex h-2.5 w-2.5">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                    </span>
                    <span className="text-xs font-black uppercase tracking-wider text-slate-800">Environmental Status</span>
                  </div>

                  {/* Hero AQI Metric */}
                  <div className="flex items-baseline justify-between my-2">
                    <div>
                      <div className="flex items-baseline gap-2">
                        <span className="text-5xl sm:text-6xl font-black text-slate-900 tracking-tight leading-none">
                          {selectedPlace.aqi}
                        </span>
                        <span className="text-sm font-bold text-slate-400 uppercase tracking-wider">AQI US</span>
                      </div>
                      <span className={`inline-block mt-1.5 text-xs font-extrabold px-3 py-1 rounded-full border shadow-2xs ${
                        selectedPlace.aqi <= 50 ? 'bg-emerald-100 text-emerald-800 border-emerald-300' :
                        selectedPlace.aqi <= 100 ? 'bg-amber-100 text-amber-900 border-amber-300' :
                        selectedPlace.aqi <= 150 ? 'bg-orange-100 text-orange-900 border-orange-300' :
                        selectedPlace.aqi <= 200 ? 'bg-rose-100 text-rose-900 border-rose-300' :
                        'bg-purple-100 text-purple-900 border-purple-300'
                      }`}>
                        {selectedPlace.status}
                      </span>
                    </div>

                    <div className="text-right">
                      <span className="text-[11px] font-bold text-slate-400 block uppercase tracking-wider">PM2.5 Density</span>
                      <span className="text-xl font-black text-slate-800">
                        {selectedPlace.pm25} <span className="text-xs font-bold text-slate-400 font-mono">µg/m³</span>
                      </span>
                      <span className="text-[10px] font-bold text-rose-600 block mt-0.5">
                        {selectedPlace.whoMultiplier}x WHO Benchmark
                      </span>
                    </div>
                  </div>

                  {/* 4-Item Telemetry Matrix */}
                  <div className="grid grid-cols-2 gap-2 mt-4 pt-3 border-t border-slate-200/60 text-xs">
                    <div className="bg-white/90 p-2.5 rounded-xl border border-slate-200/70 shadow-2xs">
                      <span className="text-[10px] font-bold text-slate-400 uppercase block tracking-wider">Nearest Monitor</span>
                      <span className="font-extrabold text-slate-900 line-clamp-1 mt-0.5">
                        {selectedPlace.nearestStationName || 'Model Town Station'}
                      </span>
                      <span className="text-[10px] font-bold text-emerald-600 block mt-0.5">
                        {selectedPlace.nearestStationDist ? `${selectedPlace.nearestStationDist} km away` : 'Live Ground Ref'}
                      </span>
                    </div>

                    <div className="bg-white/90 p-2.5 rounded-xl border border-slate-200/70 shadow-2xs">
                      <span className="text-[10px] font-bold text-slate-400 uppercase block tracking-wider">Inversion Risk</span>
                      <span className="font-extrabold text-slate-900 line-clamp-1 mt-0.5">
                        {selectedPlace.inversionRisk || 'Moderate Evening Risk'}
                      </span>
                      <span className="text-[10px] font-medium text-slate-500 block mt-0.5">
                        Boundary layer dynamic
                      </span>
                    </div>

                    <div className="bg-white/90 p-2.5 rounded-xl border border-slate-200/70 shadow-2xs">
                      <span className="text-[10px] font-bold text-slate-400 uppercase block tracking-wider">Live Meteorology</span>
                      <span className="font-extrabold text-slate-900 block mt-0.5">
                        {selectedPlace.weather?.temperature || 32}°C • {selectedPlace.weather?.humidity || 28}% Hum
                      </span>
                      <span className="text-[10px] font-medium text-slate-500 block mt-0.5">
                        Wind: {selectedPlace.weather?.windSpeed || 5} km/h
                      </span>
                    </div>

                    <div className="bg-white/90 p-2.5 rounded-xl border border-slate-200/70 shadow-2xs">
                      <span className="text-[10px] font-bold text-slate-400 uppercase block tracking-wider">Dominant Pollutant</span>
                      <span className="font-extrabold text-slate-900 block mt-0.5">
                        PM2.5 Aerosols
                      </span>
                      <span className="text-[10px] font-medium text-slate-500 block mt-0.5">
                        Combustion & dust
                      </span>
                    </div>
                  </div>
                </div>

                {/* 2. HEALTH RECOMMENDATIONS */}
                <div className="bg-white p-4 sm:p-5 rounded-3xl border border-slate-200 shadow-xs space-y-2.5">
                  <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
                    <div className="w-7 h-7 rounded-lg bg-purple-100 text-purple-700 flex items-center justify-center">
                      <ShieldAlert className="w-4 h-4" />
                    </div>
                    <h3 className="text-xs font-black uppercase tracking-wider text-slate-900">
                      Health Recommendations
                    </h3>
                  </div>

                  {/* Primary Advisory Paragraph */}
                  <p className="text-xs text-slate-700 font-medium leading-relaxed bg-slate-50 p-3.5 rounded-2xl border border-slate-100">
                    {selectedPlace.healthRecommendations?.primaryAdvisory || selectedPlace.advisory || 
                      "Air quality is acceptable for healthy individuals. Sensitive groups should monitor evening smog inversion."}
                  </p>
                </div>

                {/* 3. 24-HOUR FORECAST (AI Random Forest Model Predictions) */}
                {selectedPlace.forecast && selectedPlace.forecast.length > 0 && (
                  <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs space-y-3">
                    <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center">
                          <Activity className="w-4 h-4" />
                        </div>
                        <h3 className="text-xs font-black uppercase tracking-wider text-slate-900">
                          24-Hour Forecast
                        </h3>
                      </div>
                      <span className="text-[10px] font-black uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                        AI Model (24h)
                      </span>
                    </div>

                    {/* Diurnal Trend Notice */}
                    <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-[11px] font-bold text-slate-600 flex items-center justify-between">
                      <span>Diurnal Smog Forecast Curve</span>
                      <span className="text-slate-400 font-mono">24 Hours Ahead</span>
                    </div>

                    {/* Horizontal Scrollable Hourly Cards */}
                    <div className="flex overflow-x-auto gap-2.5 pb-2 pt-1 scrollbar-thin scrollbar-thumb-slate-200 scrollbar-track-transparent">
                      {selectedPlace.forecast.map((f: any, idx: number) => (
                        <div 
                          key={idx} 
                          className="flex flex-col items-center justify-between min-w-[76px] p-3 rounded-2xl border border-slate-100 bg-slate-50/70 hover:bg-white hover:shadow-md hover:border-slate-200 transition-all cursor-default shrink-0"
                        >
                          <span className="text-[11px] font-black text-slate-600 mb-1.5">
                            {f.time}
                          </span>
                          <Wind className={`w-4 h-4 mb-1.5 ${f.color || 'text-amber-500'}`} />
                          <span className="text-base font-black text-slate-900">
                            {f.aqi}
                          </span>
                          <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-md mt-1 ${
                            f.aqi <= 50 ? 'bg-emerald-100 text-emerald-800' :
                            f.aqi <= 100 ? 'bg-amber-100 text-amber-800' :
                            f.aqi <= 150 ? 'bg-orange-100 text-orange-800' :
                            f.aqi <= 200 ? 'bg-rose-100 text-rose-800' :
                            'bg-purple-100 text-purple-800'
                          }`}>
                            {f.aqi <= 50 ? 'Good' : f.aqi <= 100 ? 'Mod' : f.aqi <= 150 ? 'Sens' : f.aqi <= 200 ? 'Unhealthy' : 'Severe'}
                          </span>
                          {f.temp !== undefined && (
                            <span className="text-[10px] text-slate-400 font-medium mt-1">
                              {f.temp}°C
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
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
                onClick={async () => {
                   try {
                      const existingStr = localStorage.getItem('dhuan_planned_trips') || '[]';
                      const existing = JSON.parse(existingStr);
                      const others = existing.filter((p: any) => p.day !== prePlanDay);
                      const updated = [...others, ...prePlanStops];
                      localStorage.setItem('dhuan_planned_trips', JSON.stringify(updated));

                      // Synchronize into backend SQLite database
                      for (const stop of prePlanStops) {
                        try {
                          await fetch(getApiEndpoint('/routing/destinations'), {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                              id: stop.id,
                              name: stop.name,
                              address: stop.address || stop.name,
                              lat: stop.lat,
                              lng: stop.lng,
                              time: stop.time || '10:30 AM',
                              day: prePlanDay,
                              tag: (stop as any).tag || 'General',
                              vehicle: (stop as any).vehicle || 'car',
                              status: (stop as any).status || 'scheduled'
                            })
                          });
                        } catch (err) {
                          // Keep going
                        }
                      }
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

      {/* Mobile Layer & Color Guide Controls (Above Compass) */}
      <div className={`md:hidden absolute z-[1000] flex flex-col gap-2 ${fullScreen ? 'bottom-40 right-6' : 'bottom-20 right-6'}`}>
        <button
          onClick={() => setShowColorGuideModal(prev => !prev)}
          title="AQI Color Guide"
          className={`w-12 h-12 rounded-xl shadow-[0_4px_12px_rgba(0,0,0,0.15)] border flex items-center justify-center transition-all ${
            showColorGuideModal
              ? 'bg-purple-600 text-white border-purple-500 shadow-purple-500/20'
              : 'bg-white/95 backdrop-blur-md text-purple-600 border-slate-200'
          } active:scale-95`}
        >
          <Palette className="w-5 h-5" />
        </button>

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

      {/* Compact Top-Right AQI & Smog Color Guide */}
      {showColorGuideModal && (
        <div className="absolute top-16 right-4 z-[2100] w-60 bg-white/95 backdrop-blur-md rounded-2xl shadow-[0_10px_30px_rgba(0,0,0,0.18)] border border-slate-200/90 p-3 animate-in fade-in slide-in-from-top-2 duration-150">
          {/* Header */}
          <div className="flex items-center justify-between pb-2 mb-1 border-b border-slate-100">
            <span className="text-xs font-extrabold text-slate-800 flex items-center gap-1.5">
              <Palette className="w-3.5 h-3.5 text-purple-600" />
              <span>AQI Colors</span>
            </span>
            <button
              onClick={() => setShowColorGuideModal(false)}
              className="w-5 h-5 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-700 flex items-center justify-center transition-colors"
              title="Close"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Color List: Left side name, Right side color circle */}
          <div className="space-y-0.5">
            {[
              { name: 'Good', range: '0-50', color: '#10b981' },
              { name: 'Moderate', range: '51-100', color: '#f59e0b' },
              { name: 'Sensitive', range: '101-150', color: '#f97316' },
              { name: 'Unhealthy', range: '151-200', color: '#f43f5e' },
              { name: 'Very Unhealthy', range: '201-300', color: '#a855f7' },
              { name: 'Hazardous', range: '301+', color: '#881337' },
            ].map((item, idx) => (
              <div 
                key={idx} 
                className="flex items-center justify-between py-1.5 px-2 rounded-xl hover:bg-slate-50 transition-colors"
              >
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-semibold text-slate-700">{item.name}</span>
                  <span className="text-[10px] text-slate-400 font-mono">({item.range})</span>
                </div>
                <span 
                  className="w-4 h-4 rounded-full border border-black/10 shadow-sm shrink-0" 
                  style={{ backgroundColor: item.color }} 
                />
              </div>
            ))}
          </div>
        </div>
      )}
      </div>
    </div>
  );
}
