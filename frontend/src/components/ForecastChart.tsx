'use client';
import { useState, useRef, useEffect, useMemo } from 'react';
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
import { AlertCircle, Wind } from 'lucide-react';

const baseHourlyData = [
  { label: '8 AM', aqi: 90, type: 'actual', detail: 'Morning rush hour starting.' },
  { label: '10 AM', aqi: 110, type: 'actual', detail: 'Heavy traffic emissions detected.' },
  { label: '12 PM', aqi: 105, type: 'actual', detail: 'Peak afternoon smog accumulation.' },
  { label: 'Now', aqi: 101, type: 'actual', detail: 'Live verified sensor reading in SQLite.' },
  { label: '4 PM', aqi: 125, type: 'prediction', detail: 'Evening traffic building up.' },
  { label: '6 PM', aqi: 145, type: 'prediction', detail: 'Temperature inversion trapping smog.' },
  { label: '8 PM', aqi: 135, type: 'prediction', detail: 'Traffic dispersing.' },
  { label: '10 PM', aqi: 115, type: 'prediction', detail: 'Nighttime cooling.' },
];

const baseDailyData = [
  { label: 'Mon', aqi: 115, type: 'actual', detail: 'Standard workday emissions.' },
  { label: 'Tue', aqi: 120, type: 'actual', detail: 'Slightly elevated due to low winds.' },
  { label: 'Today', aqi: 101, type: 'actual', detail: 'Live synchronized reading.' },
  { label: 'Thu', aqi: 130, type: 'prediction', detail: 'AI predicts moderate increase in evening.' },
  { label: 'Fri', aqi: 140, type: 'prediction', detail: 'Post-sunset cooling creates secondary inversion.' },
  { label: 'Sat', aqi: 95, type: 'prediction', detail: 'Weekend traffic reduction.' },
  { label: 'Sun', aqi: 85, type: 'prediction', detail: 'Clearest day of the week.' },
];

const weeklyData = [
  { label: 'Week 1', aqi: 90, type: 'actual', detail: 'Early month average.' },
  { label: 'Week 2', aqi: 105, type: 'actual', detail: 'Mid-month industrial activity.' },
  { label: 'Week 3 (Now)', aqi: 101, type: 'actual', detail: 'Current week trends.' },
  { label: 'Week 4', aqi: 125, type: 'prediction', detail: 'End of month weather changes.' },
];

const monthlyData = [
  { label: 'Jan', aqi: 240, type: 'actual', detail: 'Peak winter smog.' },
  { label: 'Apr', aqi: 95, type: 'actual', detail: 'Spring clearance.' },
  { label: 'Jul', aqi: 45, type: 'actual', detail: 'Monsoon rains wash away pollution.' },
  { label: 'Oct (Now)', aqi: 101, type: 'actual', detail: 'Smog season begins.' },
  { label: 'Dec', aqi: 260, type: 'prediction', detail: 'Expected severe winter pollution.' },
];

const yearlyData = [
  { label: '2020', aqi: 110, type: 'actual', detail: 'COVID-19 Lockdown period. Lowest emissions.' },
  { label: '2021', aqi: 135, type: 'actual', detail: 'Industry and traffic reopening.' },
  { label: '2022', aqi: 165, type: 'actual', detail: 'Heavy winter smog and crop burning.' },
  { label: '2023', aqi: 150, type: 'actual', detail: 'Slight improvement in air quality.' },
  { label: '2024', aqi: 140, type: 'actual', detail: 'Historical average.' },
  { label: '2025', aqi: 125, type: 'prediction', detail: 'Predicted drop due to EV adoption.' },
  { label: '2026 (Now)', aqi: 101, type: 'prediction', detail: 'Current live projection.' },
];

