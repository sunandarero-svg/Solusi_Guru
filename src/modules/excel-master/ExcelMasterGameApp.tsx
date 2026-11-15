'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  Sparkles,
  Trophy,
  Volume2,
  VolumeX,
  Play,
  ArrowRight,
  RotateCcw,
  BookOpen,
  Award,
  CheckCircle2,
  XCircle,
  HelpCircle,
  Lightbulb,
  FileSpreadsheet,
  Clock,
  User,
  Sliders,
  Maximize2,
  Minimize2,
  ChevronRight,
  ShieldAlert,
  Star,
  Check
} from 'lucide-react';
import { EXCEL_LEVELS } from './data/levels';
import { FLASHCARDS_DATA } from './data/flashcards';
import { EXCEL_QUESTIONS } from './data/questions';
import { ExcelQuestion, ExcelMasterTitle, StudentAnswerState } from './types';
import { soundEffects } from './engine/audio';
import ExoRobot from './components/ExoRobot';
import MiniSpreadsheet from './components/MiniSpreadsheet';
import FlashcardModal from './components/FlashcardModal';
import ReviewAllModal from './components/ReviewAllModal';
import TeacherDashboardModal from './components/TeacherDashboardModal';

interface ExcelMasterGameAppProps {
  userRole?: string;
  userName?: string;
  showStandaloneHeader?: boolean;
}

type ScreenMode = 'SPLASH' | 'MAP' | 'GAMEPLAY' | 'LEVEL_COMPLETED' | 'FINAL_RESULTS';

const LOCAL_STORAGE_KEY = 'excel_master_challenge_save_v1';

