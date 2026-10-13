"use client";

import React from 'react';
import { PlayerState } from './types';

interface GameOverModalProps {
  playerState: PlayerState;
  onRetry: () => void;
  onMainMenu: () => void;
}

export default function GameOverModal({
  playerState,
  onRetry,
  onMainMenu
}: GameOverModalProps) {
  return (
    <div className="fixed inset-0 z-[100000] flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-md animate-in fade-in duration-300 overflow-y-auto">
      <div className="bg-gradient-to-b from-slate-900 to-rose-950 border-2 border-red-500/50 rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl relative overflow-hidden text-center text-white">
        {/* Glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-48 bg-red-600/20 rounded-full blur-3xl pointer-events-none"></div>

        <div className="text-6xl mb-3 animate-pulse">💀</div>
        <h2 className="text-3xl font-black text-red-400 tracking-tight mb-1">
          GAME OVER!
        </h2>
        <p className="text-sm font-semibold text-slate-300 mb-6">
          Petualanganmu terhenti! Jangan menyerah!
        </p>

        {/* Stats Card */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 text-left space-y-2 mb-6">
          <div className="flex justify-between items-center text-xs">
            <span className="text-slate-400">Nama Siswa:</span>
            <span className="font-bold text-white">{playerState.studentName}</span>
          </div>
          <div className="flex justify-between items-center text-xs">
            <span className="text-slate-400">World Terakhir:</span>
            <span className="font-bold text-amber-300">World {playerState.currentWorld}</span>
          </div>
          <div className="flex justify-between items-center text-xs">
            <span className="text-slate-400">Level Terakhir:</span>
            <span className="font-bold text-emerald-400">Level {playerState.currentLevel}</span>
          </div>
          <div className="flex justify-between items-center text-xs">
            <span className="text-slate-400">Total Skor:</span>
            <span className="font-bold text-yellow-300">⭐ {playerState.score}</span>
          </div>
          <div className="flex justify-between items-center text-xs">
            <span className="text-slate-400">Total Koin:</span>
            <span className="font-bold text-amber-400">🪙 {playerState.coins}</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col gap-3">
          <button
            onClick={onRetry}
            className="w-full py-3 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black text-sm shadow-lg transition-transform active:scale-95"
          >
            COBA LAGI (ULANG LEVEL DENGAN 3 NYAWA) 🔄
          </button>
          <button
            onClick={onMainMenu}
            className="w-full py-2.5 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-sm transition-colors border border-slate-700"
          >
            MENU UTAMA 🏠
          </button>
        </div>
      </div>
    </div>
  );
}
