import Link from 'next/link';
import { ArrowLeft, BrainCircuit, Activity, LineChart, Server } from 'lucide-react';

export default function MethodologyPage() {
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
             <div className="absolute pointer-events-none top-0 right-0 w-64 h-64 bg-blue-500/20 rounded-full filter blur-[100px] animate-pulse"></div>
             <div className="absolute pointer-events-none bottom-0 left-0 w-64 h-64 bg-emerald-500/20 rounded-full filter blur-[100px] animate-pulse" style={{ animationDelay: '1.5s' }}></div>
             <div className="flex justify-center mb-6 relative z-10">
               <div className="w-16 h-16 bg-slate-800 rounded-2xl flex items-center justify-center border border-slate-700 shadow-lg">
                 <BrainCircuit className="w-8 h-8 text-emerald-400" />
               </div>
             </div>
             <h1 className="text-4xl sm:text-5xl font-extrabold text-white mb-4 tracking-tight relative z-10">
               Our AI Methodology
             </h1>
             <p className="text-lg text-emerald-100/80 max-w-2xl mx-auto font-medium relative z-10">
               Discover how DHUAN leverages advanced Machine Learning architectures to predict smog accumulation across Lahore with high accuracy.
             </p>
          </div>

          <div className="p-8 sm:p-14 space-y-12">
            
            {/* Section 1 */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
              <div className="md:col-span-1 flex justify-center md:justify-start">
                <div className="w-12 h-12 bg-emerald-50 rounded-xl flex items-center justify-center border border-emerald-100">
                  <Server className="w-6 h-6 text-emerald-600" />
                </div>
              </div>
              <div className="md:col-span-11 space-y-4 text-slate-600">
                <h2 className="text-2xl font-bold text-slate-900">1. Data Ingestion & Pre-processing</h2>
                <p className="leading-relaxed">
                  The foundation of any predictive model is high-quality data. DHUAN continuously aggregates real-time environmental data from multiple sources, including satellite imagery, local EPA sensors, and open-source meteorological APIs. 
                </p>
                <p className="leading-relaxed">
                  We collect historical data points such as Temperature, Humidity, Wind Speed, Wind Direction, and historical PM2.5 levels. Missing values are imputed using K-Nearest Neighbors (KNN), and temporal features are extracted (hour of day, month, season) to capture cyclical smog patterns.
                </p>
              </div>
            </div>

            <hr className="border-slate-100" />

            {/* Section 2 */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
              <div className="md:col-span-1 flex justify-center md:justify-start">
                <div className="w-12 h-12 bg-indigo-50 rounded-xl flex items-center justify-center border border-indigo-100">
                  <Activity className="w-6 h-6 text-indigo-600" />
                </div>
              </div>
              <div className="md:col-span-11 space-y-4 text-slate-600">
                <h2 className="text-2xl font-bold text-slate-900">2. Random Forest for Spatial Analysis</h2>
                <p className="leading-relaxed">
                  To understand the spatial distribution of smog across different sectors of Lahore, we deploy an ensemble learning method: <strong>Random Forest Regressor</strong>.
                </p>
                <p className="leading-relaxed">
                  This algorithm builds a multitude of decision trees during training. By analyzing spatial features like proximity to industrial zones, traffic density, and localized wind patterns, the Random Forest model generates a robust, localized prediction map, correcting for variances and preventing overfitting.
                </p>
              </div>
            </div>

            <hr className="border-slate-100" />

            {/* Section 3 */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
              <div className="md:col-span-1 flex justify-center md:justify-start">
                <div className="w-12 h-12 bg-orange-50 rounded-xl flex items-center justify-center border border-orange-100">
                  <LineChart className="w-6 h-6 text-orange-600" />
                </div>
              </div>
              <div className="md:col-span-11 space-y-4 text-slate-600">
                <h2 className="text-2xl font-bold text-slate-900">3. LSTM for Temporal Forecasting</h2>
                <p className="leading-relaxed">
                  Smog accumulation is a sequential time-series problem. What happened an hour ago heavily influences the next hour. To handle this, we utilize <strong>Long Short-Term Memory (LSTM)</strong> networks, a specialized type of Recurrent Neural Network (RNN).
                </p>
                <p className="leading-relaxed">
                  Our LSTM architecture is trained on years of historical air quality data. It learns complex temporal dependencies—such as the delayed effect of temperature inversions on PM2.5 trapping—allowing us to forecast accurate AQI levels up to 72 hours into the future.
                </p>
              </div>
            </div>

            <hr className="border-slate-100" />

            {/* Conclusion */}
            <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200">
              <h3 className="font-bold text-slate-900 mb-2">The Hybrid Approach</h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                By combining Random Forest (for spatial accuracy) and LSTM (for time-series forecasting), DHUAN's backend pipeline creates a highly accurate, multi-dimensional smog intelligence map. This methodology empowers citizens to make informed decisions about their health and travel.
              </p>
            </div>

          </div>
        </div>
      </main>
    </div>
  );
}
