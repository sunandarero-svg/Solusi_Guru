'use client';

import React from 'react';
import dynamic from 'next/dynamic';
import { Loader2, FileSpreadsheet } from 'lucide-react';

const ExcelAdventureApp = dynamic(
  () => import('./ExcelAdventureApp'),
  {
    ssr: false,
    loading: () => (
      <div className="flex flex-col items-center justify-center min-h-[500px] p-8 bg-slate-950 rounded-3xl text-white border-2 border-emerald-500/30 shadow-2xl space-y-4">
        <Loader2 className="w-12 h-12 text-emerald-400 animate-spin" />
        <div className="text-center">
          <p className="font-black text-lg text-emerald-300">Menyiapkan Excel Adventure...</p>
          <p className="text-xs text-slate-400 mt-1">Memuat simulasi spreadsheet, mesin rumus & Flash Card</p>
        </div>
      </div>
    )
  }
);

interface ExcelAdventureClientWrapperProps {
  userRole?: string;
  userName?: string;
  showStandaloneHeader?: boolean;
}

export default function ExcelAdventureClientWrapper({
  userRole,
  userName = 'Siswa Hebat',
  showStandaloneHeader = false
}: ExcelAdventureClientWrapperProps) {
  const isTeacher = userRole === 'TEACHER' || userRole === 'ADMIN' || userRole === 'PRINCIPAL';

  return (
    <div className="w-full">
      <ExcelAdventureApp
        initialMode={isTeacher ? 'TEACHER' : 'STUDENT'}
        defaultPlayerName={userName}
        defaultPlayerClass="8A"
      />
    </div>
  );
}
