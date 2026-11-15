'use client';

import React from 'react';
import { 
  MoreHorizontal, 
  Sparkles, 
  TrendingUp, 
  PieChart, 
  FileText, 
  Lightbulb, 
  ArrowUpRight 
} from 'lucide-react';

interface AIAssistantCardProps {
  onOpenChat: (initialPrompt?: string) => void;
}

export const AIAssistantCard: React.FC<AIAssistantCardProps> = ({ onOpenChat }) => {
  const quickActions = [
    { label: 'Smart Insights', prompt: 'Give me smart insights on my overall cash flow and financial health.', icon: Lightbulb },
    { label: 'Expenses Analysis', prompt: 'Analyze my spending breakdown and flag any potential leakage or anomalies.', icon: PieChart },
    { label: 'Cash Flow Forecast', prompt: 'What does my projected balance look like for the next 30 days and when is my next risk window?', icon: TrendingUp },
    { label: 'Auto Reports', prompt: 'Generate an executive financial summary of my monthly income, fixed commitments, and burn rate.', icon: FileText },
  ];

  return (
    <div className="rounded-[24px] border border-[#ECE7F2] bg-white p-6 shadow-[0_8px_30px_rgba(118,80,168,0.05)] w-full flex flex-col justify-between transition-all hover:shadow-[0_12px_36px_rgba(118,80,168,0.08)]">
      {/* Header */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <h3 className="text-base font-bold text-[#17152D] tracking-tight">AI Assistant</h3>
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#F3EDFA] text-[#7650A8] border border-[#EAE6F0]">
              <Sparkles size={10} className="text-[#7650A8]" />
              GEMINI PRO
            </span>
          </div>
          <button 
            type="button"
            className="p-1 rounded-full text-[#77758A] hover:text-[#17152D] hover:bg-[#F3EDFA] transition-colors"
            title="Assistant Options"
          >
            <MoreHorizontal size={18} />
          </button>
        </div>

        {/* 3D Iridescent Orb Graphic (Paynix Style) */}
        <div className="flex flex-col items-center justify-center my-2 text-center">
          <div 
            onClick={() => onOpenChat()}
            className="group relative cursor-pointer my-2 flex items-center justify-center transition-transform hover:scale-105 duration-300"
            title="Click to talk with Ask FinOS"
          >
            {/* Ambient Aura Glow */}
            <div className="absolute w-24 h-24 rounded-full bg-gradient-to-tr from-[#9C27B0]/30 via-[#673AB7]/30 to-[#E91E63]/30 blur-xl group-hover:blur-2xl transition-all duration-500 animate-pulse" />
            
            {/* 3D Glossy Sphere */}
            <div className="relative w-20 h-20 rounded-full shadow-[0_10px_25px_rgba(118,80,168,0.35)] overflow-hidden border border-white/40 flex items-center justify-center bg-gradient-to-tr from-[#311B92] via-[#7B1FA2] to-[#FF4081]">
              {/* Internal Swirl Gradient */}
              <div 
                className="absolute inset-0 opacity-80 mix-blend-overlay"
                style={{
                  background: 'radial-gradient(circle at 35% 30%, rgba(255,255,255,0.9) 0%, rgba(255,200,240,0.5) 20%, rgba(130,70,210,0.4) 50%, rgba(30,10,60,0.9) 100%)'
                }}
              />
              {/* Secondary Specular Highlight */}
              <div 
                className="absolute top-1 left-2 w-10 h-7 rounded-full bg-white/60 blur-[3px] transform -rotate-25 pointer-events-none"
              />
              {/* Bottom Rim Light Reflection */}
              <div 
                className="absolute bottom-1 right-2 w-8 h-4 rounded-full bg-[#00E5FF]/40 blur-[4px] pointer-events-none"
              />

              <Sparkles size={22} className="text-white drop-shadow-md relative z-10 group-hover:rotate-12 transition-transform duration-300" />
            </div>
          </div>

          <h4 className="font-bold text-sm text-[#17152D] mt-2 tracking-tight">
            Your Smart Financial Assistant
          </h4>
          <p className="text-xs text-[#77758A] mt-0.5 max-w-[240px]">
            Real-time cash flow answers powered by Monte Carlo stochastic modeling
          </p>
        </div>
      </div>

      {/* Quick Prompt Chips (2x2 Grid) */}
      <div className="mt-5 grid grid-cols-2 gap-2">
        {quickActions.map((action, idx) => {
          const Icon = action.icon;
          return (
            <button
              key={idx}
              onClick={() => onOpenChat(action.prompt)}
              className="group p-2.5 rounded-2xl bg-[#F7F5FA] hover:bg-[#F3EDFA] border border-[#ECE7F2] hover:border-[#7650A8]/30 transition-all text-left flex items-center justify-between cursor-pointer"
            >
              <div className="flex items-center space-x-2 min-w-0">
                <div className="w-6 h-6 rounded-lg bg-white flex items-center justify-center text-[#7650A8] shadow-2xs group-hover:text-[#523082] transition-colors shrink-0">
                  <Icon size={13} />
                </div>
                <span className="text-[11px] font-semibold text-[#17152D] group-hover:text-[#7650A8] truncate transition-colors">
                  {action.label}
                </span>
              </div>
              <ArrowUpRight size={12} className="text-[#77758A] group-hover:text-[#7650A8] shrink-0 ml-1 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
            </button>
          );
        })}
      </div>
    </div>
  );
};
