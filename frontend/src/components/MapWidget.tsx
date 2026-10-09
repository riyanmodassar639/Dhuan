'use client';

import { useEffect, useState, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Circle, Pane, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { Search, MapPin, X, Navigation, Info, Image as ImageIcon, Wind, ShieldAlert, Activity, Bookmark, Share2 } from 'lucide-react';

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

export default function MapWidget({ fullScreen = false }: { fullScreen?: boolean }) {
  const [mounted, setMounted] = useState(false);
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null);
  
  const mapRef = useRef<L.Map | null>(null);
  const [hasCentered, setHasCentered] = useState(false);

  // Search State
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedPlace, setSelectedPlace] = useState<any | null>(null);
  const [hasSearched, setHasSearched] = useState(false);
  const skipNextSearch = useRef(false);

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
              // Fallback to ArcGIS World Geocoding Service if Photon finds nothing
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
                })
                .catch(() => {
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
    
    // Simulate AQI based on random values for realism in the demo
    const aqiVal = Math.floor(Math.random() * 250) + 50; 
    let status = 'Moderate'; let color = 'text-emerald-700'; let bg = 'bg-emerald-50'; let border = 'border-emerald-200';
    if (aqiVal > 150) { status = 'Unhealthy'; color = 'text-yellow-700'; bg = 'bg-yellow-50'; border = 'border-yellow-200'; }
    if (aqiVal > 200) { status = 'Very Unhealthy'; color = 'text-orange-700'; bg = 'bg-orange-50'; border = 'border-orange-200'; }
    if (aqiVal > 300) { status = 'Hazardous'; color = 'text-rose-700'; bg = 'bg-rose-50'; border = 'border-rose-200'; }

    // Generate 24h mock forecast
    const forecast = [];
    let currentAqi = aqiVal;
    for (let i = 1; i <= 24; i++) {
       currentAqi += Math.floor(Math.random() * 21) - 10;
       if (currentAqi < 10) currentAqi = 10;
       
       let statusColor = 'text-emerald-500';
       if (currentAqi > 150) statusColor = 'text-yellow-500';
       if (currentAqi > 200) statusColor = 'text-orange-500';
       if (currentAqi > 300) statusColor = 'text-rose-500';
       
       const d = new Date();
       d.setHours(d.getHours() + i);
       forecast.push({
          time: d.toLocaleString('en-US', { hour: 'numeric', hour12: true }),
          aqi: currentAqi,
          color: statusColor
       });
    }

    setSelectedPlace({
      ...place,
      lat, lon,
      aqi: aqiVal,
      status, color, bg, border,
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

  // Component to handle map clicks for Reverse Geocoding
  const MapClickHandler = () => {
    useMapEvents({
      click: async (e) => {
        const { lat, lng } = e.latlng;
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
      }
    });
    return null;
  };

  return (
    <div className={`w-full h-full flex-1 relative z-0 ${fullScreen ? '' : 'min-h-[500px] lg:min-h-[600px] rounded-2xl overflow-hidden shadow-sm border border-slate-200'}`}>
      <div className="absolute inset-0">
        <MapContainer 
          center={position} 
          zoom={12} 
          scrollWheelZoom={true} 
          zoomControl={false}
          style={{ height: '100%', width: '100%' }}
          ref={mapRef}
        >
          {/* Google Maps Style Tiles (English Labels) */}
          <TileLayer
            url="https://mt1.google.com/vt/lyrs=m&hl=en&x={x}&y={y}&z={z}"
            attribution="&copy; Google Maps"
          />

        {/* Live User Location Marker */}
        {userLocation && (
          <Marker position={userLocation} icon={blueDotIcon} zIndexOffset={1000}>
            <Popup>
               <div className="font-bold text-slate-900 text-sm">You are here</div>
               <div className="text-slate-500 text-xs">Live GPS Location</div>
            </Popup>
          </Marker>
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

        {/* Simulated Air Quality / Smog Layer */}
        {/* Adjusted for higher visibility and distinction between zones */}
        <Pane name="smogLayer" style={{ filter: 'blur(20px)', opacity: 0.65, pointerEvents: 'none', zIndex: 400 }}>
            {/* Hazardous Zone (Deep Red) */}
            <Circle center={[31.4697, 74.2728]} pathOptions={{ stroke: false, fillColor: '#9f1239', fillOpacity: 1 }} radius={3200} />
            <Circle center={[31.4500, 74.2500]} pathOptions={{ stroke: false, fillColor: '#be123c', fillOpacity: 0.9 }} radius={4000} />
            <Circle center={[31.4200, 74.2800]} pathOptions={{ stroke: false, fillColor: '#e11d48', fillOpacity: 0.8 }} radius={4500} />
            
            {/* Very Unhealthy Zone (Orange-Red) */}
            <Circle center={[31.5204, 74.3187]} pathOptions={{ stroke: false, fillColor: '#c2410c', fillOpacity: 0.9 }} radius={3000} />
            <Circle center={[31.5500, 74.3300]} pathOptions={{ stroke: false, fillColor: '#ea580c', fillOpacity: 0.8 }} radius={3500} />
            <Circle center={[31.4900, 74.3400]} pathOptions={{ stroke: false, fillColor: '#c2410c', fillOpacity: 0.8 }} radius={3500} />

            {/* Unhealthy Zone (Yellow-Orange) */}
            <Circle center={[31.4800, 74.3800]} pathOptions={{ stroke: false, fillColor: '#ca8a04', fillOpacity: 0.8 }} radius={5000} />
            <Circle center={[31.5400, 74.3800]} pathOptions={{ stroke: false, fillColor: '#eab308', fillOpacity: 0.7 }} radius={4000} />
            
            {/* Moderate/Safe Zone (Green) */}
            <Circle center={[31.5204, 74.4287]} pathOptions={{ stroke: false, fillColor: '#15803d', fillOpacity: 0.8 }} radius={4500} />
            <Circle center={[31.5800, 74.4500]} pathOptions={{ stroke: false, fillColor: '#16a34a', fillOpacity: 0.7 }} radius={5000} />
            <Circle center={[31.5500, 74.4800]} pathOptions={{ stroke: false, fillColor: '#22c55e', fillOpacity: 0.6 }} radius={5500} />
        </Pane>
        <MapClickHandler />
      </MapContainer>

      {/* Floating Google-Maps-Style Search Bar */}
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

      {/* Left Sidebar Modal for Selected Place (Google Maps Style) */}
      {selectedPlace && (
        <div className="absolute top-0 left-0 h-full w-full sm:w-[400px] bg-white shadow-[8px_0_24px_rgba(0,0,0,0.15)] z-[1500] flex flex-col animate-in slide-in-from-left-12 duration-300">
          {/* Header (No Image) */}
          <div className="pt-8 pb-6 px-6 bg-slate-900 relative shrink-0">
            <button 
              onClick={() => setSelectedPlace(null)}
              className="absolute top-4 right-4 bg-white/10 text-white p-2 rounded-full hover:bg-white/20 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
            
            <h2 className="text-2xl font-extrabold text-white line-clamp-2 leading-tight pr-8 mt-2">
              {selectedPlace.display_name.split(',')[0]}
            </h2>
          </div>
          
          {/* Scrollable Content */}
          <div className="flex-1 overflow-y-auto bg-slate-50 pb-8">
            <div className="p-5 bg-white mb-2 shadow-sm">
              <p className="text-sm text-slate-600 leading-relaxed mb-6">
                {selectedPlace.display_name}
              </p>

              {/* Action Buttons */}
              <div className="flex items-center justify-around pb-2">
                <div className="flex flex-col items-center gap-1.5 cursor-pointer group">
                  <div className="w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center shadow-md group-hover:bg-blue-700 transition-colors">
                    <Navigation className="w-5 h-5" />
                  </div>
                  <span className="text-xs font-bold text-blue-700">Directions</span>
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
        </div>
      )}

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

      {/* Right Side UI Column (AQI Zones Legend) */}
      {/* Hide on mobile if selectedPlace is active to avoid clutter */}
      <div className={`absolute top-4 right-4 z-[1000] flex-col gap-2 ${selectedPlace ? 'hidden sm:flex' : 'flex'}`}>
        <div className="bg-white/95 backdrop-blur-md p-3.5 rounded-xl shadow-[0_4px_12px_rgba(0,0,0,0.15)] border border-slate-200">
            <p className="text-[10px] font-extrabold text-slate-500 uppercase tracking-widest mb-3">Live AQI Zones</p>
            <div className="space-y-2.5">
               <div className="flex items-center gap-3">
                   <div className="w-3.5 h-3.5 rounded-full bg-rose-700 opacity-90 shadow-sm"></div>
                   <span className="text-xs font-semibold text-slate-700">Hazardous (300+)</span>
               </div>
               <div className="flex items-center gap-3">
                   <div className="w-3.5 h-3.5 rounded-full bg-orange-600 opacity-90 shadow-sm"></div>
                   <span className="text-xs font-semibold text-slate-700">Very Unhealthy (200+)</span>
               </div>
               <div className="flex items-center gap-3">
                   <div className="w-3.5 h-3.5 rounded-full bg-yellow-500 opacity-90 shadow-sm"></div>
                   <span className="text-xs font-semibold text-slate-700">Unhealthy (150+)</span>
               </div>
               <div className="flex items-center gap-3">
                   <div className="w-3.5 h-3.5 rounded-full bg-emerald-600 opacity-90 shadow-sm"></div>
                   <span className="text-xs font-semibold text-slate-700">Moderate (&lt;150)</span>
               </div>
            </div>
        </div>
      </div>
      </div>
    </div>
  );
}
