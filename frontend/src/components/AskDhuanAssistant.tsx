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
import { getApiEndpoint } from '@/lib/api';
import RichMessageRenderer from '@/components/RichMessageRenderer';

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
    content: `Assalam-o-Alaikum! Welcome to **DHUAN AI** — your dedicated atmospheric smog & environmental health advisor for **${cityName}**.\n\nI can assist you with:\n- Lahore Live Smog Index & ground AQI\n- Past 24 hours recorded history\n- 72-hour AI thermal inversion forecasts\n- High-alert sector monitoring zones\n- Low-exposure safe commute routes\n- Respiratory health & certified mask standards\n\nHow can I assist you with the dashboard or atmospheric conditions today?`,
    timestamp: 'Just now'
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

  // Real Grounded AI & Ground Telemetry Submission Handler
  const handleSendMessage = async (textToSend?: string) => {
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

    try {
      const history = messages.slice(-6).map((m) => ({
        role: m.role,
        content: m.content
      }));

      const res = await fetch(getApiEndpoint('/dashboard/assistant/ask'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query, history })
      });

      if (!res.ok) {
        throw new Error(`Server returned status ${res.status}`);
      }

      const data = await res.json();
      const category = data.smog_category;

      const aiReply: ChatMessage = {
        id: `ai-${Date.now()}`,
        role: 'assistant',
        content: data.answer || "Atmospheric query processed.",
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

      setMessages((prev) => [...prev, aiReply]);
    } catch (err: any) {
      console.error('[Ask DHUAN] API Error:', err);
      const errorReply: ChatMessage = {
        id: `err-${Date.now()}`,
        role: 'assistant',
        content: `### Telemetry Connection Notice\n\nUnable to reach the atmospheric AI core (${err.message || 'Network error'}). Please verify the DHUAN backend and AI service status.`,
        timestamp: 'Just now',
        smogTier: getSmogBadgeForAqi(liveAqi || 81),
        recommendations: [
          'Ensure background services are active.',
          'Try refreshing the browser window.'
        ]
      };
      setMessages((prev) => [...prev, errorReply]);
    } finally {
      setIsTyping(false);
    }
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
            Live Ground Synced
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

                    {/* Rich Formatted Message Body */}
                    <RichMessageRenderer content={msg.content} isUser={isUser} />

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
            <span>Powered by DHUAN Atmospheric Physics Model & Ground Baseline</span>
            <span>Press Enter to send</span>
          </div>
        </div>

      </div>

    </div>
  );
}
