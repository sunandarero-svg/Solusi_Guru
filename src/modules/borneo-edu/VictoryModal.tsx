"use client";

import React from 'react';
import { PlayerState } from './types';

interface VictoryModalProps {
  playerState: PlayerState;
  onViewAchievements: () => void;
  onMainMenu: () => void;
}

export default function VictoryModal({
  playerState,
  onViewAchievements,
  onMainMenu
}: VictoryModalProps) {
  const totalQuestions = playerState.correctCount + playerState.wrongCount;
  const accuracy = totalQuestions > 0 ? Math.round((playerState.correctCount / totalQuestions) * 100) : 100;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-xl animate-in zoom-in-95 duration-500 overflow-y-auto">
      <div className="bg-gradient-to-b from-slate-900 via-purple-950 to-slate-950 border-3 border-amber-400 rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl relative text-center text-white my-8">
        {/* Confetti simulation particles */}
        <div className="absolute top-2 left-6 text-2xl animate-bounce">🎉</div>
        <div className="absolute top-4 right-8 text-2xl animate-bounce delay-150">🎊</div>
        <div className="absolute bottom-6 left-10 text-2xl animate-bounce delay-300">✨</div>
        <div className="absolute bottom-8 right-6 text-2xl animate-bounce delay-200">⭐</div>

        {/* Crown & Title */}
        <div className="text-6xl mb-2 animate-bounce">👑</div>
        <h2 className="text-2xl sm:text-3xl font-black bg-gradient-to-r from-yellow-300 via-amber-200 to-yellow-400 bg-clip-text text-transparent tracking-tight">
          CONGRATULATIONS!
        </h2>
        <h3 className="text-lg sm:text-xl font-black text-amber-300 mt-1 uppercase tracking-wide">
          YOU FINISHED SUPER MARIO EDU!
        </h3>
        <p className="text-xs text-slate-300 mt-1 mb-6">
          Selamat! Kamu berhasil menaklukkan seluruh 5 World dan mengalahkan Final Boss di Borneo Edu!
        </p>

        {/* Summary Details */}
        <div className="bg-slate-900/90 border border-purple-500/30 rounded-2xl p-5 text-left space-y-2.5 mb-6 shadow-inner">
          <div className="flex justify-between items-center text-xs pb-1 border-b border-slate-800">
            <span className="text-slate-400">Nama Siswa:</span>
            <span className="font-extrabold text-white text-sm">{playerState.studentName}</span>
          </div>
          <div className="flex justify-between items-center text-xs">
            <span className="text-slate-400">Total Skor Akhir:</span>
            <span className="font-bold text-yellow-300 text-sm">⭐ {playerState.score}</span>
          </div>
          <div className="flex justify-between items-center text-xs">
            <span className="text-slate-400">Total Koin (+100 Hadiah Final Boss):</span>
            <span className="font-bold text-amber-400 text-sm">🪙 {playerState.coins}</span>
          </div>
          <div className="flex justify-between items-center text-xs">
            <span className="text-slate-400">Level Tertinggi:</span>
            <span className="font-bold text-emerald-400">Level 25 (FINAL CASTLE)</span>
          </div>
          <div className="flex justify-between items-center text-xs">
            <span className="text-slate-400">Boss Dikalahkan:</span>
            <span className="font-bold text-purple-300">5 / 5 Boss</span>
          </div>
          <div className="flex justify-between items-center text-xs">
            <span className="text-slate-400">Jumlah Jawaban Benar:</span>
            <span className="font-bold text-emerald-400">{playerState.correctCount} Soal</span>
          </div>
          <div className="flex justify-between items-center text-xs">
            <span className="text-slate-400">Jumlah Jawaban Salah:</span>
            <span className="font-bold text-red-400">{playerState.wrongCount} Soal</span>
          </div>
          <div className="flex justify-between items-center text-xs">
            <span className="text-slate-400">Akurasi:</span>
            <span className="font-bold text-teal-300">{accuracy}%</span>
          </div>
          <div className="flex justify-between items-center text-xs">
            <span className="text-slate-400">Combo Tertinggi:</span>
            <span className="font-bold text-orange-400">🔥 {playerState.highestCombo}x Combo</span>
          </div>

          {/* Badges Earned */}
          <div className="pt-2 border-t border-slate-800">
            <span className="text-[11px] text-slate-400 block mb-1.5 font-bold uppercase tracking-wider">
              Badge yang Diperoleh:
            </span>
            <div className="flex flex-wrap gap-1.5">
              {playerState.badges.length > 0 ? (
                playerState.badges.map((b) => (
                  <span
                    key={b}
                    className="px-2.5 py-1 rounded-lg bg-amber-500/20 text-amber-300 text-xs font-black border border-amber-500/40"
                  >
                    🏆 {b}
                  </span>
                ))
              ) : (
                <span className="text-xs text-slate-400 italic">Menyelesaikan Level 25</span>
              )}
            </div>
          </div>
        </div>

        {/* 5 PERTANYAAN REFLEKSI KHUSUS (DIKERJAKAN DI BUKU TULIS & DIKUMPUL VIA KAMERA FOTO TUGAS) */}
        <div className="bg-gradient-to-b from-amber-950/40 to-slate-900 border-2 border-amber-400/50 rounded-2xl p-5 text-left mb-6 shadow-xl">
          <div className="flex items-center gap-2 mb-2 pb-2 border-b border-amber-500/30">
            <span className="text-2xl animate-pulse">📝</span>
            <div>
              <h4 className="text-sm font-black text-amber-300 uppercase tracking-wide">
                Tugas Khusus: 5 Pertanyaan Refleksi
              </h4>
              <p className="text-[11px] text-slate-300">
                Wajib dikerjakan di buku tulis Anda & dikumpulkan via Kamera Foto Tugas!
              </p>
            </div>
          </div>

          <ol className="list-decimal list-inside space-y-2 text-xs text-slate-200 font-medium leading-relaxed my-3">
            <li><span className="text-amber-200 font-semibold">Pemahaman Materi:</span> Materi atau konsep apa yang paling kamu pahami setelah menaklukkan petualangan game ini?</li>
            <li><span className="text-amber-200 font-semibold">Tantangan & Strategi:</span> Soal atau rintangan mana yang paling sulit bagi kamu, dan bagaimana strategimu agar bisa menyelesaikannya?</li>
            <li><span className="text-amber-200 font-semibold">Refleksi Karakter:</span> Sikap positif apa (kejujuran, ketelitian, ketekunan, pantang menyerah) yang kamu latih saat bermain game ini?</li>
            <li><span className="text-amber-200 font-semibold">Kesan Belajar:</span> Apa manfaat dan perbedaan belajar melalui game edukasi interaktif ini dibandingkan metode belajar biasa di kelas?</li>
            <li><span className="text-amber-200 font-semibold">Rencana Belajar:</span> Apa komitmen atau langkah perbaikan belajar yang ingin kamu lakukan untuk topik berikutnya?</li>
          </ol>

          <div className="mt-4 pt-3 border-t border-amber-500/20">
            <a
              href="/dashboard"
              className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-600 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black text-xs shadow-lg flex items-center justify-center gap-2 transition-transform active:scale-95 text-center"
            >
              <span>📷</span>
              <span>Buka Kamera & Kumpulkan Tugas Refleksi</span>
              <span>▶</span>
            </a>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3">
          <button
            onClick={onViewAchievements}
            className="flex-1 py-3 rounded-2xl bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-slate-950 font-black text-sm shadow-lg transition-transform active:scale-95"
          >
            LIHAT PRESTASI LENGKAP 📜
          </button>
          <button
            onClick={onMainMenu}
            className="flex-1 py-3 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-sm transition-colors border border-slate-700"
          >
            MENU UTAMA 🏠
          </button>
        </div>
      </div>
    </div>
  );
}
