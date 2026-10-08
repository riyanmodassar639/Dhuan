'use client';
import { useState, useRef, useEffect } from 'react';
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

// --- MOCK DATA SETS FOR 5 ZOOM LEVELS ---

const hourlyData = [
  { label: '8 AM', aqi: 150, type: 'actual', detail: 'Morning rush hour starting.' },
  { label: '10 AM', aqi: 185, type: 'actual', detail: 'Heavy traffic emissions detected.' },
  { label: '12 PM', aqi: 195, type: 'actual', detail: 'Peak afternoon smog accumulation.' },
  { label: '2 PM (Now)', aqi: 165, type: 'actual', detail: 'Slight clearance due to wind.' },
  { label: '4 PM', aqi: 210, type: 'prediction', detail: 'Evening traffic building up.' },
  { label: '6 PM', aqi: 240, type: 'prediction', detail: 'Temperature inversion trapping smog.' },
  { label: '8 PM', aqi: 220, type: 'prediction', detail: 'Traffic dispersing.' },
  { label: '10 PM', aqi: 190, type: 'prediction', detail: 'Nighttime cooling.' },
];

const dailyData = [
  { label: 'Mon', aqi: 185, type: 'actual', detail: 'Standard workday emissions.' },
  { label: 'Tue', aqi: 195, type: 'actual', detail: 'Slightly elevated due to low winds.' },
  { label: 'Wed (Today)', aqi: 165, type: 'actual', detail: 'Current day average.' },
  { label: 'Thu', aqi: 220, type: 'prediction', detail: 'AI predicts hazardous spike due to crop burning winds.' },
  { label: 'Fri', aqi: 280, type: 'prediction', detail: 'Critical smog level expected. Stay indoors.' },
  { label: 'Sat', aqi: 150, type: 'prediction', detail: 'Weekend traffic reduction.' },
  { label: 'Sun', aqi: 110, type: 'prediction', detail: 'Clearest day of the week.' },
];

const weeklyData = [
  { label: 'Week 1', aqi: 140, type: 'actual', detail: 'Early month average.' },
  { label: 'Week 2', aqi: 160, type: 'actual', detail: 'Mid-month industrial activity.' },
  { label: 'Week 3 (Now)', aqi: 180, type: 'actual', detail: 'Current week trends.' },
  { label: 'Week 4', aqi: 250, type: 'prediction', detail: 'End of month crop burning season starts.' },
];

const monthlyData = [
  { label: 'Jan', aqi: 300, type: 'actual', detail: 'Peak winter smog.' },
  { label: 'Apr', aqi: 120, type: 'actual', detail: 'Spring clearance.' },
  { label: 'Jul', aqi: 80, type: 'actual', detail: 'Monsoon rains wash away pollution.' },
  { label: 'Oct (Now)', aqi: 190, type: 'actual', detail: 'Smog season begins.' },
  { label: 'Dec', aqi: 320, type: 'prediction', detail: 'Expected severe winter pollution.' },
];

const yearlyData = [
  { label: '2020', aqi: 140, type: 'actual', detail: 'COVID-19 Lockdown period. Lowest emissions.' },
  { label: '2021', aqi: 170, type: 'actual', detail: 'Industry and traffic reopening.' },
  { label: '2022', aqi: 210, type: 'actual', detail: 'Heavy winter smog and crop burning.' },
  { label: '2023', aqi: 195, type: 'actual', detail: 'Slight improvement in air quality.' },
  { label: '2024 (Now)', aqi: 185, type: 'actual', detail: 'Current yearly average.' },
  { label: '2025', aqi: 165, type: 'prediction', detail: 'Predicted drop due to EV adoption.' },
  { label: '2026', aqi: 150, type: 'prediction', detail: 'Long-term AI projection.' },
];

export default function ForecastChart() {
  const [zoomLevel, setZoomLevel] = useState(3);
  const [activePoint, setActivePoint] = useState<any>(null);
  
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const lastZoomTimeRef = useRef<number>(0);

  useEffect(() => {
    const handleWheel = (e: WheelEvent) => {
      e.preventDefault(); // STOPS the website from scrolling
      
      const now = Date.now();
      // STRICT COOLDOWN: Ignore all scroll events for 1.2 seconds after a zoom.
      // This mathematically prevents fast skipping on sensitive trackpads.
      if (now - lastZoomTimeRef.current < 1200) return;
      
      lastZoomTimeRef.current = now;
      
      if (e.deltaY < 0) {
        // Scroll Up = Zoom In
        setZoomLevel(prev => {
          if (prev < 4) { setActivePoint(null); return prev + 1; }
          return prev;
        });
      } else {
        // Scroll Down = Zoom Out
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

  let currentData;
  let referenceLabel;
  let viewName = "";
  
  switch(zoomLevel) {
    case 0: 
      currentData = yearlyData; 
      referenceLabel = '2024 (Now)';
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
      currentData = hourlyData; 
      referenceLabel = '2 PM (Now)';
      viewName = "Hourly View (Time)";
      break;
    case 3:
    default: 
      currentData = dailyData; 
      referenceLabel = 'Wed (Today)';
      viewName = "Daily View (Days)";
      break;
  }

  // Handle click on chart area
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
