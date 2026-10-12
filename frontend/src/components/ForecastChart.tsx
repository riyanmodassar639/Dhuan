'use client';

import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine
} from 'recharts';
import { 
  AlertCircle, 
  Wind, 
  Database, 
  Sparkles, 
  Clock, 
  Calendar, 
  TrendingUp, 
  Droplets, 
  Info,
  CheckCircle2
} from 'lucide-react';
import { HourlyForecastItem } from '@/components/HourlyForecastWidget';

interface ForecastChartProps {
  currentAqi?: number;
  aiForecastData?: any;
  hourlyData?: HourlyForecastItem[];
}

export interface ChartPointItem {
  label: string;
  time_label: string;
  day_label?: string;
  aqi: number;
  maxAqi?: number;
  pm25: number;
  temperature?: number;
  humidity?: number;
  wind_speed?: number;
  status: string;
  type: string;
  detail: string;
}

// Smog Severity Color & Category Mapper
const getSmogTheme = (aqi: number) => {
  if (aqi > 300) {
    return {
      name: 'Hazardous Toxic Smog',
      stroke: '#881337',
      fill: '#be123c',
      badge: 'bg-rose-950 text-rose-100 border border-rose-600',
      textClass: 'text-rose-400'
    };
  }
  if (aqi > 200) {
    return {
      name: 'Severe Smog Event',
      stroke: '#9333ea',
      fill: '#c084fc',
      badge: 'bg-purple-100 text-purple-800 border border-purple-200',
      textClass: 'text-purple-600'
    };
  }
  if (aqi > 150) {
    return {
      name: 'Dense Smog Inversion',
      stroke: '#e11d48',
      fill: '#fb7185',
      badge: 'bg-rose-100 text-rose-800 border border-rose-200',
      textClass: 'text-rose-600'
    };
  }
  if (aqi > 100) {
    return {
      name: 'Smog Inversion Forming',
      stroke: '#ea580c',
      fill: '#fb923c',
      badge: 'bg-orange-100 text-orange-800 border border-orange-200',
      textClass: 'text-orange-600'
    };
  }
  if (aqi > 50) {
    return {
      name: 'Moderate Haze',
      stroke: '#d97706',
      fill: '#fcd34d',
      badge: 'bg-amber-100 text-amber-900 border border-amber-200',
      textClass: 'text-amber-600'
    };
  }
  return {
    name: 'Clean Air',
    stroke: '#059669',
    fill: '#6ee7b7',
    badge: 'bg-emerald-100 text-emerald-800 border border-emerald-200',
    textClass: 'text-emerald-600'
  };
};

