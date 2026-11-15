'use client';

import React, { useState } from 'react';
import { X, CheckCircle2, XCircle, BookOpen, Filter, Search, Award } from 'lucide-react';
import { EXCEL_QUESTIONS } from '../data/questions';
import { EXCEL_LEVELS } from '../data/levels';
import MiniSpreadsheet from './MiniSpreadsheet';

interface ReviewAllModalProps {
  onClose: () => void;
  userAnswers?: Record<number, { chosenOption: string; isCorrect: boolean; timeSec: number }>;
}

export default function ReviewAllModal({ onClose, userAnswers = {} }: ReviewAllModalProps) {
  const [selectedLevel, setSelectedLevel] = useState<number | 'ALL'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredQuestions = EXCEL_QUESTIONS.filter((q) => {
    const matchLevel = selectedLevel === 'ALL' || q.level === selectedLevel;
    const matchSearch =
      q.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      q.theme.toLowerCase().includes(searchQuery.toLowerCase()) ||
      q.explanation.toLowerCase().includes(searchQuery.toLowerCase());
    return matchLevel && matchSearch;
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/80 backdrop-blur-md overflow-y-auto animate-in fade-in duration-200">
      <div className="relative w-full max-w-5xl max-h-[92vh] flex flex-col rounded-3xl bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950 border-2 border-emerald-500/50 shadow-2xl overflow-hidden text-white">
        {/* Header Bar */}
        <div className="flex items-center justify-between p-4 sm:p-6 border-b border-emerald-500/20 bg-slate-900/80">
          <div className="flex items-center gap-3">
            <span className="p-3 rounded-2xl bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
              <BookOpen size={24} />
            </span>
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-black uppercase tracking-wider">
                  Pembahasan Lengkap
                </span>
                <span className="text-xs text-slate-400 font-bold">50 Butir Soal Terstruktur</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight mt-0.5">
                Kunci Jawaban & Pembahasan Excel Master
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

        {/* Filter and Search Bar */}
        <div className="p-4 sm:px-6 border-b border-slate-800 bg-slate-900/40 flex flex-wrap items-center justify-between gap-3">
          {/* Level Filter Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
            <button
              onClick={() => setSelectedLevel('ALL')}
              className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all ${
                selectedLevel === 'ALL'
                  ? 'bg-emerald-500 text-slate-950 shadow-md'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              Semua (50)
            </button>
            {EXCEL_LEVELS.map((lvl) => (
              <button
                key={lvl.level}
                onClick={() => setSelectedLevel(lvl.level)}
                className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all flex items-center gap-1 whitespace-nowrap ${
                  selectedLevel === lvl.level
                    ? 'bg-emerald-500 text-slate-950 shadow-md'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                }`}
              >
                <span>{lvl.medalIcon}</span>
                <span>Level {lvl.level}</span>
              </button>
            ))}
          </div>

          {/* Search Input */}
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-2.5 text-slate-400" size={15} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari materi atau rumus..."
              className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-slate-800/80 border border-slate-700 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-emerald-500"
            />
          </div>
        </div>

        {/* Question List (Scrollable) */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
          {filteredQuestions.length === 0 ? (
            <div className="py-12 text-center text-slate-400">
              <p className="text-sm">Tidak ada soal yang cocok dengan filter pencarian.</p>
            </div>
          ) : (
            filteredQuestions.map((q) => {
              const userAttempt = userAnswers[q.id];
              const isAnswered = Boolean(userAttempt);
              const isCorrect = userAttempt?.isCorrect;

              return (
                <div
                  key={q.id}
                  className="p-4 sm:p-5 rounded-2xl bg-slate-900/80 border border-slate-700/80 hover:border-emerald-500/40 transition-all shadow-md space-y-3"
                >
                  {/* Question Header */}
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <div className="flex items-center gap-2">
                      <span className="w-7 h-7 rounded-lg bg-emerald-500/20 text-emerald-300 font-black text-xs flex items-center justify-center border border-emerald-500/30">
                        #{q.id}
                      </span>
                      <span className="px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-300 text-[11px] font-bold">
                        Level {q.level} • {q.theme}
                      </span>
                    </div>

                    {/* Status Badge jika sudah dijawab siswa */}
                    {isAnswered && (
                      <div className="flex items-center gap-1.5">
                        {isCorrect ? (
                          <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-black border border-emerald-500/40 flex items-center gap-1">
                            <CheckCircle2 size={13} />
                            <span>Jawaban Anda Benar</span>
                          </span>
                        ) : (
                          <span className="px-2.5 py-0.5 rounded-full bg-rose-500/20 text-rose-300 text-xs font-black border border-rose-500/40 flex items-center gap-1">
                            <XCircle size={13} />
                            <span>Jawaban Anda Salah (Pilih {userAttempt?.chosenOption})</span>
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Question Text */}
                  <h3 className="text-sm sm:text-base font-bold text-white leading-relaxed">
                    {q.question}
                  </h3>

                  {/* Mini Spreadsheet Table if available */}
                  {q.miniTable && (
                    <div className="pt-1">
                      <MiniSpreadsheet data={q.miniTable} />
                    </div>
                  )}

                  {/* Options Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                    {(['A', 'B', 'C', 'D'] as const).map((opt) => {
                      const isCorrectOption = opt === q.correctAnswer;
                      const isStudentChosen = userAttempt?.chosenOption === opt;

                      let optClass = 'bg-slate-800/60 border-slate-700/60 text-slate-300';
                      if (isCorrectOption) {
                        optClass = 'bg-emerald-950/60 border-emerald-500/80 text-emerald-200 font-bold';
                      } else if (isStudentChosen && !isCorrect) {
                        optClass = 'bg-rose-950/60 border-rose-500/80 text-rose-200 line-through';
                      }

                      return (
                        <div
                          key={opt}
                          className={`p-2.5 rounded-xl border text-xs sm:text-sm flex items-start gap-2.5 transition-colors ${optClass}`}
                        >
                          <span
                            className={`w-5 h-5 rounded-md flex-shrink-0 flex items-center justify-center font-black text-xs ${
                              isCorrectOption
                                ? 'bg-emerald-500 text-slate-950'
                                : isStudentChosen
                                ? 'bg-rose-500 text-white'
                                : 'bg-slate-700 text-slate-300'
                            }`}
                          >
                            {opt}
                          </span>
                          <span className="leading-snug">{q.options[opt]}</span>
                        </div>
                      );
                    })}
                  </div>

                  {/* Explanation Card */}
                  <div className="p-3.5 rounded-xl bg-slate-950/80 border border-emerald-500/30 text-xs sm:text-sm leading-relaxed">
                    <span className="font-black text-emerald-400 block mb-1 uppercase tracking-wider text-[11px]">
                      💡 Pembahasan & Konsep:
                    </span>
                    <p className="text-slate-200">{q.explanation}</p>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="p-4 sm:p-5 border-t border-emerald-500/20 bg-slate-900/90 flex items-center justify-between">
          <span className="text-xs text-slate-400">
            Menampilkan {filteredQuestions.length} dari 50 soal
          </span>
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs sm:text-sm transition-all active:scale-95"
          >
            TUTUP PEMBAHASAN
          </button>
        </div>
      </div>
    </div>
  );
}
