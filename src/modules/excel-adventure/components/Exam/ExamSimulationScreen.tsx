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
import { EXAM_INTERACTIVE_CONFIGS, InteractiveExperiment, QuestionInteractiveConfig } from '../../data/examInteractiveConfigs';
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

  // Interactive View Tab: 'SIMULATOR' | 'TABLE_LENGKAP'
  const [interactiveTab, setInteractiveTab] = useState<'SIMULATOR' | 'TABLE_LENGKAP'>('SIMULATOR');

  // Currently active experiment
  const [activeExperiment, setActiveExperiment] = useState<InteractiveExperiment | null>(null);

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
  const currentConfig = EXAM_INTERACTIVE_CONFIGS[currentQ.id];

  // Auto-load & uji coba eksperimen pertama setiap kali berganti soal
  useEffect(() => {
    const config = EXAM_INTERACTIVE_CONFIGS[currentQ.id];
    if (config && config.experiments && config.experiments.length > 0) {
      const firstExp = config.experiments[0];
      setActiveExperiment(firstExp);
      setTestFormula(firstExp.formula);
      const res = evaluateFormula(firstExp.formula, NUSANTARA_INITIAL_GRID);
      setTestResult(res);
    } else {
      setActiveExperiment(null);
      setTestFormula('');
      setTestResult(null);
    }
  }, [currentIndex, currentQ.id]);

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

  // Run specific experiment chip
  const handleRunExperiment = (exp: InteractiveExperiment) => {
    setActiveExperiment(exp);
    setTestFormula(exp.formula);
    let clean = exp.formula.trim();
    if (!clean.startsWith('=')) clean = '=' + clean;

    const res = evaluateFormula(clean, NUSANTARA_INITIAL_GRID);
    setTestResult(res);
  };

  // Apply experiment result to answer option
  const handleApplyExperimentToAnswer = (key: string) => {
    handleSelectOption(key);
    if (mobileTab === 'DATASET') {
      setMobileTab('QUESTION');
    }
  };

  // Copy experiment formula to essay sub-field
  const handleCopyExperimentToEssay = (targetLabel?: string) => {
    const label = targetLabel || activeEssaySubLabel || currentQ.essaySubQuestions?.[0]?.label;
    if (!label) return;
    let clean = testFormula.trim();
    if (!clean.startsWith('=')) clean = '=' + clean;
    handleEssaySubChange(label, clean);
    if (mobileTab === 'DATASET') {
      setMobileTab('QUESTION');
    }
  };

  // Test Formula Playground Manual
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

            {/* Banner Panduan Eksperimen Simulator */}
            <div className="bg-gradient-to-r from-cyan-950/60 via-slate-900 to-indigo-950/60 border border-cyan-500/40 rounded-2xl p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs shadow-md">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-cyan-500/20 text-cyan-400 border border-cyan-500/40 flex items-center justify-center shrink-0">
                  <Calculator className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-white font-bold flex items-center gap-1.5">
                    <span>Uji Coba Interaktif Tersedia untuk Soal Ini</span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 font-mono font-bold">
                      {currentConfig?.experiments?.length || 0} Uji Rumus
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-300 mt-0.5">
                    Gunakan panel interaktif di sebelah kanan untuk mencoba rumus dan melihat data sebelum memilih jawaban.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setMobileTab('DATASET')}
                className="md:hidden px-3.5 py-1.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black text-xs flex items-center justify-center gap-1.5 shrink-0 shadow"
              >
                <span>Buka Simulator</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
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

        {/* PANEL KANAN: LIVE INTERACTIVE SIMULATOR & TABLE PT NUSANTARA NIAGA */}
        <section
          className={`md:col-span-5 flex flex-col space-y-4 ${
            mobileTab === 'DATASET' ? 'block' : 'hidden md:flex'
          }`}
        >
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-4 sm:p-5 shadow-xl flex flex-col h-full space-y-3.5">
            {/* Header Konteks Soal Aktif */}
            <div className="bg-gradient-to-r from-cyan-950/70 via-slate-950 to-indigo-950/70 border border-cyan-500/40 rounded-2xl p-3.5 space-y-1.5 shadow-md">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/40">
                  🧪 {currentConfig?.badgeTitle || 'Simulator Soal'}
                </span>
                <span className="text-[10px] font-bold text-slate-400 bg-slate-800/80 px-2 py-0.5 rounded-full border border-slate-700">
                  Soal #{currentQ.id}
                </span>
              </div>
              <div>
                <h3 className="text-xs sm:text-sm font-black text-white leading-tight">
                  {currentConfig?.focusTitle || 'Eksperimen Rumus Excel'}
                </h3>
                <p className="text-[11px] text-slate-300 mt-1 leading-relaxed">
                  {currentConfig?.promptGuide || 'Coba rumus di bawah ini untuk melihat hasil sebelum menjawab soal.'}
                </p>
              </div>
            </div>

            {/* Tab Navigasi Panel Kanan: Simulator Soal vs Tabel Lengkap */}
            <div className="flex items-center gap-2 border-b border-slate-800 pb-2">
              <button
                type="button"
                onClick={() => setInteractiveTab('SIMULATOR')}
                className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                  interactiveTab === 'SIMULATOR'
                    ? 'bg-cyan-500 text-slate-950 font-black shadow'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                }`}
              >
                <Calculator className="w-3.5 h-3.5" />
                <span>Simulator Soal #{currentQ.id}</span>
              </button>
              <button
                type="button"
                onClick={() => setInteractiveTab('TABLE_LENGKAP')}
                className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                  interactiveTab === 'TABLE_LENGKAP'
                    ? 'bg-cyan-500 text-slate-950 font-black shadow'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                }`}
              >
                <Table className="w-3.5 h-3.5" />
                <span>Tabel Lengkap (6 Cabang)</span>
              </button>
            </div>

            {/* KONTEN TAB 1: SIMULATOR SOAL KHUSUS */}
            {interactiveTab === 'SIMULATOR' && (
              <div className="space-y-3 flex-1 flex flex-col overflow-y-auto pr-0.5">
                {/* Pilihan Eksperimen Cepat */}
                {currentConfig && currentConfig.experiments.length > 0 && (
                  <div className="space-y-2 bg-slate-950/80 border border-slate-800 rounded-2xl p-3">
                    <div className="flex items-center justify-between text-[11px] font-black text-cyan-300">
                      <span className="flex items-center gap-1">
                        <Sparkles className="w-3.5 h-3.5 text-cyan-400" /> Coba Rumus Soal Ini:
                      </span>
                      <span className="text-[10px] text-slate-400 font-normal">
                        Klik untuk uji langsung
                      </span>
                    </div>

                    <div className="flex flex-col gap-1.5">
                      {currentConfig.experiments.map((exp, idx) => {
                        const isSelected = activeExperiment?.label === exp.label;
                        return (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => handleRunExperiment(exp)}
                            className={`w-full text-left p-2.5 rounded-xl text-xs font-mono transition flex items-center justify-between border ${
                              isSelected
                                ? 'bg-gradient-to-r from-cyan-950 to-emerald-950 border-cyan-400 text-white font-bold ring-1 ring-cyan-400/50 shadow-md'
                                : 'bg-slate-900/90 border-slate-800 hover:border-slate-700 text-slate-300 hover:text-white'
                            }`}
                          >
                            <span className="flex items-center gap-2">
                              <span className="text-cyan-400 font-bold">🚀</span>
                              <span>{exp.label}</span>
                            </span>
                            <span className="text-[10px] px-2 py-0.5 rounded-md bg-slate-800 text-slate-400 font-sans">
                              {isSelected ? '✓ Diuji' : 'Uji'}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Formula Bar Tester Manual */}
                <div className="bg-slate-950 border border-slate-800 rounded-2xl p-3 space-y-2">
                  <div className="flex items-center justify-between text-[11px] font-bold text-slate-300">
                    <span className="flex items-center gap-1 text-cyan-300 font-black">
                      <Calculator className="w-3.5 h-3.5" /> Formula Bar Simulator:
                    </span>
                    <span className="text-[10px] text-slate-500 font-mono">Dukungan ; atau ,</span>
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
                        placeholder="Contoh: =COUNT(A1:A5)"
                        className="w-full pl-8 pr-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs font-mono focus:outline-none focus:border-cyan-400"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={handleRunTestFormula}
                      className="px-3.5 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black text-xs transition shrink-0 shadow"
                    >
                      Hitung
                    </button>
                  </div>

                  {/* Kotak Hasil Evaluasi & Tindakan Jawaban */}
                  {testResult && (
                    <div className="mt-2.5 p-3 rounded-xl bg-slate-900/95 border border-cyan-500/40 space-y-2 animate-in fade-in">
                      <div className="flex items-center justify-between">
                        <span className="text-slate-400 font-mono text-[11px] font-bold">
                          Hasil Kalkulasi Rumus:
                        </span>
                        <span
                          className={`font-mono font-black text-sm px-2.5 py-0.5 rounded-lg ${
                            testResult.error
                              ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                              : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                          }`}
                        >
                          {testResult.error || (typeof testResult.result === 'number' && testResult.result >= 1000000 ? formatRupiah(testResult.result) : String(testResult.result))}
                        </span>
                      </div>

                      {activeExperiment?.explanation && (
                        <p className="text-[11px] text-slate-300 leading-snug border-t border-slate-800 pt-1.5">
                          💡 <strong>Analisis:</strong> {activeExperiment.explanation}
                        </p>
                      )}

                      {/* Tombol Terapkan ke Jawaban */}
                      <div className="pt-1 flex flex-wrap gap-2">
                        {activeExperiment?.autoFillOptionKey && (
                          <button
                            type="button"
                            onClick={() => handleApplyExperimentToAnswer(activeExperiment.autoFillOptionKey!)}
                            className="px-3 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-black flex items-center gap-1.5 transition shadow"
                          >
                            <CheckCircle className="w-3.5 h-3.5" />
                            <span>Pilih Jawaban Opsi [{activeExperiment.autoFillOptionKey}]</span>
                          </button>
                        )}

                        {currentQ.type === 'ESSAY' && (
                          <button
                            type="button"
                            onClick={() => handleCopyExperimentToEssay(activeExperiment?.targetEssaySubLabel)}
                            className="px-3 py-1.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-black flex items-center gap-1.5 transition shadow"
                          >
                            <Copy className="w-3.5 h-3.5" />
                            <span>Salin Rumus ke Lembar Jawab</span>
                          </button>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* Visual Tabel Simulator (Mini Table Soal atau Tabel Nusantara Berhighlight) */}
                {/* JIKA SOAL MEMILIKI MINI TABLE KHUSUS (Q1, Q2, Q3, Q4, Q6, Q9, Q10, Q18, dll) */}
                {currentConfig?.interactiveMiniTable ? (
                  <div className="flex-1 overflow-x-auto rounded-2xl border border-indigo-800/60 bg-indigo-950/30 p-3 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between pb-2 mb-2 border-b border-indigo-800/50">
                        <span className="text-[11px] font-bold text-indigo-300 flex items-center gap-1.5">
                          <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                          {currentConfig.interactiveMiniTable.caption}
                        </span>
                        <span className="text-[10px] bg-indigo-900/60 text-indigo-300 px-2 py-0.5 rounded-full border border-indigo-700/50">
                          Cuplikan Mandiri Soal #{currentQ.id}
                        </span>
                      </div>
                      <table className="w-full text-xs text-left border-collapse">
                        <thead>
                          <tr className="bg-indigo-900/70 text-indigo-200 border-b border-indigo-700/60 font-black text-[11px]">
                            {currentConfig.interactiveMiniTable.headers.map((colName, idx) => (
                              <th key={idx} className="p-2 border-r border-indigo-800/60 text-center last:border-r-0 whitespace-nowrap">
                                {colName}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-indigo-900/40 font-mono text-[11px]">
                          {currentConfig.interactiveMiniTable.rows.map((rowItem, rIdx) => (
                            <tr key={rIdx} className="hover:bg-indigo-900/30 transition">
                              {rowItem.map((cellVal, cIdx) => (
                                <td
                                  key={cIdx}
                                  className={`p-2 border-r border-indigo-900/40 text-slate-200 last:border-r-0 ${
                                    cIdx === 0
                                      ? 'text-center font-bold text-amber-300 bg-indigo-950/50'
                                      : ''
                                  }`}
                                >
                                  {String(cellVal ?? '')}
                                </td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ) : (
                  /* TABEL NUSANTARA NIAGA DENGAN HIGHLIGHT OTOMATIS SESUAI SOAL */
                  <div className="flex-1 overflow-x-auto rounded-2xl border border-slate-800 bg-slate-950/80">
                    <table className="w-full text-xs text-left border-collapse">
                      <thead>
                        <tr className="bg-emerald-950/80 text-emerald-200 border-b border-emerald-800/60 font-black text-[11px]">
                          <th className="p-2 border-r border-emerald-900 text-center w-8">#</th>
                          {[
                            { col: 'A', label: 'A (Kode)' },
                            { col: 'B', label: 'B (Wilayah)' },
                            { col: 'C', label: 'C (Kategori)' },
                            { col: 'D', label: 'D (Target)' },
                            { col: 'E', label: 'E (Realisasi)' },
                            { col: 'F', label: 'F (Omzet Rp)' },
                          ].map(({ col, label }) => {
                            const isHigh = currentConfig?.highlightCols?.includes(col);
                            return (
                              <th
                                key={col}
                                className={`p-2 border-r border-emerald-900 text-center transition ${
                                  isHigh
                                    ? 'bg-amber-500/25 text-amber-300 font-extrabold ring-1 ring-amber-400/50'
                                    : ''
                                }`}
                              >
                                {label}
                                {isHigh && ' ⭐'}
                              </th>
                            );
                          })}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800 font-mono text-[11px]">
                        {NUSANTARA_COMPANY_DATA.map((row) => {
                          const isRowHigh = currentConfig?.highlightRows?.includes(row.rowNum);
                          return (
                            <tr
                              key={row.rowNum}
                              className={`hover:bg-slate-800/50 transition cursor-pointer ${
                                isRowHigh ? 'bg-amber-500/10' : ''
                              }`}
                              onClick={() => setSelectedCell(`A${row.rowNum}`)}
                            >
                              <td
                                className={`p-2 text-center font-bold border-r border-slate-800 ${
                                  isRowHigh
                                    ? 'bg-amber-950/60 text-amber-300 font-black'
                                    : 'text-slate-500 bg-slate-900/80'
                                }`}
                              >
                                {row.rowNum}
                              </td>

                              {/* A (Kode) */}
                              <td
                                className={`p-2 border-r border-slate-800 font-semibold whitespace-nowrap ${
                                  currentConfig?.highlightCols?.includes('A') ||
                                  currentConfig?.highlightCells?.includes(`A${row.rowNum}`)
                                    ? 'bg-amber-400/20 text-amber-200 font-black ring-1 ring-amber-500/40'
                                    : 'text-white'
                                }`}
                              >
                                {row.kodeTransaksi}
                              </td>

                              {/* B (Wilayah) */}
                              <td
                                className={`p-2 border-r border-slate-800 font-sans ${
                                  currentConfig?.highlightCols?.includes('B') ||
                                  currentConfig?.highlightCells?.includes(`B${row.rowNum}`)
                                    ? 'bg-amber-400/20 text-amber-200 font-black ring-1 ring-amber-500/40'
                                    : 'text-slate-300'
                                }`}
                              >
                                {row.wilayah}
                              </td>

                              {/* C (Kategori) */}
                              <td
                                className={`p-2 border-r border-slate-800 font-sans ${
                                  currentConfig?.highlightCols?.includes('C') ||
                                  currentConfig?.highlightCells?.includes(`C${row.rowNum}`)
                                    ? 'bg-amber-400/20 text-amber-200 font-black ring-1 ring-amber-500/40'
                                    : 'text-slate-300'
                                }`}
                              >
                                {row.kategori}
                              </td>

                              {/* D (Target) */}
                              <td
                                className={`p-2 border-r border-slate-800 text-right font-bold ${
                                  currentConfig?.highlightCols?.includes('D') ||
                                  currentConfig?.highlightCells?.includes(`D${row.rowNum}`)
                                    ? 'bg-amber-400/25 text-amber-100 font-black ring-1 ring-amber-500/50'
                                    : 'text-amber-300'
                                }`}
                              >
                                {row.targetUnit}
                              </td>

                              {/* E (Realisasi) */}
                              <td
                                className={`p-2 border-r border-slate-800 text-right font-bold ${
                                  currentConfig?.highlightCols?.includes('E') ||
                                  currentConfig?.highlightCells?.includes(`E${row.rowNum}`)
                                    ? 'bg-emerald-400/25 text-emerald-100 font-black ring-1 ring-emerald-500/50'
                                    : 'text-emerald-300'
                                }`}
                              >
                                {row.realisasiUnit}
                              </td>

                              {/* F (Omzet Rp) */}
                              <td
                                className={`p-2 text-right font-black whitespace-nowrap ${
                                  currentConfig?.highlightCols?.includes('F') ||
                                  currentConfig?.highlightCells?.includes(`F${row.rowNum}`)
                                    ? 'bg-cyan-400/25 text-cyan-100 font-black ring-1 ring-cyan-500/50'
                                    : 'text-cyan-300'
                                }`}
                              >
                                {formatRupiah(row.totalOmzet)}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}

                {/* Catatan Bantuan Interaktif Soal Ini */}
                <div className="bg-slate-950/70 p-3 rounded-2xl border border-slate-800 text-[11px] text-slate-300 space-y-1.5">
                  <div className="font-bold text-amber-400 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Petunjuk Uji Soal #{currentQ.id}:</span>
                  </div>
                  <p className="text-slate-400 leading-relaxed">
                    {currentConfig?.tipsNote || currentConfig?.promptGuide || 'Gunakan simulator di atas untuk menguji formula sebelum memilih jawaban.'}
                  </p>
                </div>
              </div>
            )}

            {/* KONTEN TAB: 2. TABEL LENGKAP PT NUSANTARA NIAGA */}
            {interactiveTab === 'TABLE_LENGKAP' && (
              <div className="flex-1 flex flex-col min-h-0 space-y-3">
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
                    <HelpCircle className="w-3.5 h-3.5 text-emerald-400" /> Panduan Referensi Sel:
                  </div>
                  <div>• Baris data berada pada baris 2 s.d. 7 (misal Target = D2:D7, Realisasi = E2:E7, Omzet = F2:F7).</div>
                  <div>• Nilai total omzet cabang JKT-06 (baris 7) adalah Rp980.000.000 (outlier).</div>
                </div>
              </div>
            )}
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

