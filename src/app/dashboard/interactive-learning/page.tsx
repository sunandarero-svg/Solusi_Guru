import React from 'react';
import Link from 'next/link';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { Gamepad2, Sparkles, Trophy, Users, BookOpen, ArrowRight, Star, BarChart3 } from 'lucide-react';

export const metadata = {
  title: 'Pembelajaran Interaktif — Solusi Guru',
  description: 'Modul pembelajaran interaktif dan game edukasi terintegrasi.'
};

export default async function InteractiveLearningHubPage() {
  const session = await getServerSession(authOptions);
  const isTeacher = session?.user?.role === 'TEACHER' || session?.user?.role === 'ADMIN' || session?.user?.role === 'PRINCIPAL';

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 mb-2">
          <span className="px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-black flex items-center gap-1.5 shadow-sm">
            <Gamepad2 size={14} />
            <span>Modul Interaktif</span>
          </span>
        </div>
        <h1 className="text-3xl font-black text-slate-800 tracking-tight">
          Pembelajaran Interaktif
        </h1>
        <p className="text-slate-500 font-medium mt-1">
          {isTeacher
            ? 'Pantau perkembangan hasil belajar dan capaian gamifikasi siswa pada modul game edukasi.'
            : 'Tingkatkan keterlibatan belajar siswa melalui gamifikasi, kuis petualangan, dan simulasi interaktif.'}
        </p>
      </div>

      {/* Featured Game Hero Card */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-emerald-900 via-teal-900 to-slate-900 border-2 border-emerald-500/40 p-6 sm:p-10 text-white shadow-2xl">
        <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/20 rounded-full blur-3xl pointer-events-none"></div>

        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-400/20 text-amber-300 text-xs font-black border border-amber-400/40 mb-4">
            {isTeacher ? <BarChart3 size={14} /> : <Star size={14} className="fill-amber-300" />}
            <span>{isTeacher ? 'PEMANTAUAN PROGRESS HASIL SISWA' : 'GAME EDUKASI UNGGULAN'}</span>
          </div>

          <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
            Borneo Edu
          </h2>
          <p className="text-lg font-bold text-amber-300 mt-1">
            {isTeacher
              ? 'Laporan Hasil & Rekapitulasi Nilai Petualangan Siswa'
              : '"Petualangan Belajar, Kumpulkan Koin, Taklukkan Tantangan!"'}
          </p>
          <p className="text-sm text-slate-200 mt-3 leading-relaxed">
            {isTeacher
              ? 'Siswa memainkan petualangan platformer 2D 25 level di 5 World untuk mengasah materi kurikulum. Anda dapat memantau perolehan nilai akhir, akurasi soal, level yang ditaklukkan, dan mengekspor rekap nilai ke format Excel (.xlsx).'
              : 'Game petualangan platformer 2D dengan visual kartun premium. Jelajahi 5 World, selesaikan 25 Level, kumpulkan koin, jawab soal kurikulum, raih power-up, dan hadapi Boss Battle hingga Final Boss!'}
          </p>

          <div className="flex flex-wrap items-center gap-4 mt-6">
            <Link
              href="/dashboard/interactive-learning/borneo-edu"
              className="px-6 py-3.5 rounded-2xl bg-gradient-to-r from-amber-400 to-yellow-400 hover:from-amber-300 hover:to-yellow-300 text-slate-950 font-black text-sm shadow-xl transition-transform active:scale-95 flex items-center gap-2"
            >
              <span>{isTeacher ? 'LIHAT PROGRESS HASIL SISWA' : 'MAINKAN BORNEO EDU SEKARANG'}</span>
              <ArrowRight size={18} />
            </Link>
          </div>
        </div>

        {/* Feature Highlights Grid */}
        <div className="relative z-10 grid grid-cols-2 sm:grid-cols-4 gap-3 mt-8 pt-6 border-t border-white/10">
          <div className="p-3 rounded-2xl bg-white/5 backdrop-blur-sm border border-white/10">
            <span className="text-xl block mb-1">🗺️</span>
            <span className="text-xs font-black block">5 World Tematik</span>
            <span className="text-[10px] text-slate-300">25 Level Petualangan</span>
          </div>
          <div className="p-3 rounded-2xl bg-white/5 backdrop-blur-sm border border-white/10">
            <span className="text-xl block mb-1">❓</span>
            <span className="text-xs font-black block">Bank Soal Kurikulum</span>
            <span className="text-[10px] text-slate-300">100+ Soal Terintegrasi</span>
          </div>
          <div className="p-3 rounded-2xl bg-white/5 backdrop-blur-sm border border-white/10">
            <span className="text-xl block mb-1">👑</span>
            <span className="text-xs font-black block">Boss Battle</span>
            <span className="text-[10px] text-slate-300">Tantangan HOTS Berkala</span>
          </div>
          <div className="p-3 rounded-2xl bg-white/5 backdrop-blur-sm border border-white/10">
            <span className="text-xl block mb-1">👨‍🏫</span>
            <span className="text-xs font-black block">Progress Guru</span>
            <span className="text-[10px] text-slate-300">Ekspor Nilai Excel .xlsx</span>
          </div>
        </div>
      </div>
    </div>
  );
}
