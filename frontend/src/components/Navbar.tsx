'use client';

import Link from 'next/link';
import { Wind, Menu, X } from 'lucide-react';
import { useState } from 'react';

export default function Navbar() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <nav className="bg-white border-b border-slate-200 text-slate-900 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo Section */}
          <div className="flex-shrink-0">
            <Link href="/" className="flex items-center gap-2 group">
              <div className="bg-emerald-50 p-2 rounded-lg group-hover:bg-emerald-100 transition-colors">
                <Wind className="h-6 w-6 text-emerald-600" />
              </div>
              <div className="flex flex-col">
                <span className="font-bold text-xl tracking-tight text-slate-900 leading-none">DHUAN</span>
                <span className="text-[10px] text-slate-500 font-bold tracking-widest uppercase mt-0.5">Lahore Smog AI</span>
              </div>
            </Link>
          </div>

          {/* Desktop Center Links */}
          <div className="hidden md:flex items-center gap-8">
            <Link href="/#features" className="text-sm font-semibold text-slate-600 hover:text-slate-900 transition-colors">
              Features
            </Link>
            <Link href="/methodology" className="text-sm font-semibold text-slate-600 hover:text-slate-900 transition-colors">
              AI Methodology
            </Link>
            <Link href="/about" className="text-sm font-semibold text-slate-600 hover:text-slate-900 transition-colors">
              About Us
            </Link>
            <Link href="/contact" className="text-sm font-semibold text-slate-600 hover:text-slate-900 transition-colors">
              Contact
            </Link>
          </div>

          {/* Desktop Right side buttons */}
          <div className="hidden md:flex items-center gap-4">
            <Link 
              href="/login" 
              className="text-sm font-bold text-slate-600 hover:text-slate-900 transition-colors"
            >
              Log in
            </Link>
            <Link 
              href="/register" 
              className="text-xs font-bold bg-emerald-500 hover:bg-emerald-400 text-slate-900 px-4 py-2 rounded-full transition-colors shadow-sm"
            >
              Sign up
            </Link>
          </div>

          {/* Mobile menu button */}
          <div className="-mr-2 flex md:hidden">
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              type="button"
              className="inline-flex items-center justify-center p-2 rounded-md text-slate-500 hover:text-slate-900 hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-emerald-500 transition-colors"
              aria-controls="mobile-menu"
              aria-expanded="false"
            >
              <span className="sr-only">Open main menu</span>
              {isMobileMenuOpen ? (
                <X className="block h-6 w-6" aria-hidden="true" />
              ) : (
                <Menu className="block h-6 w-6" aria-hidden="true" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden absolute top-16 left-0 w-full border-b border-slate-200 bg-white shadow-2xl z-[100]" id="mobile-menu">
          <div className="px-4 pt-4 pb-2 space-y-4">
             <Link href="/#features" onClick={() => setIsMobileMenuOpen(false)} className="block text-base font-semibold text-slate-600 hover:text-slate-900">
                Features
             </Link>
             <Link href="/methodology" onClick={() => setIsMobileMenuOpen(false)} className="block text-base font-semibold text-slate-600 hover:text-slate-900">
                AI Methodology
             </Link>
             <Link href="/about" onClick={() => setIsMobileMenuOpen(false)} className="block text-base font-semibold text-slate-600 hover:text-slate-900">
                About Us
             </Link>
             <Link href="/contact" onClick={() => setIsMobileMenuOpen(false)} className="block text-base font-semibold text-slate-600 hover:text-slate-900">
                Contact
             </Link>
          </div>
          <div className="px-4 pt-4 pb-4 space-y-3 border-t border-slate-100 mt-2">
             <Link href="/login" onClick={() => setIsMobileMenuOpen(false)} className="block w-full text-center text-sm font-bold text-slate-600 hover:text-slate-900 py-2 bg-slate-50 rounded-xl">
                Log in
             </Link>
             <Link href="/register" onClick={() => setIsMobileMenuOpen(false)} className="block w-full text-center text-sm font-bold bg-emerald-500 hover:bg-emerald-400 text-slate-900 py-2.5 rounded-xl transition-colors shadow-sm">
                Create Free Profile
             </Link>
          </div>
        </div>
      )}
    </nav>
  );
}
