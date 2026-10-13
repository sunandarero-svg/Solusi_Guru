"use client";

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useSession } from 'next-auth/react';
import { PlayerState, QuestionItem, TeacherConfig } from './types';
import {
  DEFAULT_TEACHER_CONFIG,
  createInitialPlayerState,
  getSavedPlayerState,
  savePlayerStateToLocal,
  getSavedConfig,
  getStoredQuestions,
  calculateFinalScore,
  evaluateBadges
} from './storage';
import { sound } from './audio';
import { WORLD_DEFINITIONS } from './defaultQuestions';
import PlatformerCanvas from './PlatformerCanvas';
import QuestionModal from './QuestionModal';
import BossBattleModal from './BossBattleModal';
import PowerUpShopModal from './PowerUpShopModal';
import GameOverModal from './GameOverModal';
import VictoryModal from './VictoryModal';
import PrestasiPageModal from './PrestasiPageModal';
import PetunjukModal from './PetunjukModal';
import WorldSelectModal from './WorldSelectModal';
import MejaGuruModal from './MejaGuruModal';

// Fisher-Yates array shuffle for randomizing questions across classes
function shuffleQuestions<T>(array: T[]): T[] {
  const copy = [...array];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

export default function BorneoEduGame() {
  const { data: session } = useSession();

  // Screen / Modal view states
  const [gameState, setGameState] = useState<
    'MENU' | 'PLAYING' | 'QUESTION' | 'BOSS' | 'SHOP' | 'PRESTASI' | 'WORLD_SELECT' | 'PETUNJUK' | 'MEJA_GURU' | 'GAME_OVER' | 'VICTORY'
  >('MENU');

  // Player State
  const [playerState, setPlayerState] = useState<PlayerState>(() => {
    const saved = getSavedPlayerState();
    if (saved) return saved;
    return createInitialPlayerState();
  });

  // Teacher Config
  const [teacherConfig, setTeacherConfig] = useState<TeacherConfig>(() => getSavedConfig());

  // Questions Bank
  const [allQuestions, setAllQuestions] = useState<QuestionItem[]>(() => getStoredQuestions());

  // Current In-game question state
  const [currentTriggeredQuestion, setCurrentTriggeredQuestion] = useState<QuestionItem | null>(null);
  const [isEnemyTrigger, setIsEnemyTrigger] = useState<boolean>(false);
  const [currentEnemyId, setCurrentEnemyId] = useState<string | undefined>(undefined);
  const [defeatedEnemyId, setDefeatedEnemyId] = useState<string | null>(null);

  // Audio / Display settings
  const [isMuted, setIsMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const gameContainerRef = useRef<HTMLDivElement | null>(null);

  // Sync / Persist progress automatically
  const persistState = useCallback((stateToSave: PlayerState) => {
    savePlayerStateToLocal(stateToSave);

    // Sync to backend API
    fetch('/api/borneo-edu/results', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(stateToSave)
    }).catch(() => {});
  }, []);

  // Update player state helper with auto-save
  const updatePlayer = useCallback((updater: (prev: PlayerState) => PlayerState) => {
    setPlayerState((prev) => {
      const updated = updater(prev);
      persistState(updated);
      return updated;
    });
  }, [persistState]);

  // Auto-fill student profile from registered account database
  useEffect(() => {
    fetch('/api/borneo-edu/student-info')
      .then((res) => res.json())
      .then((data) => {
        if (data && data.studentName) {
          updatePlayer((prev) => ({
            ...prev,
            studentName: data.studentName,
            // Keep customized absent number if student modified it, otherwise use registered studentNumber
            studentNumber: prev.studentNumber && prev.studentNumber !== '01' ? prev.studentNumber : (data.studentNumber || '01'),
            className: data.className || prev.className || 'Kelas 7A'
          }));
        }
      })
      .catch(() => {
        if (session?.user?.email) {
          const emailName = session.user.email.split('@')[0];
          const defaultName = session.user.name || (emailName ? emailName.toUpperCase() : 'Siswa');
          setPlayerState((prev) => {
            if (prev.studentName === 'Siswa Petualang') {
              return {
                ...prev,
                studentName: defaultName
              };
            }
            return prev;
          });
        }
      });
  }, [session, updatePlayer]);

  // Load and shuffle questions for class
  useEffect(() => {
    fetch('/api/borneo-edu/questions')
      .then((res) => res.json())
      .then((resData) => {
        if (resData?.data && Array.isArray(resData.data) && resData.data.length > 0) {
          setAllQuestions(shuffleQuestions(resData.data));
        }
      })
      .catch(() => {});
  }, []);

  // Mobile Orientation & Landscape helper
  const [isPortraitMobile, setIsPortraitMobile] = useState<boolean>(false);
  const [isLandscapeMobile, setIsLandscapeMobile] = useState<boolean>(false);
  const [showOrientationBanner, setShowOrientationBanner] = useState<boolean>(true);

  useEffect(() => {
    const checkOrientation = () => {
      if (typeof window === 'undefined') return;
      const w = window.innerWidth;
      const h = window.innerHeight;
      const isMobileDevice =
        Math.min(w, h) <= 650 ||
        (w <= 1024 && h <= 650) ||
        /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent || '');
      const isLandscapeMedia =
        window.matchMedia?.('(orientation: landscape)').matches ?? (w > h);
      const isPortrait = !isLandscapeMedia || h > w;
      const isLandscape = (isLandscapeMedia || w > h) && w > h;

      setIsPortraitMobile(isMobileDevice && isPortrait);
      setIsLandscapeMobile(isMobileDevice && isLandscape);
    };

    checkOrientation();
    window.addEventListener('resize', checkOrientation);
    window.addEventListener('orientationchange', checkOrientation);

    const mql = window.matchMedia?.('(orientation: landscape)');
    if (mql?.addEventListener) {
      mql.addEventListener('change', checkOrientation);
    }

    return () => {
      window.removeEventListener('resize', checkOrientation);
      window.removeEventListener('orientationchange', checkOrientation);
      if (mql?.removeEventListener) {
        mql.removeEventListener('change', checkOrientation);
      }
    };
  }, []);

  // Sync fullscreen state with document fullscreenchange
  useEffect(() => {
    const handleFsChange = () => {
      if (typeof document === 'undefined') return;
      const isFs = !!(
        document.fullscreenElement ||
        (document as any).webkitFullscreenElement ||
        (document as any).mozFullScreenElement
      );
      if (!isFs && !isLandscapeMobile) {
        setIsFullscreen(false);
      }
    };

    document.addEventListener('fullscreenchange', handleFsChange);
    document.addEventListener('webkitfullscreenchange', handleFsChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFsChange);
      document.removeEventListener('webkitfullscreenchange', handleFsChange);
    };
  }, [isLandscapeMobile]);

  // Handle Fullscreen & Landscape Toggle
  const toggleFullscreen = () => {
    const elem = gameContainerRef.current as any;
    if (!isFullscreen) {
      setIsFullscreen(true);
      if (elem) {
        if (elem.requestFullscreen) {
          elem.requestFullscreen().catch(() => {});
        } else if (elem.webkitRequestFullscreen) {
          elem.webkitRequestFullscreen();
        } else if (elem.mozRequestFullScreen) {
          elem.mozRequestFullScreen();
        } else if (elem.msRequestFullscreen) {
          elem.msRequestFullscreen();
        }
      }
      try {
        if (typeof window !== 'undefined' && typeof window.screen !== 'undefined' && window.screen.orientation && 'lock' in window.screen.orientation) {
          (window.screen.orientation as any).lock('landscape').catch(() => {});
        }
      } catch (_) {}
    } else {
      setIsFullscreen(false);
      if (typeof document !== 'undefined') {
        const doc = document as any;
        if (doc.fullscreenElement || doc.webkitFullscreenElement || doc.mozFullScreenElement) {
          if (document.exitFullscreen) {
            document.exitFullscreen().catch(() => {});
          } else if (doc.webkitExitFullscreen) {
            doc.webkitExitFullscreen();
          } else if (doc.mozCancelFullScreen) {
            doc.mozCancelFullScreen();
          }
        }
      }
      try {
        if (typeof window !== 'undefined' && typeof window.screen !== 'undefined' && window.screen.orientation && 'unlock' in window.screen.orientation) {
          (window.screen.orientation as any).unlock();
        }
      } catch (_) {}
    }
  };

  // Toggle Mute
  const toggleSound = () => {
    const newMuted = !isMuted;
    setIsMuted(newMuted);
    sound.setMute(newMuted);
  };

  // Start BGM on World load
  useEffect(() => {
    if (gameState === 'PLAYING') {
      sound.startBgm(playerState.currentWorld);
    } else {
      sound.stopBgm();
    }
  }, [gameState, playerState.currentWorld]);

  // Current level's questions (acak untuk setiap sesi kelas)
  const activeLevelQuestions = useMemo(() => {
    const currentLevelQuestions = allQuestions.filter(
      (q) => q.world === playerState.currentWorld && q.level === playerState.currentLevel && !q.isBossQuestion
    );
    const pool = currentLevelQuestions.length > 0 ? currentLevelQuestions : allQuestions.filter((q) => !q.isBossQuestion);
    return shuffleQuestions(pool);
  }, [allQuestions, playerState.currentWorld, playerState.currentLevel]);

  // Boss questions
  const currentBossQuestions = useMemo(() => {
    return allQuestions.filter(
      (q) => q.world === playerState.currentWorld && q.level === playerState.currentLevel && q.isBossQuestion
    );
  }, [allQuestions, playerState.currentWorld, playerState.currentLevel]);

  const backupBossQuestions = useMemo(() => {
    return allQuestions.filter(
      (q) => q.isBossQuestion && q.world === playerState.currentWorld
    );
  }, [allQuestions, playerState.currentWorld]);

  // Start / Continue Game
  const handleStartGame = () => {
    sound.playPowerUp();
    setGameState('PLAYING');
    if (typeof window !== 'undefined') {
      const isMobileDevice = window.innerWidth <= 1024 || window.innerHeight <= 650;
      if (isMobileDevice) {
        setIsFullscreen(true);
        const elem = gameContainerRef.current as any;
        if (elem) {
          if (elem.requestFullscreen) {
            elem.requestFullscreen().catch(() => {});
          } else if (elem.webkitRequestFullscreen) {
            elem.webkitRequestFullscreen();
          }
        }
        try {
          if (window.screen?.orientation && 'lock' in window.screen.orientation) {
            (window.screen.orientation as any).lock('landscape').catch(() => {});
          }
        } catch (_) {}
      }
    }
  };

  // Select Level
  const handleSelectLevel = (worldId: number, levelId: number) => {
    updatePlayer((prev) => ({
      ...prev,
      currentWorld: worldId,
      currentLevel: levelId,
      checkpointScore: prev.score,
      checkpointCoins: prev.coins
    }));
    sound.playPowerUp();
    setGameState('PLAYING');
    if (typeof window !== 'undefined') {
      const isMobileDevice = window.innerWidth <= 1024 || window.innerHeight <= 650;
      if (isMobileDevice) {
        setIsFullscreen(true);
      }
    }
  };

  // Coin collected in arena
  const handleCollectCoin = useCallback((amount: number) => {
    updatePlayer((prev) => ({
      ...prev,
      coins: prev.coins + amount
    }));
  }, [updatePlayer]);

  // PowerUp collected in arena
  const handleCollectPowerUp = useCallback((type: 'mushroom' | 'hintFlower' | 'superStar' | 'shield') => {
    updatePlayer((prev) => {
      const pu = { ...prev.powerUps };
      pu[type] = (pu[type] || 0) + 1;
      let newLives = prev.lives;
      let shieldActive = prev.shieldActive;
      let starBoost = prev.starBoostCount;

      if (type === 'mushroom' && newLives < 5) {
        newLives += 1;
      }
      if (type === 'shield') {
        shieldActive = true;
      }
      if (type === 'superStar') {
        starBoost = 3;
      }

      return {
        ...prev,
        lives: newLives,
        powerUps: pu,
        shieldActive,
        starBoostCount: starBoost
      };
    });
  }, [updatePlayer]);

  // Player touched Question block or Enemy
  const handleTriggerQuestion = (q: QuestionItem, isEnemy: boolean, enemyId?: string) => {
    setCurrentTriggeredQuestion(q);
    setIsEnemyTrigger(isEnemy);
    setCurrentEnemyId(enemyId);
    setGameState('QUESTION');
  };

  // Question Answer Resolved
  const handleAnswerResolved = (
    isCorrect: boolean,
    timeSpent: number,
    chosenOption: string,
    pointsEarned: number,
    coinsEarned: number
  ) => {
    if (!currentTriggeredQuestion) return;

    updatePlayer((prev) => {
      let lives = prev.lives;
      let combo = prev.combo;
      let highestCombo = prev.highestCombo;
      let shieldActive = prev.shieldActive;
      let starBoost = prev.starBoostCount;
      const pu = { ...prev.powerUps };

      if (isCorrect) {
        combo += 1;
        if (combo > highestCombo) highestCombo = combo;
        if (starBoost > 0) starBoost -= 1;
      } else {
        combo = 0;
        // Shield absorption
        if (shieldActive || pu.shield > 0) {
          sound.playShieldDeflect();
          shieldActive = false;
          if (pu.shield > 0) pu.shield -= 1;
        } else {
          lives -= 1;
        }
      }

      const totalCorrect = prev.correctCount + (isCorrect ? 1 : 0);
      const totalWrong = prev.wrongCount + (isCorrect ? 0 : 1);
      const totalQ = totalCorrect + totalWrong;
      const acc = totalQ > 0 ? Math.round((totalCorrect / totalQ) * 100) : 0;

      const newHistory = [
        ...(prev.questionHistory || []),
        {
          questionId: currentTriggeredQuestion.questionId,
          questionText: currentTriggeredQuestion.question,
          chosenOption,
          correctAnswer: currentTriggeredQuestion.correctAnswer,
          isCorrect,
          timeSpentSeconds: timeSpent,
          difficulty: currentTriggeredQuestion.difficulty,
          world: currentTriggeredQuestion.world,
          level: currentTriggeredQuestion.level,
          timestamp: new Date().toISOString()
        }
      ];

      const evaluatedBadges = evaluateBadges({
        completedLevels: prev.completedLevels,
        score: prev.score + pointsEarned,
        accuracy: acc,
        highestCombo,
        bossesDefeated: prev.bossesDefeated
      }, teacherConfig);

      const isDead = lives <= 0;

      return {
        ...prev,
        lives: Math.max(0, lives),
        coins: prev.coins + coinsEarned,
        score: prev.score + pointsEarned,
        combo,
        highestCombo,
        correctCount: totalCorrect,
        wrongCount: totalWrong,
        shieldActive,
        starBoostCount: starBoost,
        powerUps: pu,
        badges: evaluatedBadges,
        questionHistory: newHistory,
        gameStatus: isDead ? 'Game Over' : prev.gameStatus
      };
    });

    // If answered correctly on enemy challenge, defeat the enemy
    if (isEnemyTrigger && isCorrect && currentEnemyId) {
      setDefeatedEnemyId(currentEnemyId);
    }

    // Check if player died
    if (playerState.lives <= 1 && !isCorrect && !playerState.shieldActive && playerState.powerUps.shield <= 0) {
      setTimeout(() => {
        setGameState('GAME_OVER');
      }, 800);
    }
  };

  // Jika salah saat terkena musuh, muncul pertanyaan lainnya
  const handleNextEnemyQuestion = () => {
    const remaining = allQuestions.filter(
      (q) => q.questionId !== currentTriggeredQuestion?.questionId && !q.isBossQuestion
    );
    const nextQ = remaining[Math.floor(Math.random() * remaining.length)] || allQuestions[0];
    setCurrentTriggeredQuestion(nextQ);
  };

  // Close question modal
  const handleCloseQuestionModal = () => {
    if (playerState.lives <= 0) {
      setGameState('GAME_OVER');
    } else {
      setGameState('PLAYING');
    }
    setCurrentTriggeredQuestion(null);
    setIsEnemyTrigger(false);
    setCurrentEnemyId(undefined);
  };

  // Pit Fall
  const handlePlayerFell = () => {
    updatePlayer((prev) => {
      let lives = prev.lives;
      let shieldActive = prev.shieldActive;
      const pu = { ...prev.powerUps };

      if (shieldActive || pu.shield > 0) {
        sound.playShieldDeflect();
        shieldActive = false;
        if (pu.shield > 0) pu.shield -= 1;
      } else {
        lives -= 1;
        sound.playWrong();
      }

      return {
        ...prev,
        lives: Math.max(0, lives),
        shieldActive,
        powerUps: pu
      };
    });

    if (playerState.lives <= 1 && !playerState.shieldActive && playerState.powerUps.shield <= 0) {
      setGameState('GAME_OVER');
    }
  };

  // Reach Finish Flag (Level Completed)
  const handleReachFinish = () => {
    sound.playPowerUp();
    const currentLvl = playerState.currentLevel;
    const isLastOfWorld = currentLvl % 5 === 0;

    updatePlayer((prev) => {
      const completed = Array.from(new Set([...prev.completedLevels, currentLvl]));
      let nextLvl = currentLvl + 1;
      let nextWorld = prev.currentWorld;
      let completedWorlds = prev.completedWorlds;

      if (isLastOfWorld && nextWorld < 5) {
        nextWorld += 1;
        completedWorlds += 1;
      }
      if (nextLvl > 25) nextLvl = 25;

      return {
        ...prev,
        coins: prev.coins + 25, // Level completion reward (+25 coins)
        completedLevels: completed,
        currentLevel: nextLvl,
        currentWorld: nextWorld,
        completedWorlds,
        checkpointScore: prev.score,
        checkpointCoins: prev.coins + 25
      };
    });

    alert(`🎉 LEVEL ${currentLvl} SELESAI!\nKamu mendapatkan +25 Koin Petualangan!`);
  };

  // Trigger Boss Battle
  const handleTriggerBossBattle = () => {
    setGameState('BOSS');
  };

  // Boss Defeated
  const handleBossDefeated = (totalScoreGained: number, totalCoinsGained: number) => {
    const isFinal = playerState.currentLevel === 25;

    updatePlayer((prev) => {
      const completed = Array.from(new Set([...prev.completedLevels, prev.currentLevel]));
      const defeated = Math.min(5, prev.bossesDefeated + 1);
      const nextWorld = Math.min(5, prev.currentWorld + 1);
      const nextLvl = Math.min(25, prev.currentLevel + 1);

      return {
        ...prev,
        score: prev.score + totalScoreGained,
        coins: prev.coins + totalCoinsGained,
        completedLevels: completed,
        bossesDefeated: defeated,
        currentWorld: nextWorld,
        currentLevel: nextLvl,
        gameStatus: isFinal ? 'Selesai' : prev.gameStatus
      };
    });

    if (isFinal) {
      sound.playVictoryFanfare();
      setGameState('VICTORY');
    } else {
      alert(`🏆 BOSS DEFEATED!\nKamu mendapatkan +${totalScoreGained} Poin dan +${totalCoinsGained} Koin! World berikutnya terbuka!`);
      setGameState('PLAYING');
    }
  };

  // Boss damage to player
  const handlePlayerDamage = () => {
    updatePlayer((prev) => {
      let lives = prev.lives;
      let shieldActive = prev.shieldActive;
      const pu = { ...prev.powerUps };

      if (shieldActive || pu.shield > 0) {
        sound.playShieldDeflect();
        shieldActive = false;
        if (pu.shield > 0) pu.shield -= 1;
      } else {
        lives -= 1;
      }

      return {
        ...prev,
        lives: Math.max(0, lives),
        shieldActive,
        powerUps: pu
      };
    });
  };

  // Buy PowerUp in Shop
  const handleBuyItem = (type: 'mushroom' | 'hintFlower' | 'superStar' | 'shield', cost: number) => {
    updatePlayer((prev) => {
      if (prev.coins < cost) return prev;
      const pu = { ...prev.powerUps };
      pu[type] = (pu[type] || 0) + 1;
      let newLives = prev.lives;
      let shieldActive = prev.shieldActive;
      let starBoost = prev.starBoostCount;

      if (type === 'mushroom' && newLives < 5) newLives += 1;
      if (type === 'shield') shieldActive = true;
      if (type === 'superStar') starBoost = 3;

      return {
        ...prev,
        coins: prev.coins - cost,
        lives: newLives,
        powerUps: pu,
        shieldActive,
        starBoostCount: starBoost
      };
    });
  };

  // Retry on Game Over
  const handleRetryGameOver = () => {
    sound.playPowerUp();
    updatePlayer((prev) => ({
      ...prev,
      lives: 3,
      score: prev.checkpointScore || prev.score,
      coins: prev.checkpointCoins || prev.coins,
      combo: 0,
      gameStatus: 'Sedang Berjalan'
    }));
    setGameState('PLAYING');
  };

  // Reset Progress from scratch (with confirmation)
  const handleResetProgressFromScratch = () => {
    const fresh = createInitialPlayerState(
      playerState.studentName,
      playerState.className,
      playerState.studentNumber,
      playerState.subject,
      playerState.materi
    );
    setPlayerState(fresh);
    persistState(fresh);
    setGameState('MENU');
    alert('Permainan berhasil diulang dari awal (World 1 Level 1).');
  };

  const currentWorldDef = WORLD_DEFINITIONS.find((w) => w.id === playerState.currentWorld) || WORLD_DEFINITIONS[0];
  const isEdgeToEdge = isFullscreen || isLandscapeMobile;

  return (
    <div
      ref={gameContainerRef}
      className={`w-full ${
        isEdgeToEdge
          ? `fixed inset-0 z-[99999] bg-slate-950 p-0 m-0 w-screen h-screen min-h-[100dvh] max-h-[100dvh] max-w-[100dvw] flex flex-col rounded-none border-none ${
              gameState === 'MENU'
                ? 'overflow-y-auto overscroll-contain touch-pan-y'
                : 'overflow-hidden justify-between'
            }`
          : 'min-h-[520px] landscape:min-h-0 bg-slate-950 rounded-2xl sm:rounded-3xl p-2 sm:p-6 shadow-2xl relative font-sans text-white border-2 border-slate-800 flex flex-col overflow-y-auto overscroll-contain max-h-[100dvh]'
      }`}
      style={isEdgeToEdge && gameState === 'MENU' ? { WebkitOverflowScrolling: 'touch' } : undefined}
    >
      {/* Smartphone Portrait Orientation Prompt */}
      {isPortraitMobile && showOrientationBanner && (
        <div className="relative z-30 mb-3 p-3 sm:p-4 rounded-2xl bg-gradient-to-r from-amber-500/20 via-yellow-500/20 to-emerald-500/20 border-2 border-amber-400/50 backdrop-blur-md shadow-xl flex items-center justify-between gap-3 text-white animate-in slide-in-from-top duration-300">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-amber-500/30 flex items-center justify-center text-xl shrink-0 animate-bounce">
              🔄
            </div>
            <div>
              <p className="text-xs sm:text-sm font-black text-amber-300 flex items-center gap-1.5">
                <span>Mode Lanskap Direkomendasikan</span>
                <span className="text-[10px] px-1.5 py-0.2 rounded bg-amber-400/20 text-amber-200 border border-amber-400/30">Smartphone</span>
              </p>
              <p className="text-[11px] text-slate-300 leading-snug">
                Putar smartphone Anda ke posisi mendatar (landscape) untuk tampilan layar penuh dan kontrol tombol yang nyaman.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={toggleFullscreen}
              className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-amber-400 to-yellow-400 hover:from-amber-300 hover:to-yellow-300 text-slate-950 font-black text-xs shadow-md transition-transform active:scale-95 flex items-center gap-1"
            >
              <span>⛶</span>
              <span>Lanskap Penuh</span>
            </button>
            <button
              onClick={() => setShowOrientationBanner(false)}
              className="p-1 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white text-xs"
              title="Tutup Saran"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 1. HALAMAN UTAMA (MAIN MENU) */}
      {/* ========================================================================= */}
      {gameState === 'MENU' && (
        <div
          className={`relative w-full flex flex-col justify-between p-3 sm:p-8 landscape:p-3 landscape:py-2.5 min-h-full ${
            isEdgeToEdge
              ? 'rounded-none border-none bg-gradient-to-b from-teal-950 via-emerald-950 to-slate-950'
              : 'rounded-2xl sm:rounded-3xl border-2 border-slate-800 bg-gradient-to-b from-teal-950 via-emerald-950 to-slate-950'
          }`}
        >
          {/* Animated Background Decor */}
          <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none"></div>
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none"></div>

          {/* Floating Coins Decor */}
          <div className="hidden sm:block landscape:hidden absolute top-16 left-12 text-3xl animate-bounce">🪙</div>
          <div className="hidden sm:block landscape:hidden absolute top-28 right-24 text-2xl animate-bounce delay-300">🪙</div>
          <div className="hidden sm:block landscape:hidden absolute bottom-28 left-20 text-2xl animate-bounce delay-500">🪙</div>

          {/* Top Bar on Main Menu */}
          <div className="relative z-10 flex items-center justify-between gap-3">
            {/* Audio & Landscape Mode Buttons */}
            <div className="flex items-center gap-2">
              <button
                onClick={toggleSound}
                className="px-3 py-1.5 rounded-xl bg-slate-900/80 hover:bg-slate-800 text-xs font-bold text-slate-300 border border-slate-700 backdrop-blur-md shadow-md flex items-center gap-1.5"
                title="Pengaturan Suara"
              >
                <span>{isMuted ? '🔇' : '🔊'}</span>
                <span>{isMuted ? 'Muted' : 'Audio On'}</span>
              </button>
              <button
                onClick={toggleFullscreen}
                className="px-3 py-1.5 rounded-xl bg-slate-900/80 hover:bg-slate-800 text-xs font-bold text-amber-300 border border-amber-500/40 backdrop-blur-md shadow-md flex items-center gap-1.5"
                title="Mode Layar Penuh Lanskap"
              >
                <span>{isFullscreen ? '🗗' : '⛶'}</span>
                <span>{isFullscreen ? 'Exit Fullscreen' : 'Mode Lanskap'}</span>
              </button>
            </div>

            {/* Quick Student Features */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => setGameState('PETUNJUK')}
                className="px-3 py-1.5 rounded-xl bg-slate-900/80 hover:bg-slate-800 text-xs font-bold text-emerald-300 border border-emerald-500/40 backdrop-blur-md shadow-md flex items-center gap-1.5"
              >
                <span>📖</span>
                <span className="hidden sm:inline">Petunjuk</span>
              </button>
              <button
                onClick={() => setGameState('PRESTASI')}
                className="px-3 py-1.5 rounded-xl bg-slate-900/80 hover:bg-slate-800 text-xs font-bold text-yellow-300 border border-yellow-500/40 backdrop-blur-md shadow-md flex items-center gap-1.5"
              >
                <span>🏆</span>
                <span className="hidden sm:inline">Prestasi</span>
              </button>
            </div>
          </div>

          {/* Hero Banner: Large Game Title & Slogan */}
          <div className="relative z-10 text-center my-2 sm:my-6 landscape:my-1.5 shrink-0">
            <div className="inline-block px-3 py-0.5 sm:px-4 sm:py-1 rounded-full bg-emerald-500/20 border border-emerald-400/40 text-emerald-300 text-[10px] sm:text-xs font-black uppercase tracking-widest mb-1 sm:mb-2">
              SUPER MARIO EDU • EDISI BORNEO
            </div>
            <h1 className="text-3xl sm:text-6xl landscape:text-2xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-emerald-300 to-teal-200 drop-shadow-md">
              BORNEO EDU
            </h1>
            <p className="text-xs sm:text-xl landscape:text-xs font-extrabold text-amber-300 mt-0.5 sm:mt-1 tracking-wide drop-shadow">
              "Petualangan Belajar, Kumpulkan Koin, Taklukkan Tantangan!"
            </p>
          </div>

          {/* Student Identity Card */}
          <div className="relative z-10 max-w-xl mx-auto w-full p-3 sm:p-4 landscape:p-2.5 rounded-2xl bg-slate-900/90 border border-slate-700/80 backdrop-blur-md mb-3 sm:mb-6 landscape:mb-2 shadow-xl shrink-0">
            <div className="flex items-center justify-between pb-1.5 border-b border-slate-800 mb-2">
              <span className="text-xs font-black text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                <span>🎒</span>
                <span>Identitas Siswa Petualang</span>
              </span>
              <span className="text-[10px] text-slate-400">Login Otomatis</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 landscape:grid-cols-3 gap-2">
              <div>
                <label className="text-[10px] text-slate-400 block mb-0.5 font-bold flex items-center justify-between">
                  <span>Nama Siswa</span>
                  <span className="text-[9px] text-amber-400/90 font-medium">🔒 Terkunci</span>
                </label>
                <input
                  type="text"
                  value={playerState.studentName}
                  readOnly
                  disabled
                  className="w-full px-2.5 py-1 rounded-xl bg-slate-800/60 border border-slate-700/80 text-xs font-bold text-slate-300 cursor-not-allowed select-none opacity-90 focus:outline-none"
                  title="Nama siswa terkunci sesuai akun yang terdaftar"
                />
              </div>
              <div>
                <label className="text-[10px] text-slate-400 block mb-0.5 font-bold flex items-center justify-between">
                  <span>Nomor Absen</span>
                  <span className="text-[9px] text-emerald-400 font-semibold">✏️ Bisa Diedit</span>
                </label>
                <input
                  type="text"
                  value={playerState.studentNumber}
                  onChange={(e) => updatePlayer((p) => ({ ...p, studentNumber: e.target.value }))}
                  className="w-full px-2.5 py-1 rounded-xl bg-slate-800 border border-emerald-500/80 ring-1 ring-emerald-500/40 text-xs font-bold text-white focus:outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/50"
                  placeholder="No. Absen"
                  title="Nomor absen siswa (dapat diubah)"
                />
              </div>
              <div>
                <label className="text-[10px] text-slate-400 block mb-0.5 font-bold flex items-center justify-between">
                  <span>Kelas</span>
                  <span className="text-[9px] text-amber-400/90 font-medium">🔒 Terkunci</span>
                </label>
                <input
                  type="text"
                  value={playerState.className}
                  readOnly
                  disabled
                  className="w-full px-2.5 py-1 rounded-xl bg-slate-800/60 border border-slate-700/80 text-xs font-bold text-slate-300 cursor-not-allowed select-none opacity-90 focus:outline-none"
                  title="Kelas terkunci sesuai akun yang terdaftar"
                />
              </div>
            </div>

            {/* Quick Status Bar */}
            <div className="flex items-center justify-between mt-2 pt-1.5 border-t border-slate-800/80 text-[11px] sm:text-xs">
              <span className="text-slate-400">
                Nyawa: <strong className="text-red-400">❤️ {playerState.lives}</strong>
              </span>
              <span className="text-slate-400">
                Koin: <strong className="text-amber-400">🪙 {playerState.coins}</strong>
              </span>
              <span className="text-slate-400">
                Skor: <strong className="text-yellow-300">⭐ {playerState.score}</strong>
              </span>
              <span className="text-slate-400">
                Posisi: <strong className="text-emerald-400">W{playerState.currentWorld} L{playerState.currentLevel}</strong>
              </span>
            </div>
          </div>

          {/* Main Action Buttons Grid */}
          <div className="relative z-10 max-w-xl mx-auto w-full grid grid-cols-1 sm:grid-cols-2 landscape:grid-cols-2 gap-2 sm:gap-3 mb-3 sm:mb-6 landscape:mb-2 shrink-0">
            <button
              id="btn-mulai"
              onClick={handleStartGame}
              className="py-3 sm:py-3.5 px-6 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black text-sm sm:text-base shadow-xl transition-transform active:scale-95 flex items-center justify-center gap-2 col-span-1 sm:col-span-2 landscape:col-span-2 border border-emerald-300"
            >
              <span>🚀</span>
              <span>{playerState.completedLevels.length > 0 ? 'LANJUTKAN PETUALANGAN' : 'MULAI PETUALANGAN'}</span>
            </button>

            <button
              onClick={() => setGameState('WORLD_SELECT')}
              className="py-2.5 sm:py-3 px-4 rounded-2xl bg-slate-900/90 hover:bg-slate-800 text-slate-200 font-extrabold text-xs sm:text-sm border border-slate-700 shadow-md flex items-center justify-center gap-2 transition-transform active:scale-95"
            >
              <span>🗺️</span>
              <span>PILIH WORLD</span>
            </button>

            <button
              onClick={() => setGameState('PRESTASI')}
              className="py-2.5 sm:py-3 px-4 rounded-2xl bg-slate-900/90 hover:bg-slate-800 text-slate-200 font-extrabold text-xs sm:text-sm border border-slate-700 shadow-md flex items-center justify-center gap-2 transition-transform active:scale-95"
            >
              <span>🏆</span>
              <span>PRESTASI</span>
            </button>

            <button
              onClick={() => setGameState('PETUNJUK')}
              className="py-2.5 sm:py-3 px-4 rounded-2xl bg-slate-900/90 hover:bg-slate-800 text-slate-200 font-extrabold text-xs sm:text-sm border border-slate-700 shadow-md flex items-center justify-center gap-2 transition-transform active:scale-95 col-span-1 sm:col-span-2 landscape:col-span-2"
            >
              <span>📖</span>
              <span>PETUNJUK PERMAINAN</span>
            </button>
          </div>

          {/* Footer Requirement: Game Design by Sunandar Ero, S.Kom */}
          <div className="relative z-10 text-center pt-2 pb-6 landscape:pb-10 border-t border-slate-800/60 shrink-0">
            <p className="text-[10px] sm:text-[11px] text-slate-400 tracking-wide font-medium">
              Game Design by Sunandar Ero, S.Kom
            </p>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 2. IN-GAME ARENA & HUD */}
      {/* ========================================================================= */}
      {(gameState === 'PLAYING' || gameState === 'QUESTION' || gameState === 'BOSS') && (
        <div className="flex flex-col w-full h-full flex-1 min-h-0 bg-slate-950">
          {/* Top In-Game Heads-Up Display (HUD) */}
          <div className="px-2 py-1 landscape:py-0.5 landscape:px-2 bg-slate-900/95 border-b border-slate-800 flex items-center justify-between gap-1 shadow-md shrink-0 z-20">
            {/* Player Stats */}
            <div className="flex items-center gap-1.5 sm:gap-3">
              {/* Lives */}
              <div className="flex items-center gap-1 px-2 sm:px-3 py-1 rounded-lg sm:rounded-xl bg-slate-800 border border-slate-700">
                <span className="text-xs sm:text-sm">❤️</span>
                <span className="text-xs font-black text-rose-400">{playerState.lives}</span>
              </div>

              {/* Coins */}
              <div className="flex items-center gap-1 px-2 sm:px-3 py-1 rounded-lg sm:rounded-xl bg-slate-800 border border-slate-700">
                <span className="text-xs sm:text-sm">🪙</span>
                <span className="text-xs font-black text-amber-400">{playerState.coins}</span>
              </div>

              {/* Score */}
              <div className="flex items-center gap-1 px-2 sm:px-3 py-1 rounded-lg sm:rounded-xl bg-slate-800 border border-slate-700">
                <span className="text-xs sm:text-sm">⭐</span>
                <span className="text-xs font-black text-yellow-300">{playerState.score}</span>
              </div>

              {/* Combo */}
              {playerState.combo > 0 && (
                <div className="hidden sm:flex items-center gap-1 px-2 sm:px-3 py-1 rounded-xl bg-orange-500/20 border border-orange-500/40 animate-pulse">
                  <span className="text-sm">🔥</span>
                  <span className="text-xs font-black text-orange-400">{playerState.combo}x Combo</span>
                </div>
              )}

              {/* Active Power-Ups Indicators */}
              <div className="hidden sm:flex items-center gap-1">
                {playerState.shieldActive && (
                  <span className="px-2 py-0.5 rounded-lg bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 text-xs font-bold" title="Shield Aktif">
                    🛡️ Aktif
                  </span>
                )}
                {playerState.starBoostCount > 0 && (
                  <span className="px-2 py-0.5 rounded-lg bg-yellow-500/20 text-yellow-300 border border-yellow-500/40 text-xs font-bold" title="Super Star 2x Poin">
                    ⭐ 2x ({playerState.starBoostCount})
                  </span>
                )}
                {playerState.powerUps.hintFlower > 0 && (
                  <span className="px-2 py-0.5 rounded-lg bg-fuchsia-500/20 text-fuchsia-300 border border-fuchsia-500/40 text-xs font-bold" title="Hint Flower">
                    🌸 {playerState.powerUps.hintFlower}
                  </span>
                )}
              </div>
            </div>

            {/* Level Info & Action Buttons */}
            <div className="flex items-center gap-1.5 sm:gap-2">
              <div className="text-right hidden sm:block">
                <span className="text-[10px] text-slate-400 block font-bold uppercase">
                  W{playerState.currentWorld} • {currentWorldDef.name.split(' ')[0]}
                </span>
                <span className="text-xs font-black text-emerald-400">Level {playerState.currentLevel} / 25</span>
              </div>

              <button
                onClick={() => setGameState('SHOP')}
                className="px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg sm:rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 text-xs font-black border border-amber-500/40 shadow-sm"
              >
                🛒 <span className="hidden sm:inline">Shop</span>
              </button>

              <button
                onClick={toggleFullscreen}
                className="px-2 sm:px-2.5 py-1 sm:py-1.5 rounded-lg sm:rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-300 text-xs font-bold border border-slate-700 flex items-center gap-1"
                title="Layar Penuh Lanskap"
              >
                <span>{isFullscreen ? '🗗' : '⛶'}</span>
                <span className="hidden sm:inline">{isFullscreen ? 'Exit' : 'Lanskap'}</span>
              </button>

              <button
                onClick={toggleSound}
                className="p-1 sm:p-1.5 rounded-lg sm:rounded-xl bg-slate-800 text-slate-300 text-xs border border-slate-700"
                title="Pengaturan Suara"
              >
                {isMuted ? '🔇' : '🔊'}
              </button>

              <button
                onClick={() => setGameState('MENU')}
                className="px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg sm:rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold border border-slate-700"
              >
                <span className="hidden sm:inline">Menu </span>✕
              </button>
            </div>
          </div>

          {/* 2D Canvas Platformer Arena */}
          <PlatformerCanvas
            worldNumber={playerState.currentWorld}
            levelNumber={playerState.currentLevel}
            playerState={playerState}
            onTriggerQuestion={handleTriggerQuestion}
            onCollectCoin={handleCollectCoin}
            onCollectPowerUp={handleCollectPowerUp}
            onReachFinish={handleReachFinish}
            onTriggerBossBattle={handleTriggerBossBattle}
            onPlayerFell={handlePlayerFell}
            isPaused={gameState !== 'PLAYING'}
            levelQuestions={activeLevelQuestions}
            defeatedEnemyId={defeatedEnemyId}
            isFullscreen={isEdgeToEdge}
          />
        </div>
      )}

      {/* ========================================================================= */}
      {/* 3. QUESTION MODAL */}
      {/* ========================================================================= */}
      {gameState === 'QUESTION' && currentTriggeredQuestion && (
        <QuestionModal
          question={currentTriggeredQuestion}
          isEnemy={isEnemyTrigger}
          playerState={playerState}
          timeLimitSeconds={
            currentTriggeredQuestion.difficulty === 'EASY'
              ? teacherConfig.timeEasy
              : currentTriggeredQuestion.difficulty === 'MEDIUM'
              ? teacherConfig.timeMedium
              : teacherConfig.timeHard
          }
          onAnswerResolved={handleAnswerResolved}
          onUseHintFlower={() => {
            updatePlayer((prev) => ({
              ...prev,
              powerUps: {
                ...prev.powerUps,
                hintFlower: Math.max(0, prev.powerUps.hintFlower - 1)
              }
            }));
          }}
          onClose={handleCloseQuestionModal}
          onNextQuestion={handleNextEnemyQuestion}
        />
      )}

      {/* ========================================================================= */}
      {/* 4. BOSS BATTLE MODAL */}
      {/* ========================================================================= */}
      {gameState === 'BOSS' && (
        <BossBattleModal
          worldNumber={playerState.currentWorld}
          levelNumber={playerState.currentLevel}
          playerState={playerState}
          bossQuestions={currentBossQuestions}
          backupQuestions={backupBossQuestions}
          onBossDefeated={handleBossDefeated}
          onPlayerDamage={handlePlayerDamage}
          onGameOver={() => setGameState('GAME_OVER')}
          onUseHintFlower={() => {
            updatePlayer((prev) => ({
              ...prev,
              powerUps: {
                ...prev.powerUps,
                hintFlower: Math.max(0, prev.powerUps.hintFlower - 1)
              }
            }));
          }}
          onClose={() => setGameState('PLAYING')}
        />
      )}

      {/* ========================================================================= */}
      {/* 5. POWER-UP SHOP MODAL */}
      {/* ========================================================================= */}
      {gameState === 'SHOP' && (
        <PowerUpShopModal
          playerState={playerState}
          onBuyItem={handleBuyItem}
          onClose={() => setGameState('PLAYING')}
        />
      )}

      {/* ========================================================================= */}
      {/* 6. GAME OVER MODAL */}
      {/* ========================================================================= */}
      {gameState === 'GAME_OVER' && (
        <GameOverModal
          playerState={playerState}
          onRetry={handleRetryGameOver}
          onMainMenu={() => setGameState('MENU')}
        />
      )}

      {/* ========================================================================= */}
      {/* 7. VICTORY MODAL */}
      {/* ========================================================================= */}
      {gameState === 'VICTORY' && (
        <VictoryModal
          playerState={playerState}
          onViewAchievements={() => setGameState('PRESTASI')}
          onMainMenu={() => setGameState('MENU')}
        />
      )}

      {/* ========================================================================= */}
      {/* 8. PRESTASI MODAL */}
      {/* ========================================================================= */}
      {gameState === 'PRESTASI' && (
        <PrestasiPageModal
          playerState={playerState}
          teacherConfig={teacherConfig}
          onContinue={handleStartGame}
          onResetProgress={handleResetProgressFromScratch}
          onClose={() => setGameState('MENU')}
        />
      )}

      {/* ========================================================================= */}
      {/* 9. PETUNJUK MODAL */}
      {/* ========================================================================= */}
      {gameState === 'PETUNJUK' && (
        <PetunjukModal onClose={() => setGameState('MENU')} />
      )}

      {/* ========================================================================= */}
      {/* 10. WORLD SELECT MODAL */}
      {/* ========================================================================= */}
      {gameState === 'WORLD_SELECT' && (
        <WorldSelectModal
          playerState={playerState}
          onSelectLevel={handleSelectLevel}
          onClose={() => setGameState('MENU')}
        />
      )}

      {/* ========================================================================= */}
      {/* 11. MEJA GURU MODAL */}
      {/* ========================================================================= */}
      {gameState === 'MEJA_GURU' && (
        <MejaGuruModal
          teacherConfig={teacherConfig}
          onUpdateConfig={(cfg) => setTeacherConfig(cfg)}
          onClose={() => setGameState('MENU')}
          userRole={session?.user?.role}
        />
      )}
    </div>
  );
}
