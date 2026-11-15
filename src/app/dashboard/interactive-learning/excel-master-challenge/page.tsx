import React from 'react';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import ExcelMasterGameApp from '@/modules/excel-master/ExcelMasterGameApp';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Excel Master Challenge — Modul Pembelajaran Interaktif',
  description: 'Tantangan 50 soal interaktif penguasaan Microsoft Excel 5 level bertahap.'
};

export default async function ExcelMasterDashboardPage() {
  const session = await getServerSession(authOptions);
  const role = session?.user?.role || 'STUDENT';
  const userName = session?.user?.name || 'Siswa Hebat';

  return (
    <div className="space-y-6">
      <ExcelMasterGameApp
        userRole={role}
        userName={userName}
        showStandaloneHeader={false}
      />
    </div>
  );
}
