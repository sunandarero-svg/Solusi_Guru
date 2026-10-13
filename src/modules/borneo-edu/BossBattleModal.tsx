"use client";

import React, { useState, useEffect } from 'react';
import { QuestionItem, PlayerState } from './types';
import { sound } from './audio';
import { WORLD_DEFINITIONS } from './defaultQuestions';

interface BossBattleModalProps {
  worldNumber: number;
  levelNumber: number;
  playerState: PlayerState;
  bossQuestions: QuestionItem[];
  backupQuestions: QuestionItem[];
  onBossDefeated: (totalScoreGained: number, totalCoinsGained: number) => void;
  onPlayerDamage: () => void;
  onGameOver: () => void;
  onUseHintFlower: () => void;
  onClose: () => void;
}

export default function BossBattleModal({
  worldNumber,
  levelNumber,
  playerState,
  bossQuestions,
  backupQuestions,
  onBossDefeated,
  onPlayerDamage,
  onGameOver,
  onUseHintFlower,
  onClose
}: BossBattleModalProps) {
  const isFinalBoss = levelNumber === 25;
  const maxBossHp = isFinalBoss ? 5 : 3;
  const [bossHp, setBossHp] = useState(maxBossHp);
  const [currentStageIdx, setCurrentStageIdx] = useState(0);
  const [activeQuestion, setActiveQuestion] = useState<QuestionItem | null>(null);
  const [timeLeft, setTimeLeft] = useState(30);
  const [isAnswered, setIsAnswered] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [bossShaking, setBossShaking] = useState(false);
  const [eliminatedOptions, setEliminatedOptions] = useState<string[]>([]);
  const [usedHint, setUsedHint] = useState(false);
  const [scoreAccumulated, setScoreAccumulated] = useState(0);
  const [coinsAccumulated, setCoinsAccumulated] = useState(0);
  const [isDefeatedState, setIsDefeatedState] = useState(false);

  const worldDef = WORLD_DEFINITIONS.find((w) => w.id === worldNumber) || WORLD_DEFINITIONS[0];

  // Set active question when stage changes
  useEffect(() => {
    sound.playBossAlert();
    const q = bossQuestions[currentStageIdx] || bossQuestions[0];
    setActiveQuestion(q);
    setTimeLeft(30);
    setIsAnswered(false);
    setSelectedOption(null);
    setEliminatedOptions([]);
    setUsedHint(false);
  }, [currentStageIdx, bossQuestions]);

  // Timer
  useEffect(() => {
    if (isAnswered || isDefeatedState) return;

    if (timeLeft <= 0) {
      handleTimeUp();
      return;
    }

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          handleTimeUp();
          return 0;
        }
        if (prev <= 6) {
          sound.playTick(true);
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft, isAnswered, isDefeatedState]);

  const handleTimeUp = () => {
    if (isAnswered || !activeQuestion) return;
    setIsAnswered(true);
    setIsCorrect(false);
    sound.playWrong();
    handleWrongPenalty();
  };

  const handleSelectOption = (optKey: 'A' | 'B' | 'C' | 'D') => {
    if (isAnswered || !activeQuestion) return;

    setSelectedOption(optKey);
    setIsAnswered(true);
    const correct = optKey === activeQuestion.correctAnswer;
    setIsCorrect(correct);

    if (correct) {
      sound.playCorrect();
      setBossShaking(true);
      setTimeout(() => setBossShaking(false), 600);

      const newHp = bossHp - 1;
      setBossHp(newHp);

      // Points for this stage
      let stagePts = 100;
      if (isFinalBoss) {
        if (currentStageIdx === 0) stagePts = 100; // Q1 Pengetahuan
        else if (currentStageIdx === 1) stagePts = 100; // Q2 Pemahaman
        else if (currentStageIdx === 2) stagePts = 150; // Q3 Penerapan
        else if (currentStageIdx === 3) stagePts = 150; // Q4 Analisis
        else if (currentStageIdx === 4) stagePts = 200; // Q5 HOTS
      } else {
        stagePts = currentStageIdx === 0 ? 50 : currentStageIdx === 1 ? 80 : 120;
      }

      if (playerState.starBoostCount > 0) {
        stagePts *= 2;
      }

      setScoreAccumulated((prev) => prev + stagePts);

      if (newHp <= 0) {
        // Boss Defeated!
        setIsDefeatedState(true);
        sound.playBossDefeated();
        const bonusPts = isFinalBoss ? 0 : 100;
        const bonusCoins = isFinalBoss ? 100 : 50;
        setCoinsAccumulated((prev) => prev + bonusCoins);
        setScoreAccumulated((prev) => prev + bonusPts);
      }
    } else {
      sound.playWrong();
      handleWrongPenalty();
    }
  };

  const handleWrongPenalty = () => {
    onPlayerDamage();
    if (playerState.lives <= 1 && !playerState.shieldActive && playerState.powerUps.shield <= 0) {
      // Player will die
      onGameOver();
    }
  };

  const handleNextStageOrRetry = () => {
    if (isDefeatedState) {
      onBossDefeated(scoreAccumulated, coinsAccumulated);
      return;
    }

    if (isCorrect) {
      // Advance to next stage
      setCurrentStageIdx((prev) => prev + 1);
    } else {
      // Pick a backup question for this stage
      const backupQ = backupQuestions.find((b) => b.isBossQuestion) || activeQuestion;
      if (backupQ) {
        setActiveQuestion(backupQ);
      }
      setTimeLeft(30);
      setIsAnswered(false);
      setSelectedOption(null);
      setEliminatedOptions([]);
      setUsedHint(false);
    }
  };

  const handleTriggerHint = () => {
    if (usedHint || playerState.powerUps.hintFlower <= 0 || isAnswered || !activeQuestion) return;

    const allKeys: ('A' | 'B' | 'C' | 'D')[] = ['A', 'B', 'C', 'D'];
    const wrongKeys = allKeys.filter((k) => k !== activeQuestion.correctAnswer);
    const toEliminate = wrongKeys.slice(0, 2);

    setEliminatedOptions(toEliminate);
    setUsedHint(true);
    sound.playPowerUp();
    onUseHintFlower();
  };

  const bossAvatars = ['🌳', '🌋', '🐙', '🦁', '👑'];
  const bossAvatar = bossAvatars[(worldNumber - 1) % bossAvatars.length] || '👑';

  const timerPerc = Math.max(0, Math.min(100, (timeLeft / 30) * 100));

  return (
    <div className="fixed inset-0 z-[100000] flex items-center justify-center p-2 sm:p-4 bg-slate-950/90 backdrop-blur-lg animate-in fade-in duration-300 overflow-y-auto">
      <div className="bg-gradient-to-b from-slate-900 via-indigo-950 to-slate-950 border-3 border-purple-500/50 rounded-3xl max-w-2xl w-full p-4 sm:p-8 max-h-[92vh] overflow-y-auto shadow-2xl relative text-white">
        {/* Glow */}
        <div className="absolute top-0 right-0 w-80 h-80 bg-purple-600/15 rounded-full blur-3xl pointer-events-none"></div>

        {/* Top Boss Profile Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-purple-500/20 mb-6">
          <div className="flex items-center gap-4">
            <div className={`w-16 h-16 rounded-2xl bg-purple-900/60 border-2 border-purple-400 flex items-center justify-center text-4xl shadow-lg ${
              bossShaking ? 'animate-bounce text-red-500' : ''
            }`}>
              {bossAvatar}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full bg-purple-500/20 text-purple-300 text-[10px] font-black uppercase tracking-wider border border-purple-500/40">
                  {isFinalBoss ? 'FINAL BOSS LEVEL 25' : `WORLD ${worldNumber} BOSS`}
                </span>
                <span className="text-xs text-slate-400 font-bold">
                  Tahap {currentStageIdx + 1}/{maxBossHp}
                </span>
              </div>
              <h2 className="text-xl font-black text-purple-200 mt-0.5">{worldDef.bossName}</h2>
              <p className="text-xs text-slate-400">{worldDef.bossTitle}</p>
            </div>
          </div>

          {/* Boss HP Gauge */}
          <div className="flex flex-col items-end">
            <span className="text-xs font-bold text-red-400 mb-1">
              BOSS HP: {bossHp} / {maxBossHp}
            </span>
            <div className="flex items-center gap-1.5">
              {Array.from({ length: maxBossHp }).map((_, i) => (
                <span
                  key={i}
                  className={`text-2xl transition-transform ${
                    i < bossHp ? 'scale-100' : 'grayscale opacity-30 scale-90'
                  }`}
                >
                  ❤️
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Timer Bar */}
        <div className="flex items-center justify-between mb-2 text-xs font-bold">
          <span className="text-amber-400">
            {activeQuestion?.stage ? `Materi: ${activeQuestion.stage}` : 'Tantangan Boss'}
          </span>
          <span className={timeLeft <= 5 ? 'text-red-400 animate-pulse' : 'text-slate-300'}>
            ⏱️ {timeLeft} Detik
          </span>
        </div>
        <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden mb-6 border border-slate-700/50">
          <div
            className={`h-full transition-all duration-300 ${
              timeLeft <= 5 ? 'bg-red-500' : 'bg-gradient-to-r from-purple-500 to-indigo-400'
            }`}
            style={{ width: `${timerPerc}%` }}
          />
        </div>

        {/* Question Text */}
        {activeQuestion && (
          <div className="mb-6">
            <h3 className="text-base sm:text-lg font-bold text-slate-100 leading-relaxed">
              {activeQuestion.question}
            </h3>
          </div>
        )}

        {/* Options */}
        {activeQuestion && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
            {(['A', 'B', 'C', 'D'] as const).map((key) => {
              const isEliminated = eliminatedOptions.includes(key);
              const isPicked = selectedOption === key;
              const isCorrectAnswer = activeQuestion.correctAnswer === key;

              let buttonStyle = 'bg-slate-800/80 hover:bg-slate-700/80 border-slate-700 text-slate-200';
              if (isAnswered) {
                if (isCorrectAnswer) {
                  buttonStyle = 'bg-emerald-600 border-emerald-400 text-white font-bold ring-2 ring-emerald-400/50';
                } else if (isPicked && !isCorrectAnswer) {
                  buttonStyle = 'bg-red-600/80 border-red-500 text-white font-bold line-through';
                } else {
                  buttonStyle = 'bg-slate-800/40 border-slate-800 text-slate-500 opacity-60';
                }
              } else if (isEliminated) {
                buttonStyle = 'bg-slate-900 border-slate-800 text-slate-600 opacity-30 cursor-not-allowed';
              }

              return (
                <button
                  key={key}
                  disabled={isAnswered || isEliminated}
                  onClick={() => handleSelectOption(key)}
                  className={`p-4 rounded-2xl border text-left flex items-start gap-3 transition-all active:scale-[0.98] ${buttonStyle}`}
                >
                  <span className="w-7 h-7 rounded-xl bg-black/30 flex items-center justify-center font-black text-sm shrink-0 border border-white/10">
                    {key}
                  </span>
                  <span className="text-sm font-medium pt-0.5">{activeQuestion.options[key]}</span>
                </button>
              );
            })}
          </div>
        )}

        {/* Hint Flower */}
        {!isAnswered && (
          <div className="flex items-center justify-between pt-2 border-t border-slate-800">
            <span className="text-xs text-slate-400">Gunakan Hint Flower untuk membantu seranganmu</span>
            <button
              onClick={handleTriggerHint}
              disabled={usedHint || playerState.powerUps.hintFlower <= 0}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 border transition-all ${
                playerState.powerUps.hintFlower > 0 && !usedHint
                  ? 'bg-fuchsia-500/20 border-fuchsia-500/50 text-fuchsia-300 hover:bg-fuchsia-500/30'
                  : 'bg-slate-800 border-slate-700 text-slate-500 opacity-50 cursor-not-allowed'
              }`}
            >
              <span>🌸</span>
              <span>Hint Flower ({playerState.powerUps.hintFlower})</span>
            </button>
          </div>
        )}

        {/* Feedback Banner */}
        {isAnswered && (
          <div className="mt-4 pt-4 border-t border-slate-800 animate-in fade-in slide-in-from-bottom-2 duration-300">
            <div className={`p-4 rounded-2xl border mb-4 flex items-start gap-3 ${
              isCorrect ? 'bg-emerald-950/60 border-emerald-500/60 text-emerald-200' : 'bg-red-950/60 border-red-500/60 text-red-200'
            }`}>
              <span className="text-3xl shrink-0">{isCorrect ? '💥' : '⚠️'}</span>
              <div>
                <h4 className="font-black text-lg">
                  {isDefeatedState
                    ? '🏆 BOSS DEFEATED! MUSUH BERHASIL DITAKLUKKAN!'
                    : isCorrect
                    ? 'SERANGAN BERHASIL! BOSS TERKENA DAMAGE!'
                    : 'JAWABAN KELIRU! BOSS MENYERANGMU!'}
                </h4>
                <p className="text-xs mt-1 text-slate-300 leading-relaxed font-medium">
                  <span className="font-bold text-white">Pembahasan:</span> {activeQuestion?.explanation}
                </p>
              </div>
            </div>

            <div className="flex justify-end">
              <button
                onClick={handleNextStageOrRetry}
                className="px-6 py-2.5 rounded-2xl bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-purple-400 hover:to-indigo-400 text-white font-black text-sm shadow-lg transition-transform active:scale-95"
              >
                {isDefeatedState
                  ? 'KLAIM KEMENANGAN! 🏆'
                  : isCorrect
                  ? 'TANTANGAN BERIKUTNYA ▶'
                  : 'COBA SOAL PENGGANTI 🔄'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
