'use client';

import dynamic from 'next/dynamic';
import { Shield, Navigation, ArrowRight, BrainCircuit, Activity, MapPin, Wind } from 'lucide-react';
import Link from 'next/link';
import ForecastChartWidget from '@/components/ForecastChart';

// Dynamically import the map widget with SSR disabled
const MapWidget = dynamic(() => import('@/components/MapWidget'), { ssr: false });

export default function Dashboard() {
  return (
    <div className="relative overflow-hidden bg-white selection:bg-emerald-100 selection:text-emerald-900">
      
      {/* Background Dot Pattern for texture */}
      <div className="absolute inset-0 z-0 bg-[radial-gradient(#e2e8f0_1px,transparent_1px)] [background-size:16px_16px] opacity-40"></div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12 relative z-10">
        
        {/* Hero Section (Split View) */}
        <section className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
          
          {/* Left Side: Content */}
          <div className="space-y-6 max-w-2xl relative">
            <div className="absolute pointer-events-none -top-10 -left-10 w-24 h-24 bg-emerald-200 rounded-full mix-blend-multiply filter blur-2xl opacity-30 animate-blob"></div>
            
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-semibold shadow-sm">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              AI-Powered Smog Intelligence
            </div>
            
            <div className="space-y-4">
              <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-slate-900 leading-[1.15]">
                Predict the Smog. <br/>
                <span className="bg-clip-text text-transparent bg-gradient-to-r from-emerald-600 to-blue-600">
                  Protect the People.
                </span>
              </h1>
              <p className="text-base sm:text-lg text-slate-600 font-medium leading-relaxed max-w-md">
                Dhuan se pehle, hifazat ka plan. Area-wise air quality forecasts, personal health advisories, and the safest routes for you and your family.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <Link 
                href="/register" 
                className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-sm font-semibold transition-all shadow-lg shadow-slate-900/20 hover:-translate-y-0.5"
              >
                <Navigation className="w-4 h-4" />
                Plan a Safe Route
              </Link>
              <Link 
                href="/login"
                className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-white border border-slate-200 hover:border-slate-300 hover:bg-slate-50 text-slate-700 text-sm font-semibold transition-all hover:-translate-y-0.5"
              >
                <Shield className="w-4 h-4 text-emerald-500" />
                My Health Risk
              </Link>
            </div>

            <div className="flex items-center gap-3 pt-4 text-xs font-medium text-slate-500 border-t border-slate-100">
               <div className="flex -space-x-2">
                  <div className="w-6 h-6 rounded-full border-2 border-white bg-slate-200 shadow-sm"></div>
                  <div className="w-6 h-6 rounded-full border-2 border-white bg-emerald-200 shadow-sm"></div>
                  <div className="w-6 h-6 rounded-full border-2 border-white bg-blue-200 shadow-sm"></div>
               </div>
               <p>Trusted by <span className="text-slate-800 font-bold">10,000+</span> Lahoris</p>
            </div>
          </div>

          {/* Right Side: Map Widget */}
          <div className="relative h-[380px] md:h-[450px] lg:h-[480px] w-full rounded-2xl p-1.5 bg-white/50 backdrop-blur-sm border border-slate-200 shadow-xl shadow-slate-200/50 group">
             <div className="absolute pointer-events-none -inset-2 bg-gradient-to-tr from-emerald-100 to-blue-50 rounded-[20px] blur-lg -z-10 opacity-50 group-hover:opacity-70 transition-opacity duration-500"></div>
             <MapWidget />
          </div>
        </section>

        {/* Core Features Section */}
        <section id="features" className="py-16 mt-8 border-t border-slate-100/50">
          <div className="text-center max-w-2xl mx-auto mb-12 relative">
            <h2 className="text-2xl font-extrabold text-slate-900 sm:text-3xl">
              Intelligent Protection for Lahore
            </h2>
            <p className="mt-4 text-base text-slate-500">
              DHUAN leverages cutting-edge Machine Learning (Random Forest & LSTM) to provide real-time, actionable insights against urban air pollution.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative z-10">
            {/* Feature 1 */}
            <div className="bg-white rounded-2xl p-6 shadow-lg shadow-slate-200/30 border border-slate-100/80 hover:-translate-y-1 hover:shadow-xl hover:shadow-blue-900/10 transition-all duration-300">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-50 to-blue-100 flex items-center justify-center mb-4 shadow-sm border border-blue-100">
                <BrainCircuit className="w-6 h-6 text-blue-600" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">AI Smog Prediction</h3>
              <p className="text-sm text-slate-500 leading-relaxed">
                Our models analyze meteorological data and historical PM2.5 levels to forecast air quality up to 72 hours in advance with high accuracy.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="bg-white rounded-2xl p-6 shadow-lg shadow-slate-200/30 border border-slate-100/80 hover:-translate-y-1 hover:shadow-xl hover:shadow-emerald-900/10 transition-all duration-300">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-50 to-emerald-100 flex items-center justify-center mb-4 shadow-sm border border-emerald-100">
                <Activity className="w-6 h-6 text-emerald-600" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">Health Advisories</h3>
              <p className="text-sm text-slate-500 leading-relaxed">
                Input your age and medical history to receive personalized AI recommendations. Know exactly when it's safe to exercise outdoors.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="bg-white rounded-2xl p-6 shadow-lg shadow-slate-200/30 border border-slate-100/80 hover:-translate-y-1 hover:shadow-xl hover:shadow-orange-900/10 transition-all duration-300">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-orange-50 to-orange-100 flex items-center justify-center mb-4 shadow-sm border border-orange-100">
                <MapPin className="w-6 h-6 text-orange-600" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">Smart Routing</h3>
              <p className="text-sm text-slate-500 leading-relaxed">
                Why drive through hazardous smog? Our intelligent router calculates the safest path to your destination by avoiding high-pollution zones.
              </p>
            </div>
          </div>
        </section>

        {/* AI Forecast Section */}
        <section className="py-16 border-t border-slate-100/50">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-10 items-center">
            <div className="lg:col-span-1 space-y-4">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-xs font-semibold shadow-sm">
                <BrainCircuit className="w-3.5 h-3.5" />
                Machine Learning
              </div>
              <h2 className="text-2xl font-extrabold text-slate-900 sm:text-3xl leading-tight">
                See the Invisible. <br/> 
                <span className="text-slate-400">Before it arrives.</span>
              </h2>
              <p className="text-base text-slate-600 leading-relaxed max-w-sm">
                Our Random Forest model predicts AQI spikes days before they happen. Plan your outdoor activities with confidence using our 7-day smog forecast.
              </p>
              <div className="pt-2">
                 <Link href="/register" className="inline-flex items-center gap-1.5 text-emerald-600 text-sm font-bold hover:text-emerald-700 transition-colors group">
                   Read our AI Methodology <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                 </Link>
              </div>
            </div>
            
            <div className="lg:col-span-2 bg-white rounded-[2rem] p-5 sm:p-8 border border-slate-100 shadow-xl shadow-slate-200/40 relative overflow-hidden">
              <div className="absolute pointer-events-none top-0 right-0 w-48 h-48 bg-rose-50 rounded-full mix-blend-multiply filter blur-2xl opacity-50 -z-10"></div>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-3">
                <h3 className="font-extrabold text-xl text-slate-900">Lahore AQI Forecast</h3>
                <span className="inline-flex mt-2 sm:mt-0 text-xs font-bold bg-slate-100 text-slate-600 px-2.5 py-1 rounded-md border border-slate-200 shadow-sm">Next 72 Hours</span>
              </div>
              <ForecastChartWidget />
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-16 text-center">
          <div className="bg-slate-900 rounded-[2.5rem] p-10 sm:p-16 relative overflow-hidden shadow-2xl border border-slate-800">
            <div className="absolute pointer-events-none top-0 right-0 w-56 h-56 bg-emerald-500/20 rounded-full filter blur-[80px] animate-pulse"></div>
            <div className="absolute pointer-events-none bottom-0 left-0 w-56 h-56 bg-blue-500/20 rounded-full filter blur-[80px] animate-pulse" style={{ animationDelay: '2s' }}></div>
            
            <div className="relative z-10 max-w-2xl mx-auto">
              <h2 className="text-3xl sm:text-4xl font-extrabold text-white mb-4 tracking-tight">Ready to breathe safer?</h2>
              <p className="text-base sm:text-lg text-slate-300 mb-8 leading-relaxed font-light">
                Join thousands of Lahoris who are using DHUAN to protect their families from hazardous smog and navigate the city safely.
              </p>
              <Link 
                href="/register" 
                className="inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-900 font-extrabold text-base transition-all shadow-[0_0_30px_-10px_rgba(16,185,129,0.5)] hover:-translate-y-0.5 hover:shadow-[0_0_40px_-15px_rgba(16,185,129,0.7)]"
              >
                Create Free Profile <ArrowRight className="w-4 h-4 ml-1" />
              </Link>
            </div>
          </div>
        </section>

        <footer className="border-t border-slate-200 pt-16 pb-8 mt-12 text-center sm:text-left relative z-10 bg-white/80 backdrop-blur-sm rounded-t-[2.5rem]">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-10 mb-12 px-6 sm:px-8 max-w-7xl mx-auto">
            <div className="md:col-span-2">
              <div className="flex items-center gap-2.5 justify-center sm:justify-start mb-6">
                <div className="bg-emerald-50 p-2 rounded-xl border border-emerald-100 shadow-sm">
                  <Wind className="h-6 w-6 text-emerald-600" />
                </div>
                <div className="flex flex-col text-left">
                  <span className="font-extrabold text-2xl tracking-tight text-slate-900 leading-none">DHUAN</span>
                  <span className="text-[10px] text-slate-500 font-bold tracking-widest uppercase mt-0.5">Lahore Smog AI</span>
                </div>
              </div>
              <p className="text-slate-500 text-sm max-w-sm mx-auto sm:mx-0 leading-relaxed font-medium">
                An AI-powered Smog Intelligence & Navigation platform designed to protect the citizens of Lahore through predictive modeling and personalized insights. 
              </p>
            </div>
            <div>
              <h4 className="font-extrabold text-slate-900 mb-5 text-base tracking-tight">Product</h4>
              <ul className="space-y-3 text-sm text-slate-500 font-semibold">
                <li><Link href="/#features" className="hover:text-emerald-600 transition-colors">Features</Link></li>
                <li><Link href="/register" className="hover:text-emerald-600 transition-colors">Live AQI Map</Link></li>
                <li><Link href="/register" className="hover:text-emerald-600 transition-colors">Mobile App <span className="ml-1 text-[9px] bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded border border-slate-200">SOON</span></Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-extrabold text-slate-900 mb-5 text-base tracking-tight">Company</h4>
              <ul className="space-y-3 text-sm text-slate-500 font-semibold">
                <li><Link href="/about" className="hover:text-emerald-600 transition-colors">About Us</Link></li>
                <li><Link href="/methodology" className="hover:text-emerald-600 transition-colors">AI Methodology</Link></li>
                <li><Link href="/contact" className="hover:text-emerald-600 transition-colors">Contact</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-extrabold text-slate-900 mb-5 text-base tracking-tight">Legal</h4>
              <ul className="space-y-3 text-sm text-slate-500 font-semibold">
                <li><Link href="/terms" className="hover:text-emerald-600 transition-colors">Terms of Service</Link></li>
                <li><Link href="/privacy" className="hover:text-emerald-600 transition-colors">Privacy Policy</Link></li>
              </ul>
            </div>
          </div>
          <div className="max-w-7xl mx-auto border-t border-slate-200/60 px-6 sm:px-8 pt-8 text-xs font-semibold text-slate-400 flex flex-col md:flex-row justify-between items-center">
            <p>&copy; 2026 DHUAN AI. All rights reserved.</p>
            <p className="mt-2 md:mt-0 bg-slate-50 px-2.5 py-1 rounded-full border border-slate-200/60">Built for the 4th International AI Championship</p>
          </div>
        </footer>
      </div>
    </div>
  );
}
