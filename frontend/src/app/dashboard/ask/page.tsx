'use client';

import React, { useState, useRef, useEffect } from 'react';
import { 
  Wind, 
  Send, 
  Sparkles, 
  RotateCcw, 
  Bot, 
  User, 
  Copy, 
  Check, 
  ShieldAlert, 
  MapPin, 
  TrendingUp, 
  AlertTriangle,
  Lightbulb,
  ChevronRight,
  BrainCircuit,
  MessageSquare,
  Clock,
  Layers,
  HelpCircle,
  Activity,
  Flame,
  Sun
} from 'lucide-react';
import { ChatMessage } from '@/components/AskDhuanAssistant';

// 6 Official Smog Severity Categories & Color Rules
const getSmogBadgeForAqi = (aqi: number) => {
  if (aqi > 300) {
    return {
      name: 'Hazardous Toxic Smog',
      aqi,
      color: 'text-rose-100',
      bg: 'bg-rose-950',
      border: 'border-rose-800'
    };
  }
  if (aqi > 200) {
    return {
      name: 'Severe Smog Event',
      aqi,
      color: 'text-purple-700',
      bg: 'bg-purple-50',
      border: 'border-purple-200'
    };
  }
  if (aqi > 150) {
    return {
      name: 'Dense Smog Inversion',
      aqi,
      color: 'text-rose-700',
      bg: 'bg-rose-50',
      border: 'border-rose-200'
    };
  }
  if (aqi > 100) {
    return {
      name: 'Smog Inversion Forming',
      aqi,
      color: 'text-orange-700',
      bg: 'bg-orange-50',
      border: 'border-orange-200'
    };
  }
  if (aqi > 50) {
    return {
      name: 'Moderate Haze',
      aqi,
      color: 'text-amber-800',
      bg: 'bg-amber-50',
      border: 'border-amber-200'
    };
  }
  return {
    name: 'Clean Air',
    aqi,
    color: 'text-emerald-700',
    bg: 'bg-emerald-50',
    border: 'border-emerald-200'
  };
};

const SAMPLE_CHATS = [
  {
    title: 'Nocturnal Inversion Timing',
    desc: 'When does the thermal boundary layer drop tonight?',
    prompt: 'At what time will the nocturnal thermal inversion peak in Lahore tonight and what will the AQI reach?'
  },
  {
    title: 'Safe Commute Route',
    desc: 'Best route to avoid Shahdara industrial smoke',
    prompt: 'Which routes from Gulberg to Shahdara have the least smog exposure right now?'
  },
  {
    title: 'N95 Mask Efficacy',
    desc: 'Difference between cloth and N95 masks for PM2.5',
    prompt: 'Why are standard surgical masks ineffective against Lahore smog, and what certification should I look for?'
  },
  {
    title: 'Asthma Emergency Protocols',
    desc: 'Preventive steps for respiratory patients',
    prompt: 'What emergency precautions should an asthma patient follow when AQI crosses 150?'
  }
];

