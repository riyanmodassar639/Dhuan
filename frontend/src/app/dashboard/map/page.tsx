'use client';

import dynamic from 'next/dynamic';
import { MapPin, Info } from 'lucide-react';

const MapWidget = dynamic(() => import('@/components/MapWidget'), { ssr: false });

export default function MapPage() {
  return (
    <div className="h-full flex flex-col space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            Live Air Quality Map
          </h2>
          <p className="text-slate-500 font-medium text-sm mt-1">Real-time smog distribution across Lahore</p>
        </div>
        
        <div className="hidden sm:flex items-center gap-2 text-xs font-bold bg-blue-50 text-blue-700 px-3 py-2 rounded-xl border border-blue-100 shadow-sm">
          <Info className="w-4 h-4" />
          Map updates every 15 minutes
        </div>
      </div>

      <div className="flex-1 min-h-[600px] bg-white rounded-[2rem] p-2 border border-slate-200 shadow-xl shadow-slate-200/50 relative overflow-hidden group">
         <div className="absolute -inset-2 bg-gradient-to-tr from-emerald-100 to-blue-50 rounded-[20px] blur-lg -z-10 opacity-50 pointer-events-none group-hover:opacity-70 transition-opacity duration-500"></div>
         <MapWidget />
      </div>
    </div>
  );
}
