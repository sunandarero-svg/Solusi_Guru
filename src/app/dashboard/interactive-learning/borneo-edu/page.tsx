import React from 'react';
import BorneoEduGame from '@/modules/borneo-edu/BorneoEduGame';
import { Gamepad2, Sparkles } from 'lucide-react';

export const metadata = {
  title: 'Borneo Edu — Pembelajaran Interaktif Platformer',
  description: 'Petualangan Belajar, Kumpulkan Koin, Taklukkan Tantangan di Pulau Borneo!'
};

export default function BorneoEduPage() {
  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-black flex items-center gap-1.5 shadow-sm">
              <Gamepad2 size={14} />
              <span>Pembelajaran Interaktif</span>
            </span>
            <span className="px-3 py-1 rounded-full bg-amber-100 text-amber-800 text-xs font-black flex items-center gap-1 shadow-sm">
              <Sparkles size={14} />
              <span>Game Edukasi 2D Platformer</span>
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-800 tracking-tight">
            Game Borneo Edu
          </h1>
          <p className="text-sm font-medium text-slate-500">
            Petualangan Belajar, Kumpulkan Koin, Taklukkan Tantangan!
          </p>
        </div>
      </div>

      {/* Main Game Component */}
      <BorneoEduGame />
    </div>
  );
}
