'use client';

import React from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const data = [
  { day: 'Mon', exposure: 45, risk: 20 },
  { day: 'Tue', exposure: 82, risk: 55 },
  { day: 'Wed', exposure: 120, risk: 85 }, // High smog day
  { day: 'Thu', exposure: 90, risk: 60 },
  { day: 'Fri', exposure: 65, risk: 35 },
  { day: 'Sat', exposure: 40, risk: 15 },
  { day: 'Sun', exposure: 50, risk: 25 },
];

export default function HealthGraphWidget() {
  return (
    <div className="h-[250px] w-full mt-4">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart
          data={data}
          margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
        >
          <defs>
            <linearGradient id="colorRisk" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="colorExposure" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
          <XAxis 
            dataKey="day" 
            axisLine={false}
            tickLine={false}
            tick={{ fontSize: 12, fill: '#64748b' }}
            dy={10}
          />
          <YAxis 
            axisLine={false}
            tickLine={false}
            tick={{ fontSize: 12, fill: '#64748b' }}
          />
          <Tooltip 
            contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
            labelStyle={{ fontWeight: 'bold', color: '#0f172a', marginBottom: '4px' }}
          />
          <Area 
            type="monotone" 
            dataKey="exposure" 
            name="PM2.5 Exposure"
            stroke="#f59e0b" 
            strokeWidth={2}
            fillOpacity={1} 
            fill="url(#colorExposure)" 
          />
          <Area 
            type="monotone" 
            dataKey="risk" 
            name="Asthma Risk %"
            stroke="#ef4444" 
            strokeWidth={2}
            fillOpacity={1} 
            fill="url(#colorRisk)" 
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
