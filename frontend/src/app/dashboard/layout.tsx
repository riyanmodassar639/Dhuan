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
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            
            {/* Logo and Desktop Nav */}
            <div className="flex items-center gap-8">
              <Link href="/dashboard" className="flex items-center gap-2 group">
                <div className="bg-emerald-50 p-1.5 rounded-lg">
                  <Wind className="h-5 w-5 text-emerald-600" />
                </div>
                <div className="flex flex-col">
                  <span className="font-bold text-lg tracking-tight text-slate-900 leading-none">DHUAN</span>
                </div>
              </Link>
              
              {/* Desktop Nav Links */}
              <nav className="hidden md:flex items-center gap-1">
                {navItems.map((item) => {
                  const isActive = pathname === item.href;
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.name}
                      href={item.href}
                      className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-semibold transition-colors ${
                        isActive
                          ? 'bg-emerald-50 text-emerald-700'
                          : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                      }`}
                    >
                      <Icon className={`w-4 h-4 ${isActive ? 'text-emerald-600' : 'text-slate-400'}`} />
                      {item.name}
                    </Link>
                  );
                })}
              </nav>
            </div>

            {/* Right side icons & Profile */}
            <div className="hidden md:flex items-center gap-4">
               {/* AQI Mini Badge */}
               <div className="flex items-center gap-2 bg-yellow-50 border border-yellow-100 px-3 py-1.5 rounded-full shadow-sm">
                  <div className="w-2 h-2 rounded-full bg-yellow-500 animate-pulse"></div>
                  <span className="text-xs font-bold text-yellow-700">Lahore AQI: 165</span>
               </div>
               
               <button className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-full transition-colors relative">
                 <Bell className="w-5 h-5" />
                 <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-rose-500 border-2 border-white rounded-full"></span>
               </button>

               <div className="h-8 w-px bg-slate-200 mx-1"></div>

               <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center font-bold text-slate-600 text-sm">
                    A
                  </div>
                  <Link href="/" className="text-slate-400 hover:text-rose-600 transition-colors p-1" title="Log out">
                    <LogOut className="w-5 h-5" />
                  </Link>
               </div>
            </div>

            {/* Mobile menu button removed in favor of bottom tab bar */}
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      {/* Added pb-20 on mobile to account for the bottom tab bar */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 pb-20 sm:p-6 lg:p-8 flex flex-col">
        {children}
      </main>

      {/* Dashboard Footer (Hidden on mobile to avoid clashing with tab bar, or just keep it but add padding) */}
      <div className="hidden md:block">
        <Footer />
      </div>

      {/* Floating DHUAN AI Assistant Button - Adjusted position on mobile to be above tab bar */}
      <div className="fixed bottom-20 md:bottom-6 right-6 z-[100] group">
         <div className="absolute inset-0 bg-emerald-500 rounded-full blur opacity-40 group-hover:opacity-70 group-hover:scale-110 transition-all duration-500 animate-pulse"></div>
         <button 
           className="relative flex items-center justify-center gap-2 bg-slate-900 text-white px-4 py-3 md:px-5 md:py-3.5 rounded-full shadow-2xl hover:bg-slate-800 transition-transform hover:-translate-y-1 hover:scale-105 border border-slate-700/50 focus:outline-none focus:ring-4 focus:ring-emerald-500/30"
           aria-label="Chat with DHUAN AI"
           title="Chat with DHUAN AI"
         >
           <Wind className="w-5 h-5 text-emerald-400" />
           <span className="font-extrabold text-sm tracking-wide hidden md:block">Ask DHUAN AI</span>
         </button>
      </div>

      {/* Mobile Bottom Tab Bar */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 flex justify-around items-center h-16 z-50 px-2 safe-area-pb">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;
          return (
            <Link
              key={item.name}
              href={item.href}
              className={`flex flex-col items-center justify-center w-full h-full space-y-1 ${
                isActive ? 'text-emerald-600' : 'text-slate-400 hover:text-slate-600'
              }`}
            >
              <div className={`p-1.5 rounded-xl transition-colors ${isActive ? 'bg-emerald-50' : ''}`}>
                <Icon className="w-6 h-6" />
              </div>
            </Link>
          );
        })}
      </div>

    </div>
  );
}
