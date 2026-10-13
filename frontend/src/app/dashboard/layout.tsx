'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  Activity, 
  Map as MapIcon, 
  ShieldAlert, 
  LogOut, 
  Wind,
  Menu,
  X,
  Bell,
  MapPin,
  Sparkles,
  PhoneCall
} from 'lucide-react';
import { useState, useEffect } from 'react';
import Footer from '@/components/Footer';
import AskDhuanAssistant from '@/components/AskDhuanAssistant';
import { getApiEndpoint } from '@/lib/api';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [liveAqi, setLiveAqi] = useState<number | null>(null);
  const [isAskDhuanOpen, setIsAskDhuanOpen] = useState(false);

  useEffect(() => {
    const fetchLive = async () => {
      try {
        const res = await fetch(getApiEndpoint('/dashboard/overview'));
        if (res.ok) {
          const data = await res.json();
          if (data.metrics && typeof data.metrics.current_aqi === 'number') {
            setLiveAqi(data.metrics.current_aqi);
          }
        }
      } catch (err) {
        // Fallback gracefully
      }
    };
    fetchLive();
    const interval = setInterval(fetchLive, 30000);
    return () => clearInterval(interval);
  }, []);

  const navItems = [
    { name: 'Overview', href: '/dashboard', icon: Activity },
    { name: 'Map View', href: '/dashboard/map', icon: MapPin },
    { name: 'Smart Routing', href: '/dashboard/routing', icon: MapIcon },
    { name: 'Health Profile', href: '/dashboard/health', icon: ShieldAlert },
    { name: 'Ask DHUAN', href: '/dashboard/ask', icon: Sparkles },
    { name: 'SOS & Hospitals', href: '/dashboard/emergency', icon: PhoneCall, isEmergency: true },
  ];

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col relative">
      
      {/* Top Navbar */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-[3000] shadow-xs">
        <div className="max-w-7xl mx-auto px-2 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            
            {/* Logo */}
            <div className="flex items-center">
              <Link href="/dashboard" className="flex items-center gap-2 group mr-1 sm:mr-8">
                <div className="bg-emerald-50 p-1 sm:p-1.5 rounded-lg shrink-0">
                  <Wind className="h-5 w-5 text-emerald-600" />
                </div>
                <div className="flex-col hidden sm:flex">
                  <span className="font-bold text-lg tracking-tight text-slate-900 leading-none">DHUAN</span>
                </div>
              </Link>
            </div>

            {/* Navigation (Icons on Mobile, Text+Icons on Desktop) */}
            <nav className="flex items-center gap-0.5 sm:gap-2 flex-1 justify-center md:justify-start overflow-x-auto no-scrollbar px-1">
              {navItems.map((item) => {
                const isActive = pathname === item.href;
                const Icon = item.icon;
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    title={item.name}
                    className={`flex items-center gap-2 p-1.5 sm:px-3 sm:py-2 rounded-lg text-sm font-semibold transition-colors whitespace-nowrap shrink-0 ${
                      isActive
                        ? (item.isEmergency ? 'bg-rose-100 text-rose-800 font-bold border border-rose-300' : 'bg-emerald-50 text-emerald-700')
                        : item.isEmergency
                        ? 'text-rose-700 bg-rose-50/70 hover:bg-rose-100 border border-rose-200/80 font-bold'
                        : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                    }`}
                  >
                    <Icon className={`w-[18px] h-[18px] sm:w-4 sm:h-4 ${
                      isActive 
                        ? (item.isEmergency ? 'text-rose-600' : 'text-emerald-600') 
                        : (item.isEmergency ? 'text-rose-600' : 'text-slate-400')
                    }`} />
                    <span className="hidden md:block">{item.name}</span>
                  </Link>
                );
              })}
            </nav>

            {/* Right side Profile (Mobile + Desktop) */}
            <div className="flex items-center gap-2 sm:gap-4 shrink-0 ml-1">
               {/* Smog Severity Mini Badge (Desktop Only) */}
               {(() => {
                 const aqi = liveAqi !== null ? liveAqi : 81;
                 let label = 'Clean Air';
                 let badgeBg = 'bg-emerald-50 border-emerald-200 text-emerald-800';
                 let dotBg = 'bg-emerald-500';
                 if (aqi > 300) {
                   label = 'Hazardous Toxic Smog';
                   badgeBg = 'bg-rose-950 border-rose-800 text-rose-100';
                   dotBg = 'bg-rose-500';
                 } else if (aqi > 200) {
                   label = 'Severe Smog Event';
                   badgeBg = 'bg-purple-50 border-purple-200 text-purple-800';
                   dotBg = 'bg-purple-600';
                 } else if (aqi > 150) {
                   label = 'Dense Smog Inversion';
                   badgeBg = 'bg-rose-50 border-rose-200 text-rose-800';
                   dotBg = 'bg-rose-600';
                 } else if (aqi > 100) {
                   label = 'Smog Inversion Forming';
                   badgeBg = 'bg-orange-50 border-orange-200 text-orange-800';
                   dotBg = 'bg-orange-500';
                 } else if (aqi > 50) {
                   label = 'Moderate Haze';
                   badgeBg = 'bg-amber-50 border-amber-200 text-amber-800';
                   dotBg = 'bg-amber-500';
                 }
                 return (
                   <div className={`hidden lg:flex items-center gap-2 border px-3 py-1.5 rounded-full shadow-xs ${badgeBg}`}>
                      <div className={`w-2 h-2 rounded-full animate-pulse ${dotBg}`}></div>
                      <span className="text-xs font-bold">Lahore Smog: {liveAqi !== null ? liveAqi : '81'} &bull; {label}</span>
                   </div>
                 );
               })()}
               
               <button className="hidden sm:block p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-full transition-colors relative">
                 <Bell className="w-5 h-5" />
                 <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-rose-500 border-2 border-white rounded-full"></span>
               </button>

               <div className="hidden sm:block h-8 w-px bg-slate-200 mx-1"></div>

               <div className="flex items-center gap-2 sm:gap-3">
                  <Link href="/dashboard/health" title="View Health Profile" className="w-7 h-7 sm:w-9 sm:h-9 rounded-full bg-slate-100 hover:bg-emerald-50 hover:border-emerald-300 border border-slate-200 flex items-center justify-center font-bold text-slate-600 hover:text-emerald-700 text-sm shrink-0 transition-colors">
                    A
                  </Link>
                  <Link href="/" className="hidden sm:block text-slate-400 hover:text-rose-600 transition-colors p-1" title="Log out">
                    <LogOut className="w-5 h-5" />
                  </Link>
               </div>
            </div>

          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className={`flex-1 w-full mx-auto flex flex-col ${
        pathname === '/dashboard/map' 
          ? 'max-w-none p-0' 
          : 'max-w-7xl p-4 sm:p-6 lg:p-8'
      }`}>
        {children}
      </main>

      {/* Dashboard Footer (Hidden on full-screen map) */}
      {pathname !== '/dashboard/map' && (
        <div>
          <Footer />
        </div>
      )}

      {/* Floating DHUAN Assistant Button */}
      <div className="fixed bottom-6 right-6 z-[100] group">
         <div className="absolute inset-0 bg-emerald-500 rounded-2xl blur opacity-40 group-hover:opacity-70 group-hover:scale-110 transition-all duration-500 animate-pulse"></div>
         <button 
           onClick={() => setIsAskDhuanOpen((prev) => !prev)}
           className="relative flex items-center justify-center gap-2 bg-slate-900 text-white px-4 py-3 md:px-5 md:py-3.5 rounded-2xl shadow-2xl hover:bg-slate-800 transition-transform hover:-translate-y-1 hover:scale-105 border border-slate-700/50 focus:outline-none focus:ring-4 focus:ring-emerald-500/30 cursor-pointer"
           aria-label="Chat with DHUAN AI"
           title="Ask DHUAN Smog AI Assistant"
         >
           <Wind className="w-5 h-5 text-emerald-400" />
           <span className="font-extrabold text-sm tracking-wide hidden md:block">Ask DHUAN</span>
           {isAskDhuanOpen && (
             <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
           )}
         </button>
      </div>

      {/* Ask DHUAN AI Assistant Drawer / Modal */}
      <AskDhuanAssistant 
        isOpen={isAskDhuanOpen} 
        onClose={() => setIsAskDhuanOpen(false)} 
        liveAqi={liveAqi} 
        cityName="Lahore" 
      />

    </div>
  );
}
