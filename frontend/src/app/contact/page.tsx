import Link from 'next/link';
import { ArrowLeft, Mail, MessageSquare, Send } from 'lucide-react';

export default function ContactPage() {
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
          
          <div className="grid grid-cols-1 lg:grid-cols-5">
            
            {/* Left Info Panel */}
            <div className="bg-slate-900 lg:col-span-2 p-10 sm:p-12 text-white relative overflow-hidden">
              <div className="absolute pointer-events-none top-0 right-0 w-64 h-64 bg-emerald-500/20 rounded-full filter blur-[80px]"></div>
              
              <h2 className="text-3xl font-extrabold mb-4 relative z-10">Get in touch</h2>
              <p className="text-emerald-100/80 mb-12 relative z-10 font-medium">
                Whether you have a question about our AI models, the Championship, or just want to say hi, our team is ready to respond.
              </p>

              <div className="space-y-6 relative z-10">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-slate-800 rounded-full flex items-center justify-center">
                    <Mail className="w-5 h-5 text-emerald-400" />
                  </div>
                  <div>
                    <p className="text-sm text-slate-400 font-medium">Email us</p>
                    <p className="font-bold">hello@dhuan.ai</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-slate-800 rounded-full flex items-center justify-center">
                    <MessageSquare className="w-5 h-5 text-emerald-400" />
                  </div>
                  <div>
                    <p className="text-sm text-slate-400 font-medium">Support</p>
                    <p className="font-bold">support@dhuan.ai</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Form Panel */}
            <div className="lg:col-span-3 p-10 sm:p-12">
              <form action="#" method="POST" className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div>
                    <label htmlFor="first-name" className="block text-sm font-bold text-slate-900">First name</label>
                    <input
                      type="text"
                      name="first-name"
                      id="first-name"
                      className="mt-2 appearance-none block w-full px-4 py-3 border border-slate-200 rounded-xl shadow-sm placeholder-slate-400 focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm font-medium transition-colors bg-slate-50 hover:bg-white focus:bg-white"
                      placeholder="Ali"
                    />
                  </div>
                  <div>
                    <label htmlFor="last-name" className="block text-sm font-bold text-slate-900">Last name</label>
                    <input
                      type="text"
                      name="last-name"
                      id="last-name"
                      className="mt-2 appearance-none block w-full px-4 py-3 border border-slate-200 rounded-xl shadow-sm placeholder-slate-400 focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm font-medium transition-colors bg-slate-50 hover:bg-white focus:bg-white"
                      placeholder="Khan"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="email" className="block text-sm font-bold text-slate-900">Email address</label>
                  <input
                    type="email"
                    name="email"
                    id="email"
                    className="mt-2 appearance-none block w-full px-4 py-3 border border-slate-200 rounded-xl shadow-sm placeholder-slate-400 focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm font-medium transition-colors bg-slate-50 hover:bg-white focus:bg-white"
                    placeholder="ali@example.com"
                  />
                </div>

                <div>
                  <label htmlFor="message" className="block text-sm font-bold text-slate-900">Message</label>
                  <textarea
                    id="message"
                    name="message"
                    rows={4}
                    className="mt-2 appearance-none block w-full px-4 py-3 border border-slate-200 rounded-xl shadow-sm placeholder-slate-400 focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm font-medium transition-colors bg-slate-50 hover:bg-white focus:bg-white resize-none"
                    placeholder="How can we help you?"
                  ></textarea>
                </div>

                <div>
                  <button
                    type="submit"
                    className="w-full sm:w-auto inline-flex justify-center items-center gap-2 py-3.5 px-8 border border-transparent rounded-xl shadow-sm text-sm font-extrabold text-slate-900 bg-emerald-500 hover:bg-emerald-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 transition-all hover:-translate-y-0.5 hover:shadow-lg hover:shadow-emerald-500/30"
                  >
                    Send Message <Send className="w-4 h-4" />
                  </button>
                </div>
              </form>
            </div>

          </div>
        </div>
      </main>
    </div>
  );
}
