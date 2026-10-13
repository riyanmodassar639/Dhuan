'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Sliders,
  Wind,
  ShieldAlert,
  Sparkles,
  RotateCcw,
  TrendingDown,
  TrendingUp,
  Info,
  Car,
  Factory,
  CloudRain,
  Flame,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Compass,
  Play
} from 'lucide-react';
import { getApiEndpoint } from '@/lib/api';

interface SimulatedStation {
  id: number;
  name: string;
  zone_code: string;
  baseline_aqi: number;
  simulated_aqi: number;
  simulated_pm25: number;
  aqi_delta: number;
  simulated_status: string;
  simulated_color: string;
  lat: number;
  lng: number;
}

interface SimulationResult {
  is_simulation: boolean;
  simulation_engine: string;
  parameters: {
    windScenario: string;
    windDescription: string;
    policyIntervention: string;
    policyDescription: string;
    inversionSeverity: string;
  };
  summary: {
    baselineCityAvgAqi: number;
    simulatedCityAvgAqi: number;
    netDeltaAqi: number;
    netDeltaPercent: number;
    projectedExposureChange: string;
  };
  simulatedStations: SimulatedStation[];
}

export default function SimulatorPage() {
  const [windScenario, setWindScenario] = useState<string>('easterly_stubble_plume');
  const [policyIntervention, setPolicyIntervention] = useState<string>('none');
  const [inversionSeverity, setInversionSeverity] = useState<string>('moderate');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [result, setResult] = useState<SimulationResult | null>(null);

  const runSimulation = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(getApiEndpoint('/dashboard/simulator/run'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          windScenario,
          policyIntervention,
          inversionSeverity
        })
      });
      if (res.ok) {
        const data = await res.json();
        setResult(data);
      }
    } catch (err) {
      console.error('Error running simulation:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    runSimulation();
  }, [windScenario, policyIntervention, inversionSeverity]);

  const getStatusBadge = (color: string) => {
    if (color === 'maroon') return 'bg-rose-950 text-rose-200 border-rose-800';
    if (color === 'purple') return 'bg-purple-100 text-purple-800 border-purple-300';
    if (color === 'rose') return 'bg-rose-100 text-rose-800 border-rose-300';
    if (color === 'orange') return 'bg-orange-100 text-orange-800 border-orange-300';
    if (color === 'emerald') return 'bg-emerald-100 text-emerald-800 border-emerald-300';
    return 'bg-amber-100 text-amber-800 border-amber-300';
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 pb-16">
      
      {/* Simulation Watermark Banner */}
      <section className="bg-gradient-to-r from-purple-900 via-indigo-900 to-slate-900 text-white shadow-md border-b border-purple-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-purple-500/40 border border-purple-400 text-purple-200 uppercase tracking-wider flex items-center gap-1.5">
                  <Sliders className="w-3.5 h-3.5" />
                  Scenario Simulator &bull; Environmental Digital Twin
                </span>
                <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-amber-400/20 text-amber-200 border border-amber-400/30">
                  Simulated Data Only
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white flex items-center gap-2">
                Lahore Smog Scenario Simulator
              </h1>
              <p className="text-sm text-purple-200/90 max-w-2xl">
                Hypothetical physics model demonstrating how transboundary stubble smoke plumes, atmospheric inversions, and government traffic policies alter urban air exposure.
              </p>
            </div>

            <Link
              href="/dashboard"
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs border border-white/20 transition-all"
            >
              Back to Live Dashboard
            </Link>

          </div>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">

        {/* 1. Simulation Parameter Controls */}
        <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-6">
          
          <div>
            <h2 className="text-xl font-black text-slate-900 flex items-center gap-2">
              <Sliders className="w-5 h-5 text-purple-600" />
              Configure Environmental & Policy Variables
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Select atmospheric conditions or policy interventions below to observe real-time projected AQI shifts across Lahore's 14 zones.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

            {/* Variable 1: Wind & Stubble Smoke */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <Wind className="w-4 h-4 text-sky-600" />
                1. Wind Direction & Aerosol Plume
              </label>
              <select
                value={windScenario}
                onChange={(e) => setWindScenario(e.target.value)}
                className="w-full p-3 rounded-xl border border-slate-200 bg-slate-50 text-xs font-bold text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-purple-500"
              >
                <option value="easterly_stubble_plume">🌾 Easterly Stubble Smoke Plume (+38% regional PM2.5)</option>
                <option value="calm_stagnant">🌫️ Calm & Dead Stagnation (&lt;2 km/h, Ground Pooling)</option>
                <option value="westerly_clean">💨 Fresh Westerly Breeze (-22% Clean Dispersion)</option>
                <option value="monsoon_scrub">🌧️ Convective Rain Washout (-55% Wash Clean)</option>
              </select>
              <div className="text-[11px] text-slate-500">
                Simulates horizontal Gaussian plume advection across the border corridor.
              </div>
            </div>

            {/* Variable 2: Policy Interventions */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <Car className="w-4 h-4 text-emerald-600" />
                2. City Governance & Traffic Curbs
              </label>
              <select
                value={policyIntervention}
                onChange={(e) => setPolicyIntervention(e.target.value)}
                className="w-full p-3 rounded-xl border border-slate-200 bg-slate-50 text-xs font-bold text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-purple-500"
              >
                <option value="none">Standard City Baseline (No Active Curbs)</option>
                <option value="odd_even_traffic">🚗 Odd-Even Vehicle Rotation (-16% Traffic Smog)</option>
                <option value="industrial_shutdown">🏭 Brick Kiln & Steel Mill Shutdown (-22% Industrial PM2.5)</option>
                <option value="heavy_truck_ban">🚚 Daytime Heavy Diesel Truck Ban (-14% Diesel PM2.5)</option>
                <option value="combined_emergency">🚨 Full Smog Emergency Protocol (-38% Combined Reductions)</option>
              </select>
              <div className="text-[11px] text-slate-500">
                Models vehicular and point-source emission suppression policies.
              </div>
            </div>

            {/* Variable 3: Boundary Layer Inversion */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <Flame className="w-4 h-4 text-orange-600" />
                3. Nocturnal Inversion Thermal Lid
              </label>
              <select
                value={inversionSeverity}
                onChange={(e) => setInversionSeverity(e.target.value)}
                className="w-full p-3 rounded-xl border border-slate-200 bg-slate-50 text-xs font-bold text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-purple-500"
              >
                <option value="none">Open Boundary Layer (Solar Daytime Convection)</option>
                <option value="moderate">Moderate Night Surface Inversion (Typical Autumn)</option>
                <option value="extreme_thermal_lid">Extreme Severe Thermal Lid (Sub-150m Winter Inversion)</option>
              </select>
              <div className="text-[11px] text-slate-500">
                Governs vertical particulate trapping height in atmospheric boundary layer.
              </div>
            </div>

          </div>

          {/* Simulation Disclaimer Notice */}
          <div className="flex items-start gap-2.5 p-3 rounded-xl bg-purple-50/70 border border-purple-200 text-xs text-purple-900">
            <Info className="w-4 h-4 text-purple-600 shrink-0 mt-0.5" />
            <div>
              <strong className="font-bold">Scientific Boundary Condition:</strong> Scenario results are calculated via mathematical atmospheric dispersion equations. These projections are explicitly hypothetical and separated from verified live observations.
            </div>
          </div>

        </div>

        {/* 2. Projected City Impact Summary Card */}
        {result && (
          <div className="bg-slate-900 text-white rounded-2xl p-6 sm:p-8 border border-slate-800 shadow-md space-y-6">
            
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
              <div>
                <span className="text-[11px] font-black uppercase tracking-wider text-purple-400 block">
                  Digital Twin Simulation Outcome
                </span>
                <h3 className="text-xl sm:text-2xl font-black text-white mt-1">
                  Projected Environmental Impact for Lahore
                </h3>
              </div>
              <div className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-2 ${
                result.summary.netDeltaAqi <= 0 ? 'bg-emerald-950 text-emerald-300 border border-emerald-800' : 'bg-rose-950 text-rose-300 border border-rose-800'
              }`}>
                {result.summary.netDeltaAqi <= 0 ? <TrendingDown className="w-4 h-4" /> : <TrendingUp className="w-4 h-4" />}
                {result.summary.projectedExposureChange}
              </div>
            </div>

            {/* Key Comparison Metrics */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              
              <div className="bg-slate-800/80 p-4 rounded-xl border border-slate-700/60">
                <span className="text-xs text-slate-400 font-semibold block">Baseline City Avg</span>
                <span className="text-2xl sm:text-3xl font-black text-slate-200 mt-1 block">
                  {result.summary.baselineCityAvgAqi} AQI
                </span>
                <span className="text-[11px] text-slate-400">Current verified air</span>
              </div>

              <div className="bg-slate-800/80 p-4 rounded-xl border border-slate-700/60">
                <span className="text-xs text-purple-300 font-semibold block">Simulated City Avg</span>
                <span className={`text-2xl sm:text-3xl font-black mt-1 block ${
                  result.summary.simulatedCityAvgAqi > result.summary.baselineCityAvgAqi ? 'text-rose-400' : 'text-emerald-400'
                }`}>
                  {result.summary.simulatedCityAvgAqi} AQI
                </span>
                <span className="text-[11px] text-slate-400">Under configured variables</span>
              </div>

              <div className="bg-slate-800/80 p-4 rounded-xl border border-slate-700/60">
                <span className="text-xs text-slate-400 font-semibold block">Net Air Quality Delta</span>
                <span className={`text-2xl sm:text-3xl font-black mt-1 block ${
                  result.summary.netDeltaAqi > 0 ? 'text-rose-400' : 'text-emerald-400'
                }`}>
                  {result.summary.netDeltaAqi > 0 ? `+${result.summary.netDeltaAqi}` : result.summary.netDeltaAqi} AQI
                </span>
                <span className="text-[11px] text-slate-400">
                  {result.summary.netDeltaPercent > 0 ? `+${result.summary.netDeltaPercent}% change` : `${result.summary.netDeltaPercent}% change`}
                </span>
              </div>

              <div className="bg-slate-800/80 p-4 rounded-xl border border-slate-700/60">
                <span className="text-xs text-slate-400 font-semibold block">Active Policy Factor</span>
                <span className="text-base font-bold text-white mt-1 block line-clamp-2">
                  {result.parameters.policyDescription}
                </span>
              </div>

            </div>

          </div>
        )}

        {/* 3. Station by Station Comparison Grid */}
        {result && (
          <div className="space-y-4">
            
            <div>
              <h3 className="text-xl font-black text-slate-900">
                Zone-by-Zone Simulated Exposure Shifts ({result.simulatedStations.length} Stations)
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Observed spatial dispersion showing which Lahore zones face the highest stubble or inversion impact.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3.5">
              {result.simulatedStations.map((st) => (
                <div
                  key={st.zone_code}
                  className="bg-white rounded-xl p-4 border border-slate-200 shadow-2xs hover:shadow-sm transition-all flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between gap-1 text-[11px] text-slate-400 font-bold uppercase">
                      <span>{st.zone_code}</span>
                      <span className={`px-2 py-0.5 rounded-md border text-[10px] ${getStatusBadge(st.simulated_color)}`}>
                        {st.simulated_status}
                      </span>
                    </div>
                    <div className="font-bold text-sm text-slate-900 mt-1 line-clamp-1">
                      {st.name}
                    </div>
                  </div>

                  <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-xs">
                    <div>
                      <span className="text-slate-400 block text-[10px]">Baseline</span>
                      <strong className="text-slate-700 font-extrabold">{st.baseline_aqi} AQI</strong>
                    </div>
                    <ArrowRight className="w-3.5 h-3.5 text-slate-300" />
                    <div className="text-right">
                      <span className="text-slate-400 block text-[10px]">Simulated</span>
                      <strong className={`font-black ${st.aqi_delta > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                        {st.simulated_aqi} AQI
                      </strong>
                    </div>
                    <div className="text-right">
                      <span className={`px-1.5 py-0.5 rounded text-[10px] font-extrabold ${
                        st.aqi_delta > 0 ? 'bg-rose-50 text-rose-700' : 'bg-emerald-50 text-emerald-700'
                      }`}>
                        {st.aqi_delta > 0 ? `+${st.aqi_delta}` : st.aqi_delta}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

          </div>
        )}

      </div>

    </div>
  );
}
