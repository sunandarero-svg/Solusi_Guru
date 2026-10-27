import React from 'react';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import ComputerSystemSimulatorClientWrapper from '@/modules/computer-system-simulator/ComputerSystemSimulatorClientWrapper';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Computer System Simulator — Pembelajaran Interaktif Sistem Komputer',
  description: 'Game Edukasi Interaktif tentang Perangkat Keras, Arsitektur Sistem, dan Alur Data Komputer'
};

export default async function ComputerSystemSimulatorDashboardPage() {
  const session = await getServerSession(authOptions);
  const role = session?.user?.role;
  const userName = session?.user?.name || 'Bapak/Ibu Guru';

  return (
    <div className="space-y-6">
      <ComputerSystemSimulatorClientWrapper
        userRole={role}
        userName={userName}
        showStandaloneHeader={false}
      />
    </div>
  );
}
