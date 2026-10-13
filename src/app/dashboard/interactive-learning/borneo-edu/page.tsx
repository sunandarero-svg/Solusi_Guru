import React from 'react';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import BorneoEduClientWrapper from '@/modules/borneo-edu/BorneoEduClientWrapper';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Borneo Edu — Pembelajaran Interaktif Platformer',
  description: 'Petualangan Belajar, Kumpulkan Koin, Taklukkan Tantangan di Pulau Borneo!'
};

export default async function BorneoEduPage() {
  const session = await getServerSession(authOptions);
  const role = session?.user?.role;
  const teacherName = session?.user?.name || 'Bapak/Ibu Guru';

  return (
    <BorneoEduClientWrapper
      userRole={role}
      teacherName={teacherName}
    />
  );
}
