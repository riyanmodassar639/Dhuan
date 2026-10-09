'use client';

import { BrainCircuit, Activity, AlertTriangle, MapPin, Navigation, Map as MapIcon } from 'lucide-react';
import Link from 'next/link';
import ForecastChartWidget from '@/components/ForecastChart';
import HealthGraphWidget from '@/components/HealthGraph';

export default function DashboardOverview() {
  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
         <div>
            <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Dashboard Overview</h1>
            <p className="text-slate-500 font-medium mt-1">Your AI-powered Smog & Health Command Center</p>
         </div>
         <div className="flex items-center gap-2 text-sm font-bold bg-white border border-slate-200 px-4 py-2 rounded-xl shadow-sm text-slate-700">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            All Models Online
         </div>
      </div>

      {/* Quick Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
        
        {/* Stat 1 */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-slate-500">Live AQI</h3>
            <div className="w-8 h-8 rounded-full bg-yellow-50 flex items-center justify-center">
               <Activity className="w-4 h-4 text-yellow-600" />
            </div>
          </div>
          <div>
            <div className="text-3xl font-extrabold text-slate-900">165</div>
            <p className="text-xs font-bold text-yellow-600 mt-1">Unhealthy</p>
          </div>
        </div>

        {/* Stat 2 */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-slate-500">PM2.5 Level</h3>
            <div className="w-8 h-8 rounded-full bg-rose-50 flex items-center justify-center">
               <AlertTriangle className="w-4 h-4 text-rose-600" />
            </div>
          </div>
          <div>
            <div className="text-3xl font-extrabold text-slate-900">82 <span className="text-sm text-slate-400 font-semibold">µg/m³</span></div>
            <p className="text-xs font-bold text-rose-500 mt-1">16.4x WHO guideline</p>
          </div>
        </div>

        {/* Stat 3 */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-slate-500">AI Forecast (24h)</h3>
            <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center">
               <BrainCircuit className="w-4 h-4 text-blue-600" />
            </div>
          </div>
          <div>
            <div className="text-3xl font-extrabold text-slate-900">180</div>
            <p className="text-xs font-bold text-blue-500 mt-1">Expected to rise</p>
          </div>
        </div>
      </div>

      {/* Spatial AI Routing Model Banner */}
      <div className="bg-slate-900 rounded-3xl p-8 sm:p-10 flex flex-col md:flex-row items-center justify-between gap-8 text-white shadow-xl border border-slate-800 relative overflow-hidden group">
         <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 rounded-full filter blur-[80px] group-hover:scale-110 transition-transform duration-700"></div>
         <div className="relative z-10 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-800 border border-slate-700 text-emerald-400 text-xs font-bold mb-4 shadow-sm">
               <Navigation className="w-3.5 h-3.5" />
               Spatial AI Routing Model
            </div>
            <h3 className="text-2xl sm:text-3xl font-extrabold mb-3 tracking-tight">Check Environment & Decide Route</h3>
            <p className="text-slate-300 text-sm sm:text-base leading-relaxed font-medium max-w-xl">
               Analyze live environmental conditions, smog density zones, and traffic patterns on our interactive map. Let our spatial AI calculate the safest path with minimal PM2.5 exposure for your journey.
            </p>
         </div>
         <div className="relative z-10 shrink-0 w-full md:w-auto">
            <Link href="/dashboard/map" className="flex items-center justify-center gap-2 px-8 py-4 bg-emerald-500 text-slate-900 rounded-2xl font-extrabold text-base hover:bg-emerald-400 transition-all shadow-lg hover:shadow-xl hover:shadow-emerald-500/20 hover:-translate-y-1 w-full">
               <MapIcon className="w-5 h-5" />
               Open Live Map
            </Link>
         </div>
      </div>

      {/* Row 1: Forecast & Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column: Chart */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm relative overflow-hidden h-full">
             <div className="flex items-center justify-between mb-6">
               <div>
                 <h3 className="font-extrabold text-lg text-slate-900">72-Hour AI Forecast</h3>
                 <p className="text-sm text-slate-500 font-medium">Predicted AQI trends for Lahore</p>
               </div>
               <span className="bg-emerald-50 text-emerald-700 text-xs font-bold px-3 py-1 rounded-full border border-emerald-100">Live Prediction</span>
             </div>
             {/* Re-using the landing page chart */}
             <ForecastChartWidget />
          </div>
        </div>

        {/* Right Column: High Alert Areas & 24H Model */}
        <div className="space-y-6 flex flex-col">
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm">
             <h3 className="font-extrabold text-lg text-slate-900 mb-4 flex items-center gap-2">
               <MapPin className="w-5 h-5 text-rose-500" />
               High Alert Areas
             </h3>
             <p className="text-xs font-medium text-slate-500 mb-4">Currently recording severe smog levels. Avoid travel if possible.</p>
             <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100">
                   <div className="flex items-center gap-3">
                      <div className="w-2 h-2 rounded-full bg-rose-500 animate-pulse"></div>
                      <span className="text-sm font-bold text-slate-700">Gulberg III</span>
                   </div>
                   <span className="text-xs font-bold text-rose-600 bg-rose-50 px-2 py-1 rounded-md">AQI 205</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100">
                   <div className="flex items-center gap-3">
                      <div className="w-2 h-2 rounded-full bg-rose-500 animate-pulse"></div>
                      <span className="text-sm font-bold text-slate-700">DHA Phase 5</span>
                   </div>
                   <span className="text-xs font-bold text-rose-600 bg-rose-50 px-2 py-1 rounded-md">AQI 198</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100">
                   <div className="flex items-center gap-3">
                      <div className="w-2 h-2 rounded-full bg-orange-500 animate-pulse"></div>
                      <span className="text-sm font-bold text-slate-700">Johar Town</span>
                   </div>
                   <span className="text-xs font-bold text-orange-600 bg-orange-50 px-2 py-1 rounded-md">AQI 175</span>
                </div>
             </div>
             
             <Link href="/dashboard/routing" className="mt-5 relative block w-full py-2.5 bg-slate-900 text-white text-center rounded-xl text-sm font-bold hover:bg-slate-800 transition-colors">
               Plan Safe Route Around Alerts
             </Link>
          </div>

          {/* 24-Hour AI Model Update */}
          <div className="bg-blue-50/50 rounded-3xl p-6 border border-blue-100 shadow-sm flex-1 flex flex-col justify-center">
             <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-2xl bg-blue-100 flex items-center justify-center shrink-0">
                   <BrainCircuit className="w-5 h-5 text-blue-600" />
                </div>
                <h3 className="font-extrabold text-slate-900 leading-tight">Next 24 Hours Model</h3>
             </div>
             <p className="text-sm text-slate-600 leading-relaxed font-medium">
               Random Forest model indicates a <span className="text-rose-600 font-bold">22% spike</span> in PM2.5 levels between 6:00 PM and 10:00 PM today.
             </p>
          </div>
        </div>
      </div>

      {/* Row 2: Health Graph & Personal Insights */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left: Health Graph */}
        <div className="lg:col-span-2 bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm h-full">
           <div className="flex items-center justify-between">
             <div>
               <h3 className="font-extrabold text-lg text-slate-900">Personal Health & Exposure Trend</h3>
               <p className="text-sm text-slate-500 font-medium">Your daily PM2.5 exposure vs asthma risk</p>
             </div>
           </div>
           <HealthGraphWidget />
        </div>

        {/* Right: Health Insights */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm h-full flex flex-col justify-center">
           <h3 className="font-extrabold text-lg text-slate-900 mb-4 flex items-center gap-2">
             <AlertTriangle className="w-5 h-5 text-orange-500" />
             Health Insights
           </h3>
           <div className="space-y-4">
              <div className="p-4 bg-orange-50 border border-orange-100 rounded-2xl">
                 <p className="text-sm font-semibold text-orange-800 mb-1">Asthma Warning</p>
                 <p className="text-xs text-orange-700/80 leading-relaxed">
                   Based on your profile, today's PM2.5 levels are hazardous for your asthma. Keep inhaler nearby.
                 </p>
              </div>
              <div className="p-4 bg-slate-50 border border-slate-100 rounded-2xl">
                 <p className="text-sm font-semibold text-slate-700 mb-1">Outdoor Exercise</p>
                 <p className="text-xs text-slate-500 leading-relaxed">
                   Not recommended until tomorrow morning when AQI is expected to drop below 100.
                 </p>
              </div>
           </div>
           <Link href="/dashboard/health" className="block text-center mt-auto pt-4 text-sm font-bold text-emerald-600 hover:text-emerald-700 transition-colors">
             Update Health Profile &rarr;
           </Link>
        </div>

      </div>

    </div>
  );
}
