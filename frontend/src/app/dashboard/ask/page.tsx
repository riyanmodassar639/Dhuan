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
import { getApiEndpoint } from '@/lib/api';
import RichMessageRenderer from '@/components/RichMessageRenderer';

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
    content: `Assalam-o-Alaikum! Welcome to **Ask DHUAN** — your specialized AI Smog & Environmental Health Intelligence Assistant.\n\nI can assist you with:\n- Lahore Live Smog Index & ground AQI\n- Past 24 hours recorded history\n- 72-hour AI thermal inversion forecasts\n- High-alert sector monitoring zones\n- Low-exposure safe commute routes\n- Respiratory health & certified mask standards\n\nHow can I assist you with the dashboard or atmospheric conditions today?`,
    timestamp: 'Just now'
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

  const handleSend = async (textToSend?: string) => {
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

    try {
      const history = messages.slice(-6).map((m) => ({
        role: m.role,
        content: m.content
      }));

      const res = await fetch(getApiEndpoint('/dashboard/assistant/ask'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: text, history })
      });

      if (!res.ok) {
        throw new Error(`Server returned HTTP ${res.status}`);
      }

      const data = await res.json();
      const category = data.smog_category;

      const reply: ChatMessage = {
        id: `ai-${Date.now()}`,
        role: 'assistant',
        content: data.answer || "Atmospheric telemetry processed.",
        timestamp: 'Just now',
        smogTier: category ? {
          name: category.name || 'Moderate Haze',
          aqi: category.aqi,
          color: category.text || category.color || 'text-amber-800',
          bg: category.bg || 'bg-amber-50',
          border: category.border || 'border-amber-200'
        } : undefined,
        recommendations: data.protective_protocols || [],
        suggestedPrompts: []
      };

      setMessages((prev) => [...prev, reply]);
    } catch (err: any) {
      console.error('[Ask DHUAN Page] API Error:', err);
      const errorMsg: ChatMessage = {
        id: `err-${Date.now()}`,
        role: 'assistant',
        content: `### Telemetry Connection Notice\n\nUnable to reach the atmospheric AI core (${err.message || 'Network error'}). Please ensure the DHUAN backend and AI services are running.`,
        timestamp: 'Just now',
        smogTier: getSmogBadgeForAqi(81),
        recommendations: ['Check local backend status or refresh the application.']
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsTyping(false);
    }
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

                      <RichMessageRenderer content={msg.content} isUser={isUser} />

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
