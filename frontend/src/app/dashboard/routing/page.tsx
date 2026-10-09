'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';
import { MapIcon, Navigation, Shield, Clock, MapPin, Search } from 'lucide-react';

const MapWidget = dynamic(() => import('@/components/MapWidget'), { ssr: false });

export default function RoutingPage() {
  const [origin, setOrigin] = useState('');
  const [destination, setDestination] = useState('');
  const [isCalculating, setIsCalculating] = useState(false);
  const [routeCalculated, setRouteCalculated] = useState(false);

  const handleRouteCalculation = (e: React.FormEvent) => {
    e.preventDefault();
    if (!origin || !destination) return;
    
    setIsCalculating(true);
    // Simulate AI API call
    setTimeout(() => {
      setIsCalculating(false);
      setRouteCalculated(true);
    }, 1500);
  };

  return (
    <div className="h-full flex flex-col space-y-6">
      {/* Page Header */}
      <div>
        <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
          Spatial AI Routing
        </h2>
        <p className="text-slate-500 font-medium text-sm mt-1">
          Calculate routes optimized for minimal PM2.5 exposure and maximum respiratory safety.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 flex-1">
        {/* Left Column: Input Form & Route Details */}
        <div className="lg:col-span-4 flex flex-col gap-6">
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-slate-50 rounded-full filter blur-2xl group-hover:scale-110 transition-transform duration-500"></div>
            
            <h3 className="font-bold text-slate-900 mb-4 flex items-center gap-2 relative z-10">
              <Navigation className="w-5 h-5 text-emerald-600" />
              Route Parameters
            </h3>
            
            <form onSubmit={handleRouteCalculation} className="space-y-4 relative z-10">
              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">Origin</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <MapPin className="h-4 w-4 text-slate-400" />
                  </div>
                  <input
                    type="text"
                    value={origin}
                    onChange={(e) => setOrigin(e.target.value)}
                    className="block w-full pl-10 pr-3 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-sm bg-slate-50 focus:bg-white transition-colors text-slate-900 placeholder:text-slate-400"
                    placeholder="e.g. DHA Phase 5"
                    required
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">Destination</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Search className="h-4 w-4 text-slate-400" />
                  </div>
                  <input
                    type="text"
                    value={destination}
                    onChange={(e) => setDestination(e.target.value)}
                    className="block w-full pl-10 pr-3 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-sm bg-slate-50 focus:bg-white transition-colors text-slate-900 placeholder:text-slate-400"
                    placeholder="e.g. MM Alam Road"
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isCalculating || !origin || !destination}
                className="w-full flex items-center justify-center gap-2 bg-slate-900 text-white px-4 py-3 rounded-xl font-bold text-sm hover:bg-slate-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed mt-2"
              >
                {isCalculating ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                    Computing Path...
                  </>
                ) : (
                  <>
                    <MapIcon className="w-4 h-4" />
                    Generate Safe Route
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Route Results (Only visible after calculation) */}
          {routeCalculated && (
            <div className="bg-white rounded-2xl p-6 border border-emerald-100 shadow-sm relative overflow-hidden border-t-4 border-t-emerald-500 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <h3 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
                <Shield className="w-5 h-5 text-emerald-600" />
                Optimized Output
              </h3>
              
              <div className="space-y-4">
                <div className="flex justify-between items-center p-3 rounded-xl bg-slate-50 border border-slate-100">
                  <div className="flex items-center gap-3">
                    <Clock className="w-5 h-5 text-slate-400" />
                    <div>
                      <p className="text-xs font-bold text-slate-500">Est. Time</p>
                      <p className="text-sm font-extrabold text-slate-900">24 mins</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-bold text-slate-500">Standard</p>
                    <p className="text-sm font-medium text-slate-400 line-through">18 mins</p>
                  </div>
                </div>

                <div className="flex justify-between items-center p-3 rounded-xl bg-emerald-50 border border-emerald-100">
                  <div className="flex items-center gap-3">
                    <Shield className="w-5 h-5 text-emerald-600" />
                    <div>
                      <p className="text-xs font-bold text-emerald-800">PM2.5 Exposure</p>
                      <p className="text-sm font-extrabold text-emerald-700">-42% Reduction</p>
                    </div>
                  </div>
                </div>
                
                <p className="text-xs text-slate-500 leading-relaxed font-medium">
                  This route avoids the hazardous zones near Ferozepur Road. A slight time increase is required to maintain respiratory safety limits.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Map */}
        <div className="lg:col-span-8 flex-1 min-h-[500px] flex flex-col bg-white rounded-[2rem] p-2 border border-slate-200 shadow-sm relative overflow-hidden group">
          <div className="absolute -inset-2 bg-slate-100 rounded-[20px] blur-lg -z-10 opacity-50 pointer-events-none group-hover:opacity-70 transition-opacity duration-500"></div>
          <MapWidget />
        </div>
      </div>
    </div>
  );
}