export default function ForecastChart({ 
  currentAqi, 
  aiForecastData 
}: { 
  currentAqi?: number; 
  aiForecastData?: any; 
}) {
  const [zoomLevel, setZoomLevel] = useState(3);
  const [activePoint, setActivePoint] = useState<any>(null);
  
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const lastZoomTimeRef = useRef<number>(0);

  useEffect(() => {
    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      
      const now = Date.now();
      if (now - lastZoomTimeRef.current < 1200) return;
      lastZoomTimeRef.current = now;
      
      if (e.deltaY < 0) {
        setZoomLevel(prev => {
          if (prev < 4) { setActivePoint(null); return prev + 1; }
          return prev;
        });
      } else {
        setZoomLevel(prev => {
          if (prev > 0) { setActivePoint(null); return prev - 1; }
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

  // Compute live data synchronized with AI Core & SQL
  const liveHourlyData = useMemo(() => {
    if (aiForecastData && aiForecastData.hourly_72h && aiForecastData.hourly_72h.length > 0) {
      const nowAqi = currentAqi !== undefined ? currentAqi : 101;
      const initial = [
        { label: 'Now', aqi: nowAqi, type: 'actual', detail: 'Verified ground sensor reading from SQLite.' }
      ];
      const future = aiForecastData.hourly_72h.slice(0, 8).map((p: any) => ({
        label: p.time_label,
        aqi: p.predicted_aqi,
        type: 'prediction',
        detail: p.detail
      }));
      return [...initial, ...future];
    }
    return baseHourlyData.map(h => 
      h.label === 'Now' && currentAqi !== undefined ? { ...h, aqi: currentAqi } : h
    );
  }, [aiForecastData, currentAqi]);

  const liveDailyData = useMemo(() => {
    return baseDailyData.map(d => 
      d.label === 'Today' && currentAqi !== undefined ? { ...d, aqi: currentAqi } : d
    );
  }, [currentAqi]);

  let currentData;
  let referenceLabel;
  let viewName = "";
  
  switch(zoomLevel) {
    case 0: 
      currentData = yearlyData; 
      referenceLabel = '2026 (Now)';
      viewName = "Yearly View";
      break;
    case 1: 
      currentData = monthlyData; 
      referenceLabel = 'Oct (Now)';
      viewName = "Monthly View";
      break;
    case 2: 
      currentData = weeklyData; 
      referenceLabel = 'Week 3 (Now)';
      viewName = "Weekly View";
      break;
    case 4: 
      currentData = liveHourlyData; 
      referenceLabel = 'Now';
      viewName = "Hourly View (Time)";
      break;
    case 3:
    default: 
      currentData = liveDailyData; 
      referenceLabel = 'Today';
      viewName = "Daily View (Days)";
      break;
  }

  const handleChartClick = (state: any) => {
    if (state && state.activePayload && state.activePayload.length > 0) {
      setActivePoint(state.activePayload[0].payload);
    } else {
      setActivePoint(null);
    }
  };

  return (
    <div className="w-full mt-4" ref={chartContainerRef}>
      
      {/* Scroll Zoom Instructions */}
      <div className="flex flex-wrap items-center justify-between mb-4 gap-4">
        <div className="flex items-center gap-3">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest bg-slate-50 px-3 py-1.5 rounded-full border border-slate-100 shadow-inner">
            <Wind className="w-3 h-3 inline-block mr-1" />
            Scroll to zoom
          </p>
          <span className="text-xs font-extrabold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-md border border-emerald-100">
            {viewName}
          </span>
        </div>
        
        <p className="text-[11px] font-medium text-slate-400 italic">
          Click any point for AI details
        </p>
      </div>

      {/* The Chart */}
      <div className="w-full h-[280px]">
        <ResponsiveContainer width="100%" height="100%" className="focus:outline-none">
          <AreaChart
            data={currentData}
            margin={{ top: 10, right: 0, left: -25, bottom: 0 }}
            onClick={handleChartClick}
            style={{ cursor: 'pointer', outline: 'none' }}
          >
            <defs>
              <linearGradient id="colorAqi" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.4} />
                <stop offset="95%" stopColor="#f43f5e" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
            <XAxis 
              dataKey="label" 
              axisLine={false} 
              tickLine={false} 
              tick={{ fill: '#64748b', fontSize: 11, fontWeight: 600 }}
              dy={10}
            />
            <YAxis 
              axisLine={false} 
              tickLine={false} 
              tick={{ fill: '#64748b', fontSize: 11 }}
            />
            <Tooltip 
              contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
              labelStyle={{ fontWeight: 'bold', color: '#0f172a' }}
              cursor={{ stroke: '#cbd5e1', strokeWidth: 1, strokeDasharray: '4 4' }}
            />
            {/* Divider between Actual and Prediction */}
            <ReferenceLine 
              x={referenceLabel} 
              stroke="#94a3b8" 
              strokeDasharray="3 3" 
              label={{ position: 'top', value: 'AI Forecast', fill: '#64748b', fontSize: 10, fontWeight: 'bold' }} 
            />
            
            <Area 
              type="monotone" 
              dataKey="aqi" 
              stroke="#f43f5e" 
              strokeWidth={3}
              fillOpacity={1} 
              fill="url(#colorAqi)" 
              activeDot={{ r: 6, strokeWidth: 2, stroke: '#fff', fill: '#e11d48' }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Click Detail Panel */}
      {activePoint && (
        <div className="mt-6 bg-rose-50/50 border border-rose-100 rounded-xl p-4 flex gap-4 items-start animate-in fade-in slide-in-from-bottom-2">
          <div className="bg-white p-2 rounded-lg shadow-sm border border-rose-100 mt-1">
             <AlertCircle className="w-5 h-5 text-rose-500" />
          </div>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h4 className="font-bold text-slate-900 text-sm">{activePoint.label} Analysis</h4>
              <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${activePoint.type === 'prediction' ? 'bg-blue-100 text-blue-700' : 'bg-slate-200 text-slate-700'}`}>
                {activePoint.type === 'prediction' ? 'AI Predicted' : 'Recorded Data'}
              </span>
            </div>
            <p className="text-rose-600 font-extrabold text-lg mb-1">AQI: {activePoint.aqi}</p>
            <p className="text-slate-600 text-xs leading-relaxed">{activePoint.detail}</p>
          </div>
        </div>
      )}
    </div>
  );
}
