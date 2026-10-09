import Link from 'next/link';
import { Wind } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="border-t border-slate-200 pt-16 pb-8 mt-auto w-full text-center sm:text-left relative z-10 bg-white/80 backdrop-blur-sm">
      <div className="grid grid-cols-1 md:grid-cols-5 gap-10 mb-12 px-6 sm:px-8 max-w-7xl mx-auto w-full">
        <div className="md:col-span-2">
          <div className="flex items-center gap-2.5 justify-center sm:justify-start mb-6">
            <div className="bg-emerald-50 p-2 rounded-xl border border-emerald-100 shadow-sm">
              <Wind className="h-6 w-6 text-emerald-600" />
            </div>
            <div className="flex flex-col text-left">
              <span className="font-extrabold text-2xl tracking-tight text-slate-900 leading-none">DHUAN</span>
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
      <div className="max-w-7xl mx-auto border-t border-slate-200/60 px-6 sm:px-8 pt-8 text-xs font-semibold text-slate-400 flex flex-col md:flex-row justify-between items-center w-full">
        <p>&copy; 2026 DHUAN. All rights reserved.</p>
      </div>
    </footer>
  );
}
