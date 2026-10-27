import React from 'react';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Cpu } from 'lucide-react';
import ComputerSystemSimulatorClientWrapper from '@/modules/computer-system-simulator/ComputerSystemSimulatorClientWrapper';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Computer System Simulator — Game Edukasi Sistem Komputer',
  description: 'Pelajari perangkat keras komputer, arsitektur sistem, dan alur data melalui game interaktif 6 level!'
};

export default async function StandaloneComputerSystemSimulatorPage() {
  const session = await getServerSession(authOptions);

  // Jika belum login, arahkan ke login
  if (!session || !session.user) {
    redirect('/login');
  }

  // Khusus yang sudah login (Siswa maupun Guru/Admin)
  const isTeacher = session.user.role === 'TEACHER' || session.user.role === 'ADMIN' || session.user.role === 'PRINCIPAL';

  // Khusus Siswa: Tampilkan game
  return (
    <div className="min-h-screen bg-slate-950 p-2 sm:p-6 flex flex-col justify-between">
      <div className="max-w-6xl mx-auto w-full mb-2 sm:mb-4">
        <div className="flex items-center justify-between py-2 border-b border-slate-800">
          <Link
            href="/dashboard"
            className="flex items-center gap-2 text-xs font-bold text-slate-400 hover:text-white transition-colors"
          >
            <ArrowLeft size={16} />
            <span>{isTeacher ? 'Kembali ke Dashboard Guru' : 'Kembali ke Dashboard Siswa'}</span>
          </Link>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full bg-sky-500/20 text-sky-300 text-xs font-black flex items-center gap-1 border border-sky-500/40">
              <Cpu size={13} />
              <span>Computer System Simulator</span>
            </span>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto w-full flex-1">
        <ComputerSystemSimulatorClientWrapper
          userRole={session.user.role}
          userName={session.user.name || 'Siswa'}
          showStandaloneHeader={true}
        />
      </div>

      <div className="max-w-6xl mx-auto w-full text-center py-4 mt-6 border-t border-slate-900 text-slate-600 text-xs">
        Game Design by Sunandar Ero, S.Kom
      </div>
    </div>
  );
}
