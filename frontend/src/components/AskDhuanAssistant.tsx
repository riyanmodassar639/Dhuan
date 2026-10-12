'use client';

import React, { useState, useRef, useEffect } from 'react';
import { 
  Wind, 
  Send, 
  Sparkles, 
  X, 
  Maximize2, 
  Minimize2, 
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
  Info,
  ChevronRight,
  ExternalLink,
  BrainCircuit
} from 'lucide-react';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  smogTier?: {
    name: string;
    aqi?: number;
    color: string;
    bg: string;
    border: string;
  };
  recommendations?: string[];
  suggestedPrompts?: string[];
}

interface AskDhuanAssistantProps {
  isOpen: boolean;
  onClose: () => void;
  liveAqi?: number | null;
  cityName?: string;
}

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

// Preset Quick Inquiry Templates
const PRESET_TOPICS = [
  {
    id: 'forecast',
    label: 'Smog 24h Forecast',
    icon: TrendingUp,
    prompt: 'What is the smog and inversion forecast for Lahore over the next 24 hours?'
  },
  {
    id: 'health',
    label: 'Health & Masks',
    icon: ShieldAlert,
    prompt: 'What precautions and mask type should I use today given current PM2.5 levels?'
  },
  {
    id: 'hotspots',
    label: 'High Alert Zones',
    icon: MapPin,
    prompt: 'Which sectors in Lahore currently have the highest smog density and AQI?'
  },
  {
    id: 'inversion',
    label: 'Nocturnal Inversion',
    icon: Wind,
    prompt: 'Explain why smog gets worse at night and early morning in Lahore.'
  }
];

