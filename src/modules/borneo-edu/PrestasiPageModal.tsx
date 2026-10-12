"use client";

import React, { useState } from 'react';
import { PlayerState, TeacherConfig } from './types';
import { evaluateBadges } from './storage';

interface PrestasiPageModalProps {
  playerState: PlayerState;
  teacherConfig: TeacherConfig;
  onContinue: () => void;
  onResetProgress: () => void;
  onClose: () => void;
}

export default function PrestasiPageModal({
  playerState,
  teacherConfig,
  onContinue,
  onResetProgress,
  onClose
}: PrestasiPageModalProps) {
  const [showConfirmReset, setShowConfirmReset] = useState(false);

  const totalQuestions = playerState.correctCount + playerState.wrongCount;
  const accuracy = totalQuestions > 0 ? Math.round((playerState.correctCount / totalQuestions) * 100) : 0;
  const currentBadges = evaluateBadges({
    completedLevels: playerState.completedLevels,
    score: playerState.score,
    accuracy,
    highestCombo: playerState.highestCombo,
    bossesDefeated: playerState.bossesDefeated
  }, teacherConfig);

  const badgeDefinitions = [
    {
      id: 'BRONZE LEARNER',
      title: 'BRONZE LEARNER',
      icon: '🥉',
      req: `Menyelesaikan seluruh ${teacherConfig.badgeBronzeLevels} Level petualangan.`,
      unlocked: currentBadges.includes('BRONZE LEARNER')
    },
    {
      id: 'SILVER LEARNER',
      title: 'SILVER LEARNER',
      icon: '🥈',
      req: `Menyelesaikan 25 Level & skor minimal ${teacherConfig.badgeSilverScore.toLocaleString()} poin.`,
      unlocked: currentBadges.includes('SILVER LEARNER')
    },
    {
      id: 'GOLD LEARNER',
      title: 'GOLD LEARNER',
      icon: '🥇',
      req: `Menyelesaikan 25 Level, skor minimal ${teacherConfig.badgeGoldScore.toLocaleString()} poin & akurasi minimal ${teacherConfig.badgeGoldAccuracy}%.`,
      unlocked: currentBadges.includes('GOLD LEARNER')
    },
    {
      id: 'SUPER LEARNER',
      title: 'SUPER LEARNER',
      icon: '👑',
      req: `Mengalahkan Final Boss, skor minimal ${teacherConfig.badgeSuperScore.toLocaleString()} poin & combo minimal ${teacherConfig.badgeSuperCombo}x.`,
      unlocked: currentBadges.includes('SUPER LEARNER')
    }
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-200 overflow-y-auto">
      <div className="bg-gradient-to-b from-slate-900 to-slate-950 border-2 border-slate-700 rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl relative text-white my-8">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800 mb-6">
          <div className="flex items-center gap-3">
            <span className="text-3xl">📜</span>
            <div>
              <h2 className="text-xl font-black text-amber-300">PRESTASI PETUALANG</h2>
              <p className="text-xs text-slate-400">Pencapaian pribadi & rekam jejak belajar di Borneo Edu</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Identity & Hero Card */}
        <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-950/60 to-slate-900 border border-emerald-500/30 mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider block">
              Identitas Siswa Petualang
            </span>
            <h3 className="text-lg font-black text-white mt-0.5">{playerState.studentName}</h3>
            <p className="text-xs text-slate-400">
              Absen: {playerState.studentNumber} • Kelas: {playerState.className} • Mapel: {playerState.subject}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <div className="px-3 py-1.5 rounded-xl bg-slate-800/80 border border-slate-700 text-center">
              <span className="text-[10px] text-slate-400 block">Level Tertinggi</span>
              <span className="text-sm font-black text-emerald-400">Level {playerState.currentLevel}</span>
            </div>
            <div className="px-3 py-1.5 rounded-xl bg-slate-800/80 border border-slate-700 text-center">
              <span className="text-[10px] text-slate-400 block">World Selesai</span>
              <span className="text-sm font-black text-amber-400">{playerState.completedWorlds} / 5</span>
            </div>
          </div>
        </div>

        {/* 6 Stats Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-6">
          <div className="p-3.5 rounded-2xl bg-slate-800/60 border border-slate-700/60">
            <span className="text-xs text-slate-400 block">Total Skor</span>
            <span className="text-xl font-black text-yellow-300">⭐ {playerState.score}</span>
          </div>
          <div className="p-3.5 rounded-2xl bg-slate-800/60 border border-slate-700/60">
            <span className="text-xs text-slate-400 block">Total Koin</span>
            <span className="text-xl font-black text-amber-400">🪙 {playerState.coins}</span>
          </div>
          <div className="p-3.5 rounded-2xl bg-slate-800/60 border border-slate-700/60">
            <span className="text-xs text-slate-400 block">Boss Dikalahkan</span>
            <span className="text-xl font-black text-purple-400">👑 {playerState.bossesDefeated} / 5</span>
          </div>
          <div className="p-3.5 rounded-2xl bg-slate-800/60 border border-slate-700/60">
            <span className="text-xs text-slate-400 block">Jawaban Benar</span>
            <span className="text-xl font-black text-emerald-400">✓ {playerState.correctCount}</span>
          </div>
          <div className="p-3.5 rounded-2xl bg-slate-800/60 border border-slate-700/60">
            <span className="text-xs text-slate-400 block">Jawaban Salah</span>
            <span className="text-xl font-black text-red-400">✕ {playerState.wrongCount}</span>
          </div>
          <div className="p-3.5 rounded-2xl bg-slate-800/60 border border-slate-700/60">
            <span className="text-xs text-slate-400 block">Akurasi & Combo Max</span>
            <span className="text-xl font-black text-cyan-300">{accuracy}% • {playerState.highestCombo}x</span>
          </div>
        </div>

        {/* Badges Section */}
        <div className="mb-6">
          <h4 className="text-sm font-black text-slate-200 mb-3 uppercase tracking-wider flex items-center gap-2">
            <span>🏆</span>
            <span>Badge Prestasi Belajar</span>
          </h4>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {badgeDefinitions.map((b) => (
              <div
                key={b.id}
                className={`p-3.5 rounded-2xl border transition-all ${
                  b.unlocked
                    ? 'bg-amber-500/10 border-amber-500/60 shadow-lg shadow-amber-500/5'
                    : 'bg-slate-900/60 border-slate-800 opacity-50'
                }`}
              >
                <div className="flex items-start gap-3">
                  <span className={`text-3xl shrink-0 ${!b.unlocked ? 'grayscale' : ''}`}>
                    {b.icon}
                  </span>
                  <div>
                    <div className="flex items-center gap-2">
                      <h5 className={`font-black text-sm ${b.unlocked ? 'text-amber-300' : 'text-slate-400'}`}>
                        {b.title}
                      </h5>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                        b.unlocked ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40' : 'bg-slate-800 text-slate-500'
                      }`}>
                        {b.unlocked ? 'TERBUKA ✓' : 'TERKUNCI 🔒'}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 mt-1 leading-snug">{b.req}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Confirmation Modal for Resetting Game Progress */}
        {showConfirmReset ? (
          <div className="p-4 rounded-2xl bg-red-950/70 border border-red-500/60 mb-4 animate-in fade-in duration-200">
            <p className="text-sm font-bold text-red-200 mb-2">
              ⚠️ Peringatan: Anda yakin ingin mengulang seluruh permainan dari awal?
            </p>
            <p className="text-xs text-slate-300 mb-3">
              Seluruh pencapaian World, Level, Koin, dan Skor akan direset kembali ke World 1 Level 1 dengan 3 nyawa.
            </p>
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => setShowConfirmReset(false)}
                className="px-3.5 py-1.5 rounded-xl bg-slate-800 text-slate-300 text-xs font-bold"
              >
                Batal
              </button>
              <button
                onClick={() => {
                  onResetProgress();
                  setShowConfirmReset(false);
                }}
                className="px-4 py-1.5 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-black shadow-md"
              >
                Ya, Ulangi Permainan 🔄
              </button>
            </div>
          </div>
        ) : null}

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row justify-between items-center gap-3 pt-4 border-t border-slate-800">
          <button
            onClick={() => setShowConfirmReset(true)}
            className="text-xs text-red-400 hover:text-red-300 font-bold underline transition-colors"
          >
            Ulangi Permainan dari Awal 🔄
          </button>

          <button
            onClick={onContinue}
            className="w-full sm:w-auto px-6 py-2.5 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black text-sm shadow-lg transition-transform active:scale-95"
          >
            Lanjutkan Petualangan ▶
          </button>
        </div>
      </div>
    </div>
  );
}
