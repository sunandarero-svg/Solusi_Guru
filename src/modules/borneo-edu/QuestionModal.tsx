"use client";

import React, { useState, useEffect } from 'react';
import { QuestionItem, PlayerState } from './types';
import { sound } from './audio';

interface QuestionModalProps {
  question: QuestionItem;
  isEnemy: boolean;
  playerState: PlayerState;
  timeLimitSeconds: number;
  onAnswerResolved: (isCorrect: boolean, timeSpent: number, chosenOption: string, pointsEarned: number, coinsEarned: number) => void;
  onUseHintFlower: () => void;
  onClose: () => void;
  onNextQuestion?: () => void;
}

export default function QuestionModal({
  question,
  isEnemy,
  playerState,
  timeLimitSeconds,
  onAnswerResolved,
  onUseHintFlower,
  onClose,
  onNextQuestion
}: QuestionModalProps) {
  const [timeLeft, setTimeLeft] = useState(timeLimitSeconds);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [eliminatedOptions, setEliminatedOptions] = useState<string[]>([]);
  const [usedHint, setUsedHint] = useState(false);

  // Reset state when question changes (e.g. when answering wrong on enemy battle)
  useEffect(() => {
    setTimeLeft(timeLimitSeconds);
    setSelectedOption(null);
    setIsAnswered(false);
    setIsCorrect(false);
    setEliminatedOptions([]);
    setUsedHint(false);
  }, [question.questionId, timeLimitSeconds]);

  // Timer countdown
  useEffect(() => {
    if (isAnswered) return;

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
  }, [timeLeft, isAnswered]);

  const handleTimeUp = () => {
    if (isAnswered) return;
    setIsAnswered(true);
    setIsCorrect(false);
    sound.playWrong();
    onAnswerResolved(false, timeLimitSeconds, 'TIMEOUT', 0, 0);
  };

  const handleSelectOption = (optKey: 'A' | 'B' | 'C' | 'D') => {
    if (isAnswered) return;

    setSelectedOption(optKey);
    setIsAnswered(true);
    const timeSpent = timeLimitSeconds - timeLeft;
    const correct = optKey === question.correctAnswer;
    setIsCorrect(correct);

    if (correct) {
      sound.playCorrect();

      // Coin calculation
      // Standard: +10, Hard/HOTS: +20 replaces 10
      let coinReward = ['HARD', 'HOTS', 'BOSS'].includes(question.difficulty) ? 20 : 10;
      if (isEnemy) {
        coinReward = 15; // Defeating enemy reward
      }

      // Fast answer bonus: if answered in first 35% of time limit
      const isFast = timeSpent <= Math.ceil(timeLimitSeconds * 0.35);
      if (isFast) {
        coinReward += 10;
      }

      // Point calculation with combo
      const basePoints = question.difficulty === 'EASY' ? 50 : question.difficulty === 'MEDIUM' ? 80 : question.difficulty === 'HARD' ? 120 : 150;
      const streak = playerState.combo + 1;
      let comboBonus = 50;
      if (streak === 2) comboBonus = 100;
      else if (streak === 3) comboBonus = 150;
      else if (streak === 4) comboBonus = 200;
      else if (streak >= 5) comboBonus = 250;

      let totalPoints = basePoints + comboBonus;
      // Super Star doubles points
      if (playerState.starBoostCount > 0) {
        totalPoints *= 2;
      }

      onAnswerResolved(true, timeSpent, optKey, totalPoints, coinReward);
    } else {
      sound.playWrong();
      onAnswerResolved(false, timeSpent, optKey, 0, 0);
    }
  };

  const handleTriggerHint = () => {
    if (usedHint || playerState.powerUps.hintFlower <= 0 || isAnswered) return;

    // Eliminate 2 wrong choices
    const allKeys: ('A' | 'B' | 'C' | 'D')[] = ['A', 'B', 'C', 'D'];
    const wrongKeys = allKeys.filter((k) => k !== question.correctAnswer);
    const toEliminate = wrongKeys.slice(0, 2);

    setEliminatedOptions(toEliminate);
    setUsedHint(true);
    sound.playPowerUp();
    onUseHintFlower();
  };

  const timerPerc = Math.max(0, Math.min(100, (timeLeft / timeLimitSeconds) * 100));
  const isUrgent = timeLeft <= 5;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-gradient-to-b from-slate-900 to-slate-950 border-2 border-slate-700/80 rounded-3xl max-w-2xl w-full p-4 sm:p-8 max-h-[92vh] overflow-y-auto shadow-2xl relative text-white">
        {/* Glow ambient background */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl pointer-events-none"></div>

        {/* Top Header: Badge, Question ID, & Timer */}
        <div className="flex flex-wrap items-center justify-between gap-3 mb-6 relative z-10">
          <div className="flex items-center gap-2">
            <span className={`px-3 py-1 rounded-full text-xs font-black tracking-wider ${
              isEnemy ? 'bg-red-500/20 text-red-400 border border-red-500/40' : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
            }`}>
              {isEnemy ? '⚔️ BATTLE CHALLENGE' : '❓ QUESTION BLOCK'}
            </span>
            <span className="px-3 py-1 rounded-full bg-slate-800 text-slate-300 text-xs font-bold border border-slate-700">
              {question.questionId} • World {question.world}
            </span>
            <span className="px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 text-xs font-bold border border-amber-500/40">
              {question.difficulty}
            </span>
          </div>

          {/* Countdown Display */}
          <div className="flex items-center gap-2">
            <div className={`flex items-center gap-1.5 px-4 py-1.5 rounded-2xl font-black text-sm tracking-wider border shadow-md transition-all ${
              isUrgent ? 'bg-red-500/20 border-red-500 text-red-400 animate-pulse' : 'bg-slate-800/80 border-slate-700 text-emerald-400'
            }`}>
              <span>⏱️</span>
              <span className="text-lg">{timeLeft}s</span>
            </div>
          </div>
        </div>

        {/* Countdown Bar */}
        <div className="w-full bg-slate-800 h-2.5 rounded-full overflow-hidden mb-6 border border-slate-700/50">
          <div
            className={`h-full transition-all duration-300 rounded-full ${
              isUrgent ? 'bg-gradient-to-r from-red-500 to-rose-600' : 'bg-gradient-to-r from-emerald-500 to-teal-400'
            }`}
            style={{ width: `${timerPerc}%` }}
          />
        </div>

        {/* Question Text */}
        <div className="mb-6">
          <h2 className="text-lg sm:text-xl font-bold text-slate-100 leading-relaxed">
            {question.question}
          </h2>
        </div>

        {/* Options (A, B, C, D) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
          {(['A', 'B', 'C', 'D'] as const).map((key) => {
            const isEliminated = eliminatedOptions.includes(key);
            const isPicked = selectedOption === key;
            const isCorrectAnswer = question.correctAnswer === key;

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
                <span className="text-sm font-medium pt-0.5">{question.options[key]}</span>
              </button>
            );
          })}
        </div>

        {/* Hint Flower Option */}
        {!isAnswered && (
          <div className="flex items-center justify-between pt-2 border-t border-slate-800">
            <span className="text-xs text-slate-400">
              Punya Hint Flower? Hilangkan 2 jawaban salah!
            </span>
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
              <span>Gunakan Hint ({playerState.powerUps.hintFlower})</span>
            </button>
          </div>
        )}

        {/* Feedback Banner after Answered */}
        {isAnswered && (
          <div className="mt-4 pt-4 border-t border-slate-800 animate-in fade-in slide-in-from-bottom-2 duration-300">
            <div className={`p-4 rounded-2xl border mb-4 flex items-start gap-3 ${
              isCorrect ? 'bg-emerald-950/60 border-emerald-500/60 text-emerald-200' : 'bg-red-950/60 border-red-500/60 text-red-200'
            }`}>
              <span className="text-3xl shrink-0">{isCorrect ? '🎉' : '❌'}</span>
              <div>
                <h3 className="font-black text-lg">
                  {isCorrect ? 'BENAR! (CORRECT!)' : 'TRY AGAIN! (JAWABAN SALAH)'}
                </h3>
                {selectedOption === 'TIMEOUT' && (
                  <p className="text-xs font-bold text-amber-300 mt-0.5">Waktu Menjawab Habis (TIME'S UP!)</p>
                )}
                <p className="text-xs mt-1 text-slate-300 leading-relaxed font-medium">
                  <span className="font-bold text-white">Pembahasan:</span> {question.explanation}
                </p>
                {!isCorrect && (playerState.shieldActive || playerState.powerUps.shield > 0) && (
                  <p className="text-xs font-bold text-cyan-300 mt-1 flex items-center gap-1">
                    <span>🛡️</span>
                    <span>Shield kamu aktif! Nyawa aman terlindungi.</span>
                  </p>
                )}
              </div>
            </div>

            {/* Action Button: Branching for Enemy Challenge vs Question Block */}
            {isEnemy ? (
              isCorrect ? (
                <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
                  <div className="text-xs font-bold text-emerald-300 flex items-center gap-1.5">
                    <span>✨</span>
                    <span>Musuh berhasil dikalahkan! Game siap dilanjutkan.</span>
                  </div>
                  <button
                    onClick={onClose}
                    className="w-full sm:w-auto px-6 py-2.5 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black text-sm shadow-lg transition-transform active:scale-95 flex items-center justify-center gap-2"
                  >
                    <span>Kembali ke Permainan</span>
                    <span>▶</span>
                  </button>
                </div>
              ) : (
                <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
                  <div className="text-xs font-bold text-amber-300 flex items-center gap-1.5">
                    <span>⚔️</span>
                    <span>Jawaban salah! Kamu harus menyelesaikan soal agar kembali ke permainan.</span>
                  </div>
                  <button
                    onClick={() => {
                      if (onNextQuestion) onNextQuestion();
                      else onClose();
                    }}
                    className="w-full sm:w-auto px-6 py-2.5 rounded-2xl bg-gradient-to-r from-amber-500 via-orange-500 to-rose-500 hover:brightness-110 text-slate-950 font-black text-sm shadow-lg transition-transform active:scale-95 flex items-center justify-center gap-2"
                  >
                    <span>Pertanyaan Lainnya</span>
                    <span>▶</span>
                  </button>
                </div>
              )
            ) : (
              <div className="flex justify-end">
                <button
                  onClick={onClose}
                  className="px-6 py-2.5 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black text-sm shadow-lg transition-transform active:scale-95"
                >
                  Lanjutkan Petualangan ▶
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
