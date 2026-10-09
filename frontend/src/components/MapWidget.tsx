'use client';

import { useEffect, useState, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Circle, Pane } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix for default marker icons in Leaflet with Next.js
const customIcon = new L.Icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

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

export default function MapWidget() {
  const [mounted, setMounted] = useState(false);
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null);
  
  // Fix: Use useRef instead of useState to prevent multiple re-renders and React 19 lifecycle crashes
  const mapRef = useRef<L.Map | null>(null);
  const [hasCentered, setHasCentered] = useState(false);

  useEffect(() => {
    setMounted(true);
    
    // Live Location Tracking
    if (typeof window !== 'undefined' && navigator.geolocation) {
      const watchId = navigator.geolocation.watchPosition(
        (position) => {
          setUserLocation([position.coords.latitude, position.coords.longitude]);
        },
        (error) => console.log("Geolocation error:", error),
        { enableHighAccuracy: true, maximumAge: 10000, timeout: 5000 }
      );
      
      return () => navigator.geolocation.clearWatch(watchId);
    }
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
  }, [mounted]);

  // Note: We do NOT manually call mapRef.current.remove() on unmount.
  // react-leaflet handles its own cleanup. Doing so manually breaks it in StrictMode.

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

  return (
    <div className="w-full h-full min-h-[500px] lg:min-h-[600px] flex-1 rounded-2xl overflow-hidden shadow-sm border border-slate-200 relative z-0">
      <div className="absolute inset-0">
        <MapContainer 
          center={position} 
          zoom={12} 
          scrollWheelZoom={true} 
          zoomControl={false}
          style={{ height: '100%', width: '100%' }}
          ref={mapRef}
        >
          {/* Standard OpenStreetMap Tiles (No API Key Required) */}
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution="&copy; <a href='https://www.openstreetmap.org/copyright'>OpenStreetMap</a> contributors"
          />

        {/* Live User Location Marker */}
        {userLocation && (
          <Marker position={userLocation} icon={blueDotIcon} zIndexOffset={1000}>
            <Popup>
               <div className="font-bold text-slate-900 text-sm">You are here</div>
               <div className="text-slate-500 text-xs">Live GPS Location</div>
               <div className="bg-yellow-50 text-yellow-700 px-2 py-1.5 rounded-md text-xs font-bold border border-yellow-200 mt-2">
                 Environment: AQI 165 (Unhealthy)
               </div>
               <div className="text-[10px] text-slate-500 mt-1.5 leading-tight">
                 AI Advice: Wear a mask if traveling outdoors today.
               </div>
            </Popup>
          </Marker>
        )}

        {/* Simulated Air Quality / Smog Layer */}
        {/* Normal blend mode with 0.4 opacity keeps Google Maps colors intact while showing smog clouds */}
        <Pane name="smogLayer" style={{ filter: 'blur(35px)', opacity: 0.45, pointerEvents: 'none', zIndex: 400 }}>
            {/* Hazardous Zone (Deep Red) */}
            <Circle center={[31.4697, 74.2728]} pathOptions={{ stroke: false, fillColor: '#9f1239', fillOpacity: 0.8 }} radius={3500} />
            <Circle center={[31.4500, 74.2500]} pathOptions={{ stroke: false, fillColor: '#be123c', fillOpacity: 0.7 }} radius={4500} />
            <Circle center={[31.4200, 74.2800]} pathOptions={{ stroke: false, fillColor: '#e11d48', fillOpacity: 0.6 }} radius={5000} />
            
            {/* Very Unhealthy Zone (Red/Orange) */}
            <Circle center={[31.5204, 74.3187]} pathOptions={{ stroke: false, fillColor: '#ea580c', fillOpacity: 0.7 }} radius={3500} />
            <Circle center={[31.5500, 74.3300]} pathOptions={{ stroke: false, fillColor: '#f97316', fillOpacity: 0.6 }} radius={4500} />
            <Circle center={[31.4900, 74.3400]} pathOptions={{ stroke: false, fillColor: '#ea580c', fillOpacity: 0.5 }} radius={4000} />

            {/* Unhealthy Zone (Yellow/Orange) */}
            <Circle center={[31.4800, 74.3800]} pathOptions={{ stroke: false, fillColor: '#eab308', fillOpacity: 0.6 }} radius={6000} />
            <Circle center={[31.5400, 74.3800]} pathOptions={{ stroke: false, fillColor: '#facc15', fillOpacity: 0.5 }} radius={5000} />
            
            {/* Moderate/Safe Zone (Green) */}
            <Circle center={[31.5204, 74.4287]} pathOptions={{ stroke: false, fillColor: '#10b981', fillOpacity: 0.5 }} radius={5500} />
            <Circle center={[31.5800, 74.4500]} pathOptions={{ stroke: false, fillColor: '#34d399', fillOpacity: 0.4 }} radius={6500} />
            <Circle center={[31.5500, 74.4800]} pathOptions={{ stroke: false, fillColor: '#6ee7b7', fillOpacity: 0.4 }} radius={6000} />
        </Pane>
      </MapContainer>

      {/* Compass Icon (Top Left) */}
      <div 
        onClick={handleCompassClick}
        title="Find My Location"
        className="absolute top-4 left-4 z-[1000] w-10 h-10 bg-white/95 backdrop-blur-sm rounded-full shadow-lg border border-slate-200 flex items-center justify-center cursor-pointer hover:bg-slate-50 transition-all hover:scale-105 active:scale-95"
      >
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 text-slate-700">
           <path d="M12 2.25l4.5 10.5-4.5-2.25-4.5 2.25L12 2.25z" className="text-red-500" />
           <path d="M12 21.75l-4.5-10.5 4.5 2.25 4.5-2.25-4.5 10.5z" className="text-slate-400" />
        </svg>
      </div>

      {/* Right Side UI Column */}
      <div className="absolute top-4 right-4 z-[1000] flex flex-col gap-2">
        {/* Floating UI Legend */}
        <div className="bg-white/95 backdrop-blur-sm p-3 rounded-xl shadow-lg border border-slate-200">
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">Live AQI Zones</p>
            <div className="space-y-2">
               <div className="flex items-center gap-2">
                   <div className="w-3 h-3 rounded-full bg-rose-700 opacity-70"></div>
                   <span className="text-xs font-medium text-slate-700">Hazardous (300+)</span>
               </div>
               <div className="flex items-center gap-2">
                   <div className="w-3 h-3 rounded-full bg-orange-500 opacity-70"></div>
                   <span className="text-xs font-medium text-slate-700">Very Unhealthy (200+)</span>
               </div>
               <div className="flex items-center gap-2">
                   <div className="w-3 h-3 rounded-full bg-yellow-500 opacity-70"></div>
                   <span className="text-xs font-medium text-slate-700">Unhealthy (150+)</span>
               </div>
               <div className="flex items-center gap-2">
                   <div className="w-3 h-3 rounded-full bg-emerald-500 opacity-70"></div>
                   <span className="text-xs font-medium text-slate-700">Moderate (&lt;150)</span>
               </div>
            </div>
        </div>

        {/* Live User Environment Panel (Compact) */}
        {userLocation && (
          <div className="bg-white/95 backdrop-blur-sm p-3 rounded-xl shadow-lg border border-slate-200 w-full">
            <div className="flex items-center justify-between mb-1">
               <span className="text-[10px] font-bold text-blue-600 uppercase tracking-widest">You</span>
               <div className="relative flex h-2 w-2">
                 <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                 <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
               </div>
            </div>
            <div className="font-bold text-slate-900 text-xs">AQI: 165 <span className="text-yellow-600 font-semibold">(Unhealthy)</span></div>
          </div>
        )}
      </div>
      </div>
    </div>
  );
}
