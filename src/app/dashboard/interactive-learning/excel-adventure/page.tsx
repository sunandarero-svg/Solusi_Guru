import React from 'react';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import ExcelAdventureClientWrapper from '@/modules/excel-adventure/ExcelAdventureClientWrapper';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Excel Adventure — Pembelajaran Interaktif Spreadsheet',
  description: 'Misi Ahli Spreadsheet & Simulasi Rumus Matematika Interaktif SMP/SMA'
};

export default async function ExcelAdventureDashboardPage() {
  const session = await getServerSession(authOptions);
  const role = session?.user?.role;
  const userName = session?.user?.name || 'Bapak/Ibu Guru';

  return (
    <div className="space-y-6">
      <ExcelAdventureClientWrapper
        userRole={role}
        userName={userName}
        showStandaloneHeader={false}
      />
    </div>
  );
}
