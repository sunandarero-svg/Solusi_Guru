"use client";

import React from 'react';
import { PlayerState } from './types';
import { sound } from './audio';

interface PowerUpShopModalProps {
  playerState: PlayerState;
  onBuyItem: (type: 'mushroom' | 'hintFlower' | 'superStar' | 'shield', cost: number) => void;
  onClose: () => void;
}

export default function PowerUpShopModal({
  playerState,
  onBuyItem,
  onClose
}: PowerUpShopModalProps) {
  const highestCompletedLevel = Math.max(
    0,
    ...(playerState.completedLevels || []),
    (playerState.currentLevel || 1) - 1,
    (playerState.completedWorlds || 0) * 5
  );

  const shopItems = [
    {
      type: 'mushroom' as const,
      name: 'SUPER MUSHROOM',
      icon: '🍄',
      cost: 30,
      requiredLevel: 1,
      isUnlocked: highestCompletedLevel >= 1,
      description: 'Menambah satu nyawa ekstra (Maksimal 5 nyawa).',
      owned: playerState.powerUps.mushroom,
      canBuy: highestCompletedLevel >= 1 && playerState.coins >= 30 && playerState.lives < 5
    },
    {
      type: 'hintFlower' as const,
      name: 'HINT FLOWER',
      icon: '🌸',
      cost: 20,
      requiredLevel: 2,
      isUnlocked: highestCompletedLevel >= 2,
      description: 'Menghilangkan 2 pilihan jawaban salah (50:50) pada 1 pertanyaan.',
      owned: playerState.powerUps.hintFlower,
      canBuy: highestCompletedLevel >= 2 && playerState.coins >= 20
    },
    {
      type: 'shield' as const,
      name: 'SHIELD PERISAI',
      icon: '🛡️',
      cost: 40,
      requiredLevel: 3,
      isUnlocked: highestCompletedLevel >= 3,
      description: 'Melindungi dari 1 jawaban salah atau 1 serangan Enemy tanpa kehilangan nyawa.',
      owned: playerState.powerUps.shield,
      canBuy: highestCompletedLevel >= 3 && playerState.coins >= 40
    },
    {
      type: 'superStar' as const,
      name: 'SUPER STAR',
      icon: '⭐',
      cost: 50,
      requiredLevel: 4,
      isUnlocked: highestCompletedLevel >= 4,
      description: 'Menggandakan perolehan poin dan combo untuk 3 jawaban benar berikutnya.',
      owned: playerState.powerUps.superStar,
      canBuy: highestCompletedLevel >= 4 && playerState.coins >= 50
    }
  ];

  return (
    <div className="fixed inset-0 z-[100000] flex items-center justify-center p-2 sm:p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200 overflow-y-auto">
      <div className="bg-gradient-to-b from-slate-900 to-slate-950 border-2 border-amber-500/40 rounded-3xl max-w-xl w-full p-4 sm:p-8 max-h-[92vh] overflow-y-auto shadow-2xl relative text-white">
        {/* Glow */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl pointer-events-none"></div>

        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800 mb-6">
          <div className="flex items-center gap-3">
            <span className="text-3xl">🛒</span>
            <div>
              <h2 className="text-xl font-black text-amber-300 tracking-wide">
                POWER-UP SHOP
              </h2>
              <p className="text-xs text-slate-400">Tukarkan koin petualangmu untuk membeli bantuan</p>
            </div>
          </div>

          {/* Coin Badge */}
          <div className="px-4 py-2 rounded-2xl bg-amber-500/20 border border-amber-500/40 text-amber-300 font-black text-sm flex items-center gap-2 shadow-inner">
            <span className="text-lg">🪙</span>
            <span>{playerState.coins} Koin</span>
          </div>
        </div>

        {/* Items List */}
        <div className="space-y-3.5 mb-6">
          {shopItems.map((item) => (
            <div
              key={item.type}
              className={`p-4 rounded-2xl border flex items-center justify-between gap-4 transition-all ${
                item.isUnlocked
                  ? 'bg-slate-800/60 border-slate-700/70 hover:border-slate-600'
                  : 'bg-slate-900/40 border-slate-800/80 opacity-75'
              }`}
            >
              <div className="flex items-center gap-3.5">
                <span className={`text-3xl p-2 rounded-2xl bg-slate-900 border shrink-0 ${
                  item.isUnlocked ? 'border-slate-800' : 'border-slate-800/60 grayscale'
                }`}>
                  {item.icon}
                </span>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className={`font-bold text-sm ${item.isUnlocked ? 'text-slate-100' : 'text-slate-400'}`}>
                      {item.name}
                    </h3>
                    {item.owned > 0 && (
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-700 text-slate-300 font-semibold">
                        Dimiliki: {item.owned}
                      </span>
                    )}
                    {!item.isUnlocked && (
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 font-bold flex items-center gap-1">
                        🔒 Selesaikan Level {item.requiredLevel}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5 leading-snug">{item.description}</p>
                </div>
              </div>

              {!item.isUnlocked ? (
                <div className="px-3 py-2 rounded-xl text-[11px] font-bold bg-slate-800 text-slate-500 border border-slate-700/60 shrink-0 flex items-center gap-1">
                  <span>🔒 Terkunci</span>
                </div>
              ) : (
                <button
                  disabled={!item.canBuy}
                  onClick={() => {
                    sound.playPowerUp();
                    onBuyItem(item.type, item.cost);
                  }}
                  className={`px-4 py-2.5 rounded-xl text-xs font-black shrink-0 transition-transform active:scale-95 flex items-center gap-1.5 ${
                    item.canBuy
                      ? 'bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-slate-950 shadow-md cursor-pointer'
                      : 'bg-slate-800 text-slate-500 border border-slate-700 cursor-not-allowed opacity-60'
                  }`}
                >
                  <span>🪙 {item.cost}</span>
                  <span>• Beli</span>
                </button>
              )}
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="flex justify-end pt-2">
          <button
            onClick={onClose}
            className="px-6 py-2.5 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-sm transition-colors border border-slate-700"
          >
            Tutup Toko ✕
          </button>
        </div>
      </div>
    </div>
  );
}
