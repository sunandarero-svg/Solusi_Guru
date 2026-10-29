'use client';

import React from 'react';
import dynamic from 'next/dynamic';
import { Loader2, Cpu } from 'lucide-react';

const ComputerSystemSimulatorApp = dynamic(
  () => import('./ComputerSystemSimulatorApp'),
  {
    ssr: false,
    loading: () => (
      <div className="flex flex-col items-center justify-center min-h-[500px] p-8 bg-slate-950 rounded-3xl text-white border-2 border-sky-500/30 shadow-2xl space-y-4">
        <Loader2 className="w-12 h-12 text-sky-400 animate-spin" />
        <div className="text-center">
          <p className="font-black text-lg text-sky-300">Menyiapkan Computer System Simulator...</p>
          <p className="text-xs text-slate-400 mt-1">Memuat modul flashcard, tantangan level & lab animasi</p>
        </div>
      </div>
    )
  }
);

interface ComputerSystemSimulatorClientWrapperProps {
  userRole?: string;
  userName?: string;
  showStandaloneHeader?: boolean;
}

export default function ComputerSystemSimulatorClientWrapper({
  userRole,
  userName = 'Siswa Hebat',
  showStandaloneHeader = false
}: ComputerSystemSimulatorClientWrapperProps) {
  const isTeacher = userRole === 'TEACHER' || userRole === 'ADMIN' || userRole === 'PRINCIPAL';

  return (
    <div className="w-full">
      <ComputerSystemSimulatorApp
        initialMode={isTeacher ? 'TEACHER' : 'STUDENT'}
        userRole={userRole}
        userName={userName}
      />
    </div>
  );
}
