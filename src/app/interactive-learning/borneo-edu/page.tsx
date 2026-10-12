import React from 'react';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import BorneoEduGame from '@/modules/borneo-edu/BorneoEduGame';
import Link from 'next/link';
import { ArrowLeft, Gamepad2 } from 'lucide-react';

export const metadata = {
  title: 'Borneo Edu — Game Edukasi Platformer 2D',
  description: 'Petualangan Belajar, Kumpulkan Koin, Taklukkan Tantangan!'
};

export default async function StandaloneBorneoEduPage() {
  const session = await getServerSession(authOptions);

  // Jika belum login, arahkan ke login
  if (!session || !session.user) {
    redirect('/login');
  }

  // Jika guru/admin, arahkan ke halaman progress guru
  if (session.user.role === 'TEACHER' || session.user.role === 'ADMIN' || session.user.role === 'PRINCIPAL') {
    redirect('/dashboard/interactive-learning/borneo-edu');
  }

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
            <span>Kembali ke Dashboard Siswa</span>
          </Link>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-black flex items-center gap-1 border border-emerald-500/40">
              <Gamepad2 size={13} />
              <span>Borneo Edu Siswa</span>
            </span>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto w-full flex-1">
        <BorneoEduGame />
      </div>

      <div className="max-w-6xl mx-auto w-full text-center py-4 mt-6 border-t border-slate-900 text-slate-600 text-xs">
        Game Design by Sunandar Ero, S.Kom
      </div>
    </div>
  );
}
