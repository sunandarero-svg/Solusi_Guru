import React from 'react';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import Link from 'next/link';
import { ArrowLeft, FileSpreadsheet } from 'lucide-react';
import ExcelAdventureClientWrapper from '@/modules/excel-adventure/ExcelAdventureClientWrapper';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Excel Adventure — Misi Ahli Spreadsheet',
  description: 'Game Edukasi Simulasi Spreadsheet & Rumus Matematika Interaktif SMP/SMA'
};

export default async function StandaloneExcelAdventurePage() {
  const session = await getServerSession(authOptions);

  return (
    <div className="min-h-screen bg-slate-950 p-2 sm:p-6 flex flex-col justify-between">
      <div className="max-w-7xl mx-auto w-full mb-2 sm:mb-4">
        <div className="flex items-center justify-between py-2 border-b border-slate-800">
          <Link
            href="/dashboard"
            className="flex items-center gap-2 text-xs font-bold text-slate-400 hover:text-white transition-colors"
          >
            <ArrowLeft size={16} />
            <span>Kembali ke Dashboard</span>
          </Link>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-black flex items-center gap-1 border border-emerald-500/40">
              <FileSpreadsheet size={13} />
              <span>Excel Adventure</span>
            </span>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto w-full flex-1">
        <ExcelAdventureClientWrapper
          userRole={session?.user?.role || 'STUDENT'}
          userName={session?.user?.name || 'Siswa Hebat'}
          showStandaloneHeader={true}
        />
      </div>

      <div className="max-w-7xl mx-auto w-full text-center py-4 mt-6 border-t border-slate-900 text-slate-600 text-xs">
        Solusi Guru • Excel Adventure Interactive Learning
      </div>
    </div>
  );
}
