import Link from 'next/link';
import { Wind, ArrowLeft, LockKeyhole } from 'lucide-react';

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-slate-50 selection:bg-emerald-100 selection:text-emerald-900 pb-20 pt-12">
      {/* Main Content */}
      <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <Link href="/" className="inline-flex items-center gap-2 text-slate-500 hover:text-slate-900 transition-colors text-sm font-bold mb-6 group">
          <div className="p-2 bg-white rounded-full border border-slate-200 shadow-sm group-hover:bg-slate-100 transition-colors">
            <ArrowLeft className="w-4 h-4" />
          </div>
          Back to Home
        </Link>

        <div className="bg-white rounded-[2.5rem] shadow-xl shadow-slate-200/40 border border-slate-100 overflow-hidden">
          
          <div className="bg-slate-900 px-8 py-12 sm:px-14 sm:py-16 text-center relative overflow-hidden">
             <div className="absolute pointer-events-none top-0 right-0 w-64 h-64 bg-blue-500/20 rounded-full filter blur-[100px] animate-pulse"></div>
             <div className="absolute pointer-events-none bottom-0 left-0 w-64 h-64 bg-emerald-500/20 rounded-full filter blur-[100px] animate-pulse" style={{ animationDelay: '1.5s' }}></div>
             <div className="flex justify-center mb-6 relative z-10">
               <div className="w-16 h-16 bg-slate-800 rounded-2xl flex items-center justify-center border border-slate-700 shadow-lg">
                 <LockKeyhole className="w-8 h-8 text-emerald-400" />
               </div>
             </div>
             <h1 className="text-3xl sm:text-4xl font-extrabold text-white mb-4 tracking-tight relative z-10">
               Privacy Policy
             </h1>
             <p className="text-sm text-emerald-100/60 font-bold relative z-10 tracking-widest uppercase">
               Last updated: October 2026
             </p>
          </div>

          <div className="p-8 sm:p-14 space-y-8 text-slate-600 text-base leading-relaxed">
            
            <section>
              <h2 className="text-xl font-bold text-slate-900 mb-3">1. Information We Collect</h2>
              <p className="mb-3">We collect information to provide better AI-driven services to all our users. The types of personal information we collect include:</p>
              <ul className="list-disc pl-5 space-y-2">
                <li><strong>Account Information:</strong> Name, email address, and authentication data (via Google/GitHub or Email).</li>
                <li><strong>Health Metrics:</strong> Optional age and general medical history provided by you to generate personalized smog vulnerability assessments.</li>
                <li><strong>Location Data:</strong> Real-time GPS location (only when permission is granted) to center the live map and provide intelligent routing.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-bold text-slate-900 mb-3">2. How We Use Your Information</h2>
              <p>
                DHUAN utilizes your data exclusively to power its core features. Your location is used to calculate the safest, low-smog routes. Your optional health data is processed by our Machine Learning models to generate custom alerts (e.g., advising asthma patients to stay indoors during an AQI spike).
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-slate-900 mb-3">3. Data Security and AI Processing</h2>
              <p className="p-4 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-700">
                All health and location data is encrypted in transit and at rest. Our predictive AI models (Random Forest & LSTM) process aggregated, anonymized data to predict city-wide smog levels. Your personal profile data is never sold to third parties.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-slate-900 mb-3">4. Third-Party Services</h2>
              <p>
                Our platform integrates with third-party mapping providers (such as Google Maps/OpenStreetMap via Leaflet). When using the Live Map, these providers may receive anonymous requests for map tiles based on your viewport.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-slate-900 mb-3">5. Your Rights</h2>
              <p>
                You have the right to access, update, or delete your profile information at any time. If you wish to completely remove your health and location history from our servers, you may delete your account from the dashboard settings.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-slate-900 mb-3">6. Contact Us</h2>
              <p>
                If you have any questions about this Privacy Policy or DHUAN's data practices, please contact the AI Championship development team.
              </p>
            </section>

          </div>
        </div>
      </main>
    </div>
  );
}
