'use client';

import React, { useState, useRef, useEffect } from 'react';
import { 
  Sparkles, 
  Send, 
  X, 
  Bot, 
  User, 
  ShieldCheck, 
  ArrowUpRight, 
  AlertTriangle, 
  CheckCircle2, 
  HelpCircle,
  RefreshCw
} from 'lucide-react';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  simulatedResult?: any;
  isLlmGenerated?: boolean;
  timestamp: string;
}

interface AskFinOSChatProps {
  isOpen: boolean;
  onClose: () => void;
  apiBase: string;
  context: {
    current_balance?: number;
    minimum_safe_balance?: number;
    forecast?: any;
    limits?: any;
    anomalies?: any[];
    recurring_bills?: any[];
  };
  transactions?: any[];
}

export const AskFinOSChat: React.FC<AskFinOSChatProps> = ({
  isOpen,
  onClose,
  apiBase,
  context,
  transactions
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content: "Hello! I'm **Ask FinOS**, your predictive cash flow copilot. I analyze your historical cash flow, scheduled obligations, and Monte Carlo forecasts to answer questions and stress-test financial decisions.\n\nAsk me about upcoming liquidity dips, safe spending limits, or test a what-if scenario (e.g. *'What if I buy a ₹35,000 laptop?'*).",
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const suggestedQuestions = [
    "Why is my balance low around mid-month?",
    "What if I buy a ₹35,000 laptop in 7 days?",
    "What is my safe daily spending limit?",
    "Are there any unusual or anomalous expenses?"
  ];

  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen]);

  const handleSendMessage = async (textToSend?: string) => {
    const query = (textToSend || input).trim();
    if (!query || isLoading) return;

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: query,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    try {
      const res = await fetch(`${apiBase}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: query,
          context: context,
          history: messages.map(m => ({ role: m.role, content: m.content })),
          transactions: transactions || []
        })
      });

      if (!res.ok) {
        throw new Error(`HTTP ${res.status}: Failed to get copilot reply.`);
      }

      const data = await res.json();
      const assistantMsg: ChatMessage = {
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        content: data.reply || "I analyzed your financial records and completed the forecast simulation.",
        simulatedResult: data.simulated_result,
        isLlmGenerated: data.is_llm_generated,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      setMessages((prev) => [...prev, assistantMsg]);
    } catch (e: any) {
      const errorMsg: ChatMessage = {
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        content: `⚠️ Failed to reach copilot service: ${e.message}. Please verify backend health.`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-y-0 right-0 z-50 w-full sm:w-[480px] bg-[#0e1014] border-l border-white/[0.1] shadow-2xl flex flex-col font-sans transition-all animate-in slide-in-from-right duration-200">
      {/* Header */}
      <div className="p-4 border-b border-white/[0.08] bg-[#121418] flex items-center justify-between">
        <div className="flex items-center space-x-2.5">
          <div className="p-2 rounded-xl bg-[#d9f154]/10 text-[#d9f154] border border-[#d9f154]/30">
            <Sparkles size={18} />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h2 className="text-sm font-bold text-white tracking-tight">Ask FinOS Copilot</h2>
              <span className="text-[10px] font-mono font-medium px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                ACTIVE
              </span>
            </div>
            <p className="text-[11px] font-mono text-white/40 flex items-center gap-1 mt-0.5">
              <ShieldCheck size={12} className="text-emerald-400" />
              <span>DPDP Sanitized • Zero Data Retention</span>
            </p>
          </div>
        </div>

        <button
          onClick={onClose}
          className="p-1.5 rounded-lg text-white/50 hover:text-white hover:bg-white/[0.08] transition-colors cursor-pointer"
        >
          <X size={18} />
        </button>
      </div>

      {/* Suggested Chips */}
      <div className="p-3 border-b border-white/[0.06] bg-[#101216] overflow-x-auto scrollbar-none flex gap-1.5 shrink-0">
        {suggestedQuestions.map((q, idx) => (
          <button
            key={idx}
            onClick={() => handleSendMessage(q)}
            disabled={isLoading}
            className="text-[11px] text-white/70 hover:text-white bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] rounded-full px-2.5 py-1 whitespace-nowrap transition-colors cursor-pointer disabled:opacity-40"
          >
            {q}
          </button>
        ))}
      </div>

      {/* Messages Body */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((m) => {
          const isUser = m.role === 'user';

          return (
            <div
              key={m.id}
              className={`flex items-start gap-2.5 ${isUser ? 'flex-row-reverse' : ''}`}
            >
              <div
                className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 text-xs font-bold ${
                  isUser
                    ? 'bg-white/10 text-white border border-white/20'
                    : 'bg-[#d9f154]/20 text-[#d9f154] border border-[#d9f154]/40'
                }`}
              >
                {isUser ? <User size={14} /> : <Bot size={14} />}
              </div>

              <div
                className={`max-w-[85%] rounded-2xl p-3.5 text-xs leading-relaxed ${
                  isUser
                    ? 'bg-[#1e222a] text-white border border-white/[0.1] rounded-tr-none'
                    : 'bg-[#121418] text-white/90 border border-white/[0.08] rounded-tl-none shadow-sm'
                }`}
              >
                {/* Content text */}
                <div className="whitespace-pre-wrap font-sans space-y-1.5">
                  {m.content}
                </div>

                {/* Simulated Result Card (if any) */}
                {m.simulatedResult && (
                  <div className="mt-3 p-3 rounded-xl bg-black/40 border border-white/[0.1] space-y-2">
                    <div className="flex items-center justify-between text-[11px] font-mono">
                      <span className="text-white/60">Simulated Delta</span>
                      <span className="text-[#d9f154] font-semibold">1,000 Monte Carlo Paths</span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-[11px] font-mono">
                      <div className="p-2 rounded bg-white/[0.03] border border-white/[0.05]">
                        <span className="text-white/40 block">Breach Risk</span>
                        <span className="text-white font-bold text-sm">
                          {m.simulatedResult.baseline_risk}% ➔ {m.simulatedResult.simulated_risk}%
                        </span>
                        <span className={`text-[10px] block mt-0.5 ${m.simulatedResult.risk_delta > 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
                          ({m.simulatedResult.risk_delta > 0 ? '+' : ''}{m.simulatedResult.risk_delta}%)
                        </span>
                      </div>

                      <div className="p-2 rounded bg-white/[0.03] border border-white/[0.05]">
                        <span className="text-white/40 block">Lowest Balance</span>
                        <span className="text-white font-bold text-sm">
                          ₹{Math.round(m.simulatedResult.simulated_lowest_balance).toLocaleString('en-IN')}
                        </span>
                        <span className="text-[10px] text-white/40 block mt-0.5">
                          vs ₹{Math.round(m.simulatedResult.baseline_lowest_balance).toLocaleString('en-IN')} baseline
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                <div className="flex items-center justify-between text-[10px] font-mono text-white/30 mt-2">
                  <span>{m.timestamp}</span>
                  {!isUser && (
                    <span className="text-[#d9f154]/70">
                      {m.isLlmGenerated ? 'Gemini 2.5 AI' : 'FinOS Engine'}
                    </span>
                  )}
                </div>
              </div>
            </div>
          );
        })}

        {isLoading && (
          <div className="flex items-start gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-[#d9f154]/20 text-[#d9f154] border border-[#d9f154]/40 flex items-center justify-center shrink-0">
              <Bot size={14} />
            </div>
            <div className="p-3.5 rounded-2xl rounded-tl-none bg-[#121418] border border-white/[0.08] text-xs font-mono text-white/60 flex items-center space-x-2">
              <RefreshCw size={12} className="animate-spin text-[#d9f154]" />
              <span>Analyzing cash flow & running simulation...</span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Form */}
      <div className="p-3 border-t border-white/[0.08] bg-[#121418]">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSendMessage();
          }}
          className="flex items-center gap-2"
        >
          <input
            type="text"
            placeholder="Ask about your balance, limits, or simulate a purchase..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={isLoading}
            className="flex-1 bg-black/40 border border-white/[0.1] rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-white/40 focus:outline-none focus:border-[#d9f154] transition-colors font-sans"
          />
          <button
            type="submit"
            disabled={!input.trim() || isLoading}
            className="p-2.5 rounded-xl bg-[#d9f154] text-black hover:bg-[#cbf037] disabled:opacity-40 disabled:pointer-events-none transition-all cursor-pointer font-bold shrink-0 shadow-[0_0_12px_rgba(217,241,84,0.25)]"
          >
            <Send size={15} />
          </button>
        </form>
      </div>
    </div>
  );
};