export default function ExcelMasterGameApp({
  userRole = 'STUDENT',
  userName = 'Siswa Hebat',
  showStandaloneHeader = false
}: ExcelMasterGameAppProps) {
  // Screen and Flow States
  const [currentScreen, setCurrentScreen] = useState<ScreenMode>('SPLASH');
  const [currentLevel, setCurrentLevel] = useState<number>(1);
  const [currentQuestionIndexInLevel, setCurrentQuestionIndexInLevel] = useState<number>(0);

  // Player Identity State
  const [playerName, setPlayerName] = useState<string>(userName || 'Siswa Hebat');
  const [playerClass, setPlayerClass] = useState<string>('Kelas Siswa');
  const [isEditingPlayer, setIsEditingPlayer] = useState<boolean>(false);

  // Gameplay Scoring & Progress States
  const [totalScore, setTotalScore] = useState<number>(0);
  const [unlockedLevels, setUnlockedLevels] = useState<number[]>([1]);
  const [answeredHistory, setAnsweredHistory] = useState<StudentAnswerState[]>([]);
  const [currentAnswersInLevel, setCurrentAnswersInLevel] = useState<Record<number, 'A' | 'B' | 'C' | 'D'>>({});
  const [selectedOption, setSelectedOption] = useState<'A' | 'B' | 'C' | 'D' | null>(null);
  const [isAnswerSubmitted, setIsAnswerSubmitted] = useState<boolean>(false);
  const [isCurrentAnswerCorrect, setIsCurrentAnswerCorrect] = useState<boolean>(false);
  const [timerSeconds, setTimerSeconds] = useState<number>(0);
  const [isTimerRunning, setIsTimerRunning] = useState<boolean>(false);

  // EXO Mood and Speech
  const [exoMood, setExoMood] = useState<'IDLE' | 'HINT' | 'CORRECT' | 'WRONG' | 'CELEBRATE'>('IDLE');
  const [exoMessage, setExoMessage] = useState<string>(
    'Halo! Aku EXO, asisten AI-mu. Bersiaplah menaklukkan 50 tantangan untuk meraih gelar Excel Grand Master!'
  );

  // Settings & Access Check
  const [isSoundMuted, setIsSoundMuted] = useState<boolean>(false);
  const [isGameLocked, setIsGameLocked] = useState<boolean>(false);
  const [lockReason, setLockReason] = useState<string>('');
  const [hasServerAccess, setHasServerAccess] = useState<boolean>(true);
  const [isTeacherUser, setIsTeacherUser] = useState<boolean>(
    userRole === 'TEACHER' || userRole === 'ADMIN' || userRole === 'PRINCIPAL'
  );

  // Modals
  const [isFlashcardOpen, setIsFlashcardOpen] = useState<boolean>(false);
  const [flashcardLevel, setFlashcardLevel] = useState<number>(1);
  const [isReviewOpen, setIsReviewOpen] = useState<boolean>(false);
  const [isTeacherDashboardOpen, setIsTeacherDashboardOpen] = useState<boolean>(false);

  // Timer Ref
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Load configuration & check access on mount
  useEffect(() => {
    checkServerAccess();
    loadFromLocalStorage();
  }, []);

  // Timer runner during gameplay
  useEffect(() => {
    if (isTimerRunning) {
      timerIntervalRef.current = setInterval(() => {
        setTimerSeconds((prev) => prev + 1);
      }, 1000);
    } else {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    }
    return () => {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    };
  }, [isTimerRunning]);

  const checkServerAccess = async () => {
    try {
      const res = await fetch('/api/excel-master/settings');
      const data = await res.json();
      if (data.success) {
        setIsTeacherUser(!!data.isTeacher);
        if (!data.hasAccess) {
          setHasServerAccess(false);
          setIsGameLocked(true);
          setLockReason(data.accessReason || 'Game sedang tidak dapat diakses saat ini.');
        } else {
          setHasServerAccess(true);
          setIsGameLocked(false);
        }
      }
    } catch (err) {
      console.warn('Could not verify server access, using offline fallback', err);
    }
  };

  const loadFromLocalStorage = () => {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.playerName) setPlayerName(parsed.playerName);
        if (parsed.playerClass) setPlayerClass(parsed.playerClass);
        if (typeof parsed.totalScore === 'number') setTotalScore(parsed.totalScore);
        if (Array.isArray(parsed.unlockedLevels)) setUnlockedLevels(parsed.unlockedLevels);
        if (Array.isArray(parsed.answeredHistory)) setAnsweredHistory(parsed.answeredHistory);
        if (typeof parsed.timerSeconds === 'number') setTimerSeconds(parsed.timerSeconds);
      }
    } catch (e) {
      console.error('Failed to load local storage save:', e);
    }
  };

  const saveToLocalStorageAndSync = (
    newScore: number,
    newUnlocked: number[],
    newHistory: StudentAnswerState[],
    completed: boolean = false
  ) => {
    const saveData = {
      playerName,
      playerClass,
      totalScore: newScore,
      unlockedLevels: newUnlocked,
      answeredHistory: newHistory,
      timerSeconds,
      highestLevel: Math.max(...newUnlocked)
    };

    try {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(saveData));
    } catch (e) {
      console.warn('LocalStorage save failed:', e);
    }

    // Centralized MongoDB sync
    const correctCount = newHistory.filter((h) => h.isCorrect).length;
    const wrongCount = newHistory.length - correctCount;
    const accuracy = newHistory.length > 0 ? (correctCount / newHistory.length) * 100 : 0;
    const titleAwarded = calculateTitle(accuracy, newScore);

    // Compute medals
    const medals: string[] = [];
    if (newUnlocked.includes(2) || newHistory.some((h) => h.level === 1 && h.isCorrect))
      medals.push('Bronze Medal (Pengenalan Excel)');
    if (newUnlocked.includes(3) || newHistory.some((h) => h.level === 2 && h.isCorrect))
      medals.push('Silver Medal (Bagian Excel)');
    if (newUnlocked.includes(4) || newHistory.some((h) => h.level === 3 && h.isCorrect))
      medals.push('Gold Medal (Rumus Dasar)');
    if (newUnlocked.includes(5) || newHistory.some((h) => h.level === 4 && h.isCorrect))
      medals.push('Platinum Medal (Logika & Teks)');
    if (completed || (newUnlocked.includes(5) && newHistory.filter((h) => h.level === 5).length >= 10))
      medals.push('Diamond Medal (Data Analyst)');

    fetch('/api/excel-master/results', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        studentName: playerName,
        className: playerClass,
        highestLevel: Math.max(...newUnlocked),
        unlockedLevels: newUnlocked,
        totalScore: newScore,
        correctCount,
        wrongCount,
        accuracy: Math.round(accuracy * 10) / 10,
        totalTimeSeconds: timerSeconds,
        titleAwarded,
        medals,
        questionHistory: newHistory.map((h) => ({
          questionId: h.questionId,
          level: h.level,
          chosenOption: h.chosenOption,
          correctAnswer:
            EXCEL_QUESTIONS.find((q: ExcelQuestion) => q.id === h.questionId)?.correctAnswer || 'A',
          isCorrect: h.isCorrect,
          timeSec: h.timeSec
        })),
        isCompleted: completed
      })
    }).catch((err) => console.warn('Background result sync failed:', err));
  };

  const userAnswersMap = React.useMemo(() => {
    const map: Record<number, { chosenOption: string; isCorrect: boolean; timeSec: number }> = {};
    answeredHistory.forEach((h) => {
      map[h.questionId] = {
        chosenOption: h.chosenOption,
        isCorrect: h.isCorrect,
        timeSec: h.timeSec
      };
    });
    return map;
  }, [answeredHistory]);

  const calculateTitle = (acc: number, score: number): ExcelMasterTitle => {
    const percent = Math.max(acc, (score / 5000) * 100);
    if (percent >= 90) return 'EXCEL GRAND MASTER';
    if (percent >= 80) return 'EXCEL EXPERT';
    if (percent >= 70) return 'EXCEL ADVANCED';
    if (percent >= 60) return 'EXCEL APPRENTICE';
    return 'EXCEL BEGINNER';
  };

  // Get current questions for the active level
  const currentLevelQuestions = EXCEL_QUESTIONS.filter((q: ExcelQuestion) => q.level === currentLevel);
  const currentQuestion: ExcelQuestion | undefined = currentLevelQuestions[currentQuestionIndexInLevel];

  // Actions
  const handleStartAdventure = () => {
    soundEffects.playClick();
    setCurrentScreen('MAP');
    setExoMood('IDLE');
    setExoMessage(
      `Pilih misimu, ${playerName}! Selesaikan setiap level untuk membuka level berikutnya dan mengumpulkan 5 Medali!`
    );
  };

  const handleSelectLevel = (levelNum: number) => {
    if (!unlockedLevels.includes(levelNum)) {
      soundEffects.playWrong();
      setExoMood('HINT');
      setExoMessage(`Level ${levelNum} masih terkunci! Kamu harus menyelesaikan Level ${levelNum - 1} terlebih dahulu.`);
      return;
    }

    soundEffects.playClick();
    // Offer flashcard preview first
    setFlashcardLevel(levelNum);
    setIsFlashcardOpen(true);
  };

  const handleStartLevelAfterFlashcard = () => {
    setIsFlashcardOpen(false);
    setCurrentLevel(flashcardLevel);
    setCurrentQuestionIndexInLevel(0);
    setSelectedOption(null);
    setIsAnswerSubmitted(false);
    setIsCurrentAnswerCorrect(false);
    setCurrentScreen('GAMEPLAY');
    setIsTimerRunning(true);
    soundEffects.playLevelStart();

    setExoMood('IDLE');
    setExoMessage(`Level ${flashcardLevel} dimulai! Baca soalnya teliti dan gunakan tombol PETUNJUK bila perlu.`);
  };

  const handleSelectOption = (opt: 'A' | 'B' | 'C' | 'D') => {
    if (isAnswerSubmitted) return;
    soundEffects.playClick();
    setSelectedOption(opt);
  };

  const handleSubmitAnswer = () => {
    if (!selectedOption || !currentQuestion || isAnswerSubmitted) return;

    const isCorrect = selectedOption === currentQuestion.correctAnswer;
    setIsAnswerSubmitted(true);
    setIsCurrentAnswerCorrect(isCorrect);

    const questionScore = isCorrect ? 100 : 0;
    const newTotalScore = totalScore + questionScore;
    setTotalScore(newTotalScore);

    // Save answer state
    const newAnswerItem: StudentAnswerState = {
      questionId: currentQuestion.id,
      level: currentLevel,
      chosenOption: selectedOption,
      isCorrect,
      timeSec: timerSeconds
    };
    const updatedHistory = [...answeredHistory.filter((h) => h.questionId !== currentQuestion.id), newAnswerItem];
    setAnsweredHistory(updatedHistory);

    if (isCorrect) {
      soundEffects.playCorrect();
      setExoMood('CORRECT');
      setExoMessage(`LUAR BIASA! Jawabanmu 100% TEPAT! (+100 Poin)`);
    } else {
      soundEffects.playWrong();
      setExoMood('WRONG');
      setExoMessage(
        `Sayang sekali jawabanmu belum tepat. Kunci jawaban adalah (${currentQuestion.correctAnswer}). Pelajari penjelasannya ya!`
      );
    }

    saveToLocalStorageAndSync(newTotalScore, unlockedLevels, updatedHistory, false);
  };

  const handleNextQuestion = () => {
    soundEffects.playClick();

    if (currentQuestionIndexInLevel < 9) {
      // Go to next question in this level
      setCurrentQuestionIndexInLevel((prev) => prev + 1);
      setSelectedOption(null);
      setIsAnswerSubmitted(false);
      setIsCurrentAnswerCorrect(false);
      setExoMood('IDLE');
      setExoMessage(`Tantangan nomor ${currentQuestionIndexInLevel + 2} dari 10. Ayo pertahankan fokusmu!`);
    } else {
      // Level is finished!
      handleFinishLevel();
    }
  };

  const handleFinishLevel = () => {
    soundEffects.playLevelUp();
    setIsTimerRunning(false);

    // Unlock next level
    let newUnlocked = [...unlockedLevels];
    if (currentLevel < 5 && !newUnlocked.includes(currentLevel + 1)) {
      newUnlocked.push(currentLevel + 1);
      setUnlockedLevels(newUnlocked);
    }

    const isAll50Completed = currentLevel === 5;
    saveToLocalStorageAndSync(totalScore, newUnlocked, answeredHistory, isAll50Completed);

    if (isAll50Completed) {
      soundEffects.playFanfare();
      setExoMood('CELEBRATE');
      setExoMessage(
        `SELAMAT BESAR! Kamu telah menyelesaikan seluruh 50 tantangan dan resmi meraih gelar kehormatan!`
      );
      setCurrentScreen('FINAL_RESULTS');
    } else {
      setExoMood('CELEBRATE');
      setExoMessage(
        `SELAMAT! Kamu telah menuntaskan Level ${currentLevel} dan meraih ${
          EXCEL_LEVELS[currentLevel - 1].medalName
        }! Lanjutkan ke level berikutnya!`
      );
      setCurrentScreen('LEVEL_COMPLETED');
    }
  };

  const handleShowHint = () => {
    if (!currentQuestion) return;
    soundEffects.playHint();
    setExoMood('HINT');
    setExoMessage(`💡 PETUNJUK EXO: ${currentQuestion.hint}`);
  };

  const handleReplayGame = () => {
    if (confirm('Mulai petualangan baru dari awal? Skor saat ini akan direset untuk permainan baru.')) {
      soundEffects.playClick();
      setTotalScore(0);
      setUnlockedLevels([1]);
      setAnsweredHistory([]);
      setCurrentLevel(1);
      setCurrentQuestionIndexInLevel(0);
      setSelectedOption(null);
      setIsAnswerSubmitted(false);
      setCurrentScreen('MAP');
      setExoMood('IDLE');
      setExoMessage('Petualangan baru dimulai! Tunjukkan kemampuan terbaikmu!');
      try {
        localStorage.removeItem(LOCAL_STORAGE_KEY);
      } catch (e) {}
    }
  };

  // Compute summary stats
  const totalCorrect = answeredHistory.filter((h) => h.isCorrect).length;
  const totalWrong = answeredHistory.length - totalCorrect;
  const currentAccuracy = answeredHistory.length > 0 ? (totalCorrect / answeredHistory.length) * 100 : 0;
  const currentTitle = calculateTitle(currentAccuracy, totalScore);

  // If game is locked by teacher and user is not teacher
  if (isGameLocked && !isTeacherUser) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-slate-900 border border-rose-500/40 rounded-3xl p-8 text-center shadow-2xl space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-rose-500/20 text-rose-400 mx-auto flex items-center justify-center border border-rose-500/30">
            <ShieldAlert size={32} />
          </div>
          <h2 className="text-xl font-black text-white">Akses Game Dibatasi</h2>
          <p className="text-sm text-slate-300 leading-relaxed">{lockReason}</p>
          <div className="pt-2 text-xs text-slate-500">Hubungi guru pengampu mata pelajaran untuk membuka akses.</div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full min-h-[85vh] bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 text-slate-100 flex flex-col justify-between select-none relative overflow-hidden rounded-3xl border border-slate-800 shadow-2xl">
      {/* Background Glows */}
      <div className="absolute -top-32 -left-32 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* TOP NAV BAR */}
      <div className="relative z-10 px-4 sm:px-6 py-3 border-b border-slate-800/80 bg-slate-950/60 backdrop-blur-md flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center text-white shadow-lg shadow-emerald-950">
            <FileSpreadsheet size={20} />
          </div>
          <div>
            <h1 className="text-sm sm:text-base font-black text-white tracking-tight flex items-center gap-2">
              <span>EXCEL MASTER CHALLENGE</span>
              <span className="hidden sm:inline-block px-2 py-0.2 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-bold border border-emerald-500/30">
                50 Soal • 5 Level
              </span>
            </h1>
            <div className="text-[11px] text-slate-400 flex items-center gap-2">
              <span className="flex items-center gap-1">
                <User size={12} className="text-emerald-400" />
                <span className="font-semibold text-slate-300">{playerName}</span> ({playerClass})
              </span>
              <button
                onClick={() => setIsEditingPlayer(true)}
                className="text-[10px] text-emerald-400 hover:underline"
              >
                Ganti
              </button>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          {/* Total Score Badge */}
          <div className="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-700/80 flex items-center gap-2">
            <Trophy size={15} className="text-amber-400" />
            <div className="text-right">
              <div className="text-[9px] text-slate-400 font-bold uppercase leading-none">Skor Total</div>
              <div className="text-xs sm:text-sm font-black text-emerald-400 leading-none">
                {totalScore} <span className="text-[10px] text-slate-400 font-normal">/ 5000</span>
              </div>
            </div>
          </div>

          {/* Audio FX Toggle */}
          <button
            onClick={() => {
              const nextMute = !isSoundMuted;
              setIsSoundMuted(nextMute);
              soundEffects.setMuted(nextMute);
            }}
            className="w-8 h-8 rounded-xl bg-slate-800 text-slate-300 hover:text-white flex items-center justify-center transition-colors border border-slate-700"
            title={isSoundMuted ? 'Nyalakan Suara' : 'Matikan Suara'}
          >
            {isSoundMuted ? <VolumeX size={15} /> : <Volume2 size={15} />}
          </button>

          {/* Teacher Mode Button (Only for Teachers / Admins) */}
          {isTeacherUser && (
            <button
              onClick={() => setIsTeacherDashboardOpen(true)}
              className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-md transition-all"
            >
              <Sliders size={14} />
              <span className="hidden sm:inline">Panel Guru</span>
            </button>
          )}
        </div>
      </div>

      {/* SCREEN 1: SPLASH SCREEN */}
      {currentScreen === 'SPLASH' && (
        <div className="relative z-10 flex-1 flex flex-col items-center justify-center p-6 text-center max-w-3xl mx-auto space-y-6 animate-in fade-in zoom-in-95 duration-300">
          <ExoRobot mood={exoMood} message={exoMessage} />

          <div className="space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-black border border-emerald-500/30 shadow-inner">
              <Sparkles size={14} />
              <span>GAME EDUKASI INTERAKTIF RESMI</span>
            </div>
            <h2 className="text-3xl sm:text-5xl font-black text-white tracking-tight leading-tight">
              Petualangan Menjadi <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400">
                Ahli Microsoft Excel
              </span>
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 max-w-xl mx-auto leading-relaxed">
              Taklukkan 50 tantangan berpikir kritis, identifikasi formula, pengolahan tabel, logika IF/AND/OR, hingga
              analisis data bersama Robot EXO.
            </p>
          </div>

          {/* 5 Levels Feature Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 w-full pt-2">
            {EXCEL_LEVELS.map((lvl) => (
              <div
                key={lvl.level}
                className="p-3 rounded-2xl bg-slate-900/80 border border-slate-800 text-center space-y-1 hover:border-slate-700 transition-colors"
              >
                <div className="text-lg">{lvl.medalIcon}</div>
                <div className="text-[11px] font-bold text-white truncate">{lvl.name}</div>
                <div className="text-[9px] text-slate-400">{lvl.totalQuestions} Soal</div>
              </div>
            ))}
          </div>

          {/* Start Action */}
          <div className="pt-4 flex flex-col sm:flex-row items-center gap-3 w-full max-w-md">
            <button
              onClick={handleStartAdventure}
              className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-slate-950 font-black text-base tracking-wide shadow-2xl shadow-emerald-500/30 flex items-center justify-center gap-3 transition-transform active:scale-95"
            >
              <Play size={20} className="fill-slate-950" />
              <span>MULAI PETUALANGAN (50 SOAL)</span>
            </button>
          </div>
        </div>
      )}

      {/* SCREEN 2: LEVEL MAP SCREEN */}
      {currentScreen === 'MAP' && (
        <div className="relative z-10 flex-1 p-4 sm:p-8 max-w-4xl mx-auto w-full flex flex-col justify-between space-y-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div>
              <div className="text-xs font-bold text-emerald-400 uppercase tracking-wider">PETA MISI PERJALANAN</div>
              <h2 className="text-2xl font-black text-white">5 Misi Menuju Excel Master</h2>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsReviewOpen(true)}
                className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold flex items-center gap-1.5 border border-slate-700 transition-colors"
              >
                <BookOpen size={14} className="text-emerald-400" />
                <span>Lihat Pembahasan 50 Soal</span>
              </button>
            </div>
          </div>

          <ExoRobot mood={exoMood} message={exoMessage} />

          {/* Level Cards Stack */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-3.5 pt-2">
            {EXCEL_LEVELS.map((lvl) => {
              const isUnlocked = unlockedLevels.includes(lvl.level);
              const levelAnswers = answeredHistory.filter((h) => h.level === lvl.level);
              const correctInLevel = levelAnswers.filter((h) => h.isCorrect).length;
              const isFinished = levelAnswers.length >= 10;

              return (
                <div
                  key={lvl.level}
                  onClick={() => handleSelectLevel(lvl.level)}
                  className={`relative p-5 rounded-3xl border-2 transition-all flex flex-col justify-between cursor-pointer group ${
                    isUnlocked
                      ? 'bg-slate-900/90 border-slate-700 hover:border-emerald-500 shadow-xl hover:shadow-emerald-500/20 active:scale-98'
                      : 'bg-slate-950/60 border-slate-800/80 opacity-60 cursor-not-allowed'
                  }`}
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="w-8 h-8 rounded-2xl bg-slate-800 text-xs font-black text-white flex items-center justify-center border border-slate-700">
                        0{lvl.level}
                      </span>
                      <span className="text-2xl">{lvl.medalIcon}</span>
                    </div>

                    <div>
                      <h3 className="font-black text-white text-base group-hover:text-emerald-300 transition-colors">
                        {lvl.name}
                      </h3>
                      <div className="text-[11px] text-emerald-400 font-bold">{lvl.theme}</div>
                      <p className="text-[10px] text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                        {lvl.description}
                      </p>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-slate-800/80 mt-4 space-y-2">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-slate-400">Progres:</span>
                      <span className="font-bold text-white">
                        {levelAnswers.length}/10 {isFinished && '✅'}
                      </span>
                    </div>

                    {isUnlocked ? (
                      <button className="w-full py-2 rounded-xl bg-emerald-500/20 group-hover:bg-emerald-500 text-emerald-300 group-hover:text-slate-950 font-bold text-xs flex items-center justify-center gap-1 transition-all">
                        <span>{isFinished ? 'Main Lagi' : 'Mulai Level'}</span>
                        <ChevronRight size={14} />
                      </button>
                    ) : (
                      <div className="w-full py-2 rounded-xl bg-slate-800 text-slate-500 font-bold text-xs text-center">
                        Terkunci
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-slate-800/80 text-xs text-slate-400">
            <span>Gelar Saat Ini: <strong className="text-amber-300">{currentTitle}</strong></span>
            <span>Total Benar: <strong className="text-emerald-400">{totalCorrect}</strong> / 50</span>
          </div>
        </div>
      )}

      {/* SCREEN 3: GAMEPLAY SCREEN */}
      {currentScreen === 'GAMEPLAY' && currentQuestion && (
        <div className="relative z-10 flex-1 p-3 sm:p-6 max-w-4xl mx-auto w-full flex flex-col justify-between space-y-4">
          {/* Question Header & Progress Bar */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/30">
                  Level {currentLevel}: {EXCEL_LEVELS[currentLevel - 1].name}
                </span>
                <span className="text-slate-400">
                  Soal <strong className="text-white">{currentQuestionIndexInLevel + 1}</strong> dari 10
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="flex items-center gap-1 text-slate-400">
                  <Clock size={13} />
                  <span>
                    {Math.floor(timerSeconds / 60)}:{(timerSeconds % 60).toString().padStart(2, '0')}
                  </span>
                </span>
                <button
                  onClick={() => setCurrentScreen('MAP')}
                  className="text-[11px] text-slate-400 hover:text-white hover:underline"
                >
                  Peta Level
                </button>
              </div>
            </div>

            {/* Visual Progress Bar */}
            <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 transition-all duration-300"
                style={{ width: `${((currentQuestionIndexInLevel + 1) / 10) * 100}%` }}
              />
            </div>
          </div>

          {/* EXO Avatar Speech */}
          <ExoRobot mood={exoMood} message={exoMessage} />

          {/* Main Question Card */}
          <div className="p-4 sm:p-6 rounded-3xl bg-slate-900/90 border border-slate-700/80 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-emerald-400 uppercase tracking-wide">
                Tantangan #{currentQuestion.id} • {currentQuestion.theme}
              </span>
              <button
                onClick={handleShowHint}
                className="px-3 py-1 rounded-xl bg-amber-500/20 text-amber-300 hover:bg-amber-500/30 border border-amber-500/30 text-xs font-bold flex items-center gap-1.5 transition-all"
              >
                <Lightbulb size={14} />
                <span>Petunjuk</span>
              </button>
            </div>

            <p className="text-base sm:text-lg font-bold text-white leading-relaxed">
              {currentQuestion.question}
            </p>

            {/* Optional Mini Spreadsheet Table */}
            {currentQuestion.miniTable && (
              <div className="pt-1">
                <MiniSpreadsheet data={currentQuestion.miniTable} />
              </div>
            )}

            {/* Optional Formula Example Code Block */}
            {currentQuestion.formulaExample && (
              <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800 font-mono text-xs sm:text-sm text-emerald-300 flex items-center gap-2 overflow-x-auto">
                <span className="text-slate-500 select-none">fx</span>
                <span>{currentQuestion.formulaExample}</span>
              </div>
            )}

            {/* Options Grid (A, B, C, D) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              {(['A', 'B', 'C', 'D'] as const).map((optKey) => {
                const optText = currentQuestion.options[optKey];
                const isSelected = selectedOption === optKey;
                const isCorrectOption = optKey === currentQuestion.correctAnswer;

                let cardStyle = 'bg-slate-800/70 border-slate-700 hover:border-slate-500 text-slate-200';
                if (isAnswerSubmitted) {
                  if (isCorrectOption) {
                    cardStyle = 'bg-emerald-500/25 border-emerald-400 text-emerald-100 shadow-lg shadow-emerald-500/20';
                  } else if (isSelected && !isCorrectOption) {
                    cardStyle = 'bg-rose-500/25 border-rose-500 text-rose-200';
                  } else {
                    cardStyle = 'bg-slate-900/50 border-slate-800 text-slate-500 opacity-60';
                  }
                } else if (isSelected) {
                  cardStyle = 'bg-emerald-500/20 border-emerald-400 text-white shadow-md';
                }

                return (
                  <button
                    key={optKey}
                    onClick={() => handleSelectOption(optKey)}
                    disabled={isAnswerSubmitted}
                    className={`p-4 rounded-2xl border-2 text-left transition-all flex items-start gap-3 active:scale-98 ${cardStyle}`}
                  >
                    <span
                      className={`w-7 h-7 rounded-xl flex items-center justify-center font-black text-xs shrink-0 ${
                        isAnswerSubmitted && isCorrectOption
                          ? 'bg-emerald-500 text-slate-950'
                          : isAnswerSubmitted && isSelected && !isCorrectOption
                          ? 'bg-rose-500 text-white'
                          : isSelected
                          ? 'bg-emerald-500 text-slate-950'
                          : 'bg-slate-700 text-slate-300'
                      }`}
                    >
                      {optKey}
                    </span>
                    <span className="text-xs sm:text-sm font-semibold leading-relaxed pt-0.5">{optText}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Action & Feedback Bar */}
          <div className="space-y-3">
            {isAnswerSubmitted ? (
              <div
                className={`p-4 rounded-2xl border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 animate-in fade-in slide-in-from-bottom-2 ${
                  isCurrentAnswerCorrect
                    ? 'bg-emerald-950/60 border-emerald-500/40 text-emerald-200'
                    : 'bg-rose-950/60 border-rose-500/40 text-rose-200'
                }`}
              >
                <div className="flex items-start gap-2.5">
                  {isCurrentAnswerCorrect ? (
                    <CheckCircle2 size={22} className="text-emerald-400 shrink-0 mt-0.5" />
                  ) : (
                    <XCircle size={22} className="text-rose-400 shrink-0 mt-0.5" />
                  )}
                  <div>
                    <div className="text-xs font-bold uppercase tracking-wider">
                      {isCurrentAnswerCorrect ? 'Jawaban Benar! (+100 Poin)' : 'Jawaban Kurang Tepat'}
                    </div>
                    <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                      {currentQuestion.explanation}
                    </p>
                  </div>
                </div>

                <button
                  onClick={handleNextQuestion}
                  className="w-full sm:w-auto px-6 py-3 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-slate-950 font-black text-sm shrink-0 flex items-center justify-center gap-2 shadow-lg transition-transform active:scale-95"
                >
                  <span>{currentQuestionIndexInLevel === 9 ? 'Selesaikan Level' : 'LANJUTKAN'}</span>
                  <ArrowRight size={16} />
                </button>
              </div>
            ) : (
              <div className="flex items-center justify-end">
                <button
                  onClick={handleSubmitAnswer}
                  disabled={!selectedOption}
                  className="w-full sm:w-auto px-8 py-3.5 rounded-2xl bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-slate-950 font-black text-sm shadow-xl shadow-emerald-500/20 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-all active:scale-95"
                >
                  <Check size={18} />
                  <span>JAWAB SEKARANG</span>
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* SCREEN 4: LEVEL COMPLETED SCREEN */}
      {currentScreen === 'LEVEL_COMPLETED' && (
        <div className="relative z-10 flex-1 p-6 flex flex-col items-center justify-center text-center max-w-xl mx-auto space-y-6 animate-in zoom-in-95 duration-300">
          <ExoRobot mood="CELEBRATE" message={exoMessage} />

          <div className="space-y-2">
            <div className="text-4xl">{EXCEL_LEVELS[currentLevel - 1].medalIcon}</div>
            <h2 className="text-2xl sm:text-3xl font-black text-white">
              {EXCEL_LEVELS[currentLevel - 1].name} Selesai!
            </h2>
            <p className="text-sm text-emerald-400 font-bold">
              Kamu berhasil memperoleh {EXCEL_LEVELS[currentLevel - 1].medalName}!
            </p>
          </div>

          <div className="w-full p-5 rounded-3xl bg-slate-900 border border-slate-700/80 grid grid-cols-3 gap-3">
            <div>
              <div className="text-[10px] text-slate-400 font-semibold uppercase">Skor Akumulasi</div>
              <div className="text-xl font-black text-emerald-400 mt-0.5">{totalScore}</div>
            </div>
            <div>
              <div className="text-[10px] text-slate-400 font-semibold uppercase">Total Benar</div>
              <div className="text-xl font-black text-white mt-0.5">{totalCorrect} / 50</div>
            </div>
            <div>
              <div className="text-[10px] text-slate-400 font-semibold uppercase">Akurasi</div>
              <div className="text-xl font-black text-cyan-400 mt-0.5">{currentAccuracy.toFixed(0)}%</div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-3 w-full">
            <button
              onClick={() => {
                soundEffects.playClick();
                setCurrentScreen('MAP');
              }}
              className="w-full py-3.5 px-6 rounded-2xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-sm transition-colors"
            >
              Kembali ke Peta
            </button>
            {currentLevel < 5 && (
              <button
                onClick={() => {
                  soundEffects.playClick();
                  setFlashcardLevel(currentLevel + 1);
                  setIsFlashcardOpen(true);
                }}
                className="w-full py-3.5 px-6 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-400 text-slate-950 font-black text-sm shadow-xl flex items-center justify-center gap-2"
              >
                <span>Lanjut Level {currentLevel + 1}</span>
                <ArrowRight size={16} />
              </button>
            )}
          </div>
        </div>
      )}

      {/* SCREEN 5: FINAL RESULTS (50 SOAL SELESAI) */}
      {currentScreen === 'FINAL_RESULTS' && (
        <div className="relative z-10 flex-1 p-6 flex flex-col items-center justify-center text-center max-w-2xl mx-auto space-y-6 animate-in zoom-in-95 duration-400">
          <ExoRobot mood="CELEBRATE" message={exoMessage} />

          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-amber-400/20 text-amber-300 font-black text-xs border border-amber-400/40">
              <Award size={15} />
              <span>GELAR KELULUSAN RESMI</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
              {currentTitle}
            </h2>
            <p className="text-xs text-slate-300 max-w-md mx-auto">
              Selamat, {playerName}! Kamu telah menuntaskan seluruh 50 tantangan dan membuktikan kompetensi tinggi
              dalam ekosistem Microsoft Excel!
            </p>
          </div>

          {/* Medals Showcase */}
          <div className="flex items-center justify-center gap-3 flex-wrap">
            {EXCEL_LEVELS.map((lvl) => (
              <div
                key={lvl.level}
                className="p-3 rounded-2xl bg-slate-900 border border-slate-700 text-center flex flex-col items-center gap-1 shadow-lg"
              >
                <span className="text-2xl">{lvl.medalIcon}</span>
                <span className="text-[10px] font-bold text-slate-300">{lvl.medalName}</span>
              </div>
            ))}
          </div>

          {/* Results Summary Box */}
          <div className="w-full p-5 rounded-3xl bg-slate-900/90 border border-slate-700 grid grid-cols-2 sm:grid-cols-4 gap-3 text-left">
            <div className="p-3 rounded-2xl bg-slate-950/60 border border-slate-800">
              <div className="text-[10px] text-slate-400 font-bold uppercase">Total Skor</div>
              <div className="text-xl font-black text-emerald-400 mt-1">{totalScore} / 5000</div>
            </div>
            <div className="p-3 rounded-2xl bg-slate-950/60 border border-slate-800">
              <div className="text-[10px] text-slate-400 font-bold uppercase">Akurasi</div>
              <div className="text-xl font-black text-cyan-400 mt-1">{currentAccuracy.toFixed(1)}%</div>
            </div>
            <div className="p-3 rounded-2xl bg-slate-950/60 border border-slate-800">
              <div className="text-[10px] text-slate-400 font-bold uppercase">Benar / Salah</div>
              <div className="text-xl font-black text-white mt-1">
                {totalCorrect} <span className="text-slate-400 text-xs">/ {totalWrong}</span>
              </div>
            </div>
            <div className="p-3 rounded-2xl bg-slate-950/60 border border-slate-800">
              <div className="text-[10px] text-slate-400 font-bold uppercase">Waktu Selesai</div>
              <div className="text-xl font-black text-amber-400 mt-1">
                {Math.floor(timerSeconds / 60)}m {timerSeconds % 60}s
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row items-center gap-3 w-full max-w-md">
            <button
              onClick={() => setIsReviewOpen(true)}
              className="w-full py-3.5 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm shadow-xl flex items-center justify-center gap-2 transition-all"
            >
              <BookOpen size={16} />
              <span>Lihat Pembahasan Lengkap</span>
            </button>
            <button
              onClick={handleReplayGame}
              className="w-full py-3.5 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-sm flex items-center justify-center gap-2 transition-all"
            >
              <RotateCcw size={16} />
              <span>Main Ulang</span>
            </button>
          </div>
        </div>
      )}

      {/* FOOTER */}
      <div className="relative z-10 px-6 py-3 border-t border-slate-800/60 bg-slate-950/40 flex items-center justify-between text-[11px] text-slate-500">
        <div>Solusi Guru • Excel Master Challenge 50 Soal</div>
        <div>Mendukung Smartboard, Laptop & Smartphone</div>
      </div>

      {/* MODAL 1: FLASHCARD STUDY MODAL */}
      {isFlashcardOpen && (
        <FlashcardModal
          level={flashcardLevel}
          onClose={() => setIsFlashcardOpen(false)}
          onStartLevel={handleStartLevelAfterFlashcard}
        />
      )}

      {/* MODAL 2: REVIEW ALL 50 QUESTIONS */}
      {isReviewOpen && (
        <ReviewAllModal
          userAnswers={userAnswersMap}
          onClose={() => setIsReviewOpen(false)}
        />
      )}

      {/* MODAL 3: TEACHER DASHBOARD */}
      {isTeacherDashboardOpen && (
        <TeacherDashboardModal
          isOpen={isTeacherDashboardOpen}
          onClose={() => setIsTeacherDashboardOpen(false)}
          onConfigUpdated={() => checkServerAccess()}
        />
      )}

      {/* MODAL 4: EDIT PLAYER IDENTITY */}
      {isEditingPlayer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
          <div className="max-w-md w-full bg-slate-900 border border-slate-700 rounded-3xl p-6 space-y-4 shadow-2xl">
            <h3 className="text-lg font-black text-white">Identitas Pemain</h3>
            <div className="space-y-3">
              <div>
                <label className="text-xs font-bold text-slate-300">Nama Siswa / Pemain:</label>
                <input
                  type="text"
                  value={playerName}
                  onChange={(e) => setPlayerName(e.target.value)}
                  className="w-full mt-1 bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2 text-sm text-slate-200 focus:outline-none focus:border-emerald-500"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-300">Kelas:</label>
                <input
                  type="text"
                  value={playerClass}
                  onChange={(e) => setPlayerClass(e.target.value)}
                  className="w-full mt-1 bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2 text-sm text-slate-200 focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => {
                  setIsEditingPlayer(false);
                  saveToLocalStorageAndSync(totalScore, unlockedLevels, answeredHistory, false);
                }}
                className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs"
              >
                Simpan
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
