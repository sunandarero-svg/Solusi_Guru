import React, { useState, useEffect, useRef } from 'react';
import {
  Clock,
  CheckCircle,
  Flag,
  HelpCircle,
  ChevronLeft,
  ChevronRight,
  Send,
  Table,
  Calculator,
  RotateCcw,
  Sparkles,
  ArrowRight,
  Pause,
  Play,
  Copy,
  AlertTriangle,
  Info
} from 'lucide-react';
import { EXAM_QUESTIONS_DATA, ExamQuestion } from '../../data/examQuestionsData';
import { NUSANTARA_COMPANY_DATA, NUSANTARA_INITIAL_GRID, formatRupiah } from '../../data/nusantaraCompanyData';
import { gradeWholeExam, ExamOverallResult } from '../../engine/examGrader';
import { evaluateFormula } from '../../engine/formulaParser';
import { ExamResultModal } from './ExamResultModal';
import { ExamReviewModal } from './ExamReviewModal';
import { GridData } from '../../types';

interface ExamSimulationScreenProps {
  playerName: string;
  playerClass: string;
  isTeacherUser?: boolean;
  kkmScore?: number;
  onExit: () => void;
  onSaveResult?: (result: ExamOverallResult) => void;
}

export const ExamSimulationScreen: React.FC<ExamSimulationScreenProps> = ({
  playerName,
  playerClass,
  isTeacherUser = false,
  kkmScore = 75,
  onExit,
  onSaveResult
}) => {
  // Current question index (0 to 24)
  const [currentIndex, setCurrentIndex] = useState<number>(0);

  // Student answers: questionId -> string (for MC/TF) or Record<string, string> (for Essay)
  const [answers, setAnswers] = useState<Record<number, any>>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem(`excel_exam_answers_${playerName}`);
        if (saved) return JSON.parse(saved);
      } catch (e) {}
    }
    return {};
  });

  // Flagged questions (ragu-ragu)
  const [flagged, setFlagged] = useState<Record<number, boolean>>({});

  // Mobile active tab: 'QUESTION' | 'DATASET'
  const [mobileTab, setMobileTab] = useState<'QUESTION' | 'DATASET'>('QUESTION');

  // Timer (90 minutes = 5400 seconds)
  const [timeRemaining, setTimeRemaining] = useState<number>(5400);
  const [isTimerPaused, setIsTimerPaused] = useState<boolean>(false);

  // Live Formula Playground in dataset tab
  const [testFormula, setTestFormula] = useState<string>('');
  const [testResult, setTestResult] = useState<{ result?: any; error?: string } | null>(null);
  const [selectedCell, setSelectedCell] = useState<string>('A2');

  // Submit confirmation modal
  const [showSubmitConfirm, setShowSubmitConfirm] = useState<boolean>(false);

  // Final Results
  const [examResult, setExamResult] = useState<ExamOverallResult | null>(null);
  const [showResultModal, setShowResultModal] = useState<boolean>(false);
  const [showReviewModal, setShowReviewModal] = useState<boolean>(false);

  // Active essay input label (to copy formula into)
  const [activeEssaySubLabel, setActiveEssaySubLabel] = useState<string>('');

  // Auto-save answers
  useEffect(() => {
    if (typeof window !== 'undefined' && playerName) {
      try {
        localStorage.setItem(`excel_exam_answers_${playerName}`, JSON.stringify(answers));
      } catch (e) {}
    }
  }, [answers, playerName]);

  // Countdown timer effect
  useEffect(() => {
    if (isTimerPaused || examResult) return;
    const interval = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          handleSubmitExam();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [isTimerPaused, examResult]);

  const currentQ = EXAM_QUESTIONS_DATA[currentIndex];

  // Helper to format time MM:SS
  const formatTimer = (sec: number) => {
    const mins = Math.floor(sec / 60);
    const secs = sec % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Handler for multiple choice & true false
  const handleSelectOption = (val: string) => {
    setAnswers((prev) => ({
      ...prev,
      [currentQ.id]: val
    }));
  };

  // Handler for essay sub questions
  const handleEssaySubChange = (label: string, text: string) => {
    setAnswers((prev) => {
      const currentEssay = (typeof prev[currentQ.id] === 'object' && prev[currentQ.id] !== null)
        ? { ...prev[currentQ.id] }
        : {};
      currentEssay[label] = text;
      return {
        ...prev,
        [currentQ.id]: currentEssay
      };
    });
  };

  // Toggle flag
  const toggleFlag = (qId: number) => {
    setFlagged((prev) => ({
      ...prev,
      [qId]: !prev[qId]
    }));
  };

  // Test Formula Playground
  const handleRunTestFormula = () => {
    if (!testFormula.trim()) return;
    let clean = testFormula.trim();
    if (!clean.startsWith('=')) clean = '=' + clean;

    const res = evaluateFormula(clean, NUSANTARA_INITIAL_GRID);
    setTestResult(res);
  };

  // Copy tested formula into active essay input field
  const handleCopyFormulaToAnswer = (subLabel: string) => {
    if (!testFormula.trim()) return;
    let clean = testFormula.trim();
    if (!clean.startsWith('=')) clean = '=' + clean;

    handleEssaySubChange(subLabel, clean);
    setMobileTab('QUESTION');
  };

  // Submit Exam
  const handleSubmitExam = () => {
    const finalEvaluation = gradeWholeExam(answers, kkmScore);
    setExamResult(finalEvaluation);
    setShowSubmitConfirm(false);
    setShowResultModal(true);

    if (onSaveResult) {
      onSaveResult(finalEvaluation);
    }
  };

  // Count answered
  const answeredCount = EXAM_QUESTIONS_DATA.filter((q) => {
    const a = answers[q.id];
    if (!a) return false;
    if (typeof a === 'string') return a.trim().length > 0;
    if (typeof a === 'object') return Object.values(a).some((v: any) => String(v).trim().length > 0);
    return false;
  }).length;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans select-none">
      {/* TOP BAR / HEADER */}
      <header className="bg-slate-900 border-b border-slate-800 px-4 py-3 sticky top-0 z-40 shadow-lg">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => {
                if (answeredCount > 0 && !examResult) {
                  if (confirm('Apakah Anda yakin ingin keluar dari Simulasi Ujian? Jawaban Anda tetap tersimpan.')) {
                    onExit();
                  }
                } else {
                  onExit();
                }
              }}
              className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs transition border border-slate-700"
            >
              ← Kembali ke Menu
            </button>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  Evaluasi Sumatif
                </span>
                <span className="text-xs text-slate-400 font-semibold hidden sm:inline">
                  {playerName} • {playerClass}
                </span>
              </div>
              <h1 className="text-sm sm:text-base font-black text-white leading-tight">
                Simulasi Ujian: Analisis Data & Rumus Microsoft Excel
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            {/* Timer */}
            <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-mono font-bold ${
              timeRemaining < 600
                ? 'bg-rose-500/20 border-rose-500/40 text-rose-300 animate-pulse'
                : 'bg-slate-800 border-slate-700 text-amber-300'
            }`}>
              <Clock className="w-4 h-4" />
              <span>{formatTimer(timeRemaining)}</span>
              {isTeacherUser && (
                <button
                  type="button"
                  onClick={() => setIsTimerPaused(!isTimerPaused)}
                  className="p-1 hover:text-white"
                  title={isTimerPaused ? 'Lanjutkan Timer' : 'Jeda Timer'}
                >
                  {isTimerPaused ? <Play className="w-3.5 h-3.5 text-emerald-400" /> : <Pause className="w-3.5 h-3.5" />}
                </button>
              )}
            </div>

            {/* Selesai / Kumpulkan */}
            {!examResult && (
              <button
                type="button"
                onClick={() => setShowSubmitConfirm(true)}
                className="px-4 py-2 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 font-black text-xs rounded-xl shadow-lg flex items-center gap-1.5 transition"
              >
                <Send className="w-3.5 h-3.5" /> Kumpulkan Ujian
              </button>
            )}
          </div>
        </div>
      </header>

      {/* MOBILE TAB TOGGLE (Only on smaller screens) */}
      <div className="md:hidden bg-slate-900/90 border-b border-slate-800 px-3 py-2 flex items-center justify-center gap-2">
        <button
          type="button"
          onClick={() => setMobileTab('QUESTION')}
          className={`flex-1 py-2 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 ${
            mobileTab === 'QUESTION'
              ? 'bg-emerald-500 text-slate-950 shadow'
              : 'bg-slate-800 text-slate-300'
          }`}
        >
          📝 Soal & Lembar Jawab ({answeredCount}/25)
        </button>
        <button
          type="button"
          onClick={() => setMobileTab('DATASET')}
          className={`flex-1 py-2 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 ${
            mobileTab === 'DATASET'
              ? 'bg-emerald-500 text-slate-950 shadow'
              : 'bg-slate-800 text-slate-300'
          }`}
        >
          <Table className="w-3.5 h-3.5" /> Tabel PT Nusantara Niaga
        </button>
      </div>

      {/* QUESTION NAVIGATOR PILL BAR */}
      <div className="bg-slate-900/60 border-b border-slate-800/80 px-4 py-2.5 overflow-x-auto">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-1.5 overflow-x-auto py-1 scrollbar-thin">
            {EXAM_QUESTIONS_DATA.map((q, idx) => {
              const ans = answers[q.id];
              let hasAnswer = false;
              if (ans) {
                if (typeof ans === 'string') hasAnswer = ans.trim().length > 0;
                else if (typeof ans === 'object') hasAnswer = Object.values(ans).some((v: any) => String(v).trim().length > 0);
              }
              const isFlag = !!flagged[q.id];
              const isCurrent = idx === currentIndex;

              let pillStyle = 'bg-slate-800 text-slate-300 border-slate-700';
              if (hasAnswer) pillStyle = 'bg-emerald-600 text-white border-emerald-400 font-bold';
              if (isFlag) pillStyle = 'bg-amber-500 text-slate-950 border-amber-300 font-black';
              if (isCurrent) pillStyle += ' ring-2 ring-cyan-400 scale-105';

              return (
                <button
                  key={q.id}
                  type="button"
                  onClick={() => {
                    setCurrentIndex(idx);
                    setMobileTab('QUESTION');
                  }}
                  className={`min-w-[34px] h-[34px] px-2 rounded-xl text-xs flex items-center justify-center transition border relative ${pillStyle}`}
                >
                  {q.id}
                  {isFlag && (
                    <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-yellow-300 rounded-full border border-slate-900" />
                  )}
                </button>
              );
            })}
          </div>

          <div className="text-xs font-bold text-slate-400 whitespace-nowrap hidden lg:block">
            Terjawab: <span className="text-emerald-400">{answeredCount}</span> / 25
          </div>
        </div>
      </div>

      {/* MAIN SPLIT-VIEW AREA */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-3 sm:p-5 grid grid-cols-1 md:grid-cols-12 gap-5 overflow-hidden">
        {/* PANEL KIRI: SOAL & LEMBAR JAWABAN */}
        <section
          className={`md:col-span-7 flex flex-col justify-between space-y-4 ${
            mobileTab === 'QUESTION' ? 'block' : 'hidden md:flex'
          }`}
        >
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-7 shadow-xl space-y-5">
            {/* Header Nomor Soal & Bagian */}
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <span className="px-3 py-1 rounded-xl text-xs font-black bg-gradient-to-r from-emerald-500/20 to-teal-500/20 text-emerald-300 border border-emerald-500/30">
                  {currentQ.partTitle}
                </span>
                <span className="text-xs font-black text-white px-2.5 py-1 rounded-xl bg-slate-800 border border-slate-700">
                  Soal {currentQ.id} dari 25
                </span>
                <span className="text-xs font-bold text-slate-400">
                  ({currentQ.points} Poin)
                </span>
              </div>

              {/* Tombol Ragu-Ragu */}
              <button
                type="button"
                onClick={() => toggleFlag(currentQ.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 border transition ${
                  flagged[currentQ.id]
                    ? 'bg-amber-500 text-slate-950 border-amber-400 font-black shadow'
                    : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-slate-200'
                }`}
              >
                <Flag className="w-3.5 h-3.5" />
                {flagged[currentQ.id] ? 'Ragu-Ragu (Ditandai)' : 'Tandai Ragu'}
              </button>
            </div>

            {/* Teks Soal */}
            <div className="text-sm sm:text-base text-slate-100 font-medium leading-relaxed whitespace-pre-line bg-slate-950/60 p-4 rounded-2xl border border-slate-800/80">
              {currentQ.question}
            </div>

            {/* Form Jawaban Berdasarkan Tipe Soal */}
            {/* TIPE 1: PILIHAN GANDA (1 s.d. 10) */}
            {currentQ.type === 'MULTIPLE_CHOICE' && (
              <div className="space-y-2.5 pt-2">
                <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  Pilih satu jawaban yang paling tepat:
                </div>
                <div className="grid grid-cols-1 gap-2.5">
                  {currentQ.options?.map((opt) => {
                    const isSelected = answers[currentQ.id] === opt.key;
                    return (
                      <button
                        key={opt.key}
                        type="button"
                        onClick={() => handleSelectOption(opt.key)}
                        className={`w-full text-left p-3.5 rounded-2xl border-2 transition flex items-center gap-3.5 text-xs sm:text-sm ${
                          isSelected
                            ? 'bg-emerald-500/20 border-emerald-400 text-white font-bold shadow-md'
                            : 'bg-slate-950/60 border-slate-800/80 hover:border-slate-700 text-slate-300'
                        }`}
                      >
                        <span
                          className={`w-7 h-7 rounded-xl flex items-center justify-center font-black text-xs shrink-0 transition ${
                            isSelected
                              ? 'bg-emerald-500 text-slate-950 shadow'
                              : 'bg-slate-800 text-slate-300 border border-slate-700'
                          }`}
                        >
                          {opt.key}
                        </span>
                        <span className="leading-snug">{opt.text}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* TIPE 2: BENAR / SALAH (11 s.d. 20) */}
            {currentQ.type === 'TRUE_FALSE' && (
              <div className="space-y-3 pt-3">
                <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  Tentukan kebenaran pernyataan di atas:
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <button
                    type="button"
                    onClick={() => handleSelectOption('BENAR')}
                    className={`py-5 px-4 rounded-2xl border-2 transition flex flex-col items-center justify-center gap-2 ${
                      answers[currentQ.id] === 'BENAR'
                        ? 'bg-emerald-500/25 border-emerald-400 text-emerald-300 font-black shadow-lg scale-102'
                        : 'bg-slate-950/70 border-slate-800 hover:border-emerald-500/50 text-slate-300'
                    }`}
                  >
                    <CheckCircle className="w-8 h-8 text-emerald-400" />
                    <span className="text-base font-black">BENAR</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleSelectOption('SALAH')}
                    className={`py-5 px-4 rounded-2xl border-2 transition flex flex-col items-center justify-center gap-2 ${
                      answers[currentQ.id] === 'SALAH'
                        ? 'bg-rose-500/25 border-rose-400 text-rose-300 font-black shadow-lg scale-102'
                        : 'bg-slate-950/70 border-slate-800 hover:border-rose-500/50 text-slate-300'
                    }`}
                  >
                    <AlertTriangle className="w-8 h-8 text-rose-400" />
                    <span className="text-base font-black">SALAH</span>
                  </button>
                </div>
              </div>
            )}

            {/* TIPE 3: ESSAY / STUDI KASUS (21 s.d. 25) */}
            {currentQ.type === 'ESSAY' && (
              <div className="space-y-4 pt-2">
                <div className="flex items-center justify-between">
                  <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                    Lembar Isian Jawaban & Penulisan Rumus:
                  </div>
                  <span className="text-[11px] text-cyan-400 font-semibold flex items-center gap-1">
                    <Info className="w-3.5 h-3.5" /> Gunakan tabel PT Nusantara Niaga di sebelah kanan
                  </span>
                </div>

                <div className="space-y-3.5">
                  {currentQ.essaySubQuestions?.map((sub, idx) => {
                    const currentVal = answers[currentQ.id]?.[sub.label] || '';
                    const isFocus = activeEssaySubLabel === sub.label;

                    return (
                      <div
                        key={idx}
                        className={`bg-slate-950/90 border rounded-2xl p-3.5 space-y-2 transition ${
                          isFocus ? 'border-cyan-400 ring-1 ring-cyan-400/40 shadow-lg' : 'border-slate-800'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <label className="text-xs font-black text-emerald-300">
                            {sub.label}
                          </label>
                          <div className="flex items-center gap-2">
                            <span className="text-[11px] font-mono text-slate-400 font-bold">
                              Bobot: {sub.points} Poin
                            </span>
                            {testFormula && (
                              <button
                                type="button"
                                onClick={() => handleCopyFormulaToAnswer(sub.label)}
                                className="px-2 py-0.5 rounded-md bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 text-[10px] font-bold border border-cyan-500/40 flex items-center gap-1"
                                title="Salin rumus yang sedang diuji di Formula Bar ke kotak ini"
                              >
                                <Copy className="w-3 h-3" /> Salin Rumus Uji
                              </button>
                            )}
                          </div>
                        </div>

                        <p className="text-[11px] text-slate-300 leading-snug">
                          {sub.prompt}
                        </p>

                        <input
                          type="text"
                          value={currentVal}
                          onFocus={() => setActiveEssaySubLabel(sub.label)}
                          onChange={(e) => handleEssaySubChange(sub.label, e.target.value)}
                          placeholder={sub.placeholder}
                          className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs font-mono placeholder:text-slate-600 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400"
                        />
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Navigasi Bawah (Sebelumnya & Selanjutnya) */}
          <div className="flex items-center justify-between pt-2">
            <button
              type="button"
              disabled={currentIndex <= 0}
              onClick={() => setCurrentIndex((prev) => Math.max(0, prev - 1))}
              className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs flex items-center gap-1.5 disabled:opacity-40 border border-slate-700 transition"
            >
              <ChevronLeft className="w-4 h-4" /> Soal Sebelumnya
            </button>

            <span className="text-xs text-slate-400 font-semibold hidden sm:inline">
              Nomor {currentIndex + 1} dari {EXAM_QUESTIONS_DATA.length}
            </span>

            <button
              type="button"
              disabled={currentIndex >= EXAM_QUESTIONS_DATA.length - 1}
              onClick={() => setCurrentIndex((prev) => Math.min(EXAM_QUESTIONS_DATA.length - 1, prev + 1))}
              className="px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs flex items-center gap-1.5 disabled:opacity-40 transition shadow-md"
            >
              Soal Selanjutnya <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </section>

        {/* PANEL KANAN: LIVE INTERACTIVE TABLE PT NUSANTARA NIAGA */}
        <section
          className={`md:col-span-5 flex flex-col space-y-4 ${
            mobileTab === 'DATASET' ? 'block' : 'hidden md:flex'
          }`}
        >
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-4 sm:p-5 shadow-xl flex flex-col h-full space-y-4">
            {/* Header Panel Dataset */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider text-cyan-400">
                  Dataset Resmi Kasus
                </span>
                <h3 className="text-sm font-black text-white flex items-center gap-1.5 mt-0.5">
                  <Table className="w-4 h-4 text-cyan-400" /> PT Nusantara Niaga (Baris 2–7)
                </h3>
              </div>
              <span className="text-[10px] font-bold text-slate-400 bg-slate-800 px-2.5 py-1 rounded-full border border-slate-700">
                6 Cabang
              </span>
            </div>

            {/* Live Formula Bar / Simulator Pengujian Rumus */}
            <div className="bg-slate-950 border border-slate-800 rounded-2xl p-3 space-y-2">
              <div className="flex items-center justify-between text-[11px] font-bold text-slate-300">
                <span className="flex items-center gap-1 text-cyan-300">
                  <Calculator className="w-3.5 h-3.5" /> Uji Coba Rumus Langsung (Live):
                </span>
                <span className="text-[10px] text-slate-500">Gunakan ; atau ,</span>
              </div>

              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <span className="absolute left-2.5 top-2 text-slate-500 font-mono text-xs font-black">
                    fx
                  </span>
                  <input
                    type="text"
                    value={testFormula}
                    onChange={(e) => setTestFormula(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleRunTestFormula()}
                    placeholder="Contoh: =SUMIFS(F2:F7; B2:B7; &quot;Kalimantan&quot;)"
                    className="w-full pl-8 pr-3 py-1.5 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs font-mono focus:outline-none focus:border-cyan-400"
                  />
                </div>
                <button
                  type="button"
                  onClick={handleRunTestFormula}
                  className="px-3 py-1.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black text-xs transition shrink-0"
                >
                  Hitung
                </button>
              </div>

              {/* Hasil Kalkulasi Uji Coba */}
              {testResult && (
                <div className="mt-2 p-2 rounded-xl bg-slate-900/90 border border-slate-700 text-xs flex items-center justify-between">
                  <span className="text-slate-400 font-mono text-[11px]">Hasil Evaluasi:</span>
                  <span
                    className={`font-mono font-bold text-xs ${
                      testResult.error ? 'text-rose-400' : 'text-emerald-400 font-black'
                    }`}
                  >
                    {testResult.error || String(testResult.result)}
                  </span>
                </div>
              )}
            </div>

            {/* Tabel Spreadsheet Interaktif PT Nusantara Niaga */}
            <div className="flex-1 overflow-x-auto rounded-2xl border border-slate-800 bg-slate-950/80">
              <table className="w-full text-xs text-left border-collapse">
                <thead>
                  <tr className="bg-emerald-950/80 text-emerald-200 border-b border-emerald-800/60 font-black text-[11px]">
                    <th className="p-2 border-r border-emerald-900 text-center w-8">#</th>
                    <th className="p-2 border-r border-emerald-900 text-center">A (Kode)</th>
                    <th className="p-2 border-r border-emerald-900 text-center">B (Wilayah)</th>
                    <th className="p-2 border-r border-emerald-900 text-center">C (Kategori)</th>
                    <th className="p-2 border-r border-emerald-900 text-center">D (Target)</th>
                    <th className="p-2 border-r border-emerald-900 text-center">E (Realisasi)</th>
                    <th className="p-2 text-center">F (Omzet Rp)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800 font-mono text-[11px]">
                  {NUSANTARA_COMPANY_DATA.map((row) => (
                    <tr
                      key={row.rowNum}
                      className="hover:bg-slate-800/50 transition cursor-pointer"
                      onClick={() => setSelectedCell(`A${row.rowNum}`)}
                    >
                      <td className="p-2 text-center font-bold text-slate-500 bg-slate-900/80 border-r border-slate-800">
                        {row.rowNum}
                      </td>
                      <td className="p-2 border-r border-slate-800 font-semibold text-white whitespace-nowrap">
                        {row.kodeTransaksi}
                      </td>
                      <td className="p-2 border-r border-slate-800 text-slate-300 font-sans">
                        {row.wilayah}
                      </td>
                      <td className="p-2 border-r border-slate-800 text-slate-300 font-sans">
                        {row.kategori}
                      </td>
                      <td className="p-2 border-r border-slate-800 text-right text-amber-300 font-bold">
                        {row.targetUnit}
                      </td>
                      <td className="p-2 border-r border-slate-800 text-right text-emerald-300 font-bold">
                        {row.realisasiUnit}
                      </td>
                      <td className="p-2 text-right font-black text-cyan-300 whitespace-nowrap">
                        {formatRupiah(row.totalOmzet)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Quick Helper / Info Sel */}
            <div className="bg-slate-950/60 p-3 rounded-2xl border border-slate-800/80 text-[11px] text-slate-400 space-y-1 leading-relaxed">
              <div className="font-bold text-slate-300 flex items-center gap-1">
                <HelpCircle className="w-3 h-3 text-emerald-400" /> Panduan Referensi Sel:
              </div>
              <div>• Baris data berada pada baris 2 s.d. 7 (misal Target = D2:D7, Realisasi = E2:E7, Omzet = F2:F7).</div>
              <div>• Nilai total omzet cabang JKT-06 (baris 7) adalah Rp980.000.000 (outlier).</div>
            </div>
          </div>
        </section>
      </main>

      {/* MODAL KONFIRMASI PENGUMPULAN UJIAN */}
      {showSubmitConfirm && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border-2 border-slate-800 rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4 text-center">
            <div className="w-16 h-16 rounded-2xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 flex items-center justify-center mx-auto">
              <Send className="w-8 h-8" />
            </div>

            <h3 className="text-xl font-black text-white">Kumpulkan Lembar Ujian?</h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              Pastikan Anda telah memeriksa kembali seluruh jawaban pilihan ganda, benar/salah, dan studi kasus.
            </p>

            <div className="bg-slate-950 p-3.5 rounded-2xl border border-slate-800 grid grid-cols-2 gap-2 text-xs">
              <div className="text-left">
                <div className="text-slate-400 font-medium">Soal Terjawab:</div>
                <div className="text-base font-black text-emerald-400">{answeredCount} / 25</div>
              </div>
              <div className="text-left">
                <div className="text-slate-400 font-medium">Ditandai Ragu:</div>
                <div className="text-base font-black text-amber-400">{Object.values(flagged).filter(Boolean).length} Soal</div>
              </div>
            </div>

            <div className="flex gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setShowSubmitConfirm(false)}
                className="flex-1 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs border border-slate-700 transition"
              >
                Cek Lagi
              </button>
              <button
                type="button"
                onClick={handleSubmitExam}
                className="flex-1 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs shadow-lg transition"
              >
                Ya, Kumpulkan Sekarang
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL HASIL NILAI */}
      {showResultModal && examResult && (
        <ExamResultModal
          result={examResult}
          onReview={() => {
            setShowResultModal(false);
            setShowReviewModal(true);
          }}
          onRetake={() => {
            setAnswers({});
            setFlagged({});
            setExamResult(null);
            setShowResultModal(false);
            setTimeRemaining(5400);
            setCurrentIndex(0);
          }}
          onClose={() => {
            setShowResultModal(false);
            onExit();
          }}
        />
      )}

      {/* MODAL REVIEW & PEMBAHASAN 25 SOAL */}
      {showReviewModal && examResult && (
        <ExamReviewModal
          result={examResult}
          onClose={() => setShowReviewModal(false)}
        />
      )}
    </div>
  );
};