export default function ForecastChart({ 
  currentAqi, 
  aiForecastData,
  hourlyData = []
}: ForecastChartProps) {
  // View mode: '24h' | '72h' | 'daily'
  const [viewMode, setViewMode] = useState<'24h' | '72h' | 'daily'>('24h');
  const [activePoint, setActivePoint] = useState<any>(null);
  
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const lastZoomTimeRef = useRef<number>(0);

  // Wheel scroll zooming support (cycles through views smoothly)
  useEffect(() => {
    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      const now = Date.now();
      if (now - lastZoomTimeRef.current < 1000) return;
      lastZoomTimeRef.current = now;
      
      if (e.deltaY < 0) {
        // Scroll Up: Zoom In
        setViewMode(prev => {
          if (prev === 'daily') return '72h';
          if (prev === '72h') return '24h';
          return prev;
        });
      } else {
        // Scroll Down: Zoom Out
        setViewMode(prev => {
          if (prev === '24h') return '72h';
          if (prev === '72h') return 'daily';
          return prev;
        });
      }
    };

    const container = chartContainerRef.current;
    if (container) {
      container.addEventListener('wheel', handleWheel, { passive: false });
    }

    return () => {
      if (container) {
        container.removeEventListener('wheel', handleWheel);
      }
    };
  }, []);

  // Preferred dataset: prioritize hourlyData (SQLite) or aiForecastData.hourly_72h (AI Core)
  const rawHourlyList: HourlyForecastItem[] = useMemo(() => {
    if (hourlyData && hourlyData.length > 0) {
      return hourlyData;
    }
    if (aiForecastData && aiForecastData.hourly_72h && aiForecastData.hourly_72h.length > 0) {
      return aiForecastData.hourly_72h.map((h: any) => ({
        step: h.step,
        time_label: h.time_label,
        day_label: h.day_label,
        timestamp: h.timestamp,
        aqi: h.predicted_aqi !== undefined ? h.predicted_aqi : h.aqi,
        pm25: h.predicted_pm25 !== undefined ? h.predicted_pm25 : h.pm25,
        temperature: h.temperature,
        humidity: h.humidity,
        wind_speed: h.wind_speed,
        status: h.status,
        color: h.color,
        detail: h.detail
      }));
    }
    return [];
  }, [hourlyData, aiForecastData]);

  // Next 24 Hours Data
  const data24h: ChartPointItem[] = useMemo(() => {
    if (rawHourlyList.length === 0) return [];
    return rawHourlyList.slice(0, 25).map((item) => ({
      label: item.time_label,
      time_label: item.time_label,
      day_label: item.day_label,
      aqi: item.aqi,
      pm25: item.pm25,
      temperature: item.temperature,
      humidity: item.humidity,
      wind_speed: item.wind_speed,
      status: item.status,
      type: item.step === 0 ? 'actual' : 'prediction',
      detail: item.detail || `${item.status}: Atmospheric inversion projection.`
    }));
  }, [rawHourlyList]);

  // Full 72 Hours Data
  const data72h: ChartPointItem[] = useMemo(() => {
    if (rawHourlyList.length === 0) return [];
    return rawHourlyList.map((item) => ({
      label: item.step === 0 ? 'Now' : item.time_label.includes(':00') ? item.time_label : item.time_label,
      time_label: item.time_label,
      day_label: item.day_label,
      aqi: item.aqi,
      pm25: item.pm25,
      temperature: item.temperature,
      humidity: item.humidity,
      wind_speed: item.wind_speed,
      status: item.status,
      type: item.step === 0 ? 'actual' : 'prediction',
      detail: item.detail || `${item.status}: AI boundary layer projection.`
    }));
  }, [rawHourlyList]);

  // Daily 3-Day Aggregated Data
  const dataDaily = useMemo(() => {
    if (rawHourlyList.length === 0) return [];
    
    // Group 72 hours by day_label
    const groups: { [key: string]: HourlyForecastItem[] } = {};
    rawHourlyList.forEach(item => {
      const day = item.day_label || 'Today';
      if (!groups[day]) groups[day] = [];
      groups[day].push(item);
    });

    return Object.keys(groups).map((dayKey, idx): ChartPointItem => {
      const items = groups[dayKey];
      const avgAqi = Math.round(items.reduce((acc, i) => acc + i.aqi, 0) / items.length);
      const maxAqi = Math.max(...items.map(i => i.aqi));
      const avgPm25 = Math.round((items.reduce((acc, i) => acc + i.pm25, 0) / items.length) * 10) / 10;
      const primaryStatus = items[Math.floor(items.length / 2)]?.status || 'Moderate Haze';
      const avgTemp = Math.round(items.reduce((acc, i) => acc + (i.temperature || 24), 0) / items.length);
      const avgHum = Math.round(items.reduce((acc, i) => acc + (i.humidity || 50), 0) / items.length);
      const avgWind = Math.round(items.reduce((acc, i) => acc + (i.wind_speed || 5), 0) / items.length);

      return {
        label: idx === 0 ? 'Today' : dayKey,
        time_label: idx === 0 ? 'Today' : dayKey,
        day_label: dayKey,
        aqi: avgAqi,
        maxAqi,
        pm25: avgPm25,
        temperature: avgTemp,
        humidity: avgHum,
        wind_speed: avgWind,
        status: primaryStatus,
        type: idx === 0 ? 'actual' : 'prediction',
        detail: `Daily average AQI ${avgAqi} (Peak ${maxAqi}). Highest inversion risk during early morning.`
      };
    });
  }, [rawHourlyList]);

  // Active dataset based on view mode
  const currentData: ChartPointItem[] = useMemo(() => {
    if (viewMode === '24h') return data24h;
    if (viewMode === '72h') return data72h;
    return dataDaily;
  }, [viewMode, data24h, data72h, dataDaily]);

  // Determine peak AQI in the current dataset to style gradient
  const peakAqiInView = useMemo(() => {
    if (!currentData || currentData.length === 0) return 120;
    return Math.max(...currentData.map(d => d.aqi));
  }, [currentData]);

  const chartTheme = useMemo(() => {
    return getSmogTheme(peakAqiInView);
  }, [peakAqiInView]);

  const handleChartClick = (state: any) => {
    if (state && state.activePayload && state.activePayload.length > 0) {
      setActivePoint(state.activePayload[0].payload);
    } else {
      setActivePoint(null);
    }
  };

  // Custom Rich Tooltip
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length > 0) {
      const data = payload[0].payload;
      const theme = getSmogTheme(data.aqi);
      return (
        <div className="bg-slate-900/95 backdrop-blur-md text-white p-3.5 rounded-2xl shadow-xl border border-slate-700/80 text-xs min-w-[210px] animate-in fade-in duration-150">
          <div className="flex items-center justify-between gap-2 mb-2 pb-2 border-b border-slate-800">
            <span className="font-extrabold text-slate-100">{data.label} {data.day_label && data.label !== data.day_label ? `(${data.day_label})` : ''}</span>
            <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${theme.badge}`}>
              {data.status || theme.name}
            </span>
          </div>
          <div className="flex items-center justify-between gap-4 mb-1">
            <span className="text-slate-400 font-medium">Smog Index:</span>
            <span className="font-black text-base text-white">{data.aqi} AQI</span>
          </div>
          {data.pm25 !== undefined && (
            <div className="flex items-center justify-between gap-4 mb-1">
              <span className="text-slate-400 font-medium">PM2.5:</span>
              <span className="font-bold text-amber-400">{data.pm25} µg/m³</span>
            </div>
          )}
          {data.temperature !== undefined && (
            <div className="flex items-center justify-between gap-4 text-slate-400 text-[11px] mb-1">
              <span>Weather:</span>
              <span className="font-medium text-slate-300">{data.temperature}°C &bull; {data.humidity}% hum &bull; {data.wind_speed} km/h</span>
            </div>
          )}
          <div className="mt-2 pt-1.5 border-t border-slate-800 text-[10px] text-slate-400 font-semibold flex items-center justify-between">
            <span className="flex items-center gap-1">
              <span className={`w-1.5 h-1.5 rounded-full ${data.type === 'actual' ? 'bg-emerald-400 animate-pulse' : 'bg-blue-400'}`}></span>
              {data.type === 'actual' ? 'SQLite Live Sensor' : 'DHUAN AI Core Model'}
            </span>
            <span>Click for details</span>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="w-full mt-2" ref={chartContainerRef}>
      
      {/* Chart Top Controls & Status Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 gap-3">
        
        {/* Left: Interactive View Selector Tabs */}
        <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs font-bold w-fit">
          <button
            onClick={() => { setViewMode('24h'); setActivePoint(null); }}
            className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
              viewMode === '24h' 
                ? 'bg-white text-slate-900 shadow-xs' 
                : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>24h View</span>
          </button>
          
          <button
            onClick={() => { setViewMode('72h'); setActivePoint(null); }}
            className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
              viewMode === '72h' 
                ? 'bg-white text-slate-900 shadow-xs' 
                : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
            <span>72h Outlook</span>
          </button>
          
          <button
            onClick={() => { setViewMode('daily'); setActivePoint(null); }}
            className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
              viewMode === 'daily' 
                ? 'bg-white text-slate-900 shadow-xs' 
                : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            <Calendar className="w-3.5 h-3.5" />
            <span>3-Day Daily</span>
          </button>
        </div>

        {/* Right: Live Sync Indicator & Instructions */}
        <div className="flex items-center gap-2 text-[11px] text-slate-400 font-semibold">
          <span className="hidden sm:inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-slate-50 border border-slate-200 text-slate-600">
            <Database className="w-3 h-3 text-emerald-600" />
            SQLite & AI Core Connected
          </span>
          <span className="hidden md:inline-flex items-center gap-1 text-slate-400">
            <Wind className="w-3 h-3 text-slate-400" />
            Scroll to zoom
          </span>
        </div>
      </div>

      {/* The Area Chart */}
      <div className="w-full h-[290px]">
        <ResponsiveContainer width="100%" height="100%" className="focus:outline-none">
          <AreaChart
            data={currentData}
            margin={{ top: 12, right: 10, left: -25, bottom: 0 }}
            onClick={handleChartClick}
            style={{ cursor: 'pointer', outline: 'none' }}
          >
            <defs>
              <linearGradient id="smogAreaGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={chartTheme.stroke} stopOpacity={0.42} />
                <stop offset="95%" stopColor={chartTheme.stroke} stopOpacity={0.02} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
            <XAxis 
              dataKey="label" 
              axisLine={false} 
              tickLine={false} 
              interval={viewMode === '72h' ? 5 : 0}
              tick={{ fill: '#64748b', fontSize: 11, fontWeight: 700 }}
              dy={10}
            />
            <YAxis 
              axisLine={false} 
              tickLine={false} 
              domain={[0, (dataMax: number) => Math.max(180, Math.ceil((dataMax + 20) / 20) * 20)]}
              tick={{ fill: '#64748b', fontSize: 11, fontWeight: 600 }}
            />
            <Tooltip 
              content={<CustomTooltip />}
              cursor={{ stroke: '#cbd5e1', strokeWidth: 1.5, strokeDasharray: '4 4' }}
            />
            {/* Dividing reference line between live ground sensor and AI projections */}
            <ReferenceLine 
              x="Now" 
              stroke="#059669" 
              strokeDasharray="3 3" 
              strokeWidth={1.5}
              label={{ position: 'top', value: 'Live SQLite Baseline', fill: '#059669', fontSize: 10, fontWeight: 'bold' }} 
            />
            
            <Area 
              type="monotone" 
              dataKey="aqi" 
              stroke={chartTheme.stroke} 
              strokeWidth={3}
              fillOpacity={1} 
              fill="url(#smogAreaGradient)" 
              activeDot={{ r: 6, strokeWidth: 2, stroke: '#fff', fill: chartTheme.stroke }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Selected Point Inspector Banner */}
      {activePoint ? (
        <div className="mt-4 p-4 rounded-2xl bg-slate-900 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-in fade-in slide-in-from-bottom-2 duration-200 border border-slate-800">
          <div className="flex items-center gap-3">
            <div className={`px-3 py-1.5 rounded-xl text-sm font-black ${getSmogTheme(activePoint.aqi).badge}`}>
              Smog {activePoint.aqi}
            </div>
            <div>
              <div className="text-sm font-bold text-slate-100 flex items-center gap-2">
                <span>{activePoint.label} {activePoint.day_label ? `(${activePoint.day_label})` : ''}</span>
                <span className="text-slate-500">&bull;</span>
                <span className="text-amber-400 font-extrabold">{activePoint.status}</span>
                <span className="text-slate-500">&bull;</span>
                <span className="text-xs text-slate-400 font-medium">
                  {activePoint.type === 'actual' ? 'SQLite Sensor Reading' : 'AI Boundary Layer Projection'}
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-0.5 font-medium">
                {activePoint.pm25 !== undefined && `PM2.5: ${activePoint.pm25} µg/m³`} 
                {activePoint.temperature !== undefined && ` • Temp: ${activePoint.temperature}°C • Humidity: ${activePoint.humidity}% • Wind: ${activePoint.wind_speed} km/h`}
              </p>
            </div>
          </div>
          {activePoint.detail && (
            <div className="text-xs text-slate-300 bg-slate-800/80 px-3.5 py-2.5 rounded-xl border border-slate-700/60 max-w-md">
              <span className="text-amber-400 font-bold">Atmospheric Diagnostics:</span> {activePoint.detail}
            </div>
          )}
        </div>
      ) : (
        <div className="mt-3 flex items-center justify-between text-[11px] text-slate-400 px-1 font-medium">
          <span className="flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
            <span>AI model calibrated to live Open-Meteo atmospheric telemetry and central Lahore ground monitors.</span>
          </span>
          <span className="italic hidden sm:inline">Click any curve point to inspect PM2.5 & weather physics</span>
        </div>
      )}

    </div>
  );
}
