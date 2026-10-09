'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  Activity, 
  Map as MapIcon, 
  ShieldAlert, 
  Settings, 
  LogOut, 
  Wind,
  Menu,
  X,
  Bell,
  MapPin,
  Sparkles
} from 'lucide-react';
import { useState } from 'react';
import Footer from '@/components/Footer';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const navItems = [
    { name: 'Overview', href: '/dashboard', icon: Activity },
    { name: 'Map View', href: '/dashboard/map', icon: MapPin },
    { name: 'Smart Routing', href: '/dashboard/routing', icon: MapIcon },
    { name: 'Health Profile', href: '/dashboard/health', icon: ShieldAlert },
    { name: 'Settings', href: '/dashboard/settings', icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col relative">
      
      {/* Top Navbar */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-50">
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
                        ? 'bg-emerald-50 text-emerald-700'
                        : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                    }`}
                  >
                    <Icon className={`w-[18px] h-[18px] sm:w-4 sm:h-4 ${isActive ? 'text-emerald-600' : 'text-slate-400'}`} />
                    <span className="hidden md:block">{item.name}</span>
                  </Link>
                );
              })}
            </nav>

            {/* Right side Profile (Mobile + Desktop) */}
            <div className="flex items-center gap-2 sm:gap-4 shrink-0 ml-1">
               {/* AQI Mini Badge (Desktop Only) */}
               <div className="hidden lg:flex items-center gap-2 bg-yellow-50 border border-yellow-100 px-3 py-1.5 rounded-full shadow-sm">
                  <div className="w-2 h-2 rounded-full bg-yellow-500 animate-pulse"></div>
                  <span className="text-xs font-bold text-yellow-700">Lahore AQI: 165</span>
               </div>
               
               <button className="hidden sm:block p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-full transition-colors relative">
                 <Bell className="w-5 h-5" />
                 <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-rose-500 border-2 border-white rounded-full"></span>
               </button>

               <div className="hidden sm:block h-8 w-px bg-slate-200 mx-1"></div>

               <div className="flex items-center gap-2 sm:gap-3">
                  <div className="w-7 h-7 sm:w-9 sm:h-9 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center font-bold text-slate-600 text-sm shrink-0">
                    A
                  </div>
                  <Link href="/" className="hidden sm:block text-slate-400 hover:text-rose-600 transition-colors p-1" title="Log out">
                    <LogOut className="w-5 h-5" />
                  </Link>
               </div>
            </div>

          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 flex flex-col">
        {children}
      </main>

      {/* Dashboard Footer (Shown on all views since bottom bar is gone) */}
      <div>
        <Footer />
      </div>

      {/* Floating DHUAN Assistant Button - Reset position to standard bottom */}
      <div className="fixed bottom-6 right-6 z-[100] group">
         <div className="absolute inset-0 bg-emerald-500 rounded-2xl blur opacity-40 group-hover:opacity-70 group-hover:scale-110 transition-all duration-500 animate-pulse"></div>
         <button 
           className="relative flex items-center justify-center gap-2 bg-slate-900 text-white px-4 py-3 md:px-5 md:py-3.5 rounded-2xl shadow-2xl hover:bg-slate-800 transition-transform hover:-translate-y-1 hover:scale-105 border border-slate-700/50 focus:outline-none focus:ring-4 focus:ring-emerald-500/30"
           aria-label="Chat with DHUAN"
           title="Chat with DHUAN"
         >
           <Wind className="w-5 h-5 text-emerald-400" />
           <span className="font-extrabold text-sm tracking-wide hidden md:block">Ask DHUAN</span>
         </button>
      </div>

    </div>
  );
}
