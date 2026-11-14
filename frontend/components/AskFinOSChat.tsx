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
  RefreshCw,
  Info
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
      content: "Hello! I'm **Ask FinOS**, your financial intelligence advisor. I analyze your historical cash flow, scheduled obligations, and Monte Carlo forecasts to answer questions and stress-test financial decisions.\n\nAsk me about upcoming liquidity dips, safe spending limits, or test a what-if scenario (e.g. *'What if I buy a ₹35,000 laptop?'*).",
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const suggestedQuestions = [
    "I want to buy a new phone. Can I afford it?",
    "Can I buy an iPhone for ₹70,000?",
    "Can I purchase a laptop for ₹35,000?",
    "What if I buy it next month?",
    "Can I take a ₹15,000 EMI?",
    "How much can I safely spend on a phone?"
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
        content: `⚠️ Unable to reach advisor service: ${e.message}. Please ensure the backend is running.`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-y-0 right-0 z-50 w-full sm:w-[480px] bg-white border-l border-[#EAE6F0] shadow-[0_10px_40px_-5px_rgba(118,80,168,0.18)] flex flex-col font-sans transition-all animate-in slide-in-from-right duration-200">
      {/* Header */}
      <div className="p-4 border-b border-[#EAE6F0] bg-white flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="h-10 w-10 rounded-xl bg-[#F3EDFA] flex items-center justify-center text-[#7650A8]">
            <Sparkles size={20} />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h2 className="text-sm font-bold text-[#17152D] tracking-tight">Ask FinOS AI Advisor</h2>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#E8F8F2] text-[#159B72] border border-[#B4E8D2]">
                ACTIVE
              </span>
            </div>
            <p className="text-[11px] text-[#77758A] flex items-center gap-1 mt-0.5 font-medium">
              <ShieldCheck size={13} className="text-[#159B72]" />
              <span>DPDP Sanitized • Zero Data Retention</span>
            </p>
          </div>
        </div>

        <button
          onClick={onClose}
          className="p-2 rounded-full text-[#77758A] hover:text-[#17152D] hover:bg-[#F3EDFA] transition-colors cursor-pointer"
        >
          <X size={18} />
        </button>
      </div>

      {/* Suggested Chips */}
      <div className="p-3 border-b border-[#EAE6F0] bg-[#F7F5FA] overflow-x-auto scrollbar-none flex gap-2 shrink-0">
        {suggestedQuestions.map((q, idx) => (
          <button
            key={idx}
            onClick={() => handleSendMessage(q)}
            disabled={isLoading}
            className="text-xs font-semibold text-[#7650A8] bg-[#F3EDFA] hover:bg-[#EAE6F0] border border-[#EAE6F0] rounded-full px-3 py-1.5 whitespace-nowrap transition-colors cursor-pointer disabled:opacity-40"
          >
            {q}
          </button>
        ))}
      </div>

      {/* Messages Body */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-white">
        {messages.map((m) => {
          const isUser = m.role === 'user';

          return (
            <div
              key={m.id}
              className={`flex items-start gap-3 ${isUser ? 'flex-row-reverse' : ''}`}
            >
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-xs font-bold ${
                  isUser
                    ? 'bg-[#F3EDFA] text-[#7650A8]'
                    : 'bg-[#F3EDFA] text-[#7650A8] border border-[#EAE6F0]'
                }`}
              >
                {isUser ? <User size={15} /> : <Bot size={15} />}
              </div>

              <div
                className={`max-w-[85%] rounded-[20px] p-4 text-xs leading-relaxed ${
                  isUser
                    ? 'bg-[#7650A8] text-white rounded-tr-none shadow-xs'
                    : 'bg-[#F7F5FA] text-[#17152D] border border-[#EAE6F0] rounded-tl-none shadow-xs'
                }`}
              >
                {/* Content text */}
                <div className="whitespace-pre-wrap font-sans space-y-1.5">
                  {m.content}
                </div>

                {/* Simulated Result Card (if any) */}
                {m.simulatedResult && (
                  <div className="mt-3 p-3.5 rounded-2xl bg-white border border-[#EAE6F0] space-y-2.5 text-[#17152D] shadow-xs">
                    {/* Header with Title and Category Badge */}
                    <div className="flex items-center justify-between gap-2 pb-1 border-b border-[#EAE6F0]">
                      <div className="flex items-center gap-1.5 font-bold text-xs text-[#17152D]">
                        <Sparkles size={14} className="text-[#7650A8]" />
                        <span>
                          {m.simulatedResult.item || m.simulatedResult.item_name || 'Purchase Evaluation'}
                          {(m.simulatedResult.purchase_amount || m.simulatedResult.amount) ? ` • ₹${Math.round(m.simulatedResult.purchase_amount || m.simulatedResult.amount).toLocaleString('en-IN')}` : ''}
                        </span>
                      </div>
                      {m.simulatedResult.category && (
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                            m.simulatedResult.category === 'AFFORDABLE'
                              ? 'bg-[#E8F8F2] text-[#159B72] border-[#B4E8D6]'
                              : m.simulatedResult.category === 'AFFORDABLE WITH CAUTION'
                              ? 'bg-[#FEF7EC] text-[#8F5805] border-[#FBD9A3]'
                              : 'bg-[#FDF1F2] text-[#E64B55] border-[#F9B8BC]'
                          }`}
                        >
                          {m.simulatedResult.category === 'AFFORDABLE' ? (
                            <CheckCircle2 size={11} />
                          ) : (
                            <AlertTriangle size={11} />
                          )}
                          <span>{m.simulatedResult.category}</span>
                        </span>
                      )}
                    </div>

                    {/* Metric Cards Grid */}
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      {m.simulatedResult.baseline_risk !== undefined && (
                        <div className="p-2.5 rounded-xl bg-[#F7F5FA] border border-[#EAE6F0]">
                          <span className="text-[#77758A] block font-medium text-[11px]">Breach Probability</span>
                          <span className="text-[#17152D] font-bold text-sm tabular-nums">
                            {m.simulatedResult.baseline_risk}% ➔ {m.simulatedResult.simulated_risk}%
                          </span>
                          <span
                            className={`text-[11px] block mt-0.5 font-semibold ${
                              m.simulatedResult.risk_delta > 0 ? 'text-[#E64B55]' : 'text-[#159B72]'
                            }`}
                          >
                            ({m.simulatedResult.risk_delta > 0 ? '+' : ''}{m.simulatedResult.risk_delta}%)
                          </span>
                        </div>
                      )}

                      {m.simulatedResult.horizons?.['30d'] ? (
                        <div className="p-2.5 rounded-xl bg-[#F7F5FA] border border-[#EAE6F0]">
                          <span className="text-[#77758A] block font-medium text-[11px]">30-Day Median Balance</span>
                          <span className="text-[#17152D] font-bold text-sm tabular-nums">
                            ₹{Math.round(m.simulatedResult.horizons['30d'].baseline_p50).toLocaleString('en-IN')} ➔ ₹{Math.round(m.simulatedResult.horizons['30d'].simulated_p50).toLocaleString('en-IN')}
                          </span>
                          <span className="text-[11px] text-[#77758A] block mt-0.5">
                            Buffer: ₹{Math.round(m.simulatedResult.minimum_safe_balance || 5000).toLocaleString('en-IN')}
                          </span>
                        </div>
                      ) : m.simulatedResult.simulated_lowest_balance !== undefined ? (
                        <div className="p-2.5 rounded-xl bg-[#F7F5FA] border border-[#EAE6F0]">
                          <span className="text-[#77758A] block font-medium text-[11px]">Lowest Projected Balance</span>
                          <span className="text-[#17152D] font-bold text-sm tabular-nums">
                            ₹{Math.round(m.simulatedResult.simulated_lowest_balance).toLocaleString('en-IN')}
                          </span>
                          <span className="text-[11px] text-[#77758A] block mt-0.5">
                            Safe limit: ≤ ₹{Math.round(m.simulatedResult.simulated_safe_limit || 0).toLocaleString('en-IN')}/day
                          </span>
                        </div>
                      ) : null}
                    </div>

                    {/* Timing Recommendation Callout */}
                    {m.simulatedResult.timing_recommendation && (
                      <div className="p-2.5 rounded-xl bg-[#F3EDFA] text-[#17152D] text-[11px] border border-[#EAE6F0] flex items-start gap-1.5 font-medium">
                        <Sparkles size={13} className="text-[#7650A8] shrink-0 mt-0.5" />
                        <span>
                          <strong>Alternative Timing:</strong> Deferring {m.simulatedResult.timing_recommendation.suggested_date_desc} reduces breach risk to <strong>{m.simulatedResult.timing_recommendation.delayed_risk}%</strong> (saves {m.simulatedResult.timing_recommendation.risk_reduction}% risk).
                        </span>
                      </div>
                    )}

                    {/* Safe Budget Target Callout */}
                    {m.simulatedResult.suggested_safe_budget && m.simulatedResult.category !== 'AFFORDABLE' && (
                      <div className="p-2.5 rounded-xl bg-[#F7F5FA] text-[#17152D] text-[11px] border border-[#EAE6F0] flex items-start gap-1.5 font-medium">
                        <Info size={13} className="text-[#7650A8] shrink-0 mt-0.5" />
                        <span>
                          <strong>Recommended Safe Budget:</strong> Spending within <strong>₹{Math.round(m.simulatedResult.suggested_safe_budget).toLocaleString('en-IN')}</strong> preserves your safety runway.
                        </span>
                      </div>
                    )}
                  </div>
                )}

                <div className={`text-[10px] mt-1.5 font-medium ${isUser ? 'text-white/80 text-right' : 'text-[#77758A]'}`}>
                  {m.timestamp}
                </div>
              </div>
            </div>
          );
        })}

        {isLoading && (
          <div className="flex items-center space-x-2 text-xs text-[#77758A] pl-2 font-medium">
            <RefreshCw size={14} className="animate-spin text-[#7650A8]" />
            <span>FinOS advisor is analyzing parameters and calculating trajectories...</span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Box Footer */}
      <div className="p-4 border-t border-[#EAE6F0] bg-white">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSendMessage();
          }}
          className="flex items-center space-x-2"
        >
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask about liquidity dips, safe limits, or what-ifs..."
            className="flex-1 min-h-[44px] px-4 py-2.5 rounded-full bg-[#F7F5FA] border border-[#EAE6F0] text-xs text-[#17152D] placeholder-[#77758A] focus:outline-none focus:border-[#7650A8] focus:ring-2 focus:ring-[#F3EDFA] transition-all"
          />
          <button
            type="submit"
            disabled={!input.trim() || isLoading}
            className="min-h-[44px] min-w-[44px] px-4 rounded-full bg-[#7650A8] hover:bg-[#633F94] active:bg-[#52327D] text-white flex items-center justify-center transition-all disabled:opacity-40 cursor-pointer shadow-xs focus:outline-none focus:ring-2 focus:ring-[#7650A8] focus:ring-offset-2"
          >
            <Send size={16} />
          </button>
        </form>
      </div>
    </div>
  );
};
