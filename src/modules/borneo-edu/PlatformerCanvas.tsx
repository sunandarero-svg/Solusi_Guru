"use client";

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { PlayerState, QuestionItem } from './types';
import { sound } from './audio';
import { WORLD_DEFINITIONS } from './defaultQuestions';

interface PlatformerCanvasProps {
  worldNumber: number;
  levelNumber: number;
  playerState: PlayerState;
  onTriggerQuestion: (question: QuestionItem, isEnemy: boolean, enemyId?: string) => void;
  onCollectCoin: (amount: number) => void;
  onCollectPowerUp: (type: 'mushroom' | 'hintFlower' | 'superStar' | 'shield') => void;
  onReachFinish: () => void;
  onTriggerBossBattle: () => void;
  onPlayerFell: () => void;
  isPaused: boolean;
  levelQuestions: QuestionItem[];
  defeatedEnemyId?: string | null;
  isFullscreen?: boolean;
}

interface Entity {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface Platform extends Entity {
  type: 'solid' | 'wood' | 'stone' | 'sand' | 'brick';
}

interface QuestionBlock extends Entity {
  id: string;
  isHit: boolean;
  questionIndex: number;
  bounceOffset: number;
}

interface CoinItem extends Entity {
  id: string;
  isCollected: boolean;
  sparkleTime: number;
}

interface PowerUpItem extends Entity {
  id: string;
  type: 'mushroom' | 'hintFlower' | 'superStar' | 'shield';
  isCollected: boolean;
}

interface EnemyEntity extends Entity {
  id: string;
  vx: number;
  minX: number;
  maxX: number;
  isDefeated: boolean;
  questionIndex: number;
  animFrame: number;
}

export default function PlatformerCanvas({
  worldNumber,
  levelNumber,
  playerState,
  onTriggerQuestion,
  onCollectCoin,
  onCollectPowerUp,
  onReachFinish,
  onTriggerBossBattle,
  onPlayerFell,
  isPaused,
  levelQuestions,
  defeatedEnemyId,
  isFullscreen
}: PlatformerCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Touch controls state
  const touchStateRef = useRef<{ left: boolean; right: boolean; jump: boolean }>({
    left: false,
    right: false,
    jump: false
  });

  const [touchActive, setTouchActive] = useState<{ left: boolean; right: boolean; jump: boolean }>({
    left: false,
    right: false,
    jump: false
  });

  const setTouchDirection = useCallback((dir: 'left' | 'right' | 'jump', active: boolean) => {
    touchStateRef.current[dir] = active;
    setTouchActive((prev) => (prev[dir] === active ? prev : { ...prev, [dir]: active }));
  }, []);

  const keysRef = useRef<{ [key: string]: boolean }>({});

  // Stable references to prevent render-cycle level rebuilds
  const levelQuestionsRef = useRef(levelQuestions);
  levelQuestionsRef.current = levelQuestions;

  const playerStateRef = useRef(playerState);
  playerStateRef.current = playerState;

  const callbacksRef = useRef({
    onTriggerQuestion,
    onCollectCoin,
    onCollectPowerUp,
    onReachFinish,
    onTriggerBossBattle,
    onPlayerFell
  });
  callbacksRef.current = {
    onTriggerQuestion,
    onCollectCoin,
    onCollectPowerUp,
    onReachFinish,
    onTriggerBossBattle,
    onPlayerFell
  };

  const currentLoadedLevelKey = useRef<string>('');

  const worldDef = WORLD_DEFINITIONS.find((w) => w.id === worldNumber) || WORLD_DEFINITIONS[0];
  const isBossLevel = levelNumber === 5 || levelNumber === 10 || levelNumber === 15 || levelNumber === 20 || levelNumber === 25;

  // Level data refs
  const platformsRef = useRef<Platform[]>([]);
  const questionBlocksRef = useRef<QuestionBlock[]>([]);
  const coinsRef = useRef<CoinItem[]>([]);
  const powerUpsRef = useRef<PowerUpItem[]>([]);
  const enemiesRef = useRef<EnemyEntity[]>([]);
  const finishFlagRef = useRef<Entity>({ x: 2500, y: 380, width: 40, height: 160 });
  const levelLengthRef = useRef<number>(2700);

  // Player physics
  const playerRef = useRef({
    x: 80,
    y: 350,
    vx: 0,
    vy: 0,
    width: 38,
    height: 54,
    isGrounded: false,
    facingRight: true,
    animTimer: 0,
    walkFrame: 0,
    invincibleTimer: 0
  });

  // Camera
  const cameraXRef = useRef(0);

  // Initialize level geometry
  const buildLevel = useCallback(() => {
    const plats: Platform[] = [];
    const qBlocks: QuestionBlock[] = [];
    const cList: CoinItem[] = [];
    const pList: PowerUpItem[] = [];
    const eList: EnemyEntity[] = [];

    const groundY = 480;
    const levelLen = isBossLevel ? 1600 : 2800;
    levelLengthRef.current = levelLen;

    // Build Ground segments with pit gaps
    if (isBossLevel) {
      // Solid continuous arena for Boss battles
      plats.push({ x: 0, y: groundY, width: levelLen + 200, height: 120, type: 'solid' });
      // Boss platforms
      plats.push({ x: 250, y: 360, width: 140, height: 24, type: 'brick' });
      plats.push({ x: 550, y: 280, width: 160, height: 24, type: 'brick' });
      plats.push({ x: 850, y: 360, width: 140, height: 24, type: 'brick' });

      // Flag or boss trigger at x=1100
      finishFlagRef.current = { x: 1200, y: groundY - 140, width: 50, height: 140 };
    } else {
      // Segmented ground with jumps
      plats.push({ x: 0, y: groundY, width: 700, height: 120, type: 'solid' });
      plats.push({ x: 820, y: groundY, width: 650, height: 120, type: 'solid' });
      plats.push({ x: 1600, y: groundY, width: 600, height: 120, type: 'solid' });
      plats.push({ x: 2320, y: groundY, width: 600, height: 120, type: 'solid' });

      // Floating platforms
      plats.push({ x: 280, y: 370, width: 130, height: 22, type: 'wood' });
      plats.push({ x: 500, y: 300, width: 140, height: 22, type: 'wood' });
      plats.push({ x: 720, y: 390, width: 90, height: 22, type: 'stone' }); // gap stepping stone
      plats.push({ x: 1000, y: 360, width: 150, height: 22, type: 'wood' });
      plats.push({ x: 1240, y: 280, width: 130, height: 22, type: 'stone' });
      plats.push({ x: 1500, y: 380, width: 90, height: 22, type: 'wood' });
      plats.push({ x: 1800, y: 340, width: 160, height: 22, type: 'stone' });
      plats.push({ x: 2060, y: 270, width: 140, height: 22, type: 'wood' });

      finishFlagRef.current = { x: 2550, y: groundY - 140, width: 50, height: 140 };

      // Question blocks (?) - at least 3-4
      const qPositions = [
        { x: 340, y: 250 },
        { x: 560, y: 180 },
        { x: 1080, y: 240 },
        { x: 1880, y: 220 }
      ];

      qPositions.forEach((pos, idx) => {
        qBlocks.push({
          id: `qb_${levelNumber}_${idx}`,
          x: pos.x,
          y: pos.y,
          width: 42,
          height: 42,
          isHit: false,
          questionIndex: idx % Math.max(1, levelQuestionsRef.current?.length || 5),
          bounceOffset: 0
        });
      });

      // Bonus Power-Up block
      pList.push({
        id: `pu_${levelNumber}_1`,
        x: 1290,
        y: 230,
        width: 32,
        height: 32,
        type: levelNumber % 4 === 1 ? 'mushroom' : levelNumber % 4 === 2 ? 'shield' : levelNumber % 4 === 3 ? 'hintFlower' : 'superStar',
        isCollected: false
      });

      // Coins scattered
      const coinCoords = [
        180, 220, 260,
        420, 460,
        640, 680, 720,
        920, 960,
        1150, 1190, 1230,
        1420, 1460,
        1700, 1740, 1780,
        2150, 2190, 2230
      ];

      coinCoords.forEach((cx, i) => {
        const cy = cx > 400 && cx < 800 ? 250 : cx > 1000 && cx < 1400 ? 320 : 430;
        cList.push({
          id: `coin_${levelNumber}_${i}`,
          x: cx,
          y: cy,
          width: 26,
          height: 26,
          isCollected: false,
          sparkleTime: 0
        });
      });

      // Patrol Enemies (at least 2 enemies)
      eList.push({
        id: `enemy_${levelNumber}_1`,
        x: 420,
        y: groundY - 44,
        width: 40,
        height: 40,
        vx: 1.2,
        minX: 300,
        maxX: 620,
        isDefeated: false,
        questionIndex: (qPositions.length) % Math.max(1, levelQuestionsRef.current?.length || 5),
        animFrame: 0
      });

      eList.push({
        id: `enemy_${levelNumber}_2`,
        x: 1100,
        y: groundY - 44,
        width: 40,
        height: 40,
        vx: -1.3,
        minX: 900,
        maxX: 1400,
        isDefeated: false,
        questionIndex: (qPositions.length + 1) % Math.max(1, levelQuestionsRef.current?.length || 5),
        animFrame: 0
      });

      if (levelNumber >= 3) {
        eList.push({
          id: `enemy_${levelNumber}_3`,
          x: 1850,
          y: groundY - 44,
          width: 40,
          height: 40,
          vx: 1.5,
          minX: 1680,
          maxX: 2150,
          isDefeated: false,
          questionIndex: (qPositions.length + 2) % Math.max(1, levelQuestionsRef.current?.length || 5),
          animFrame: 0
        });
      }
    }

    platformsRef.current = plats;
    questionBlocksRef.current = qBlocks;
    coinsRef.current = cList;
    powerUpsRef.current = pList;
    enemiesRef.current = eList;

    // Reset player position on genuine level load
    playerRef.current.x = 80;
    playerRef.current.y = 360;
    playerRef.current.vx = 0;
    playerRef.current.vy = 0;
    playerRef.current.isGrounded = false;
    cameraXRef.current = 0;
  }, [levelNumber, isBossLevel]);

  useEffect(() => {
    const levelKey = `w${worldNumber}_l${levelNumber}`;
    if (currentLoadedLevelKey.current !== levelKey) {
      currentLoadedLevelKey.current = levelKey;
      buildLevel();
    }
  }, [worldNumber, levelNumber, buildLevel]);

  // Handle enemy defeated from question resolution
  useEffect(() => {
    if (defeatedEnemyId) {
      enemiesRef.current.forEach((enemy) => {
        if (enemy.id === defeatedEnemyId) {
          enemy.isDefeated = true;
        }
      });
      if (playerRef.current) {
        playerRef.current.invincibleTimer = 60;
        playerRef.current.vy = -6; // Joyful bounce after defeating enemy
      }
    }
  }, [defeatedEnemyId]);

  // Keyboard and focus events
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const code = e.code;
      const key = e.key;
      if (code) keysRef.current[code] = true;
      if (key) {
        keysRef.current[key] = true;
        keysRef.current[key.toLowerCase()] = true;
      }
      if (
        ['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'KeyW', 'KeyA', 'KeyS', 'KeyD'].includes(code) ||
        ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' '].includes(key)
      ) {
        e.preventDefault();
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      const code = e.code;
      const key = e.key;
      if (code) keysRef.current[code] = false;
      if (key) {
        keysRef.current[key] = false;
        keysRef.current[key.toLowerCase()] = false;
      }
    };

    const handleClearInputs = () => {
      keysRef.current = {};
      touchStateRef.current = { left: false, right: false, jump: false };
      setTouchActive({ left: false, right: false, jump: false });
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    window.addEventListener('blur', handleClearInputs);
    document.addEventListener('visibilitychange', handleClearInputs);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      window.removeEventListener('blur', handleClearInputs);
      document.removeEventListener('visibilitychange', handleClearInputs);
    };
  }, []);

  // Clear inputs when paused or when modal opens
  useEffect(() => {
    if (isPaused) {
      keysRef.current = {};
      touchStateRef.current = { left: false, right: false, jump: false };
      setTouchActive({ left: false, right: false, jump: false });
    }
  }, [isPaused]);

  // Main 60FPS Game Loop
  useEffect(() => {
    let animId: number;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let clouds = [
      { x: 50, y: 70, s: 1.0, vx: 0.3 },
      { x: 380, y: 110, s: 0.7, vx: 0.2 },
      { x: 720, y: 50, s: 1.2, vx: 0.4 },
      { x: 1100, y: 90, s: 0.8, vx: 0.25 },
      { x: 1500, y: 60, s: 1.1, vx: 0.35 }
    ];

    const GRAVITY = 0.65;
    const MOVE_SPEED = 4.2;
    const JUMP_FORCE = -12.8;

    const gameLoop = () => {
      if (!canvas || !ctx) return;

      const p = playerRef.current;
      const cameraX = cameraXRef.current;

      if (!isPaused) {
        // --- INPUT HANDLING ---
        const moveLeft =
          !!keysRef.current['ArrowLeft'] ||
          !!keysRef.current['Left'] ||
          !!keysRef.current['KeyA'] ||
          !!keysRef.current['a'] ||
          !!keysRef.current['A'] ||
          touchStateRef.current.left;

        const moveRight =
          !!keysRef.current['ArrowRight'] ||
          !!keysRef.current['Right'] ||
          !!keysRef.current['KeyD'] ||
          !!keysRef.current['d'] ||
          !!keysRef.current['D'] ||
          touchStateRef.current.right;

        const jumpPress =
          !!keysRef.current['ArrowUp'] ||
          !!keysRef.current['Up'] ||
          !!keysRef.current['KeyW'] ||
          !!keysRef.current['w'] ||
          !!keysRef.current['W'] ||
          !!keysRef.current['Space'] ||
          !!keysRef.current[' '] ||
          touchStateRef.current.jump;

        // Ensure character can reliably move right/forward
        if (moveRight && !moveLeft) {
          p.vx = MOVE_SPEED;
          p.facingRight = true;
        } else if (moveLeft && !moveRight) {
          p.vx = -MOVE_SPEED;
          p.facingRight = false;
        } else if (moveRight && moveLeft) {
          // If both are active, prioritize right to maintain forward game progress
          p.vx = MOVE_SPEED;
          p.facingRight = true;
        } else {
          p.vx *= 0.75;
          if (Math.abs(p.vx) < 0.1) p.vx = 0;
        }

        if (jumpPress && p.isGrounded) {
          p.vy = JUMP_FORCE;
          p.isGrounded = false;
          sound.playJump();
        }

        // Invulnerability timer countdown
        if (p.invincibleTimer > 0) {
          p.invincibleTimer -= 1;
        }

        // Apply Gravity
        p.vy += GRAVITY;
        if (p.vy > 14) p.vy = 14;

        // Apply Horizontal Movement & Bounds
        p.x += p.vx;
        if (p.x < 10) p.x = 10;
        if (p.x > levelLengthRef.current - 40) p.x = levelLengthRef.current - 40;

        // Platform Collisions
        p.isGrounded = false;
        const nextY = p.y + p.vy;

        for (const plat of platformsRef.current) {
          // Check landing on top of platform
          if (
            p.x + p.width * 0.7 > plat.x &&
            p.x + p.width * 0.3 < plat.x + plat.width
          ) {
            if (p.y + p.height <= plat.y + 4 && nextY + p.height >= plat.y) {
              p.y = plat.y - p.height;
              p.vy = 0;
              p.isGrounded = true;
              break;
            }
          }
        }

        if (!p.isGrounded) {
          p.y += p.vy;
        }

        // Pit death check
        if (p.y > 620) {
          callbacksRef.current.onPlayerFell();
          p.x = Math.max(80, cameraX - 100);
          p.y = 350;
          p.vy = 0;
        }

        // --- QUESTION BLOCK COLLISION (Hit from below or touched) ---
        for (const qb of questionBlocksRef.current) {
          if (!qb.isHit) {
            // Check collision with question block
            if (
              p.x + p.width > qb.x &&
              p.x < qb.x + qb.width &&
              p.y + p.height > qb.y &&
              p.y < qb.y + qb.height
            ) {
              qb.isHit = true;
              qb.bounceOffset = -8;
              sound.playPowerUp();

              const questionsList = levelQuestionsRef.current;
              const targetQ = questionsList[qb.questionIndex] || questionsList[0];
              if (targetQ) {
                callbacksRef.current.onTriggerQuestion(targetQ, false);
              }
              break;
            }
          }
        }

        // --- COIN PICKUP COLLISION ---
        for (const coin of coinsRef.current) {
          if (!coin.isCollected) {
            if (
              p.x + p.width > coin.x &&
              p.x < coin.x + coin.width &&
              p.y + p.height > coin.y &&
              p.y < coin.y + coin.height
            ) {
              coin.isCollected = true;
              sound.playCoin();
              callbacksRef.current.onCollectCoin(5);
            }
          }
        }

        // --- POWER UP COLLISION ---
        for (const pu of powerUpsRef.current) {
          if (!pu.isCollected) {
            if (
              p.x + p.width > pu.x &&
              p.x < pu.x + pu.width &&
              p.y + p.height > pu.y &&
              p.y < pu.y + pu.height
            ) {
              pu.isCollected = true;
              sound.playPowerUp();
              callbacksRef.current.onCollectPowerUp(pu.type);
            }
          }
        }

        // --- ENEMY PATROL & COLLISION ---
        for (const enemy of enemiesRef.current) {
          if (!enemy.isDefeated) {
            enemy.x += enemy.vx;
            if (enemy.x <= enemy.minX || enemy.x >= enemy.maxX) {
              enemy.vx *= -1;
            }
            enemy.animFrame = (enemy.animFrame + 0.1) % 4;

            // Player touches enemy
            if (
              p.x + p.width > enemy.x &&
              p.x < enemy.x + enemy.width &&
              p.y + p.height > enemy.y &&
              p.y < enemy.y + enemy.height
            ) {
              if (p.invincibleTimer <= 0) {
                const questionsList = levelQuestionsRef.current;
                if (questionsList && questionsList.length > 0) {
                  // Acak soal dari bank soal yang tersedia untuk kelas
                  const randomIndex = Math.floor(Math.random() * questionsList.length);
                  const enemyQ = questionsList[randomIndex] || questionsList[0];
                  callbacksRef.current.onTriggerQuestion(enemyQ, true, enemy.id);
                }
              }
              break;
            }
          }
        }

        // --- FINISH FLAG COLLISION ---
        const flag = finishFlagRef.current;
        if (
          p.x + p.width > flag.x &&
          p.x < flag.x + flag.width &&
          p.y + p.height > flag.y &&
          p.y < flag.y + flag.height
        ) {
          if (isBossLevel) {
            callbacksRef.current.onTriggerBossBattle();
          } else {
            callbacksRef.current.onReachFinish();
          }
        }

        // Animate question blocks bounce recovery
        for (const qb of questionBlocksRef.current) {
          if (qb.bounceOffset < 0) {
            qb.bounceOffset += 0.8;
            if (qb.bounceOffset > 0) qb.bounceOffset = 0;
          }
        }

        // Camera smoothly follows player
        const targetCamX = p.x - 300;
        cameraXRef.current += (targetCamX - cameraXRef.current) * 0.12;
        if (cameraXRef.current < 0) cameraXRef.current = 0;
        const maxCam = Math.max(0, levelLengthRef.current - 800);
        if (cameraXRef.current > maxCam) cameraXRef.current = maxCam;

        // Player animation timer
        if (p.isGrounded && Math.abs(p.vx) > 0.5) {
          p.animTimer += 0.2;
          p.walkFrame = Math.floor(p.animTimer) % 4;
        } else {
          p.walkFrame = 0;
        }
      }

      // --- RENDERING ---
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const cam = cameraXRef.current;

      // 1. Parallax Sky Gradient
      const grad = ctx.createLinearGradient(0, 0, 0, canvas.height);
      grad.addColorStop(0, worldDef.palette.skyTop);
      grad.addColorStop(1, worldDef.palette.skyBottom);
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // 2. Parallax Mountains / Hills (0.2x speed)
      ctx.save();
      ctx.fillStyle = worldDef.palette.hills;
      ctx.beginPath();
      ctx.moveTo(0, canvas.height);
      const hillOffset = (cam * 0.2) % 300;
      for (let x = -300; x < canvas.width + 300; x += 150) {
        const peakY = worldNumber === 2 ? 220 : worldNumber === 3 ? 340 : 280;
        ctx.quadraticCurveTo(x - hillOffset + 75, peakY - 60, x - hillOffset + 150, canvas.height);
      }
      ctx.closePath();
      ctx.fill();
      ctx.restore();

      // 3. Animated Clouds / Atmosphere
      ctx.fillStyle = 'rgba(255, 255, 255, 0.35)';
      clouds.forEach((cloud) => {
        cloud.x += cloud.vx;
        if (cloud.x > levelLengthRef.current + 500) cloud.x = -200;
        const drawCloudX = cloud.x - cam * 0.4;
        if (drawCloudX > -150 && drawCloudX < canvas.width + 150) {
          ctx.beginPath();
          ctx.arc(drawCloudX, cloud.y, 25 * cloud.s, 0, Math.PI * 2);
          ctx.arc(drawCloudX + 22 * cloud.s, cloud.y - 10 * cloud.s, 30 * cloud.s, 0, Math.PI * 2);
          ctx.arc(drawCloudX + 48 * cloud.s, cloud.y, 24 * cloud.s, 0, Math.PI * 2);
          ctx.fill();
        }
      });

      // 4. World Props & Parallax Foreground details
      ctx.save();
      ctx.translate(-cam, 0);

      // Render Platforms
      platformsRef.current.forEach((plat) => {
        if (plat.x + plat.width > cam - 50 && plat.x < cam + canvas.width + 50) {
          // Main Body
          ctx.fillStyle = plat.type === 'solid' ? worldDef.palette.terrain : worldDef.palette.platform;
          ctx.beginPath();
          ctx.roundRect(plat.x, plat.y, plat.width, plat.height, 6);
          ctx.fill();

          // Platform Top Highlight (Grass / Snow / Sand cap)
          ctx.fillStyle = worldDef.palette.accent;
          ctx.fillRect(plat.x, plat.y, plat.width, 7);

          // Texture brick lines
          ctx.strokeStyle = 'rgba(0,0,0,0.18)';
          ctx.lineWidth = 2;
          for (let bx = plat.x + 30; bx < plat.x + plat.width; bx += 35) {
            ctx.beginPath();
            ctx.moveTo(bx, plat.y + 7);
            ctx.lineTo(bx, plat.y + plat.height);
            ctx.stroke();
          }
        }
      });

      // Render Question Blocks (?)
      questionBlocksRef.current.forEach((qb) => {
        const drawY = qb.y + qb.bounceOffset;
        // Block background
        ctx.fillStyle = qb.isHit ? '#94a3b8' : '#f59e0b';
        ctx.beginPath();
        ctx.roundRect(qb.x, drawY, qb.width, qb.height, 8);
        ctx.fill();

        // Border & 3D bevel
        ctx.strokeStyle = qb.isHit ? '#64748b' : '#b45309';
        ctx.lineWidth = 3;
        ctx.strokeRect(qb.x, drawY, qb.width, qb.height);

        // Corner rivets
        ctx.fillStyle = '#ffffff';
        const corners = [
          [qb.x + 5, drawY + 5],
          [qb.x + qb.width - 7, drawY + 5],
          [qb.x + 5, drawY + qb.height - 7],
          [qb.x + qb.width - 7, drawY + qb.height - 7]
        ];
        corners.forEach(([cx, cy]) => {
          ctx.fillRect(cx, cy, 3, 3);
        });

        // Question mark text or spent dot
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 22px system-ui, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(qb.isHit ? '✓' : '?', qb.x + qb.width / 2, drawY + qb.height / 2);
      });

      // Render Spinning Collectible Coins
      const timeNow = Date.now() * 0.005;
      coinsRef.current.forEach((coin) => {
        if (!coin.isCollected) {
          const coinW = Math.abs(Math.sin(timeNow + coin.x)) * (coin.width * 0.8) + 4;
          const coinH = coin.height;

          // Golden coin rim
          ctx.fillStyle = '#f59e0b';
          ctx.beginPath();
          ctx.ellipse(coin.x + coin.width / 2, coin.y + coin.height / 2, coinW / 2, coinH / 2, 0, 0, Math.PI * 2);
          ctx.fill();

          // Inner gold core
          ctx.fillStyle = '#fde047';
          ctx.beginPath();
          ctx.ellipse(coin.x + coin.width / 2, coin.y + coin.height / 2, coinW * 0.35, coinH * 0.35, 0, 0, Math.PI * 2);
          ctx.fill();
        }
      });

      // Render Power-Ups
      powerUpsRef.current.forEach((pu) => {
        if (!pu.isCollected) {
          const hoverY = pu.y + Math.sin(timeNow * 2) * 5;
          ctx.font = '28px sans-serif';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          const icon = pu.type === 'mushroom' ? '🍄' : pu.type === 'shield' ? '🛡️' : pu.type === 'superStar' ? '⭐' : '🌸';
          ctx.fillText(icon, pu.x + pu.width / 2, hoverY + pu.height / 2);
        }
      });

      // Render Enemies
      enemiesRef.current.forEach((enemy) => {
        if (!enemy.isDefeated) {
          ctx.save();
          // Draw cartoon enemy
          const enemyTypeIcons = ['👾', '🐗', '🦀', '🦂', '🦇'];
          const enemyIcon = enemyTypeIcons[(worldNumber - 1) % enemyTypeIcons.length] || '👾';
          
          ctx.font = '34px sans-serif';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(enemyIcon, enemy.x + enemy.width / 2, enemy.y + enemy.height / 2);
          ctx.restore();
        }
      });

      // Render Finish Flag / Gate
      const flag = finishFlagRef.current;
      if (isBossLevel) {
        // Dramatic Boss Portal Gate
        ctx.fillStyle = '#4c1d95';
        ctx.fillRect(flag.x, flag.y, flag.width, flag.height);
        ctx.fillStyle = '#c084fc';
        ctx.font = '32px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('👑', flag.x + flag.width / 2, flag.y + 40);
        ctx.font = 'bold 12px sans-serif';
        ctx.fillStyle = '#ffffff';
        ctx.fillText('BOSS GATE', flag.x + flag.width / 2, flag.y + flag.height - 15);
      } else {
        // Flag Pole
        ctx.fillStyle = '#94a3b8';
        ctx.fillRect(flag.x + 8, flag.y, 8, flag.height);
        // Golden Ball on top
        ctx.fillStyle = '#f59e0b';
        ctx.beginPath();
        ctx.arc(flag.x + 12, flag.y, 10, 0, Math.PI * 2);
        ctx.fill();
        // Waving Triangle Pennant
        ctx.fillStyle = '#ef4444';
        ctx.beginPath();
        ctx.moveTo(flag.x + 16, flag.y + 10);
        ctx.lineTo(flag.x + 60, flag.y + 35);
        ctx.lineTo(flag.x + 16, flag.y + 60);
        ctx.closePath();
        ctx.fill();
      }

      // --- RENDER PLAYER CHARACTER (Original Student Adventurer) ---
      ctx.save();
      const px = p.x;
      const py = p.y;
      const facing = p.facingRight ? 1 : -1;

      // Center transformation for flipping
      ctx.translate(px + p.width / 2, py + p.height / 2);
      ctx.scale(facing, 1);

      // Invulnerability flash effect
      if (p.invincibleTimer > 0 && Math.floor(p.invincibleTimer / 4) % 2 === 0) {
        ctx.globalAlpha = 0.4;
      }

      // Shield Aura Effect if active
      if (playerStateRef.current.shieldActive || playerStateRef.current.powerUps.shield > 0) {
        ctx.strokeStyle = 'rgba(56, 189, 248, 0.7)';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(0, 0, 34, 0, Math.PI * 2);
        ctx.stroke();
        ctx.fillStyle = 'rgba(56, 189, 248, 0.15)';
        ctx.fill();
      }

      // Super Star Sparkle Effect
      if (playerStateRef.current.starBoostCount > 0) {
        ctx.fillStyle = '#fde047';
        for (let i = 0; i < 4; i++) {
          const ang = timeNow * 3 + (i * Math.PI) / 2;
          const sx = Math.cos(ang) * 36;
          const sy = Math.sin(ang) * 36;
          ctx.beginPath();
          ctx.arc(sx, sy, 3, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      // 1. Adventurer Backpack (behind torso)
      ctx.fillStyle = '#78350f';
      ctx.beginPath();
      ctx.roundRect(-18, -12, 12, 22, 4);
      ctx.fill();

      // 2. Legs & Shoes (Animated walking / jumping)
      const legAngle = p.isGrounded ? Math.sin(p.walkFrame * Math.PI * 0.5) * 8 : -4;
      // Left leg
      ctx.fillStyle = '#1e3a8a'; // Navy school pants
      ctx.fillRect(-8 - legAngle * 0.5, 10, 7, 16);
      ctx.fillStyle = '#ffffff'; // White sneakers
      ctx.fillRect(-10 - legAngle * 0.5, 23, 10, 6);

      // Right leg
      ctx.fillStyle = '#1e3a8a';
      ctx.fillRect(2 + legAngle * 0.5, 10, 7, 16);
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(2 + legAngle * 0.5, 23, 10, 6);

      // 3. Torso (Student Uniform / Jacket)
      ctx.fillStyle = '#0284c7'; // Adventure Blue Jacket
      ctx.beginPath();
      ctx.roundRect(-10, -12, 20, 24, 5);
      ctx.fill();

      // White Shirt collar & badge
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.moveTo(-4, -12);
      ctx.lineTo(0, -5);
      ctx.lineTo(4, -12);
      ctx.closePath();
      ctx.fill();

      // Solusi Guru ID Badge
      ctx.fillStyle = '#10b981';
      ctx.fillRect(2, -4, 5, 6);

      // 4. Arms
      const armSwing = p.isGrounded ? Math.sin(p.walkFrame * Math.PI * 0.5) * 6 : -6;
      ctx.fillStyle = '#0284c7';
      ctx.beginPath();
      ctx.roundRect(-2 + armSwing, -8, 6, 14, 3);
      ctx.fill();

      // 5. Head
      ctx.fillStyle = '#fbcfe8'; // Skin tone
      ctx.beginPath();
      ctx.arc(0, -18, 11, 0, Math.PI * 2);
      ctx.fill();

      // Eyes
      ctx.fillStyle = '#0f172a';
      ctx.beginPath();
      ctx.arc(4, -19, 2, 0, Math.PI * 2);
      ctx.fill();

      // Smile
      ctx.strokeStyle = '#0f172a';
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.arc(3, -16, 3, 0, Math.PI * 0.8);
      ctx.stroke();

      // 6. School/Adventure Cap
      ctx.fillStyle = '#b91c1c'; // Maroon student cap
      ctx.beginPath();
      ctx.arc(0, -23, 11, Math.PI, Math.PI * 2);
      ctx.fill();
      // Cap Visor
      ctx.fillStyle = '#991b1b';
      ctx.beginPath();
      ctx.moveTo(3, -22);
      ctx.lineTo(14, -20);
      ctx.lineTo(6, -18);
      ctx.closePath();
      ctx.fill();

      ctx.restore();
      ctx.restore(); // camera translate restore

      animId = requestAnimationFrame(gameLoop);
    };

    animId = requestAnimationFrame(gameLoop);
    return () => cancelAnimationFrame(animId);
  }, [
    isPaused,
    worldNumber,
    levelNumber,
    isBossLevel,
    worldDef
  ]);

  return (
    <div className={`relative w-full flex-1 overflow-hidden select-none touch-none bg-slate-900 flex items-center justify-center transition-all ${
      isFullscreen
        ? 'h-full max-h-[100dvh] max-w-[100dvw] rounded-none border-none p-0 m-0'
        : 'max-h-[calc(100vh-65px)] landscape:max-h-[calc(100dvh-55px)] sm:max-h-[620px] rounded-2xl sm:rounded-3xl border-2 sm:border-4 border-slate-800 shadow-2xl'
    }`}>
      <canvas
        ref={canvasRef}
        width={800}
        height={540}
        className="w-full h-full max-h-[100dvh] max-w-[100dvw] aspect-[800/540] object-contain block mx-auto"
      />

      {/* On-screen Mobile & Tablet Touch Controls (Landscape & Portrait Ergonomic) */}
      <div className={`absolute inset-x-0 ${isFullscreen ? 'bottom-2 px-3 sm:px-8' : 'bottom-1 sm:bottom-4 px-2 sm:px-6'} flex justify-between items-end pointer-events-none z-30 select-none touch-none`}>
        {/* D-Pad Buttons (Left & Right) */}
        <div className="flex items-center gap-1.5 sm:gap-3 pointer-events-auto p-1 sm:p-1.5 rounded-xl sm:rounded-2xl bg-slate-950/60 backdrop-blur-md border border-white/10 shadow-2xl">
          {/* Tombol Kiri */}
          <button
            type="button"
            id="touch-left"
            onPointerDown={(e) => {
              e.preventDefault();
              e.stopPropagation();
              try {
                (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
              } catch (_) {}
              setTouchDirection('left', true);
            }}
            onPointerUp={(e) => {
              e.preventDefault();
              try {
                (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
              } catch (_) {}
              setTouchDirection('left', false);
            }}
            onPointerCancel={(e) => {
              e.preventDefault();
              setTouchDirection('left', false);
            }}
            onTouchStart={(e) => {
              e.preventDefault();
              setTouchDirection('left', true);
            }}
            onTouchEnd={(e) => {
              e.preventDefault();
              setTouchDirection('left', false);
            }}
            onTouchCancel={(e) => {
              e.preventDefault();
              setTouchDirection('left', false);
            }}
            onContextMenu={(e) => e.preventDefault()}
            className={`w-11 h-11 landscape:w-11 landscape:h-11 sm:w-16 sm:h-16 rounded-xl sm:rounded-2xl flex flex-col items-center justify-center font-black transition-all select-none touch-none shadow-xl border-2 active:scale-95 ${
              touchActive.left
                ? 'bg-emerald-500 text-slate-950 border-emerald-300 ring-4 ring-emerald-400/50 scale-95 shadow-emerald-500/50'
                : 'bg-slate-900/80 text-white border-white/30 hover:border-emerald-400/60'
            }`}
            aria-label="Gerak Kiri (Mundur)"
          >
            <span className="text-lg sm:text-2xl leading-none">◀</span>
            <span className="text-[8px] sm:text-[10px] font-bold tracking-tight opacity-80 mt-0.5">KIRI</span>
          </button>

          {/* Tombol Kanan (MAJU KE DEPAN) */}
          <button
            type="button"
            id="touch-right"
            onPointerDown={(e) => {
              e.preventDefault();
              e.stopPropagation();
              try {
                (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
              } catch (_) {}
              setTouchDirection('right', true);
            }}
            onPointerUp={(e) => {
              e.preventDefault();
              try {
                (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
              } catch (_) {}
              setTouchDirection('right', false);
            }}
            onPointerCancel={(e) => {
              e.preventDefault();
              setTouchDirection('right', false);
            }}
            onTouchStart={(e) => {
              e.preventDefault();
              setTouchDirection('right', true);
            }}
            onTouchEnd={(e) => {
              e.preventDefault();
              setTouchDirection('right', false);
            }}
            onTouchCancel={(e) => {
              e.preventDefault();
              setTouchDirection('right', false);
            }}
            onContextMenu={(e) => e.preventDefault()}
            className={`w-11 h-11 landscape:w-11 landscape:h-11 sm:w-16 sm:h-16 rounded-xl sm:rounded-2xl flex flex-col items-center justify-center font-black transition-all select-none touch-none shadow-xl border-2 active:scale-95 ${
              touchActive.right
                ? 'bg-emerald-500 text-slate-950 border-emerald-300 ring-4 ring-emerald-400/50 scale-95 shadow-emerald-500/50'
                : 'bg-slate-900/80 text-white border-white/30 hover:border-emerald-400/60'
            }`}
            aria-label="Gerak Kanan (Maju)"
          >
            <span className="text-lg sm:text-2xl leading-none">▶</span>
            <span className="text-[8px] sm:text-[10px] font-bold tracking-tight opacity-80 mt-0.5">KANAN</span>
          </button>
        </div>

        {/* Action / Jump Button */}
        <div className="pointer-events-auto p-1 sm:p-1.5 rounded-2xl sm:rounded-3xl bg-slate-950/60 backdrop-blur-md border border-white/10 shadow-2xl">
          <button
            type="button"
            id="touch-jump"
            onPointerDown={(e) => {
              e.preventDefault();
              e.stopPropagation();
              try {
                (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
              } catch (_) {}
              setTouchDirection('jump', true);
            }}
            onPointerUp={(e) => {
              e.preventDefault();
              try {
                (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
              } catch (_) {}
              setTouchDirection('jump', false);
            }}
            onPointerCancel={(e) => {
              e.preventDefault();
              setTouchDirection('jump', false);
            }}
            onTouchStart={(e) => {
              e.preventDefault();
              setTouchDirection('jump', true);
            }}
            onTouchEnd={(e) => {
              e.preventDefault();
              setTouchDirection('jump', false);
            }}
            onTouchCancel={(e) => {
              e.preventDefault();
              setTouchDirection('jump', false);
            }}
            onContextMenu={(e) => e.preventDefault()}
            className={`w-12 h-12 landscape:w-12 landscape:h-12 sm:w-18 sm:h-18 rounded-xl sm:rounded-2xl flex flex-col items-center justify-center font-black transition-all select-none touch-none shadow-xl border-2 active:scale-95 ${
              touchActive.jump
                ? 'bg-emerald-400 text-slate-950 border-white ring-4 ring-emerald-300/60 scale-95 shadow-emerald-400/60'
                : 'bg-gradient-to-t from-emerald-700 to-emerald-500 text-white border-emerald-300/80 hover:brightness-110 shadow-emerald-900/40'
            }`}
            aria-label="Melompat"
          >
            <span className="text-lg sm:text-2xl leading-none">▲</span>
            <span className="text-[8px] sm:text-[10px] font-bold tracking-wider mt-0.5">LOMPAT</span>
          </button>
        </div>
      </div>
    </div>
  );
}