export default function AskDhuanPage() {
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const initialGreeting: ChatMessage = {
    id: 'welcome-page-msg',
    role: 'assistant',
    content: `Assalam-o-Alaikum! Welcome to **Ask DHUAN**, your specialized AI Smog & Atmospheric Intelligence Assistant.\n\nI am engineered with domain-specific knowledge of **Lahore's urban microclimate, boundary-layer thermal inversions, particulate matter (PM2.5/PM10) dispersion physics**, and WHO respiratory health standards.\n\nFeel free to ask questions about current smog alerts, hourly forecasts, safest commute corridors, or health protocols.`,
    timestamp: 'Just now',
    smogTier: getSmogBadgeForAqi(81),
    recommendations: [
      'Monitor evening inversion shifts when ground cooling traps pollutants.',
      'Check certified PM2.5 filtration before choosing face masks.',
      'Select low-exposure routes using DHUAN smart spatial navigation.'
    ],
    suggestedPrompts: [
      'What is today\'s smog forecast for Lahore?',
      'Which areas have the worst smog right now?',
      'Is outdoor exercise safe for children today?'
    ]
  };

  const [messages, setMessages] = useState<ChatMessage[]>([initialGreeting]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleReset = () => {
    setMessages([initialGreeting]);
  };

  const generateSimulatedResponse = (query: string): ChatMessage => {
    const q = query.toLowerCase();

    if (q.includes('forecast') || q.includes('next') || q.includes('inversion') || q.includes('kal') || q.includes('today')) {
      return {
        id: `ai-${Date.now()}`,
        role: 'assistant',
        content: `### 24-Hour Smog Inversion Projection for Lahore\n\nOur atmospheric boundary model shows clear diurnal cycling:\n\n1. **Midday Window (11:00 – 17:00):** Ambient temperature warming expands vertical mixing depth to ~800m. AQI stays in **Moderate Haze (70–95)**.\n2. **Evening Transition (18:00 – 22:00):** Radiational cooling begins at ground level. A strong **thermal inversion lid** begins forming below 150m, trapping automotive exhaust and brick kiln particulates. AQI rises into **Smog Inversion Forming (105–140)**.\n3. **Nocturnal Peak (01:00 – 06:00):** Peak atmospheric density stagnation. Smog concentration reaches **Dense Smog Inversion (150–165 AQI)**.\n\n*Condition improves steadily after 09:30 AM once solar irradiance breaks the temperature inversion.*`,
        timestamp: 'Just now',
        smogTier: getSmogBadgeForAqi(155),
        recommendations: [
          'Schedule sports and outdoor activities strictly between 12:00 PM and 4:30 PM.',
          'Operate bedroom HEPA air purifiers during 22:00 to 07:00 nocturnal peak.',
          'Keep vehicle air conditioning on internal air recirculation mode.'
        ],
        suggestedPrompts: [
          'Which areas in Lahore have the highest risk?',
          'What are the best indoor air purifiers for smog?'
        ]
      };
    }

    if (q.includes('mask') || q.includes('safe') || q.includes('health') || q.includes('asthma') || q.includes('child')) {
      return {
        id: `ai-${Date.now()}`,
        role: 'assistant',
        content: `### Respiratory Defense & Health Guidance\n\nFine particulate matter (**PM2.5**) measures less than 2.5 microns—about 30 times smaller than a single human hair. It penetrates directly through nasal cilia into deep alveoli and enters the bloodstream.\n\n- **Mask Efficacy Breakdown:**\n  - **Cloth / Surgical Mask:** Only filters ~10–25% of fine toxic aerosol matter.\n  - **KN95 / N95 / FFP2:** Filters **>95%** when tightly sealed around the nose and jaw.\n- **Asthma & Bronchitis Vulnerability:** Inhalation of acidic sulfur dioxide ($SO_2$) and nitrogen oxides ($NO_x$) triggers acute airway inflammation and bronchospasm.\n- **Pediatric Safety:** Children inhale 50% more air per pound of body weight than adults; keep schools' outdoor recess indoor during inversions.`,
        timestamp: 'Just now',
        smogTier: getSmogBadgeForAqi(125),
        recommendations: [
          'Wear N95/FFP2 certified masks when outside for longer than 15 minutes.',
          'Use saline nasal irrigation to clear sub-micron soot buildup at night.',
          'Carry rescue inhalers (e.g. Salbutamol) if you have any history of respiratory allergy.'
        ],
        suggestedPrompts: [
          'How does smog affect skin and eyes?',
          'What indoor plants purify smog best?'
        ]
      };
    }

    if (q.includes('shahdara') || q.includes('area') || q.includes('sector') || q.includes('worst') || q.includes('hotspot')) {
      return {
        id: `ai-${Date.now()}`,
        role: 'assistant',
        content: `### Microclimate Sector Diagnostics\n\nOur Land-Use Regression model monitors 10 distinct Lahore urban sectors:\n\n- **Shahdara (GT Road Corridor):** Top alert sector due to continuous heavy freight diesel exhaust and riverbed thermal pooling.\n- **Kot Lakhpat Industrial Estate:** Concentrated industrial boiler emissions with stagnant surface wind speeds ($<5\\text{ km/h}$).\n- **Multan Road / Thokar Niaz Baig:** Severe intersection friction and regional bus terminal congestion.\n- **Gulberg & Mall Road:** Urban street canyon effect where multi-story buildings reduce cross-ventilation.\n- **DHA Phase 5 & Lahore Cantt:** Lowest average PM2.5 due to expansive tree cover and strictly controlled industrial zoning.`,
        timestamp: 'Just now',
        smogTier: getSmogBadgeForAqi(92),
        recommendations: [
          'Prefer Canal Bank Road or Ring Road over central arterial routes.',
          'Avoid open motorbike travel on GT Road after 6:00 PM without protective eyewear and N95 mask.'
        ],
        suggestedPrompts: [
          'Plan an eco-friendly low smog route',
          'How does wind speed influence Shahdara smog?'
        ]
      };
    }

    return {
      id: `ai-${Date.now()}`,
      role: 'assistant',
      content: `### Domain Analysis for: "${query}"\n\nLahore's smog is a seasonal crisis driven by a unique confluence of geography, thermal meteorology, crop residue burning across the Punjab basin, and local vehicular/industrial emissions.\n\n- **Atmospheric State:** Surface high-pressure ridges prevent vertical atmospheric venting, leaving pollutants trapped in the breathing layer.\n- **Real-Time Baseline:** Baseline AQI across central monitoring stations is **81 (Moderate Haze)**, but projected to rise during nocturnal boundary collapse.\n- **Action Protocol:** Keep indoor spaces sealed during early mornings and monitor real-time spatial updates on DHUAN.`,
      timestamp: 'Just now',
      smogTier: getSmogBadgeForAqi(81),
      recommendations: [
        'Stay well hydrated to aid natural mucosal airway defense.',
        'Check hourly forecasts before scheduling morning commutes.'
      ],
      suggestedPrompts: [
        'What causes the yellow-brown color of smog?',
        'How does crop stubble burning reach Lahore?'
      ]
    };
  };

  const handleSend = (textToSend?: string) => {
    const text = (textToSend || inputText).trim();
    if (!text || isTyping) return;

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: text,
      timestamp: 'Just now'
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputText('');
    setIsTyping(true);

    setTimeout(() => {
      const reply = generateSimulatedResponse(text);
      setMessages((prev) => [...prev, reply]);
      setIsTyping(false);
    }, 850);
  };

  return (
    <div className="flex-1 flex flex-col h-[calc(100vh-5rem)] max-w-7xl mx-auto w-full">
      
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4 shrink-0">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
              <span className="w-10 h-10 rounded-2xl bg-emerald-500 text-slate-900 flex items-center justify-center shadow-md">
                <Wind className="w-5 h-5" />
              </span>
              Ask DHUAN
            </h1>
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
              AI Smog Model v2.4
            </span>
          </div>
          <p className="text-sm text-slate-500 font-medium mt-1">
            Domain-specific conversational intelligence for Lahore smog physics, sector microclimates, and health defense.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            onClick={handleReset}
            className="px-3.5 py-2 rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-bold flex items-center gap-1.5 shadow-2xs transition-all active:scale-95"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            New Chat
          </button>
        </div>
      </div>

      {/* Main Container: Sidebar + Chat Feed */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-4 gap-6 min-h-0 bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden p-0 sm:p-2">
        
        {/* Left Column: Topics & Pre-built queries */}
        <div className="hidden lg:flex lg:col-span-1 flex-col border-r border-slate-100 p-4 bg-slate-50/70 rounded-2xl overflow-y-auto">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">
            <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
            <span>Popular Smog Topics</span>
          </div>

          <div className="space-y-2 flex-1">
            {SAMPLE_CHATS.map((item, idx) => (
              <button
                key={idx}
                onClick={() => handleSend(item.prompt)}
                className="w-full text-left p-3 rounded-xl bg-white border border-slate-200/80 hover:border-emerald-300 hover:bg-emerald-50/40 transition-all group shadow-2xs"
              >
                <div className="font-bold text-xs text-slate-800 group-hover:text-emerald-800 transition-colors">
                  {item.title}
                </div>
                <div className="text-[11px] text-slate-500 line-clamp-2 mt-0.5">
                  {item.desc}
                </div>
              </button>
            ))}
          </div>

          {/* Quick Atmospheric Knowledge Card */}
          <div className="mt-4 p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs">
            <div className="font-black flex items-center gap-1.5 mb-1 text-emerald-800">
              <BrainCircuit className="w-3.5 h-3.5 text-emerald-600" />
              Smog Inversion Physics
            </div>
            <p className="text-[11px] leading-relaxed text-emerald-700 font-medium">
              Lahore experiences rapid boundary layer collapses during evenings, trapping fine aerosol particulates near breathing level.
            </p>
          </div>
        </div>

        {/* Right Column: Chat Feed & Input */}
        <div className="lg:col-span-3 flex flex-col h-full min-h-0">
          
          {/* Messages Stream */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
            {messages.map((msg) => {
              const isUser = msg.role === 'user';
              return (
                <div 
                  key={msg.id} 
                  className={`flex gap-3 ${isUser ? 'justify-end' : 'justify-start'} animate-in fade-in duration-200`}
                >
                  {!isUser && (
                    <div className="w-8 h-8 rounded-xl bg-slate-900 text-emerald-400 flex items-center justify-center shrink-0 shadow-xs border border-slate-800 mt-1">
                      <Bot className="w-4 h-4" />
                    </div>
                  )}

                  <div className={`max-w-[85%] ${isUser ? 'items-end' : 'items-start'} flex flex-col`}>
                    <div 
                      className={`rounded-2xl p-4 sm:p-5 shadow-xs text-sm leading-relaxed ${
                        isUser 
                          ? 'bg-slate-900 text-white rounded-tr-xs' 
                          : 'bg-white text-slate-800 border border-slate-200 rounded-tl-xs'
                      }`}
                    >
                      {!isUser && msg.smogTier && (
                        <div className="mb-3 flex items-center gap-2">
                          <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-black border ${msg.smogTier.bg} ${msg.smogTier.color} ${msg.smogTier.border}`}>
                            <AlertTriangle className="w-3.5 h-3.5" />
                            {msg.smogTier.name} {msg.smogTier.aqi ? `(${msg.smogTier.aqi} AQI)` : ''}
                          </span>
                        </div>
                      )}

                      <div className="space-y-2 whitespace-pre-line font-normal text-slate-800">
                        {msg.content}
                      </div>

                      {!isUser && msg.recommendations && msg.recommendations.length > 0 && (
                        <div className="mt-4 pt-3 border-t border-slate-100">
                          <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-500 block mb-1.5">
                            Protective Protocols:
                          </span>
                          <ul className="space-y-1.5 text-xs text-slate-700">
                            {msg.recommendations.map((rec, i) => (
                              <li key={i} className="flex items-start gap-2">
                                <ShieldAlert className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                                <span>{rec}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {!isUser && msg.suggestedPrompts && msg.suggestedPrompts.length > 0 && (
                        <div className="mt-3.5 pt-2.5 border-t border-slate-100 flex flex-wrap gap-1.5">
                          {msg.suggestedPrompts.map((prompt, i) => (
                            <button
                              key={i}
                              onClick={() => handleSend(prompt)}
                              className="text-[11px] font-semibold text-emerald-700 hover:text-emerald-900 bg-emerald-50 hover:bg-emerald-100 px-3 py-1.5 rounded-lg transition-colors border border-emerald-200 flex items-center gap-1 text-left"
                            >
                              <span>{prompt}</span>
                              <ChevronRight className="w-3 h-3 shrink-0" />
                            </button>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-2 mt-1 px-1 text-[11px] text-slate-400">
                      <span>{msg.timestamp}</span>
                      {!isUser && (
                        <button
                          onClick={() => handleCopy(msg.id, msg.content)}
                          className="hover:text-slate-600 transition-colors flex items-center gap-1"
                        >
                          {copiedId === msg.id ? (
                            <>
                              <Check className="w-3 h-3 text-emerald-600" />
                              <span className="text-emerald-600 font-bold">Copied</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3 h-3" />
                              <span>Copy</span>
                            </>
                          )}
                        </button>
                      )}
                    </div>
                  </div>

                  {isUser && (
                    <div className="w-8 h-8 rounded-xl bg-slate-200 text-slate-700 flex items-center justify-center shrink-0 font-bold text-xs mt-1">
                      <User className="w-4 h-4" />
                    </div>
                  )}
                </div>
              );
            })}

            {isTyping && (
              <div className="flex gap-3 items-start animate-in fade-in duration-200">
                <div className="w-8 h-8 rounded-xl bg-slate-900 text-emerald-400 flex items-center justify-center shrink-0 shadow-xs border border-slate-800">
                  <Bot className="w-4 h-4" />
                </div>
                <div className="bg-white rounded-2xl p-4 shadow-xs border border-slate-200 flex items-center gap-3">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-bounce"></span>
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-bounce [animation-delay:0.2s]"></span>
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-bounce [animation-delay:0.4s]"></span>
                  </div>
                  <span className="text-xs font-semibold text-slate-500">
                    DHUAN AI analyzing boundary inversion & PM2.5 physics...
                  </span>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input Bar */}
          <div className="p-3 sm:p-5 bg-white border-t border-slate-100">
            <div className="flex items-center gap-2 bg-slate-50 rounded-2xl p-2 border border-slate-200 focus-within:border-emerald-500 focus-within:ring-2 focus-within:ring-emerald-500/20 transition-all">
              <input
                ref={inputRef}
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleSend();
                  }
                }}
                placeholder="Ask DHUAN anything about Lahore smog, safe routes, masks, or inversion forecasts..."
                className="flex-1 bg-transparent px-3 py-2 text-sm text-slate-900 placeholder-slate-400 focus:outline-none"
              />
              
              <button
                onClick={() => handleSend()}
                disabled={!inputText.trim() || isTyping}
                className={`p-3 rounded-xl transition-all flex items-center justify-center shrink-0 ${
                  inputText.trim() && !isTyping
                    ? 'bg-emerald-500 text-slate-900 hover:bg-emerald-400 shadow-md hover:scale-105 active:scale-95 font-bold cursor-pointer'
                    : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                }`}
                title="Send Message"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
            
            <div className="mt-2 flex items-center justify-between text-[11px] text-slate-400 px-1 font-medium">
              <span>Domain-Specific AI calibrated to Open-Meteo & Lahore ground stations</span>
              <span>Press Enter to send</span>
            </div>
          </div>

        </div>

      </div>

    </div>
  );
}