export default function AskDhuanAssistant({
  isOpen,
  onClose,
  liveAqi = 81,
  cityName = 'Lahore'
}: AskDhuanAssistantProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const initialGreeting: ChatMessage = {
    id: 'welcome-msg',
    role: 'assistant',
    content: `Assalam-o-Alaikum! I am **DHUAN AI**, your dedicated atmospheric smog intelligence and public health advisor for **${cityName}**.\n\nI continuously evaluate live microclimate telemetry, nocturnal boundary layer inversion physics, and PM2.5 dispersion across 10 central monitoring sectors to help keep your lungs safe.\n\nHow can I assist you with today's atmospheric conditions?`,
    timestamp: 'Just now',
    smogTier: getSmogBadgeForAqi(liveAqi || 81),
    recommendations: [
      'Check nocturnal inversion schedule before planning outdoor runs.',
      'Keep certified N95 or KN95 masks in vehicle or bag.',
      'Seal windows during 21:00 to 08:00 temperature inversions.'
    ],
    suggestedPrompts: [
      'Is it safe for morning exercise tomorrow?',
      'Which routes have the lowest smog right now?',
      'How does smog affect asthma patients?'
    ]
  };

  const [messages, setMessages] = useState<ChatMessage[]>([initialGreeting]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll on new message
  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      inputRef.current?.focus();
    }
  }, [messages, isOpen]);

  // Handle Copy Message
  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Reset Conversation
  const handleResetChat = () => {
    setMessages([initialGreeting]);
  };

  // Simulated AI response engine for frontend prototyping
  const generateSimulatedResponse = (query: string): ChatMessage => {
    const q = query.toLowerCase();
    const currentVal = liveAqi || 81;

    if (q.includes('forecast') || q.includes('next') || q.includes('24h') || q.includes('hours') || q.includes('kal')) {
      return {
        id: `ai-${Date.now()}`,
        role: 'assistant',
        content: `### 24-Hour Atmospheric Outlook for ${cityName}\n\nOur inversion model indicates a significant **diurnal variation**:\n\n- **Daytime (12:00 – 17:00):** Solar radiative heating elevates the boundary layer, dispersing fine particulate matter into the upper troposphere. AQI remains near **${currentVal} (Moderate Haze)**.\n- **Late Evening (20:00 – 23:00):** Surface cooling triggers a rapid **nocturnal thermal inversion**, trapping vehicle exhaust and biomass smoke within 120m of ground level. AQI projected to climb to **115–130 (Smog Inversion Forming)**.\n- **Early Morning Peak (04:00 – 07:00):** Peak atmospheric density collapse. PM2.5 levels may peak near **155–165 AQI (Dense Smog Inversion)**.`,
        timestamp: 'Just now',
        smogTier: getSmogBadgeForAqi(155),
        recommendations: [
          'Postpone early morning outdoor workouts until after 10:00 AM when the inversion breaks.',
          'Operate HEPA air filtration in bedrooms during nocturnal peak hours.',
          'Close fresh air intake vents on vehicles during evening rush hours.'
        ],
        suggestedPrompts: [
          'Which areas are safest during morning commute?',
          'What are the best indoor air purifiers for smog?'
        ]
      };
    }

    if (q.includes('mask') || q.includes('precaution') || q.includes('health') || q.includes('safe') || q.includes('asthma') || q.includes('walk')) {
      return {
        id: `ai-${Date.now()}`,
        role: 'assistant',
        content: `### Health Advisory & Respiratory Protection\n\nWith current PM2.5 concentrations at **${((currentVal * 0.35)).toFixed(1)} µg/m³** (${Math.round((currentVal * 0.35) / 5)}x WHO Annual Limit):\n\n- **Standard Surgical/Cloth Masks:** Provide **<15% filtration efficiency** against sub-micron PM2.5 aerosol particles. They do not prevent smog lung infiltration.\n- **Recommended Standard:** Certified **N95, KN95, or FFP2 respirators** with tight perimeter facial seals, filtering >95% of fine toxic aerosol matter.\n- **Sensitive Demographics:** Individuals with bronchial asthma, cardiovascular disease, children under 10, and seniors should restrict strenuous physical exertion outdoors.`,
        timestamp: 'Just now',
        smogTier: getSmogBadgeForAqi(currentVal),
        recommendations: [
          'Wear a snug-fitting N95/KN95 mask whenever traveling outdoors.',
          'Asthma patients should keep rescue bronchodilator inhalers easily accessible.',
          'Rinse eyes with saline wash after extended outdoor exposure to remove acidic smog nitrates.'
        ],
        suggestedPrompts: [
          'Can indoor plants help reduce PM2.5?',
          'Is it safe to open windows in the afternoon?'
        ]
      };
    }

    if (q.includes('hotspot') || q.includes('area') || q.includes('zone') || q.includes('shahdara') || q.includes('worst') || q.includes('lahore')) {
      return {
        id: `ai-${Date.now()}`,
        role: 'assistant',
        content: `### Spatial Smog Sector Diagnostics\n\nOur microclimate regression across 10 official Lahore stations detects high pollutant accumulation near industrial and transit corridors:\n\n1. **Shahdara (GT Road Corridor):** ~90 AQI *(Heavy diesel freight particulate entrapment)*\n2. **Kot Lakhpat Industrial Complex:** ~88 AQI *(Industrial emissions + nocturnal low wind)*\n3. **Multan Road (Thokar Niaz Baig):** ~86 AQI *(Intercity transit hub congestion)*\n4. **Mall Road / Punjab Assembly:** ~82 AQI *(Dense urban vehicular background)*\n5. **DHA Phase 5 & Cantt:** ~75 AQI *(Comparatively lower local density with vegetative buffer)*`,
        timestamp: 'Just now',
        smogTier: getSmogBadgeForAqi(90),
        recommendations: [
          'Utilize Lahore Ring Road or Canal Road to bypass congested central choking points.',
          'Avoid idling in heavy traffic on GT Road between 18:00 and 22:00.'
        ],
        suggestedPrompts: [
          'Plan an eco-friendly low smog route',
          'How does wind speed influence Shahdara smog?'
        ]
      };
    }

    // Default Atmospheric Inversion Physics response
    return {
      id: `ai-${Date.now()}`,
      role: 'assistant',
      content: `### Smog Dynamics Analysis for "${query}"\n\nIn the Lahore metropolitan basin, **smog is not just ordinary smoke or dust**; it is a complex photochemical mixture of airborne sulfates, nitrates, ammonium, and secondary organic aerosols entrapped by meteorological thermal inversions.\n\n- **Current Ground Telemetry:** Baseline AQI is **${currentVal}** (${getSmogBadgeForAqi(currentVal).name}).\n- **Dispersion Potential:** Low planetary boundary layer height traps pollutants near ground breathing zones.\n- **Recommended Posture:** Exercise caution, monitor hourly AQI shifts, and utilize the DHUAN Smart Route planner for commute planning.`,
      timestamp: 'Just now',
      smogTier: getSmogBadgeForAqi(currentVal),
      recommendations: [
        'Stay hydrated to assist mucosal respiratory clearance.',
        'Check DHUAN hourly inversion widget before commuting.'
      ],
      suggestedPrompts: [
        'What causes the yellow-brown color of smog?',
        'How does crop stubble burning reach Lahore?'
      ]
    };
  };

  // Submit Handler
  const handleSendMessage = (textToSend?: string) => {
    const query = (textToSend || inputText).trim();
    if (!query || isTyping) return;

    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: query,
      timestamp: 'Just now'
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputText('');
    setIsTyping(true);

    // Simulate AI thinking & atmospheric calculation
    setTimeout(() => {
      const aiReply = generateSimulatedResponse(query);
      setMessages((prev) => [...prev, aiReply]);
      setIsTyping(false);
    }, 900);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSendMessage();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-end sm:items-center justify-end p-0 sm:p-6 pointer-events-none">
      
      {/* Backdrop (visible only when expanded or on mobile) */}
      <div 
        onClick={onClose}
        className={`fixed inset-0 bg-slate-950/40 backdrop-blur-xs transition-opacity duration-300 pointer-events-auto ${
          isExpanded ? 'opacity-100' : 'opacity-0 sm:pointer-events-none'
        }`}
      />

      {/* Main Chat Panel */}
      <div 
        className={`pointer-events-auto w-full bg-white shadow-2xl flex flex-col transition-all duration-300 ease-out border border-slate-200 overflow-hidden ${
          isExpanded 
            ? 'sm:w-[760px] h-[92vh] sm:h-[820px] sm:rounded-3xl' 
            : 'sm:w-[460px] h-[88vh] sm:h-[640px] rounded-t-3xl sm:rounded-3xl'
        }`}
      >
        
        {/* Panel Header */}
        <div className="bg-slate-900 text-white px-5 py-4 flex items-center justify-between border-b border-slate-800 shrink-0 relative">
          
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
                <Wind className="w-5 h-5 animate-pulse" />
              </div>
              <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-emerald-500 border-2 border-slate-900"></span>
            </div>
            
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-extrabold text-base tracking-tight text-white">Ask DHUAN</h2>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  Smog AI v2.4
                </span>
              </div>
              <p className="text-xs text-slate-400 font-medium flex items-center gap-1.5 mt-0.5">
                <BrainCircuit className="w-3 h-3 text-emerald-400" />
                Atmospheric Physics & Health Advisor
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-1 text-slate-400">
            <button
              onClick={handleResetChat}
              title="Reset Conversation"
              className="p-2 hover:text-white hover:bg-slate-800 rounded-xl transition-colors"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
            
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              title={isExpanded ? "Collapse view" : "Expand view"}
              className="p-2 hover:text-white hover:bg-slate-800 rounded-xl transition-colors hidden sm:block"
            >
              {isExpanded ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>

            <button
              onClick={onClose}
              title="Close Assistant"
              className="p-2 hover:text-white hover:bg-slate-800 rounded-xl transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Live Smog Context Bar */}
        <div className="bg-slate-100/90 px-4 py-2 border-b border-slate-200 text-xs font-medium text-slate-600 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping"></span>
            <span className="font-bold text-slate-800">Lahore Live Baseline:</span>
            <span>{liveAqi || 81} AQI</span>
            <span className="text-slate-400">&bull;</span>
            <span className="font-semibold text-amber-700">Moderate Haze</span>
          </div>
          <span className="text-[11px] text-slate-500 hidden sm:inline-block font-mono">
            SQLite Synced
          </span>
        </div>

        {/* Message Stream */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4 bg-slate-50/50">
          
          {messages.map((msg) => {
            const isUser = msg.role === 'user';
            
            return (
              <div 
                key={msg.id} 
                className={`flex gap-3 ${isUser ? 'justify-end' : 'justify-start'} animate-in fade-in duration-200`}
              >
                {/* Bot Avatar */}
                {!isUser && (
                  <div className="w-8 h-8 rounded-xl bg-slate-900 text-emerald-400 flex items-center justify-center shrink-0 shadow-xs border border-slate-800 mt-1">
                    <Bot className="w-4 h-4" />
                  </div>
                )}

                {/* Message Bubble Container */}
                <div className={`max-w-[85%] ${isUser ? 'items-end' : 'items-start'} flex flex-col`}>
                  
                  <div 
                    className={`rounded-2xl p-4 shadow-xs text-sm leading-relaxed ${
                      isUser 
                        ? 'bg-slate-900 text-white rounded-tr-xs' 
                        : 'bg-white text-slate-800 border border-slate-200 rounded-tl-xs'
                    }`}
                  >
                    {/* Assistant Smog Severity Badge */}
                    {!isUser && msg.smogTier && (
                      <div className="mb-3 flex items-center gap-2">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-black border ${msg.smogTier.bg} ${msg.smogTier.color} ${msg.smogTier.border}`}>
                          <AlertTriangle className="w-3.5 h-3.5" />
                          {msg.smogTier.name} {msg.smogTier.aqi ? `(${msg.smogTier.aqi} AQI)` : ''}
                        </span>
                      </div>
                    )}

                    {/* Markdown Body */}
                    <div className="space-y-2 whitespace-pre-line font-normal text-slate-800">
                      {msg.content}
                    </div>

                    {/* Actionable Health Checklist (if provided) */}
                    {!isUser && msg.recommendations && msg.recommendations.length > 0 && (
                      <div className="mt-3.5 pt-3 border-t border-slate-100">
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

                    {/* Follow-up Prompts */}
                    {!isUser && msg.suggestedPrompts && msg.suggestedPrompts.length > 0 && (
                      <div className="mt-3 pt-2.5 border-t border-slate-100 flex flex-wrap gap-1.5">
                        {msg.suggestedPrompts.map((prompt, i) => (
                          <button
                            key={i}
                            onClick={() => handleSendMessage(prompt)}
                            className="text-[11px] font-semibold text-emerald-700 hover:text-emerald-900 bg-emerald-50 hover:bg-emerald-100 px-2.5 py-1 rounded-lg transition-colors border border-emerald-200 flex items-center gap-1 text-left"
                          >
                            <span>{prompt}</span>
                            <ChevronRight className="w-3 h-3 shrink-0" />
                          </button>
                        ))}
                      </div>
                    )}

                  </div>

                  {/* Message Footer Info */}
                  <div className="flex items-center gap-2 mt-1 px-1 text-[11px] text-slate-400">
                    <span>{msg.timestamp}</span>
                    {!isUser && (
                      <button
                        onClick={() => handleCopy(msg.id, msg.content)}
                        className="hover:text-slate-600 transition-colors flex items-center gap-1"
                        title="Copy message"
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

                {/* User Avatar */}
                {isUser && (
                  <div className="w-8 h-8 rounded-xl bg-slate-200 text-slate-700 flex items-center justify-center shrink-0 font-bold text-xs mt-1">
                    <User className="w-4 h-4" />
                  </div>
                )}
              </div>
            );
          })}

          {/* Typing Indicator */}
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
                  DHUAN AI analyzing inversion & PM2.5 physics...
                </span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Quick Suggestion Chips (when user is at idle) */}
        <div className="px-4 py-2 bg-white border-t border-slate-100 flex items-center gap-2 overflow-x-auto no-scrollbar shrink-0">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider shrink-0 flex items-center gap-1">
            <Lightbulb className="w-3 h-3 text-amber-500" />
            Quick:
          </span>
          {PRESET_TOPICS.map((topic) => {
            const Icon = topic.icon;
            return (
              <button
                key={topic.id}
                onClick={() => handleSendMessage(topic.prompt)}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 hover:border-slate-300 text-xs font-semibold text-slate-700 whitespace-nowrap transition-all shrink-0 active:scale-95"
              >
                <Icon className="w-3 h-3 text-slate-500" />
                <span>{topic.label}</span>
              </button>
            );
          })}
        </div>

        {/* Chat Input Bar */}
        <div className="p-3 sm:p-4 bg-white border-t border-slate-200 shrink-0">
          <div className="flex items-center gap-2 bg-slate-50 rounded-2xl p-1.5 border border-slate-200 focus-within:border-emerald-500 focus-within:ring-2 focus-within:ring-emerald-500/20 transition-all">
            <input
              ref={inputRef}
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask DHUAN about smog, masks, safe routes, or inversion..."
              className="flex-1 bg-transparent px-3 py-2 text-sm text-slate-900 placeholder-slate-400 focus:outline-none"
            />
            
            <button
              onClick={() => handleSendMessage()}
              disabled={!inputText.trim() || isTyping}
              className={`p-2.5 rounded-xl transition-all flex items-center justify-center shrink-0 ${
                inputText.trim() && !isTyping
                  ? 'bg-emerald-500 text-slate-900 hover:bg-emerald-400 shadow-md hover:scale-105 active:scale-95 font-bold'
                  : 'bg-slate-200 text-slate-400 cursor-not-allowed'
              }`}
              title="Send Message"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
          
          <div className="mt-2 flex items-center justify-between text-[10px] text-slate-400 px-1 font-medium">
            <span>Powered by DHUAN Atmospheric Physics Model & SQLite Ground Baseline</span>
            <span>Press Enter to send</span>
          </div>
        </div>

      </div>

    </div>
  );
}
