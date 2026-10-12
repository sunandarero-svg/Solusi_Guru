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
  const shopItems = [
    {
      type: 'mushroom' as const,
      name: 'SUPER MUSHROOM',
      icon: '🍄',
      cost: 30,
      description: 'Menambah satu nyawa ekstra (Maksimal 5 nyawa).',
      owned: playerState.powerUps.mushroom,
      canBuy: playerState.coins >= 30 && playerState.lives < 5
    },
    {
      type: 'hintFlower' as const,
      name: 'HINT FLOWER',
      icon: '🌸',
      cost: 20,
      description: 'Menghilangkan 2 pilihan jawaban salah (50:50) pada 1 pertanyaan.',
      owned: playerState.powerUps.hintFlower,
      canBuy: playerState.coins >= 20
    },
    {
      type: 'superStar' as const,
      name: 'SUPER STAR',
      icon: '⭐',
      cost: 50,
      description: 'Menggandakan perolehan poin dan combo untuk 3 jawaban benar berikutnya.',
      owned: playerState.powerUps.superStar,
      canBuy: playerState.coins >= 50
    },
    {
      type: 'shield' as const,
      name: 'SHIELD PERISAI',
      icon: '🛡️',
      cost: 40,
      description: 'Melindungi dari 1 jawaban salah atau 1 serangan Enemy tanpa kehilangan nyawa.',
      owned: playerState.powerUps.shield,
      canBuy: playerState.coins >= 40
    }
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-gradient-to-b from-slate-900 to-slate-950 border-2 border-amber-500/40 rounded-3xl max-w-xl w-full p-6 sm:p-8 shadow-2xl relative overflow-hidden text-white">
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
              className="p-4 rounded-2xl bg-slate-800/60 border border-slate-700/70 flex items-center justify-between gap-4 hover:border-slate-600 transition-all"
            >
              <div className="flex items-center gap-3.5">
                <span className="text-3xl p-2 rounded-2xl bg-slate-900 border border-slate-800 shrink-0">
                  {item.icon}
                </span>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-sm text-slate-100">{item.name}</h3>
                    {item.owned > 0 && (
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-700 text-slate-300 font-semibold">
                        Dimiliki: {item.owned}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5 leading-snug">{item.description}</p>
                </div>
              </div>

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
