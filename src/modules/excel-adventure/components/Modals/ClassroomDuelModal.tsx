'use client';

import React, { useState, useEffect } from 'react';
import { X, Trophy, Swords, Zap, RotateCcw, Play, Pause, Check, Volume2 } from 'lucide-react';
import { playSound } from '../../engine/soundEffects';

interface ClassroomDuelModalProps {
  isOpen: boolean;
  onClose: () => void;
  soundEnabled: boolean;
}

const DUEL_QUESTIONS = [
  {
    q: 'Rumus untuk menjumlahkan isi sel dari B2 sampai B8 secara otomatis adalah...',
    a: '=SUM(B2:B8)',
    hint: 'Gunakan fungsi SUM dengan titik dua (:)'
  },
  {
    q: 'Karakter apakah yang WAJIB ditulis pertama kali sebelum rumus Excel?',
    a: 'Tanda Sama Dengan (=)',
    hint: 'Simbol ='
  },
  {
    q: 'Untuk mencari nilai rata-rata dari rentang C1 sampai C10 digunakan fungsi...',
    a: '=AVERAGE(C1:C10)',
    hint: 'Gunakan fungsi AVERAGE'
  },
  {
    q: 'Bagaimana rumus mengalikan isi sel B2 dengan harga di sel C2?',
    a: '=B2*C2',
    hint: 'Operator perkalian adalah tanda bintang (*)'
  },
  {
    q: 'Fungsi untuk mencari nilai tertinggi di antara kumpulan sel adalah...',
    a: '=MAX(...)',
    hint: 'Gunakan fungsi MAX'
  },
  {
    q: 'Jika ingin menghitung banyaknya siswa yang berstatus "Lulus" digunakan fungsi...',
    a: '=COUNTIF(...)',
    hint: 'Gunakan fungsi COUNTIF dengan kriteria "Lulus"'
  }
];

