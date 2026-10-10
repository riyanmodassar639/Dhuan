import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Search, MapPin, Wind, Activity, X, Navigation, ArrowLeft, Bookmark, Share2 } from 'lucide-react';
import { GoogleMap, useJsApiLoader, Marker, DirectionsRenderer, Circle } from '@react-google-maps/api';

const LIBRARIES: ("places" | "geometry")[] = ['places', 'geometry'];
const API_KEY = "AIzaSyB71oeDQWH2FF_jpMqgep8F4yK_Sd3k7qM"; // The key provided by the user

const LAHORE_CENTER = { lat: 31.5204, lng: 74.3587 };

interface MapWidgetProps {
  fullScreen?: boolean;
}

export default function MapWidget({ fullScreen = false }: MapWidgetProps) {
  // Google Maps Loader
  const { isLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey: API_KEY,
    libraries: LIBRARIES
  });

  const mapRef = useRef<google.maps.Map | null>(null);

  // Search State
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [selectedPlace, setSelectedPlace] = useState<any | null>(null);
  const skipNextSearch = useRef(false);

  // Routing State
  const [routes, setRoutes] = useState<any[]>([]);
  const [selectedRouteIdx, setSelectedRouteIdx] = useState(0);
  const [isDirectionsMode, setIsDirectionsMode] = useState(false);
  const [isNavigating, setIsNavigating] = useState(false);
  const [isPanelCollapsed, setIsPanelCollapsed] = useState(false);

  // Custom Origin State
  const [userLocation, setUserLocation] = useState<google.maps.LatLngLiteral | null>(null);
  const [userAddress, setUserAddress] = useState("Your Location");
  const [originInput, setOriginInput] = useState("");
  const [originResults, setOriginResults] = useState<any[]>([]);
  const [isSearchingOrigin, setIsSearchingOrigin] = useState(false);
  const [isSelectingOriginOnMap, setIsSelectingOriginOnMap] = useState(false);
  const [routeOriginCoords, setRouteOriginCoords] = useState<google.maps.LatLngLiteral | null>(null);
  const skipNextOriginSearch = useRef(false);
  const originInputRef = useRef<HTMLInputElement>(null);

  // Initialize GPS Location with Geofencing for Pakistan
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const lat = pos.coords.latitude;
          const lng = pos.coords.longitude;
          
          // Smart Geofencing: Check if the user's GPS (or VPN) is inside Pakistan (roughly)
          // Bounding box for Pakistan: Lat 23 to 37, Lng 60 to 78
          const isInsidePakistan = lat > 23 && lat < 37 && lng > 60 && lng < 78;
          
          const loc = isInsidePakistan ? { lat, lng } : LAHORE_CENTER;
          setUserLocation(loc);

          if (isLoaded) {
             const geocoder = new window.google.maps.Geocoder();
             geocoder.geocode({ location: loc }, (res, status) => {
                if (status === 'OK' && res && res.length > 0) {
                   setUserAddress(res[0].formatted_address);
                   setOriginInput(res[0].formatted_address);
                }
             });
          }
        },
        () => setUserLocation(LAHORE_CENTER) // Fallback if permission denied
      );
    } else {
      setUserLocation(LAHORE_CENTER);
    }
  }, [isLoaded]);

  // Main Search Autocomplete
  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      if (skipNextSearch.current) { skipNextSearch.current = false; return; }
      const trimmedQuery = query.trim();
      if (trimmedQuery.length > 2 && isLoaded) {
        setIsSearching(true);
        setHasSearched(true);
        const service = new window.google.maps.places.AutocompleteService();
        service.getPlacePredictions({ 
           input: trimmedQuery, 
           componentRestrictions: { country: 'pk' },
           locationBias: new window.google.maps.Circle({ center: LAHORE_CENTER, radius: 20000 })
        }, (predictions, status) => {
           if (status === window.google.maps.places.PlacesServiceStatus.OK && predictions) {
              setResults(predictions.map(p => ({
                 place_id: p.place_id,
                 name: p.structured_formatting.main_text,
                 display_name: p.description
              })));
           } else {
              setResults([]);
           }
           setIsSearching(false);
        });
      } else {
        setResults([]);
      }
    }, 500);
    return () => clearTimeout(delayDebounceFn);
  }, [query, isLoaded]);

  // Origin Search Autocomplete
  useEffect(() => {
    const delayFn = setTimeout(() => {
      if (skipNextOriginSearch.current) { skipNextOriginSearch.current = false; return; }
      if (originInput.trim().length > 2 && document.activeElement === originInputRef.current && isLoaded) {
         setIsSearchingOrigin(true);
         const service = new window.google.maps.places.AutocompleteService();
         service.getPlacePredictions({ input: originInput.trim(), componentRestrictions: { country: 'pk' } }, (predictions, status) => {
            if (status === window.google.maps.places.PlacesServiceStatus.OK && predictions) {
               setOriginResults(predictions.map(p => ({
                 place_id: p.place_id,
                 name: p.structured_formatting.main_text,
                 display_name: p.description
               })));
            } else {
               setOriginResults([]);
            }
            setIsSearchingOrigin(false);
         });
      } else {
         setOriginResults([]);
      }
    }, 500);
    return () => clearTimeout(delayFn);
  }, [originInput, isLoaded]);

  const fetchRoutesAndEnhance = (origin: google.maps.LatLngLiteral, dest: google.maps.LatLngLiteral) => {
     if (!isLoaded) return;
     const directionsService = new window.google.maps.DirectionsService();
     directionsService.route({
        origin,
        destination: dest,
        travelMode: window.google.maps.TravelMode.DRIVING,
        provideRouteAlternatives: true
     }, (result, status) => {
        if (status === window.google.maps.DirectionsStatus.OK && result) {
           const enhancedRoutes = result.routes.map((r, idx) => {
              let isSafest = false;
              if (result.routes.length > 1 && idx === 1) isSafest = true;
              else if (result.routes.length === 1 && idx === 0) isSafest = true;
              
              const smogExposure = isSafest ? Math.floor(Math.random() * 20) + 20 : Math.floor(Math.random() * 50) + 70;
              const trafficLevel = isSafest ? 'Low' : ['Moderate', 'High'][Math.floor(Math.random() * 2)];
              
              return {
                 googleRoute: result,
                 routeIndex: idx,
                 distance: r.legs[0].distance?.value || 0,
                 distanceText: r.legs[0].distance?.text || "",
                 duration: r.legs[0].duration?.value || 0,
                 durationText: r.legs[0].duration?.text || "",
                 summary: r.summary,
                 aiStats: { smogExposure, traffic: trafficLevel, isSafest }
              };
           });
           setRoutes(enhancedRoutes);
           setSelectedRouteIdx(enhancedRoutes.length > 1 ? 1 : 0);
        } else {
           console.error("Directions error:", status);
        }
     });
  };

  const handleSelectPlace = (place: any) => {
    if (!isLoaded || !mapRef.current) return;
    const service = new window.google.maps.places.PlacesService(mapRef.current);
    service.getDetails({ placeId: place.place_id, fields: ['geometry', 'name'] }, (details, status) => {
       if (status === window.google.maps.places.PlacesServiceStatus.OK && details?.geometry?.location) {
          const lat = details.geometry.location.lat();
          const lng = details.geometry.location.lng();
          
          // Generate mock environmental data
          const aqiVal = Math.floor(Math.random() * (450 - 50 + 1)) + 50;
          let statusColor = 'Moderate';
          let color = 'text-emerald-500';
          let bg = 'bg-emerald-50';
          let border = 'border-emerald-200';
          if (aqiVal > 150) { statusColor = 'Unhealthy'; color = 'text-yellow-500'; bg = 'bg-yellow-50'; border = 'border-yellow-200'; }
          if (aqiVal > 200) { statusColor = 'Very Unhealthy'; color = 'text-orange-500'; bg = 'bg-orange-50'; border = 'border-orange-200'; }
          if (aqiVal > 300) { statusColor = 'Hazardous'; color = 'text-rose-600'; bg = 'bg-rose-50'; border = 'border-rose-200'; }

          // 24h forecast
          const forecast = [];
          let currentAqi = aqiVal;
          for (let i = 1; i <= 24; i++) {
             currentAqi += Math.floor(Math.random() * 21) - 10;
             if (currentAqi < 10) currentAqi = 10;
             let fcColor = 'text-emerald-500';
             if (currentAqi > 150) fcColor = 'text-yellow-500';
             if (currentAqi > 200) fcColor = 'text-orange-500';
             if (currentAqi > 300) fcColor = 'text-rose-500';
             const d = new Date(); d.setHours(d.getHours() + i);
             forecast.push({ time: d.toLocaleString('en-US', { hour: 'numeric', hour12: true }), aqi: currentAqi, color: fcColor });
          }

          setSelectedPlace({
             ...place,
             name: details.name || place.name,
             lat, lng, aqi: aqiVal, status: statusColor, color, bg, border, forecast
          });
          
          skipNextSearch.current = true;
          setResults([]);
          setHasSearched(false);
          setQuery(details.name || place.name);
          mapRef.current.panTo({ lat, lng });
          mapRef.current.setZoom(15);
       }
    });
  };

  const handleDirectionsClick = () => {
    if (!selectedPlace) return;
    setIsDirectionsMode(true);
    setIsNavigating(false);
    
    const origin = routeOriginCoords || userLocation || LAHORE_CENTER;
    setRouteOriginCoords(origin);
    const dest = { lat: selectedPlace.lat, lng: selectedPlace.lng };
    
    if (userAddress === "Your Location" || originInput === "Your Location") {
       setUserAddress("Locating...");
       const geocoder = new window.google.maps.Geocoder();
       geocoder.geocode({ location: origin }, (res, status) => {
          if (status === 'OK' && res && res.length > 0) {
             setUserAddress(res[0].formatted_address);
             setOriginInput(res[0].formatted_address);
          } else {
             setUserAddress("Current Location");
          }
       });
    }
    fetchRoutesAndEnhance(origin, dest);
  };

  const handleMapClick = (e: google.maps.MapMouseEvent) => {
     if (!e.latLng) return;
     const lat = e.latLng.lat();
     const lng = e.latLng.lng();

     if (isSelectingOriginOnMap) {
         setIsSelectingOriginOnMap(false);
         setRouteOriginCoords({ lat, lng });
         skipNextOriginSearch.current = true;
         setUserAddress("Locating...");
         setOriginInput("Locating...");
         const geocoder = new window.google.maps.Geocoder();
         geocoder.geocode({ location: { lat, lng } }, (res, status) => {
            if (status === 'OK' && res && res.length > 0) {
               setUserAddress(res[0].formatted_address);
               setOriginInput(res[0].formatted_address);
            } else {
               setUserAddress("Selected Location");
               setOriginInput("Selected Location");
            }
         });
         if (selectedPlace) fetchRoutesAndEnhance({ lat, lng }, { lat: selectedPlace.lat, lng: selectedPlace.lng });
         return;
     }

     if (isDirectionsMode) return;
     
     // Reverse Geocode for random map clicks
     setIsSearching(true);
     const geocoder = new window.google.maps.Geocoder();
     geocoder.geocode({ location: { lat, lng } }, (res, status) => {
        if (status === 'OK' && res && res.length > 0) {
           handleSelectPlace({
              place_id: res[0].place_id,
              name: res[0].address_components[0]?.long_name || "Pinned Location",
              display_name: res[0].formatted_address
           });
        }
        setIsSearching(false);
     });
  };

  if (!isLoaded) {
    return (
      <div className="w-full h-full bg-slate-100 animate-pulse rounded-2xl flex items-center justify-center">
        <span className="text-slate-400 font-medium">Loading Google Maps...</span>
      </div>
    );
  }

  return (
    <div className={`w-full h-full flex-1 relative z-0 ${fullScreen ? '' : 'min-h-[500px] lg:min-h-[600px] rounded-2xl overflow-hidden shadow-sm border border-slate-200'}`}>
      <div className="absolute inset-0">
        <GoogleMap
          mapContainerStyle={{ width: '100%', height: '100%' }}
          center={userLocation || LAHORE_CENTER}
          zoom={12}
          options={{
             disableDefaultUI: true,
             zoomControl: false,
             mapTypeControl: false,
             scaleControl: false,
             streetViewControl: false,
             rotateControl: false,
             fullscreenControl: false,
             styles: [
                { featureType: "poi", elementType: "labels", stylers: [{ visibility: "off" }] }
             ]
          }}
          onLoad={(map) => { mapRef.current = map; }}
          onClick={handleMapClick}
        >
          {/* Mock Smog Layer overlay using Circles */}
          {!isDirectionsMode && (
             <>
                <Circle center={{ lat: 31.5204, lng: 74.3587 }} radius={8000} options={{ fillColor: '#ef4444', fillOpacity: 0.25, strokeOpacity: 0, clickable: false }} />
                <Circle center={{ lat: 31.4504, lng: 74.4587 }} radius={5000} options={{ fillColor: '#f97316', fillOpacity: 0.2, strokeOpacity: 0, clickable: false }} />
             </>
          )}

          {/* User Location Marker */}
          {userLocation && (!isDirectionsMode || !routeOriginCoords || (routeOriginCoords.lat === userLocation.lat && routeOriginCoords.lng === userLocation.lng)) && (
            <Marker position={userLocation} icon={{ path: window.google.maps.SymbolPath.CIRCLE, scale: 7, fillColor: '#2563eb', fillOpacity: 1, strokeColor: '#ffffff', strokeWeight: 3 }} />
          )}

          {/* Custom Origin Marker */}
          {isDirectionsMode && routeOriginCoords && (!userLocation || routeOriginCoords.lat !== userLocation.lat || routeOriginCoords.lng !== userLocation.lng) && (
            <Marker position={routeOriginCoords} icon={{ path: window.google.maps.SymbolPath.CIRCLE, scale: 7, fillColor: '#2563eb', fillOpacity: 1, strokeColor: '#ffffff', strokeWeight: 3 }} />
          )}

          {/* Selected Destination Marker */}
          {selectedPlace && (
            <Marker position={{ lat: selectedPlace.lat, lng: selectedPlace.lng }} />
          )}

          {/* Render Routes */}
          {isDirectionsMode && routes.length > 0 && [...routes].sort((a, b) => a.routeIndex === selectedRouteIdx ? 1 : b.routeIndex === selectedRouteIdx ? -1 : 0).map((r) => {
             const isSelected = r.routeIndex === selectedRouteIdx;
             return (
                <DirectionsRenderer
                   key={`${r.routeIndex}-${isSelected}`}
                   directions={r.googleRoute}
                   routeIndex={r.routeIndex}
                   options={{
                      suppressMarkers: true,
                      polylineOptions: {
                         strokeColor: isSelected ? '#7c3aed' : '#94a3b8',
                         strokeWeight: isSelected ? 6 : 4,
                         strokeOpacity: isSelected ? 1 : 0.7,
                         zIndex: isSelected ? 100 : 10
                      }
                   }}
                />
             )
          })}
        </GoogleMap>
      </div>

      {/* Overlays / UI */}
      <div className={`absolute top-4 left-4 z-[2000] w-full max-w-[340px] sm:max-w-[400px] pr-8 transition-transform duration-300 ${isPanelCollapsed ? '-translate-y-[150%]' : 'translate-y-0'}`}>
        <form onSubmit={(e) => e.preventDefault()} className={`flex items-center w-full bg-white shadow-[0_8px_30px_rgba(0,0,0,0.12)] rounded-full px-4 py-3.5 border ${isSearching ? 'border-blue-300' : 'border-slate-200'} transition-all`}>
          <Search className={`w-5 h-5 ${isSearching ? 'text-blue-500 animate-pulse' : 'text-slate-400'}`} />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search places or coordinates..."
            className="flex-1 bg-transparent border-none outline-none px-3 text-sm font-medium text-slate-700 placeholder:text-slate-400"
          />
          {query && !isSearching && (
            <button type="button" onClick={() => { setQuery(''); setResults([]); setHasSearched(false); setSelectedPlace(null); }} className="ml-2 p-1 hover:bg-slate-100 rounded-full text-slate-400">
              <X className="w-4 h-4" />
            </button>
          )}
        </form>

        {(results.length > 0 || (hasSearched && query.trim().length > 2 && !isSearching)) && (
          <div className="mt-2 bg-white rounded-xl shadow-[0_12px_24px_rgba(0,0,0,0.2)] border border-slate-200 overflow-hidden max-h-[300px] overflow-y-auto">
            {results.length > 0 ? (
              results.map((place, idx) => (
                <div key={place.place_id || idx} onClick={() => handleSelectPlace(place)} className="flex items-start gap-3 p-3 hover:bg-slate-50 cursor-pointer border-b border-slate-100 last:border-0 transition-colors">
                  <MapPin className="w-4 h-4 text-slate-400 mt-1 shrink-0" />
                  <div className="flex flex-col">
                    <span className="text-sm font-bold text-slate-900 line-clamp-1">{place.name}</span>
                    <span className="text-xs text-slate-500 line-clamp-1">{place.display_name}</span>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-4 text-center text-slate-500 text-sm font-medium">No results found</div>
            )}
          </div>
        )}
      </div>

      {/* Left Sidebar Modal for Selected Place */}
      {selectedPlace && (
        <div className={`absolute top-0 left-0 h-full w-full sm:w-[400px] bg-white shadow-[8px_0_24px_rgba(0,0,0,0.15)] z-[2500] flex flex-col transition-transform duration-300 ${isPanelCollapsed ? '-translate-x-full' : 'translate-x-0'}`}>
          {isDirectionsMode ? (
            <div className="flex flex-col h-full bg-slate-50">
               <div className="bg-white p-4 pt-6 shadow-sm relative z-10 border-b border-slate-200">
                  <button onClick={() => { setIsDirectionsMode(false); setRoutes([]); }} className="mb-4 text-slate-500 hover:text-slate-900 flex items-center gap-2 text-sm font-bold transition-colors w-fit p-2 -ml-2 rounded-full hover:bg-slate-100">
                    <ArrowLeft className="w-5 h-5" />
                  </button>
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
                             onKeyDown={(e) => {
                                if (e.key === 'Enter' && originResults.length > 0) {
                                   const p = originResults[0];
                                   setOriginInput(p.name);
                                   setUserAddress(p.name);
                                   setOriginResults([]);
                                   const service = new window.google.maps.places.PlacesService(mapRef.current!);
                                   service.getDetails({ placeId: p.place_id, fields: ['geometry'] }, (d, s) => {
                                      if (s === 'OK' && d?.geometry?.location) {
                                         const loc = { lat: d.geometry.location.lat(), lng: d.geometry.location.lng() };
                                         setRouteOriginCoords(loc);
                                         fetchRoutesAndEnhance(loc, { lat: selectedPlace.lat, lng: selectedPlace.lng });
                                      }
                                   });
                                }
                             }}
                             className="w-full bg-white px-3 py-2.5 rounded-xl text-sm font-medium text-slate-900 border border-slate-200 shadow-inner focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-100 transition-all placeholder:text-slate-400"
                             placeholder="Enter starting point..."
                           />
                           {originResults.length > 0 && (
                             <div className="absolute top-full left-0 right-0 mt-1 bg-white rounded-xl shadow-[0_12px_24px_rgba(0,0,0,0.2)] border border-slate-200 overflow-hidden max-h-[200px] overflow-y-auto z-[3000]">
                               {originResults.map((p, idx) => (
                                 <div key={idx} onClick={() => {
                                      setOriginInput(p.name);
                                      setUserAddress(p.name);
                                      setOriginResults([]);
                                      const service = new window.google.maps.places.PlacesService(mapRef.current!);
                                      service.getDetails({ placeId: p.place_id, fields: ['geometry'] }, (d, s) => {
                                         if (s === 'OK' && d?.geometry?.location) {
                                            const loc = { lat: d.geometry.location.lat(), lng: d.geometry.location.lng() };
                                            setRouteOriginCoords(loc);
                                            fetchRoutesAndEnhance(loc, { lat: selectedPlace.lat, lng: selectedPlace.lng });
                                         }
                                      });
                                   }} className="flex items-start gap-3 p-2.5 hover:bg-slate-50 cursor-pointer border-b border-slate-100 last:border-0 transition-colors">
                                   <MapPin className="w-3.5 h-3.5 text-slate-400 mt-1 shrink-0" />
                                   <div className="flex flex-col">
                                     <span className="text-xs font-bold text-slate-900 line-clamp-1">{p.name}</span>
                                     <span className="text-[10px] text-slate-500 line-clamp-1">{p.display_name}</span>
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
                     <div className="flex items-center gap-4">
                       <div className="w-7 h-7 bg-rose-100 rounded-full flex items-center justify-center z-10 shrink-0 border-2 border-white">
                          <MapPin className="w-3.5 h-3.5 text-rose-600" />
                       </div>
                       <div className="flex-1 bg-slate-100 px-3 py-2.5 rounded-xl text-sm font-bold text-slate-900 border border-slate-200 truncate">{selectedPlace.name}</div>
                     </div>
                  </div>
               </div>
               
               <div className="flex-1 overflow-y-auto p-4 space-y-3">
                  {routes.length === 0 && <div className="text-center p-8 text-slate-400 font-medium">Calculating route...</div>}
                  {routes.map((route, idx) => (
                    <div 
                      key={idx} 
                      onClick={() => setSelectedRouteIdx(idx)}
                      className={`p-4 rounded-xl cursor-pointer border-2 transition-all relative overflow-hidden ${idx === selectedRouteIdx ? 'border-purple-500 bg-purple-50/50 shadow-sm' : 'border-slate-200 bg-white hover:border-purple-200'}`}
                    >
                      {route.aiStats?.isSafest && (
                        <div className="absolute top-0 right-0 bg-emerald-500 text-white text-[10px] font-black uppercase px-2 py-1 rounded-bl-lg tracking-wider">
                           Safest Route
                        </div>
                      )}
                      <div className="flex justify-between items-center mb-1">
                        <span className={`font-black text-lg ${idx === selectedRouteIdx ? 'text-purple-700' : 'text-slate-800'}`}>
                          {route.durationText}
                        </span>
                        <span className="text-sm font-bold text-slate-500">
                          {route.distanceText}
                        </span>
                      </div>
                      <div className="text-xs text-slate-500 font-medium mb-3">
                        via {route.summary || "Main Route"}
                      </div>
                      
                      {route.aiStats && (
                        <div className="flex items-center gap-2 mt-2 pt-3 border-t border-slate-200/60">
                           <div className={`flex items-center gap-1 text-[11px] font-bold px-2 py-1 rounded-md ${route.aiStats.smogExposure < 60 ? 'bg-emerald-100 text-emerald-700' : route.aiStats.smogExposure < 100 ? 'bg-yellow-100 text-yellow-700' : 'bg-rose-100 text-rose-700'}`}>
                             <Wind className="w-3 h-3" />
                             AQI {route.aiStats.smogExposure}
                           </div>
                           <div className={`flex items-center gap-1 text-[11px] font-bold px-2 py-1 rounded-md ${route.aiStats.traffic === 'Low' ? 'bg-emerald-100 text-emerald-700' : route.aiStats.traffic === 'Moderate' ? 'bg-orange-100 text-orange-700' : 'bg-rose-100 text-rose-700'}`}>
                             <Activity className="w-3 h-3" />
                             {route.aiStats.traffic} Traffic
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
          ) : (
            <>
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
          
              <div className="flex-1 overflow-y-auto bg-slate-50 pb-8">
                <div className="p-5 bg-white mb-2 shadow-sm">
                  <p className="text-sm text-slate-600 leading-relaxed mb-6">
                    {selectedPlace.display_name}
                  </p>

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
                   
                   <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">24-Hour Smog Forecast</h4>
                   <div className="flex gap-3 overflow-x-auto pb-2 snap-x hide-scrollbar">
                      {selectedPlace.forecast.map((fc: any, i: number) => (
                         <div key={i} className="flex flex-col items-center justify-center bg-slate-50 border border-slate-100 rounded-xl min-w-[70px] py-3 snap-start">
                            <span className="text-[10px] font-bold text-slate-400 mb-1">{fc.time}</span>
                            <span className={`text-sm font-black ${fc.color}`}>{fc.aqi}</span>
                         </div>
                      ))}
                   </div>
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {selectedPlace && isPanelCollapsed && (
         <div className="absolute top-4 left-4 z-[2500] bg-white p-4 rounded-xl shadow-[0_4px_20px_rgba(0,0,0,0.15)] border border-slate-200 flex flex-col gap-3 animate-in fade-in zoom-in duration-300">
            <div className="font-bold text-slate-900 flex items-center gap-2">
               <Navigation className="w-5 h-5 text-purple-600" />
               Navigating to {selectedPlace.name}
            </div>
            <div className="flex gap-2">
               <button onClick={() => setIsPanelCollapsed(false)} className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-bold rounded-lg transition-colors">Details</button>
               <button onClick={() => { setIsPanelCollapsed(false); setIsNavigating(false); setIsDirectionsMode(false); setSelectedPlace(null); setRoutes([]); }} className="px-4 py-2 bg-rose-100 hover:bg-rose-200 text-rose-700 text-sm font-bold rounded-lg transition-colors">End Route</button>
            </div>
         </div>
      )}

      <div 
        onClick={() => mapRef.current?.panTo(userLocation || LAHORE_CENTER)}
        className={`absolute ${fullScreen ? 'bottom-8' : 'bottom-4'} right-4 z-[2000] w-12 h-12 bg-white rounded-full shadow-[0_4px_12px_rgba(0,0,0,0.15)] flex items-center justify-center cursor-pointer hover:bg-slate-50 transition-colors border border-slate-200`}
      >
        <Navigation className="w-5 h-5 text-slate-600" style={{ transform: 'rotate(45deg)' }} />
      </div>
    </div>
  );
}
