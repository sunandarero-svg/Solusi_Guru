'use client';

import React, { useState } from 'react';
import { BookOpen, ChevronLeft, ChevronRight, Play, Sparkles, X, Lightbulb, Compass } from 'lucide-react';
import { FLASHCARDS_DATA } from '../data/flashcards';
import { EXCEL_LEVELS } from '../data/levels';
import MiniSpreadsheet from './MiniSpreadsheet';
import ExoRobot from './ExoRobot';

interface FlashcardModalProps {
  level: number;
  onClose: () => void;
  onStartLevel: () => void;
}

export default function FlashcardModal({ level, onClose, onStartLevel }: FlashcardModalProps) {
  const [currentLevel, setCurrentLevel] = useState<number>(level);
  const flashcard = FLASHCARDS_DATA[currentLevel] || FLASHCARDS_DATA[1];
  const levelInfo = EXCEL_LEVELS.find((l) => l.level === currentLevel) || EXCEL_LEVELS[0];

  const handlePrev = () => {
    if (currentLevel > 1) {
      setCurrentLevel(currentLevel - 1);
    }
  };

  const handleNext = () => {
    if (currentLevel < 5) {
      setCurrentLevel(currentLevel + 1);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/80 backdrop-blur-md overflow-y-auto animate-in fade-in duration-200">
      <div className="relative w-full max-w-4xl max-h-[92vh] flex flex-col rounded-3xl bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950 border-2 border-emerald-500/50 shadow-2xl overflow-hidden text-white">
        {/* Glow Header Accent */}
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-emerald-400 via-teal-400 to-cyan-400" />

        {/* Modal Top Header */}
        <div className="flex items-center justify-between p-4 sm:p-6 border-b border-emerald-500/20 bg-slate-900/60">
          <div className="flex items-center gap-3">
            <span className="text-3xl sm:text-4xl">{levelInfo.medalIcon}</span>
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-black uppercase tracking-wider border border-emerald-500/30">
                  Flashcard Materi
                </span>
                <span className="text-xs text-slate-400 font-bold">
                  Misi {currentLevel} dari 5
                </span>
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight mt-0.5">
                {flashcard.title}
              </h2>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-2xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
            title="Tutup"
          >
            <X size={20} />
          </button>
        </div>

        {/* Modal Body (Scrollable) */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
          {/* Subtitle & Concept Banner */}
          <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-emerald-950/60 via-slate-900 to-slate-900 border border-emerald-500/30 shadow-inner">
            <h3 className="text-sm font-bold text-emerald-400 flex items-center gap-2 uppercase tracking-wider">
              <Compass size={16} />
              <span>{flashcard.subtitle}</span>
            </h3>
            <p className="text-sm sm:text-base text-slate-200 mt-2 leading-relaxed">
              {flashcard.concept}
            </p>
          </div>

          {/* Key Points */}
          <div>
            <h4 className="text-xs sm:text-sm font-black text-emerald-400 uppercase tracking-wider flex items-center gap-2 mb-3">
              <Sparkles size={16} />
              <span>Poin-Poin Penting Yang Wajib Dipahami</span>
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {flashcard.keyPoints.map((point, idx) => (
                <div
                  key={idx}
                  className="p-3.5 rounded-2xl bg-slate-800/60 border border-slate-700/60 hover:border-emerald-500/40 transition-colors shadow-sm text-xs sm:text-sm text-slate-200 leading-relaxed"
                >
                  {point}
                </div>
              ))}
            </div>
          </div>

          {/* Visual Mini Spreadsheet if available */}
          {flashcard.visualMiniTable && (
            <div>
              <h4 className="text-xs sm:text-sm font-black text-emerald-400 uppercase tracking-wider flex items-center gap-2 mb-2">
                <BookOpen size={16} />
                <span>Contoh Lembar Kerja Visual</span>
              </h4>
              <MiniSpreadsheet data={flashcard.visualMiniTable} />
            </div>
          )}

          {/* Formula Tip & Real World Example */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
            {flashcard.formulaTip && (
              <div className="p-3.5 rounded-2xl bg-amber-950/30 border border-amber-500/40 text-amber-200 text-xs sm:text-sm">
                <div className="font-black text-amber-400 flex items-center gap-1.5 mb-1 text-xs uppercase tracking-wider">
                  <Lightbulb size={14} />
                  <span>Tips Rumus Cepat</span>
                </div>
                <p className="leading-relaxed">{flashcard.formulaTip}</p>
              </div>
            )}
            <div className="p-3.5 rounded-2xl bg-cyan-950/30 border border-cyan-500/40 text-cyan-200 text-xs sm:text-sm">
              <div className="font-black text-cyan-400 flex items-center gap-1.5 mb-1 text-xs uppercase tracking-wider">
                <span>🌍</span>
                <span>Penerapan Nyata</span>
              </div>
              <p className="leading-relaxed">{flashcard.realWorldExample}</p>
            </div>
          </div>

          {/* Robot EXO Insight */}
          <ExoRobot
            mood="HINT"
            message={`Pelajari flashcard ini sebelum menjawab 10 soal di Level ${currentLevel}. Kamu bisa menggunakan tombol PETUNJUK saat kuis jika butuh arahan konsep dariku!`}
          />
        </div>

        {/* Modal Footer Controls */}
        <div className="p-4 sm:p-5 border-t border-emerald-500/20 bg-slate-900/90 flex flex-wrap items-center justify-between gap-3">
          {/* Navigasi Level Flashcard */}
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrev}
              disabled={currentLevel <= 1}
              className="px-4 py-2.5 rounded-2xl bg-slate-800 hover:bg-slate-700 disabled:opacity-40 disabled:hover:bg-slate-800 text-xs sm:text-sm font-bold flex items-center gap-1.5 transition-all active:scale-95"
            >
              <ChevronLeft size={16} />
              <span>SEBELUMNYA</span>
            </button>
            <button
              onClick={handleNext}
              disabled={currentLevel >= 5}
              className="px-4 py-2.5 rounded-2xl bg-slate-800 hover:bg-slate-700 disabled:opacity-40 disabled:hover:bg-slate-800 text-xs sm:text-sm font-bold flex items-center gap-1.5 transition-all active:scale-95"
            >
              <span>BERIKUTNYA</span>
              <ChevronRight size={16} />
            </button>
          </div>

          {/* Tombol Mulai Tantangan Level Ini */}
          <button
            onClick={() => {
              onStartLevel();
            }}
            className="px-6 py-3 rounded-2xl bg-gradient-to-r from-emerald-400 to-teal-400 hover:from-emerald-300 hover:to-teal-300 text-slate-950 text-sm font-black shadow-lg shadow-emerald-500/20 flex items-center gap-2 transition-all active:scale-95"
          >
            <Play size={18} className="fill-slate-950" />
            <span>MULAI TANTANGAN (LEVEL {currentLevel})</span>
          </button>
        </div>
      </div>
    </div>
  );
}