export const ClassroomDuelModal: React.FC<ClassroomDuelModalProps> = ({
  isOpen,
  onClose,
  soundEnabled
}) => {
  const [qIndex, setQIndex] = useState(0);
  const [redScore, setRedScore] = useState(0);
  const [blueScore, setBlueScore] = useState(0);
  const [timerSec, setTimerSec] = useState(30);
  const [timerRunning, setTimerRunning] = useState(false);
  const [showAnswer, setShowAnswer] = useState(false);
  const [buzzedTeam, setBuzzedTeam] = useState<'RED' | 'BLUE' | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    setTimerSec(30);
    setTimerRunning(false);
    setShowAnswer(false);
    setBuzzedTeam(null);
  }, [isOpen, qIndex]);

  useEffect(() => {
    if (!timerRunning || timerSec <= 0) return;
    const interval = setInterval(() => {
      setTimerSec((s) => {
        if (s <= 1) {
          playSound('error', soundEnabled);
          setTimerRunning(false);
          return 0;
        }
        return s - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [timerRunning, timerSec, soundEnabled]);

  if (!isOpen) return null;

  const currentQ = DUEL_QUESTIONS[qIndex] || DUEL_QUESTIONS[0];

  const handleBuzzer = (team: 'RED' | 'BLUE') => {
    if (buzzedTeam) return;
    playSound('buzzer', soundEnabled);
    setBuzzedTeam(team);
    setTimerRunning(false);
  };

  const handleAwardPoint = (team: 'RED' | 'BLUE') => {
    playSound('win', soundEnabled);
    if (team === 'RED') setRedScore((s) => s + 100);
    else setBlueScore((s) => s + 100);
    setShowAnswer(true);
  };

  const handleNextQuestion = () => {
    playSound('click', soundEnabled);
    setQIndex((i) => (i + 1) % DUEL_QUESTIONS.length);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/90 backdrop-blur-md animate-in fade-in">
      <div className="bg-slate-900 border-2 border-amber-500/50 rounded-3xl p-5 sm:p-8 max-w-4xl w-full max-h-[95vh] overflow-y-auto shadow-2xl flex flex-col justify-between">
        {/* Header Duel */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-5">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/20 border border-amber-400/40 flex items-center justify-center text-amber-400">
              <Swords className="w-6 h-6" />
            </div>
            <div>
              <span className="text-[10px] font-black uppercase tracking-wider text-amber-400">
                MODE IFP / SMARTBOARD KELAS
              </span>
              <h3 className="text-xl sm:text-2xl font-black text-white">
                Duel Cerdas Cermat Rumus Excel
              </h3>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Skor & Papan Duel Belah Dua (Split Screen) */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          {/* Tim Merah */}
          <div className={`p-5 rounded-2xl border-2 flex flex-col items-center justify-between transition ${
            buzzedTeam === 'RED'
              ? 'bg-rose-950/80 border-rose-400 scale-102 ring-4 ring-rose-500/50'
              : 'bg-rose-950/30 border-rose-800'
          }`}>
            <span className="text-sm font-black text-rose-300 uppercase tracking-widest">
              🔴 TIM MERAH
            </span>
            <div className="text-4xl sm:text-5xl font-mono font-black text-white my-3">
              {redScore}
            </div>
            <button
              type="button"
              onClick={() => handleBuzzer('RED')}
              disabled={!!buzzedTeam}
              className="w-full min-h-[54px] bg-rose-600 hover:bg-rose-500 disabled:opacity-50 text-white font-black rounded-xl text-sm flex items-center justify-center gap-2 shadow-lg active:scale-95 transition"
            >
              <Zap className="w-5 h-5" /> BUZZER MERAH
            </button>
            {buzzedTeam === 'RED' && (
              <div className="flex gap-2 w-full mt-3">
                <button
                  type="button"
                  onClick={() => handleAwardPoint('RED')}
                  className="flex-1 py-2 bg-emerald-600 text-white font-bold rounded-lg text-xs"
                >
                  Jawaban Benar (+100)
                </button>
              </div>
            )}
          </div>

          {/* Tim Biru */}
          <div className={`p-5 rounded-2xl border-2 flex flex-col items-center justify-between transition ${
            buzzedTeam === 'BLUE'
              ? 'bg-cyan-950/80 border-cyan-400 scale-102 ring-4 ring-cyan-500/50'
              : 'bg-cyan-950/30 border-cyan-800'
          }`}>
            <span className="text-sm font-black text-cyan-300 uppercase tracking-widest">
              🔵 TIM BIRU
            </span>
            <div className="text-4xl sm:text-5xl font-mono font-black text-white my-3">
              {blueScore}
            </div>
            <button
              type="button"
              onClick={() => handleBuzzer('BLUE')}
              disabled={!!buzzedTeam}
              className="w-full min-h-[54px] bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 text-white font-black rounded-xl text-sm flex items-center justify-center gap-2 shadow-lg active:scale-95 transition"
            >
              <Zap className="w-5 h-5" /> BUZZER BIRU
            </button>
            {buzzedTeam === 'BLUE' && (
              <div className="flex gap-2 w-full mt-3">
                <button
                  type="button"
                  onClick={() => handleAwardPoint('BLUE')}
                  className="flex-1 py-2 bg-emerald-600 text-white font-bold rounded-lg text-xs"
                >
                  Jawaban Benar (+100)
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Soal Tantangan & Timer */}
        <div className="bg-slate-950 border border-slate-800 rounded-2xl p-5 mb-6 text-center space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <span className="text-xs font-bold text-slate-400">
              Pertanyaan {qIndex + 1} dari {DUEL_QUESTIONS.length}
            </span>
            <div className="flex items-center gap-2">
              <span className={`text-xl font-mono font-black ${timerSec <= 5 ? 'text-rose-500 animate-ping' : 'text-amber-400'}`}>
                ⏱️ {timerSec}s
              </span>
              <button
                type="button"
                onClick={() => setTimerRunning(!timerRunning)}
                className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-xs font-bold rounded-lg text-white"
              >
                {timerRunning ? 'Jeda' : 'Mulai'}
              </button>
            </div>
          </div>

          <h4 className="text-lg sm:text-2xl font-black text-white leading-relaxed">
            "{currentQ.q}"
          </h4>

          {showAnswer ? (
            <div className="p-3 bg-emerald-950/60 border border-emerald-500/50 rounded-xl text-emerald-300 font-mono text-sm sm:text-base font-bold">
              ✅ Kunci Jawaban: {currentQ.a}
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setShowAnswer(true)}
              className="text-xs text-slate-400 underline hover:text-white"
            >
              Tampilkan Kunci Jawaban
            </button>
          )}
        </div>

        {/* Tombol Kontrol Bawah */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-800">
          <button
            type="button"
            onClick={() => {
              setRedScore(0);
              setBlueScore(0);
            }}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white text-xs font-bold rounded-xl flex items-center gap-1.5"
          >
            <RotateCcw className="w-4 h-4" /> Reset Skor
          </button>

          <button
            type="button"
            onClick={handleNextQuestion}
            className="min-h-[48px] px-6 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black rounded-xl text-sm shadow-md"
          >
            Pertanyaan Berikutnya ➔
          </button>
        </div>
      </div>
    </div>
  );
};
