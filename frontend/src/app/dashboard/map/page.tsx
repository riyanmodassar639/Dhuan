'use client';

import dynamic from 'next/dynamic';
import { MapPin, Info } from 'lucide-react';

const MapWidget = dynamic(() => import('@/components/MapWidget'), { ssr: false });

export default function MapPage() {
  return (
    <div className="flex-1 w-full h-[calc(100vh-73px)] relative flex flex-col bg-slate-100 z-0">
       <MapWidget fullScreen={true} />
    </div>
  );
}
