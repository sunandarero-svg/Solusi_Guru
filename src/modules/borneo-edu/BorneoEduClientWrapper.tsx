"use client";

import React from 'react';
import dynamic from 'next/dynamic';
import { Loader2, Gamepad2, Sparkles } from 'lucide-react';

const BorneoEduGame = dynamic(
  () => import('./BorneoEduGame'),
  {
    ssr: false,
    loading: () => (
      <div className="flex flex-col items-center justify-center min-h-[520px] p-8 bg-slate-950 rounded-3xl text-white border-2 border-emerald-500/30 shadow-2xl space-y-4">
        <Loader2 className="w-12 h-12 text-emerald-400 animate-spin" />
        <div className="text-center">
          <p className="font-black text-lg text-emerald-300">Menyiapkan Game Borneo Edu...</p>
          <p className="text-xs text-slate-400 mt-1">Mengunduh aset arena platformer & modul kuis interaktif</p>
        </div>
      </div>
    )
  }
);

const BorneoEduTeacherProgress = dynamic(
  () => import('./BorneoEduTeacherProgress'),
  {
    ssr: false,
    loading: () => (
      <div className="flex flex-col items-center justify-center min-h-[400px] p-8 bg-white rounded-3xl border border-slate-200 shadow-sm space-y-3">
        <Loader2 className="w-10 h-10 text-emerald-600 animate-spin" />
        <p className="font-bold text-slate-700">Memuat Rekap Progress Guru...</p>
      </div>
    )
  }
);

interface BorneoEduClientWrapperProps {
  userRole?: string;
  teacherName?: string;
  showStandaloneHeader?: boolean;
}

export default function BorneoEduClientWrapper({
  userRole,
  teacherName = 'Bapak/Ibu Guru',
  showStandaloneHeader = false
}: BorneoEduClientWrapperProps) {
  const isTeacherOrAdmin = userRole === 'TEACHER' || userRole === 'ADMIN' || userRole === 'PRINCIPAL';

  if (isTeacherOrAdmin) {
    return <BorneoEduTeacherProgress userRole={userRole} teacherName={teacherName} />;
  }

  return (
    <div className="space-y-3 sm:space-y-6">
      {!showStandaloneHeader && (
        <div className="landscape:hidden sm:landscape:flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-black flex items-center gap-1.5 shadow-sm">
                <Gamepad2 size={14} />
                <span>Pembelajaran Interaktif Siswa</span>
              </span>
              <span className="px-3 py-1 rounded-full bg-amber-100 text-amber-800 text-xs font-black flex items-center gap-1 shadow-sm">
                <Sparkles size={14} />
                <span>Game Edukasi 2D Platformer</span>
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-800 tracking-tight">
              Game Borneo Edu
            </h1>
            <p className="text-sm font-medium text-slate-500">
              Petualangan Belajar, Kumpulkan Koin, Taklukkan Tantangan!
            </p>
          </div>
        </div>
      )}

      <BorneoEduGame />
    </div>
  );
}
