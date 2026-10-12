'use client';

import React, { useRef, useState } from 'react';
import { 
  Sun, 
  Moon, 
  Droplets, 
  Wind, 
  ChevronLeft, 
  ChevronRight, 
  Sparkles,
  Info
} from 'lucide-react';

export interface HourlyForecastItem {
  id?: number;
  step: number;
  time_label: string;
  day_label?: string;
  timestamp: string;
  aqi: number;
  pm25: number;
  temperature?: number;
  humidity?: number;
  wind_speed?: number;
  wind_direction?: number;
  weather_icon?: string;
  status: string;
  color: string;
  detail?: string;
}

interface HourlyForecastWidgetProps {
  hourlyData?: HourlyForecastItem[];
  cityName?: string;
}

export default function HourlyForecastWidget({ 
  hourlyData = [], 
  cityName = 'Lahore' 
}: HourlyForecastWidgetProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [selectedItem, setSelectedItem] = useState<HourlyForecastItem | null>(null);
  const [viewMode, setViewMode] = useState<'24h' | '72h'>('24h');

  const scroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const scrollAmount = direction === 'left' ? -360 : 360;
      scrollRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  // Specialized Smog Severity Badge Colors matching DHUAN Smog Inversion Standard
  const getSmogBadgeStyle = (aqi: number) => {
    if (aqi <= 50) return 'bg-emerald-500 text-white';
    if (aqi <= 100) return 'bg-amber-400 text-slate-900 font-extrabold';
    if (aqi <= 150) return 'bg-orange-500 text-white';
    if (aqi <= 200) return 'bg-rose-600 text-white';
    if (aqi <= 300) return 'bg-purple-600 text-white';
    return 'bg-rose-950 border border-rose-500 text-rose-100 font-extrabold';
  };
  const getAqiBadgeStyle = getSmogBadgeStyle;

  // Filter items based on selected timeframe
  const displayItems = viewMode === '24h' 
    ? hourlyData.slice(0, 25) // Step 0 (Now) + next 24 hours
    : hourlyData;

  if (!displayItems || displayItems.length === 0) {
    return null;
  }

  return (
    <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm relative overflow-hidden transition-all hover:shadow-md">
      
      {/* Header section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="font-extrabold text-xl text-slate-900 tracking-tight">Hourly Smog Forecast</h3>
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
              <Sparkles className="w-3 h-3" />
              Smog AI Model
            </span>
          </div>
          <p className="text-sm text-slate-500 font-medium mt-0.5">
            {cityName} Smog Severity & Inversion Model
          </p>
        </div>

        {/* View mode toggle + Scroll buttons */}
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs font-bold">
            <button
              onClick={() => setViewMode('24h')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                viewMode === '24h' 
                  ? 'bg-white text-slate-900 shadow-xs' 
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              Next 24h
            </button>
            <button
              onClick={() => setViewMode('72h')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                viewMode === '72h' 
                  ? 'bg-white text-slate-900 shadow-xs' 
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              72h Outlook
            </button>
          </div>

          <div className="hidden sm:flex items-center gap-1 ml-2">
            <button
              onClick={() => scroll('left')}
              title="Scroll backward"
              aria-label="Scroll backward"
              className="p-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => scroll('right')}
              title="Scroll forward"
              aria-label="Scroll forward"
              className="p-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Horizontal Hourly Columns Container */}
      <div 
        ref={scrollRef}
        className="flex items-stretch gap-2.5 overflow-x-auto no-scrollbar pb-3 pt-1 scroll-smooth"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {displayItems.map((item, idx) => {
          const isSelected = selectedItem?.step === item.step;
          const aqiBadgeClass = getAqiBadgeStyle(item.aqi);
          const isDayTime = item.weather_icon === 'sunny';

          return (
            <div
              key={`${item.step}-${item.time_label}`}
              onClick={() => setSelectedItem(isSelected ? null : item)}
              className={`flex flex-col items-center justify-between min-w-[76px] sm:min-w-[82px] p-3 rounded-2xl border transition-all cursor-pointer select-none group ${
                isSelected 
                  ? 'bg-emerald-50/60 border-emerald-400 ring-2 ring-emerald-300 shadow-sm' 
                  : 'bg-slate-50/70 hover:bg-slate-100/80 border-slate-200/80 hover:border-slate-300'
              }`}
            >
              {/* Row 1: Time Label */}
              <div className="text-center mb-3">
                <span className={`text-xs font-bold tracking-tight block ${
                  item.step === 0 
                    ? 'text-emerald-700 font-extrabold' 
                    : item.time_label.includes('00:00')
                    ? 'text-indigo-700 font-extrabold'
                    : 'text-slate-700'
                }`}>
                  {item.time_label}
                </span>
                {item.day_label && item.step !== 0 && !item.time_label.includes('00:00') && (
                  <span className="text-[10px] font-semibold text-slate-400 block -mt-0.5">
                    {item.day_label}
                  </span>
                )}
              </div>

              {/* Row 2: AQI Badge Chip */}
              <div className={`w-full py-1.5 px-2 rounded-lg text-center text-xs font-bold shadow-xs transition-transform group-hover:scale-105 ${aqiBadgeClass}`}>
                {item.aqi}
              </div>

              {/* Row 3: Weather Icon */}
              <div className="my-3 flex items-center justify-center">
                {isDayTime ? (
                  <Sun className="w-5 h-5 text-amber-500 drop-shadow-xs" />
                ) : (
                  <Moon className="w-5 h-5 text-indigo-400 drop-shadow-xs" />
                )}
              </div>

              {/* Row 4: Temperature */}
              <div className="text-xs font-bold text-slate-800 mb-2">
                {item.temperature ?? 24}°
              </div>

              {/* Row 5: Wind Speed */}
              <div className="flex items-center gap-1 text-[11px] font-semibold text-slate-500 mb-2">
                <Wind className="w-3 h-3 text-slate-400" />
                <span>{item.wind_speed ?? 6} <span className="text-[9px]">km/h</span></span>
              </div>

              {/* Row 6: Humidity */}
              <div className="flex items-center gap-1 text-[11px] font-semibold text-sky-600">
                <Droplets className="w-3 h-3 text-sky-500" />
                <span>{item.humidity ?? 45}%</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Detail Inspector Banner (Shows when an hour card is selected) */}
      {selectedItem && (
        <div className="mt-4 p-4 rounded-2xl bg-slate-900 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="flex items-center gap-3">
            <div className={`px-3 py-1.5 rounded-xl text-sm font-extrabold ${getSmogBadgeStyle(selectedItem.aqi)}`}>
              Smog {selectedItem.aqi}
            </div>
            <div>
              <div className="text-sm font-bold text-slate-100 flex items-center gap-2">
                <span>{selectedItem.time_label} ({selectedItem.day_label || 'Today'})</span>
                <span className="text-slate-400">&bull;</span>
                <span className="text-amber-400 font-extrabold">{selectedItem.status}</span>
              </div>
              <p className="text-xs text-slate-300 mt-0.5 font-medium">
                PM2.5: {selectedItem.pm25} µg/m³ &bull; Temp: {selectedItem.temperature}°C &bull; Humidity: {selectedItem.humidity}% &bull; Wind: {selectedItem.wind_speed} km/h
              </p>
            </div>
          </div>
          {selectedItem.detail && (
            <div className="text-xs text-slate-300 bg-slate-800/80 px-3.5 py-2.5 rounded-xl border border-slate-700/60 max-w-md">
              <span className="text-amber-400 font-bold">Smog & Inversion Diagnostics:</span> {selectedItem.detail}
            </div>
          )}
        </div>
      )}

      {/* Smog Severity Classification Legend */}
      <div className="mt-4 pt-3 border-t border-slate-100 flex flex-col sm:flex-row items-start sm:items-center justify-between text-[11px] text-slate-500 gap-3 font-semibold">
        <div className="flex items-center gap-3 flex-wrap">
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-xs bg-emerald-500 shrink-0"></span>
            0-50 Clean Air
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-xs bg-amber-400 shrink-0"></span>
            51-100 Moderate Haze
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-xs bg-orange-500 shrink-0"></span>
            101-150 Smog Inversion Forming
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-xs bg-rose-600 shrink-0"></span>
            151-200 Dense Smog Inversion
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-xs bg-purple-600 shrink-0"></span>
            201-300 Severe Smog Event
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-xs bg-rose-950 border border-rose-500 shrink-0"></span>
            301+ Hazardous Toxic Smog
          </span>
        </div>
        <div className="flex items-center gap-1 text-slate-400 text-[10px] font-medium shrink-0">
          <Info className="w-3.5 h-3.5 text-amber-500 shrink-0" />
          <span>Click any hour to inspect nocturnal inversion physics</span>
        </div>
      </div>

    </div>
  );
}
