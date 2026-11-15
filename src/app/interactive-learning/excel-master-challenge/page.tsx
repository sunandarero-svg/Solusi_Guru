import React from 'react';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import Link from 'next/link';
import { ArrowLeft, FileSpreadsheet } from 'lucide-react';
import ExcelMasterGameApp from '@/modules/excel-master/ExcelMasterGameApp';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'EXCEL MASTER CHALLENGE — Petualangan Menjadi Ahli Microsoft Excel',
  description: 'Game edukasi interaktif 50 soal dalam 5 level bersama Robot EXO untuk siswa dan guru.'
};

export default async function StandaloneExcelMasterPage() {
  const session = await getServerSession(authOptions);
  const role = session?.user?.role || 'STUDENT';
  const userName = session?.user?.name || 'Siswa Hebat';

  return (
    <div className="min-h-screen bg-slate-950 p-2 sm:p-6 flex flex-col justify-between">
      <div className="max-w-7xl mx-auto w-full mb-3">
        <div className="flex items-center justify-between py-2 border-b border-slate-800">
          <Link
            href="/dashboard"
            className="flex items-center gap-2 text-xs font-bold text-slate-400 hover:text-white transition-colors"
          >
            <ArrowLeft size={16} />
            <span>Kembali ke Dashboard</span>
          </Link>
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-black flex items-center gap-1.5 border border-emerald-500/40 shadow-sm">
              <FileSpreadsheet size={14} />
              <span>Excel Master Challenge</span>
            </span>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto w-full flex-1">
        <ExcelMasterGameApp
          userRole={role}
          userName={userName}
          showStandaloneHeader={true}
        />
      </div>

      <div className="max-w-7xl mx-auto w-full text-center py-4 mt-6 border-t border-slate-900 text-slate-600 text-xs">
        Solusi Guru • EXCEL MASTER CHALLENGE: Petualangan Menjadi Ahli Microsoft Excel
      </div>
    </div>
  );
}
