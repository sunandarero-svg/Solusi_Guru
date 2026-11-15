'use client';

import React from 'react';
import { Bot, Sparkles, Lightbulb, Heart, Award } from 'lucide-react';

export type ExoMood = 'IDLE' | 'HINT' | 'CORRECT' | 'WRONG' | 'CELEBRATE';

interface ExoRobotProps {
  mood?: ExoMood;
  message?: string;
  className?: string;
  showBubble?: boolean;
}

export default function ExoRobot({
  mood = 'IDLE',
  message,
  className = '',
  showBubble = true
}: ExoRobotProps) {
  // Warna dan efek berdasarkan mood
  const getMoodConfig = () => {
    switch (mood) {
      case 'CORRECT':
        return {
          bgBadge: 'bg-emerald-500',
          badgeText: 'Hebat Sekali!',
          icon: <Sparkles className="w-4 h-4 text-amber-300 animate-spin" />,
          eyeClass: 'bg-emerald-400 animate-bounce',
          faceEmoji: '✨',
          bubbleBorder: 'border-emerald-500/50 bg-emerald-950/40 text-emerald-100',
          halo: 'from-emerald-400/30 to-teal-500/10'
        };
      case 'WRONG':
        return {
          bgBadge: 'bg-rose-500',
          badgeText: 'Jangan Menyerah!',
          icon: <Heart className="w-4 h-4 text-white animate-pulse" />,
          eyeClass: 'bg-amber-400',
          faceEmoji: '💡',
          bubbleBorder: 'border-rose-500/50 bg-rose-950/40 text-rose-100',
          halo: 'from-rose-400/30 to-amber-500/10'
        };
      case 'HINT':
        return {
          bgBadge: 'bg-amber-500',
          badgeText: 'Petunjuk EXO',
          icon: <Lightbulb className="w-4 h-4 text-yellow-200 animate-bounce" />,
          eyeClass: 'bg-amber-300 animate-pulse',
          faceEmoji: '🔍',
          bubbleBorder: 'border-amber-500/50 bg-amber-950/40 text-amber-100',
          halo: 'from-amber-400/30 to-yellow-500/10'
        };
      case 'CELEBRATE':
        return {
          bgBadge: 'bg-gradient-to-r from-amber-400 to-yellow-400 text-slate-950',
          badgeText: 'EXCEL MASTER!',
          icon: <Award className="w-4 h-4 text-slate-950 animate-bounce" />,
          eyeClass: 'bg-yellow-300 animate-ping',
          faceEmoji: '👑',
          bubbleBorder: 'border-yellow-400/60 bg-yellow-950/50 text-yellow-100',
          halo: 'from-yellow-400/40 to-amber-500/20'
        };
      default:
        return {
          bgBadge: 'bg-emerald-600',
          badgeText: 'Robot Pemandu',
          icon: <Bot className="w-4 h-4 text-white" />,
          eyeClass: 'bg-cyan-400 animate-pulse',
          faceEmoji: '🤖',
          bubbleBorder: 'border-emerald-500/30 bg-slate-900/80 text-slate-100',
          halo: 'from-emerald-500/20 to-cyan-500/10'
        };
    }
  };

  const config = getMoodConfig();

  return (
    <div className={`flex items-start gap-3 sm:gap-4 ${className}`}>
      {/* Avatar Robot EXO 3D Futuristic */}
      <div className="relative flex-shrink-0 group">
        {/* Glow Halo */}
        <div
          className={`absolute -inset-2 rounded-3xl bg-gradient-to-tr ${config.halo} blur-xl opacity-80 transition-all duration-500`}
        />

        {/* Badan Robot Head Container */}
        <div className="relative w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-gradient-to-b from-slate-700 via-slate-800 to-slate-950 border-2 border-emerald-400/50 p-2 shadow-2xl flex flex-col items-center justify-between overflow-hidden">
          {/* Antena Robot */}
          <div className="absolute -top-1 w-2.5 h-2 rounded-full bg-emerald-400 animate-ping opacity-75" />

          {/* Layar Kaca Wajah Robot */}
          <div className="w-full h-8 sm:h-9 rounded-lg bg-slate-950 border border-emerald-500/40 flex items-center justify-center gap-1.5 px-2 relative overflow-hidden shadow-inner">
            {/* Scanlines Effect */}
            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-emerald-400/5 to-transparent pointer-events-none" />

            {/* Mata Robot Beranimasi */}
            <div className={`w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full ${config.eyeClass} shadow-[0_0_8px_rgba(52,211,153,0.8)]`} />
            <div className={`w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full ${config.eyeClass} shadow-[0_0_8px_rgba(52,211,153,0.8)]`} />
          </div>

          {/* Label Nama Robot */}
          <div className="text-[10px] sm:text-[11px] font-black tracking-widest text-emerald-400 uppercase">
            EXO
          </div>
        </div>
      </div>

      {/* Balon Pesan Dialog EXO */}
      {showBubble && message && (
        <div
          className={`flex-1 relative rounded-2xl p-3.5 sm:p-4 backdrop-blur-md border ${config.bubbleBorder} shadow-xl transition-all duration-300 animate-in fade-in slide-in-from-left-2`}
        >
          {/* Ekor Balon Percakapan */}
          <div className="absolute top-4 -left-2 w-3 h-3 rotate-45 bg-inherit border-l border-b border-inherit" />

          {/* Badge Header Pemandu */}
          <div className="flex items-center gap-2 mb-1.5">
            <span
              className={`px-2 py-0.5 rounded-full text-[10px] sm:text-xs font-black uppercase tracking-wider flex items-center gap-1 ${config.bgBadge}`}
            >
              {config.icon}
              <span>{config.badgeText}</span>
            </span>
            <span className="text-xs text-slate-400 font-bold hidden sm:inline">
              EXO Assistant
            </span>
          </div>

          {/* Isi Pesan */}
          <p className="text-xs sm:text-sm font-medium leading-relaxed">
            {message}
          </p>
        </div>
      )}
    </div>
  );
}
