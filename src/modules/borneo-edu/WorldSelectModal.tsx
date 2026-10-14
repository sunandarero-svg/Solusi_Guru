"use client";

import React, { useState } from 'react';
import { PlayerState, TeacherConfig } from './types';
import { WORLD_DEFINITIONS } from './defaultQuestions';

interface WorldSelectModalProps {
  playerState: PlayerState;
  teacherConfig?: TeacherConfig;
  onSelectLevel: (worldId: number, levelId: number) => void;
  onClose: () => void;
}

export default function WorldSelectModal({
  playerState,
  teacherConfig,
  onSelectLevel,
  onClose
}: WorldSelectModalProps) {
  const startLevel = teacherConfig?.activeLevelStart ?? 1;
  const endLevel = teacherConfig?.activeLevelEnd ?? 25;

  const isLevelActiveByTeacher = (lvl: number) => {
    return lvl >= startLevel && lvl <= endLevel;
  };

  const initialWorld = Math.max(1, Math.min(5, Math.floor((playerState.currentLevel - 1) / 5) + 1));
  const [selectedWorldId, setSelectedWorldId] = useState<number>(initialWorld);

  const selectedWorld = WORLD_DEFINITIONS.find((w) => w.id === selectedWorldId) || WORLD_DEFINITIONS[0];

  // A level is unlocked if it is the starting level, or previous level is completed, within teacher active scope
  const isLevelUnlocked = (lvl: number) => {
    if (!isLevelActiveByTeacher(lvl)) return false;
    if (lvl === startLevel) return true;
    return playerState.completedLevels.includes(lvl - 1) || playerState.completedLevels.includes(lvl);
  };

  const isWorldUnlocked = (worldId: number) => {
    const worldLevels = WORLD_DEFINITIONS.find((w) => w.id === worldId)?.levels || [];
    const hasActiveLevel = worldLevels.some((l) => isLevelActiveByTeacher(l));
    if (!hasActiveLevel) return false;

    const firstActiveWorld = Math.floor((startLevel - 1) / 5) + 1;
    if (worldId === firstActiveWorld) return true;

    const prevBossLevel = (worldId - 1) * 5;
    return playerState.completedLevels.includes(prevBossLevel) || playerState.completedLevels.some((l) => l >= (worldId - 1) * 5);
  };

  return (
    <div className="fixed inset-0 z-[100000] flex items-center justify-center p-2 sm:p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-200 overflow-y-auto">
      <div className="bg-gradient-to-b from-slate-900 to-slate-950 border-2 border-slate-700 rounded-3xl max-w-3xl w-full p-6 sm:p-8 shadow-2xl relative text-white my-8">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800 mb-6">
          <div className="flex items-center gap-3">
            <span className="text-3xl">🗺️</span>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-black text-amber-300">PILIH WORLD & LEVEL</h2>
                {(startLevel > 1 || endLevel < 25) && (
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 font-extrabold border border-indigo-500/40">
                    Target Guru: Level {startLevel} - {endLevel}
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400">Jelajahi World dan Level petualangan yang ditugaskan Guru</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center transition-colors"
          >
            ✕
          </button>
        </div>

        {/* 5 Worlds Navigation Tabs */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 mb-6">
          {WORLD_DEFINITIONS.map((world) => {
            const unlocked = isWorldUnlocked(world.id);
            const isSelected = selectedWorldId === world.id;

            return (
              <button
                key={world.id}
                disabled={!unlocked}
                onClick={() => setSelectedWorldId(world.id)}
                className={`p-3 rounded-2xl border text-center transition-all flex flex-col items-center justify-center gap-1 ${
                  isSelected
                    ? 'bg-emerald-500/20 border-emerald-400 text-white font-black shadow-lg ring-2 ring-emerald-500/40'
                    : unlocked
                    ? 'bg-slate-800/80 hover:bg-slate-700 border-slate-700 text-slate-300 font-bold'
                    : 'bg-slate-900 border-slate-800 text-slate-600 opacity-40 cursor-not-allowed'
                }`}
              >
                <span className="text-xl">
                  {!unlocked ? '🔒' : world.id === 1 ? '🌲' : world.id === 2 ? '🌋' : world.id === 3 ? '🌊' : world.id === 4 ? '🏜️' : '🏰'}
                </span>
                <span className="text-xs font-black truncate w-full">W{world.id}</span>
                <span className="text-[10px] text-slate-400 truncate w-full">{world.name.split(' ')[0]}</span>
              </button>
            );
          })}
        </div>

        {/* World Detail Banner */}
        <div
          className="p-5 rounded-2xl mb-6 border shadow-inner transition-all relative overflow-hidden"
          style={{
            background: `linear-gradient(135deg, ${selectedWorld.palette.skyTop}99, ${selectedWorld.palette.terrain}33)`,
            borderColor: selectedWorld.palette.accent
          }}
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <span className="text-xs font-black tracking-wider uppercase text-amber-300">
                WORLD {selectedWorld.id} — {selectedWorld.name}
              </span>
              <h3 className="text-lg font-black text-white mt-0.5">{selectedWorld.themeTitle}</h3>
              <p className="text-xs text-slate-200 mt-1">{selectedWorld.description}</p>
              <p className="text-xs text-emerald-300 font-semibold mt-1">
                📚 <strong>Materi:</strong> {selectedWorld.materiTheme}
              </p>
            </div>
            <div className="text-right shrink-0">
              <span className="text-[10px] text-slate-300 block">Bos Penguasa:</span>
              <span className="text-xs font-black text-amber-300">👑 {selectedWorld.bossName}</span>
            </div>
          </div>
        </div>

        {/* Levels Grid (5 Levels per World) */}
        <div className="mb-6">
          <h4 className="text-xs font-black uppercase text-slate-400 tracking-wider mb-3">
            PILIH LEVEL (WORLD {selectedWorld.id})
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-5 gap-3">
            {selectedWorld.levels.map((lvl) => {
              const activeByTeacher = isLevelActiveByTeacher(lvl);
              const unlocked = isLevelUnlocked(lvl);
              const isCompleted = playerState.completedLevels.includes(lvl);
              const isBoss = lvl === selectedWorld.bossLevel;

              return (
                <button
                  key={lvl}
                  disabled={!unlocked}
                  onClick={() => onSelectLevel(selectedWorld.id, lvl)}
                  className={`p-4 rounded-2xl border flex flex-col items-center justify-center gap-1.5 transition-all active:scale-95 ${
                    !activeByTeacher
                      ? 'bg-slate-900 border-slate-800 text-slate-600 opacity-40 cursor-not-allowed'
                      : isCompleted
                      ? 'bg-emerald-950/50 hover:bg-emerald-900/60 border-emerald-500/60 text-emerald-200 shadow-md'
                      : unlocked
                      ? 'bg-slate-800 hover:bg-slate-700 border-slate-600 text-white shadow-md ring-1 ring-white/10'
                      : 'bg-slate-900 border-slate-800 text-slate-600 opacity-40 cursor-not-allowed'
                  }`}
                  title={!activeByTeacher ? 'Level ini dinonaktifkan oleh pengaturan Guru' : undefined}
                >
                  <div className="w-10 h-10 rounded-xl bg-black/40 flex items-center justify-center text-lg font-black">
                    {!activeByTeacher ? (
                      <span className="text-slate-600">⛔</span>
                    ) : isCompleted ? (
                      <span className="text-emerald-400">✓</span>
                    ) : !unlocked ? (
                      <span className="text-slate-500">🔒</span>
                    ) : isBoss ? (
                      <span className="text-amber-400">👑</span>
                    ) : (
                      <span>{lvl}</span>
                    )}
                  </div>
                  <span className="text-xs font-black">Level {lvl}</span>
                  <span className="text-[10px] font-bold text-slate-400">
                    {!activeByTeacher ? 'NONAKTIF' : isBoss ? 'BOSS BATTLE' : isCompleted ? 'SELESAI' : unlocked ? 'TERBUKA' : 'TERKUNCI'}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end pt-4 border-t border-slate-800">
          <button
            onClick={onClose}
            className="px-6 py-2.5 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-sm transition-colors border border-slate-700"
          >
            Kembali ke Menu Utama ✕
          </button>
        </div>
      </div>
    </div>
  );
}
