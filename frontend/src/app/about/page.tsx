import Link from 'next/link';
import { ArrowLeft, Users, Trophy, Target } from 'lucide-react';

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-slate-50 selection:bg-emerald-100 selection:text-emerald-900 pb-20">
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 mt-12">
        <Link href="/" className="inline-flex items-center gap-2 text-slate-500 hover:text-slate-900 transition-colors text-sm font-bold mb-6 group">
          <div className="p-2 bg-white rounded-full border border-slate-200 shadow-sm group-hover:bg-slate-100 transition-colors">
            <ArrowLeft className="w-4 h-4" />
          </div>
          Back to Home
        </Link>

        <div className="bg-white rounded-[2.5rem] shadow-xl shadow-slate-200/40 border border-slate-100 overflow-hidden">
          
          <div className="bg-slate-900 px-8 py-16 sm:px-14 sm:py-20 text-center relative overflow-hidden">
             <div className="absolute pointer-events-none top-0 left-0 w-64 h-64 bg-emerald-500/20 rounded-full filter blur-[100px] animate-pulse"></div>
             <div className="absolute pointer-events-none bottom-0 right-0 w-64 h-64 bg-blue-500/20 rounded-full filter blur-[100px] animate-pulse" style={{ animationDelay: '2s' }}></div>
             <h1 className="text-4xl sm:text-5xl font-extrabold text-white mb-4 tracking-tight relative z-10">
               About DHUAN
             </h1>
             <p className="text-lg text-emerald-100/80 max-w-2xl mx-auto font-medium relative z-10">
               Built for the 4th International AI Championship to tackle one of the greatest environmental challenges of our time.
             </p>
          </div>

          <div className="p-8 sm:p-14 space-y-12">
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
              <div>
                <div className="w-12 h-12 bg-rose-50 rounded-xl flex items-center justify-center border border-rose-100 mb-6">
                  <Target className="w-6 h-6 text-rose-600" />
                </div>
                <h2 className="text-3xl font-bold text-slate-900 mb-4">Our Mission</h2>
                <p className="text-slate-600 leading-relaxed text-lg">
                  Every winter, the city of Lahore is engulfed in hazardous smog, severely impacting the health and daily lives of millions. 
                  Our mission is to democratize air quality intelligence. By leveraging cutting-edge Artificial Intelligence, we aim to provide citizens with actionable insights, personalized health advisories, and safer navigational routes to mitigate the effects of extreme pollution.
                </p>
              </div>
              <div className="bg-slate-50 p-8 rounded-3xl border border-slate-100 shadow-inner">
                <div className="space-y-6">
                   <div className="flex gap-4 items-start">
                      <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center border border-slate-200 shrink-0 text-slate-900 font-bold">1</div>
                      <p className="text-slate-600 font-medium pt-2">Identify high-risk zones using AI.</p>
                   </div>
                   <div className="flex gap-4 items-start">
                      <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center border border-slate-200 shrink-0 text-slate-900 font-bold">2</div>
                      <p className="text-slate-600 font-medium pt-2">Protect vulnerable populations.</p>
                   </div>
                   <div className="flex gap-4 items-start">
                      <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center border border-slate-200 shrink-0 text-slate-900 font-bold">3</div>
                      <p className="text-slate-600 font-medium pt-2">Provide smarter, cleaner routing.</p>
                   </div>
                </div>
              </div>
            </div>

            <hr className="border-slate-100" />

            <div className="text-center max-w-2xl mx-auto">
               <div className="inline-flex items-center justify-center w-16 h-16 bg-amber-50 rounded-2xl border border-amber-100 mb-6 shadow-sm">
                 <Trophy className="w-8 h-8 text-amber-600" />
               </div>
               <h2 className="text-3xl font-bold text-slate-900 mb-4">4th International AI Championship</h2>
               <p className="text-slate-600 leading-relaxed text-lg">
                 DHUAN is proudly developed as a flagship submission for the International AI Championship 2026. This project represents the pinnacle of applying practical Machine Learning algorithms (Random Forest and LSTM networks) to solve real-world, life-threatening civic issues.
               </p>
            </div>

          </div>
        </div>
      </main>
    </div>
  );
}
