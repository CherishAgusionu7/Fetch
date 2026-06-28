/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef, useState } from 'react';
import { 
  GameState, 
  PlayerState, 
  EnemyState, 
  PlatformState, 
  ObstacleState, 
  FamilyState, 
  ParticleState, 
  ProjectileState, 
  WaterTankState,
  GameScreen
} from '../types';
import { 
  PHYSICS, 
  INITIAL_PLATFORMS, 
  INITIAL_OBSTACLES, 
  INITIAL_ENEMIES, 
  INITIAL_FAMILIES, 
  LEVEL_WIDTH, 
  LEVEL_HEIGHT, 
  CAMERA_PADDING_X 
} from '../constants';
import { gameAudio } from '../audio';

interface GameCanvasProps {
  screen: GameScreen;
  setScreen: (screen: GameScreen) => void;
  setHudStats: (stats: {
    lives: number;
    timeRemaining: number;
    familiesHelped: number;
    hasWater: boolean;
    waterCarried: number;
    lastHurtTime: number;
  }) => void;
  mobileKeyStates: {
    left: boolean;
    right: boolean;
    jump: boolean;
    action: boolean;
  };
  resetSignal: number;
}

export default function GameCanvas({
  screen,
  setScreen,
  setHudStats,
  mobileKeyStates,
  resetSignal,
}: GameCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const pendingTimeouts = useRef<number[]>([]);

  const clearPendingTimeouts = () => {
    pendingTimeouts.current.forEach((timeoutId) => clearTimeout(timeoutId));
    pendingTimeouts.current = [];
  };

  const registerTimeout = (timeoutId: number) => {
    pendingTimeouts.current.push(timeoutId);
  };

  const checkpointRef = useRef<{
    familyId: number | null;
    player: PlayerState;
    enemies: EnemyState[];
    projectiles: ProjectileState[];
    platforms: PlatformState[];
    obstacles: ObstacleState[];
    families: FamilyState[];
    waterTank: WaterTankState;
    stats: GameState['stats'];
    cameraX: number;
  } | null>(null);
  const checkpointFlashTimer = useRef<number>(0);

  const cloneValue = <T,>(value: T): T => {
    if (typeof structuredClone === 'function') {
      return structuredClone(value);
    }

    return JSON.parse(JSON.stringify(value)) as T;
  };
  
  // Game state reference for loop to access latest state without React closure traps
  const stateRef = useRef<GameState>({
    screen: 'menu',
    player: {
      x: 100,
      y: 400,
      vx: 0,
      vy: 0,
      width: 32,
      height: 48,
      direction: 'right',
      isGrounded: false,
      hasWater: false,
      waterCarried: 0,
      lives: 3,
      maxLives: 3,
      isHurt: false,
      hurtTimer: 0,
      invulnerableTimer: 0,
      victoryTimer: 0,
      walkFrame: 0,
      walkTimer: 0,
      idleTimer: 0,
      doubleJumpsLeft: 1,
    },
    enemies: [],
    projectiles: [],
    platforms: [],
    obstacles: [],
    families: [],
    waterTank: {
      x: 120,
      y: 350,
      width: 80,
      height: 200,
      waterLevel: 1.0,
      drippingTimer: 0,
    },
    particles: [],
    stats: {
      score: 0,
      timeRemaining: 120, // 2 minutes
      familiesHelped: 0,
      totalFamilies: 4,
      waterDelivered: 0,
      isSoundMuted: false,
    },
  });

  // Track active inputs
  const keysPressed = useRef<{ [key: string]: boolean }>({});
  const prevJumpPressed = useRef<boolean>(false);
  
  // Camera horizontal offset
  const cameraX = useRef<number>(0);
  const cameraShake = useRef<number>(0);

  const saveCheckpoint = (familyId: number | null) => {
    const s = stateRef.current;
    checkpointRef.current = {
      familyId,
      player: cloneValue(s.player),
      enemies: cloneValue(s.enemies),
      projectiles: cloneValue(s.projectiles),
      platforms: cloneValue(s.platforms),
      obstacles: cloneValue(s.obstacles),
      families: cloneValue(s.families),
      waterTank: cloneValue(s.waterTank),
      stats: cloneValue(s.stats),
      cameraX: cameraX.current,
    };
    checkpointFlashTimer.current = familyId === null ? 0 : 90;
  };

  const restoreCheckpoint = () => {
    const checkpoint = checkpointRef.current;
    if (!checkpoint) {
      initLevel();
      return;
    }

    const s = stateRef.current;
    s.player = {
      ...cloneValue(checkpoint.player),
      lives: 3,
      maxLives: 3,
      isHurt: false,
      hurtTimer: 0,
      invulnerableTimer: 60,
      victoryTimer: 0,
      vx: 0,
      vy: 0,
      isGrounded: true,
      doubleJumpsLeft: 1,
    };
    s.enemies = cloneValue(checkpoint.enemies);
    s.projectiles = cloneValue(checkpoint.projectiles);
    s.platforms = cloneValue(checkpoint.platforms);
    s.obstacles = cloneValue(checkpoint.obstacles);
    s.families = cloneValue(checkpoint.families);
    s.waterTank = cloneValue(checkpoint.waterTank);
    s.stats = {
      ...cloneValue(checkpoint.stats),
      isSoundMuted: gameAudio.isMuted(),
    };

    cameraX.current = checkpoint.cameraX;
    cameraShake.current = 0;
    secondAccumulator.current = 0;
    prevJumpPressed.current = false;
    keysPressed.current['w'] = false;
    keysPressed.current['arrowup'] = false;
    keysPressed.current[' '] = false;
    keysPressed.current['e'] = false;
  };

  // Logical game resolution (16:9)
  const logicalWidth = 1000;
  const logicalHeight = 562;

  // Track time ticks
  const lastTimeRef = useRef<number>(0);
  const secondAccumulator = useRef<number>(0);
  const frameCounter = useRef<number>(0);

  // Initialize Game Entity Instances
  const initLevel = () => {
    const s = stateRef.current;
    
    // Player
    s.player = {
      x: 180,
      y: 480,
      vx: 0,
      vy: 0,
      width: 30,
      height: 48,
      direction: 'right',
      isGrounded: true,
      hasWater: false,
      waterCarried: 0,
      lives: 3,
      maxLives: 3,
      isHurt: false,
      hurtTimer: 0,
      invulnerableTimer: 0,
      victoryTimer: 0,
      walkFrame: 0,
      walkTimer: 0,
      idleTimer: 0,
      doubleJumpsLeft: 1,
    };

    // Deep copy level configurations
    s.platforms = INITIAL_PLATFORMS.map((p, i) => ({
      ...p,
      id: `p_${i}`,
      collapseTimer: p.type === 'collapsing' ? -1 : undefined,
    })) as PlatformState[];

    s.obstacles = INITIAL_OBSTACLES.map((o, i) => ({
      ...o,
      id: `o_${i}`,
      angle: o.type === 'saw_blade' ? 0 : undefined,
      speedY: o.type === 'falling_rock' ? 0 : undefined,
      active: o.type === 'falling_rock' ? true : undefined,
    })) as ObstacleState[];

    s.enemies = INITIAL_ENEMIES.map((e, i) => ({
      ...e,
      id: `e_${i}`,
    })) as EnemyState[];

    s.families = INITIAL_FAMILIES.map((f) => ({
      ...f,
      hasWater: false,
    })) as FamilyState[];

    s.waterTank = {
      x: 100,
      y: 350,
      width: 80,
      height: 200,
      waterLevel: 1.0,
      drippingTimer: 0,
    };

    s.particles = [];
    s.projectiles = [];
    s.stats = {
      score: 0,
      timeRemaining: 120, // 2 minutes
      familiesHelped: 0,
      totalFamilies: 4,
      waterDelivered: 0,
      isSoundMuted: s.stats?.isSoundMuted ?? false,
    };

    cameraX.current = 0;
    cameraShake.current = 0;
    secondAccumulator.current = 0;
    checkpointRef.current = null;
    checkpointFlashTimer.current = 0;
    saveCheckpoint(null);
  };

  // Keyboard Event Binding
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const k = e.key.toLowerCase();
      keysPressed.current[k] = true;

      // Quick hotkey controls
      if (k === 'm') {
        const audioMuted = !gameAudio.isMuted();
        gameAudio.setMute(audioMuted);
        stateRef.current.stats.isSoundMuted = audioMuted;
        gameAudio.playClick();
      }
      if (k === 'r') {
        initLevel();
        gameAudio.playClick();
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      const k = e.key.toLowerCase();
      keysPressed.current[k] = false;
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  // Sync mobile keys to keyboard inputs
  useEffect(() => {
    keysPressed.current['arrowleft'] = mobileKeyStates.left;
    keysPressed.current['arrowright'] = mobileKeyStates.right;
    keysPressed.current['arrowup'] = mobileKeyStates.jump;
    keysPressed.current['e'] = mobileKeyStates.action;
  }, [mobileKeyStates]);

  // Main game loop initialization
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animFrameId: number;

    const updateGame = () => {
      const s = stateRef.current;
      frameCounter.current++;

      if (screen !== 'playing') {
        // Slow particle drift in background when menus are open
        updateBackgroundParticles();
        return;
      }

      // 1. TIMERS & WIN/LOSE CHECKS
      if (s.stats.timeRemaining <= 0) {
        setScreen('gameover');
        gameAudio.playGameOver();
        return;
      }
      if (s.player.lives <= 0) {
        restoreCheckpoint();
        return;
      }

      if (checkpointFlashTimer.current > 0) {
        checkpointFlashTimer.current--;
      }

      // Update seconds
      secondAccumulator.current += 1 / 60;
      if (secondAccumulator.current >= 1) {
        s.stats.timeRemaining = Math.max(0, s.stats.timeRemaining - 1);
        secondAccumulator.current -= 1;
      }

      // 2. PLAYER PHYSICS UPDATES
      updatePlayerPhysics();

      // 3. PLATFORMS & MOVING PHYSICS
      updatePlatforms();

      // 4. ENEMIES & PROJECTILES UPDATE
      updateEnemiesAndProjectiles();

      // 5. OBSTACLES UPDATE (Saws & falling rocks)
      updateObstacles();

      // 6. COLLISION & TRIGGERS CHECKS
      checkGameTriggers();

      // 7. PARTICLES UPDATE
      updateGameParticles();

      // 8. CAMERA UPDATE (Soft follow)
      const targetCamX = s.player.x - logicalWidth / 2 + s.player.width / 2;
      cameraX.current += (targetCamX - cameraX.current) * 0.1;
      // Clamp camera
      cameraX.current = Math.max(0, Math.min(LEVEL_WIDTH - logicalWidth, cameraX.current));

      // Decent camera shake
      if (cameraShake.current > 0) {
        cameraShake.current *= 0.9;
        if (cameraShake.current < 0.1) cameraShake.current = 0;
      }

      // 9. UPDATE HUD METRICS IN REACT
      setHudStats({
        lives: s.player.lives,
        timeRemaining: s.stats.timeRemaining,
        familiesHelped: s.stats.familiesHelped,
        hasWater: s.player.hasWater,
        waterCarried: s.player.waterCarried,
        lastHurtTime: s.player.hurtTimer,
      });
    };

    // PHYSICS HANDLERS
    const updatePlayerPhysics = () => {
      const s = stateRef.current;
      const p = s.player;

      // Timers decrement
      if (p.hurtTimer > 0) p.hurtTimer--;
      if (p.invulnerableTimer > 0) p.invulnerableTimer--;
      if (p.victoryTimer > 0) p.victoryTimer--;

      if (p.hurtTimer > 0) {
        p.isHurt = true;
      } else {
        p.isHurt = false;
      }

      // Inputs
      const moveLeft = keysPressed.current['a'] || keysPressed.current['arrowleft'];
      const moveRight = keysPressed.current['d'] || keysPressed.current['arrowright'];
      const jump = keysPressed.current['w'] || keysPressed.current['arrowup'] || keysPressed.current[' '];

      // Slidiness from mud puddles
      let speedMultiplier = 1.0;
      let onMud = false;

      // Check mud puddles
      s.obstacles.forEach((obs) => {
        if (obs.type === 'mud_puddle' && checkCollision(p, obs)) {
          onMud = true;
        }
      });

      if (onMud) {
        speedMultiplier = 0.45; // significantly slow down in mud
      }

      // Move updates
      if (!p.isHurt) {
        if (moveLeft) {
          p.vx -= PHYSICS.WALK_SPEED * 0.15 * speedMultiplier;
          if (p.vx < -PHYSICS.WALK_SPEED * speedMultiplier) p.vx = -PHYSICS.WALK_SPEED * speedMultiplier;
          p.direction = 'left';
          p.walkTimer++;
          if (p.walkTimer > 6) {
            p.walkFrame = (p.walkFrame + 1) % 4;
            p.walkTimer = 0;
            // sound cue for walking
            if (p.isGrounded && frameCounter.current % 18 === 0) {
              gameAudio.playLand(); // soft noise puff
            }
          }
        } else if (moveRight) {
          p.vx += PHYSICS.WALK_SPEED * 0.15 * speedMultiplier;
          if (p.vx > PHYSICS.WALK_SPEED * speedMultiplier) p.vx = PHYSICS.WALK_SPEED * speedMultiplier;
          p.direction = 'right';
          p.walkTimer++;
          if (p.walkTimer > 6) {
            p.walkFrame = (p.walkFrame + 1) % 4;
            p.walkTimer = 0;
            if (p.isGrounded && frameCounter.current % 18 === 0) {
              gameAudio.playLand();
            }
          }
        } else {
          // apply friction
          p.vx *= PHYSICS.FRICTION;
          if (Math.abs(p.vx) < 0.1) p.vx = 0;
          p.walkFrame = 0;
        }

        // Jump physics
        const jumpJustPressed = jump && !prevJumpPressed.current;
        if (jumpJustPressed) {
          if (p.isGrounded) {
            p.vy = PHYSICS.JUMP_POWER;
            p.isGrounded = false;
            p.doubleJumpsLeft = 1;
            gameAudio.playJump();
            // Emit jump dust particles
            createDustExplosion(p.x + p.width / 2, p.y + p.height, 6);
          } else if ((p.doubleJumpsLeft ?? 0) > 0) {
            p.vy = PHYSICS.JUMP_POWER * 0.95; // slightly softer double jump
            p.doubleJumpsLeft = (p.doubleJumpsLeft ?? 1) - 1;
            gameAudio.playJump();
            // Emit double-jump splash particles
            createSplashExplosion(p.x + p.width / 2, p.y + p.height / 2, 10);
          }
        }
      }

      // Gravity updates
      p.vy += PHYSICS.GRAVITY;
      if (p.vy > PHYSICS.MAX_FALL_SPEED) p.vy = PHYSICS.MAX_FALL_SPEED;

      // Boundary limits
      p.x += p.vx;
      if (p.x < 0) {
        p.x = 0;
        p.vx = 0;
      }
      if (p.x > LEVEL_WIDTH - p.width) {
        p.x = LEVEL_WIDTH - p.width;
        p.vx = 0;
      }

      p.y += p.vy;

      // Bottom out-of-bounds check (respawn on starting or near platform)
      if (p.y > LEVEL_HEIGHT) {
        damagePlayer(true);
        return;
      }

      // Platform Collision checks
      p.isGrounded = false;
      s.platforms.forEach((platform) => {
        // Collisions only when falling down onto platform top
        if (p.vx >= 0 ? (p.x + p.width > platform.x && p.x < platform.x + platform.width) : (p.x < platform.x + platform.width && p.x + p.width > platform.x)) {
          // Standing check
          const prevBottom = p.y + p.height - p.vy;
          if (p.vy >= 0 && prevBottom <= platform.y + 4 && p.y + p.height >= platform.y) {
            p.y = platform.y - p.height;
            p.vy = 0;
            p.isGrounded = true;
            p.doubleJumpsLeft = 1;

            // Trigger collapsing platform stand
            if (platform.type === 'collapsing') {
              if (platform.collapseTimer === -1) {
                platform.collapseTimer = 40; // 40 frames until collapse
              }
            }

            // Carry moving platform velocity
            if (platform.type === 'moving') {
              // Calculate moving speed from ends and speed
              const dx = (platform.endX ?? 0) - (platform.startX ?? 0);
              const dy = (platform.endY ?? 0) - (platform.startY ?? 0);
              const dist = Math.sqrt(dx * dx + dy * dy);
              if (dist > 0) {
                const speedX = (dx / dist) * (platform.speed ?? 1) * (platform.moveDirection ?? 1);
                p.x += speedX;
              }
            }
          }
        }
      });

      // Save key states for next frame transition detection
      prevJumpPressed.current = jump;
    };

    const updatePlatforms = () => {
      const s = stateRef.current;
      s.platforms.forEach((p) => {
        // Moving platform coordinate step
        if (p.type === 'moving' && p.startX !== undefined && p.endX !== undefined) {
          const dx = p.endX - p.startX;
          const dy = (p.endY ?? 0) - (p.startY ?? 0);
          const dist = Math.sqrt(dx * dx + dy * dy);
          
          if (dist > 0) {
            p.moveProgress = (p.moveProgress ?? 0) + ((p.speed ?? 1) / dist) * (p.moveDirection ?? 1);
            if (p.moveProgress >= 1.0) {
              p.moveProgress = 1.0;
              p.moveDirection = -1;
            } else if (p.moveProgress <= 0.0) {
              p.moveProgress = 0.0;
              p.moveDirection = 1;
            }

            p.x = p.startX + dx * p.moveProgress;
            p.y = (p.startY ?? 0) + dy * p.moveProgress;
          }
        }

        // Collapsing platform countdown
        if (p.type === 'collapsing' && p.collapseTimer !== undefined && p.collapseTimer > -1) {
          p.collapseTimer--;
          if (p.collapseTimer === 0) {
            // Spawn collapse particles (shivering wood bits)
            createMudExplosion(p.x + p.width / 2, p.y + p.height / 2, 8, '#78350f');
            gameAudio.playLand();
          }
          if (p.collapseTimer < -60) {
            // Reset collapsing platform after 1 second (60 frames)
            p.collapseTimer = -1;
          }
        }
      });
    };

    const updateEnemiesAndProjectiles = () => {
      const s = stateRef.current;

      // 1. PROJECTILES
      s.projectiles.forEach((proj, idx) => {
        proj.x += proj.vx;
        proj.y += proj.vy;
        proj.life--;

        // Collision with player
        if (checkCircleBoxCollision(proj, s.player)) {
          damagePlayer();
          proj.life = 0; // destroy projectile
        }

        if (proj.life <= 0) {
          s.projectiles.splice(idx, 1);
        }
      });

      // 2. ENEMIES
      s.enemies.forEach((enemy) => {
        enemy.animTimer++;
        if (enemy.animTimer > 10) {
          enemy.animFrame = (enemy.animFrame + 1) % 4;
          enemy.animTimer = 0;
        }

        if (enemy.isHurt && enemy.hurtTimer > 0) {
          enemy.hurtTimer--;
          if (enemy.hurtTimer === 0) enemy.isHurt = false;
        }

        // Enemy specific AI patterns
        if (enemy.type === 'sludge') {
          // Patrol side-to-side
          enemy.x += enemy.vx;
          if (enemy.x <= enemy.patrolMinX) {
            enemy.x = enemy.patrolMinX;
            enemy.vx = Math.abs(enemy.vx);
            enemy.direction = 'right';
          } else if (enemy.x >= enemy.patrolMaxX) {
            enemy.x = enemy.patrolMaxX;
            enemy.vx = -Math.abs(enemy.vx);
            enemy.direction = 'left';
          }
        }

        if (enemy.type === 'slime') {
          // Jumping slime behavior
          enemy.actionTimer--;
          if (enemy.actionTimer <= 0) {
            // Jump!
            enemy.vy = -7.5;
            enemy.vx = (Math.random() > 0.5 ? 1 : -1) * 2;
            enemy.actionTimer = 90 + Math.random() * 60; // reset jump cooloff
            gameAudio.playLand(); // slime bounce sound
          }

          // Apply gravity
          enemy.vy += 0.3;
          enemy.x += enemy.vx;
          enemy.y += enemy.vy;

          // Patrol boundaries check for slimes
          if (enemy.x <= enemy.patrolMinX || enemy.x >= enemy.patrolMaxX) {
            enemy.vx = -enemy.vx;
            enemy.direction = enemy.vx > 0 ? 'right' : 'left';
          }

          // Platform collisions for slimes
          s.platforms.forEach((platform) => {
            if (enemy.x + enemy.width > platform.x && enemy.x < platform.x + platform.width) {
              if (enemy.vy >= 0 && enemy.y + enemy.height >= platform.y && enemy.y + enemy.height - enemy.vy <= platform.y + 4) {
                enemy.y = platform.y - enemy.height;
                enemy.vy = 0;
                enemy.vx = 0; // stop horizontal speed on landing
              }
            }
          });
        }

        if (enemy.type === 'spirit') {
          // Floating wave pattern + Shooting
          enemy.actionTimer++;
          enemy.y = enemy.spawnY + Math.sin(enemy.actionTimer * 0.05) * 35;

          // Slow drift patrol
          enemy.x += enemy.vx;
          if (enemy.x <= enemy.patrolMinX) {
            enemy.vx = Math.abs(enemy.vx);
            enemy.direction = 'right';
          } else if (enemy.x >= enemy.patrolMaxX) {
            enemy.vx = -Math.abs(enemy.vx);
            enemy.direction = 'left';
          }

          // Shooting mud projectiles
          enemy.shootTimer--;
          if (enemy.shootTimer <= 0) {
            // Trigger shoot
            enemy.shootTimer = 110 + Math.random() * 40;
            // Aim at player
            const dx = s.player.x - enemy.x;
            const dy = s.player.y - enemy.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < 400) {
              const vx = (dx / dist) * 4;
              const vy = (dy / dist) * 4;
              s.projectiles.push({
                id: `proj_${Date.now()}_${Math.random()}`,
                x: enemy.x + enemy.width / 2,
                y: enemy.y + enemy.height / 2,
                vx,
                vy,
                radius: 6,
                color: '#78350f', // Poison Mud Dark Brown
                life: 180, // 3 seconds
              });
              gameAudio.playSplash(); // soft splash trigger
            }
          }
        }

        if (enemy.type === 'bat') {
          // Quick swooping bat
          enemy.x += enemy.vx;
          if (enemy.x <= enemy.patrolMinX) {
            enemy.vx = Math.abs(enemy.vx);
            enemy.direction = 'right';
          } else if (enemy.x >= enemy.patrolMaxX) {
            enemy.vx = -Math.abs(enemy.vx);
            enemy.direction = 'left';
          }
          // Slight flap up and down
          enemy.y = enemy.spawnY + Math.sin(enemy.animTimer * 0.3) * 10;
        }

        if (enemy.type === 'fish') {
          // Periodically leaps from deep pools
          enemy.y += enemy.vy;
          enemy.vy += 0.25; // gravity

          if (enemy.y > enemy.spawnY) {
            enemy.y = enemy.spawnY;
            enemy.vy = -8.5 - Math.random() * 3; // jump back up!
            // Splash particles
            createSplashExplosion(enemy.x + enemy.width / 2, enemy.y, 8);
            if (Math.abs(s.player.x - enemy.x) < 300) {
              gameAudio.playSplash();
            }
          }
        }

        // Collision check with Player
        if (checkCollision(s.player, enemy) && !s.player.isHurt && s.player.invulnerableTimer <= 0) {
          damagePlayer();
        }
      });
    };

    const updateObstacles = () => {
      const s = stateRef.current;
      s.obstacles.forEach((obs) => {
        if (obs.type === 'saw_blade' && obs.angle !== undefined) {
          obs.angle = (obs.angle + 4) % 360;
          
          // Collision check
          if (checkCollision(s.player, obs) && !s.player.isHurt && s.player.invulnerableTimer <= 0) {
            damagePlayer();
          }
        }

        if (obs.type === 'falling_rock') {
          obs.spawnTimer = (obs.spawnTimer ?? 0) + 1;
          if (obs.spawnTimer > 140) {
            // Trigger fall!
            obs.y += obs.speedY ?? 0;
            obs.speedY = (obs.speedY ?? 0) + 0.3; // fall acceleration

            // Platform collision for falling rock
            let hitGround = false;
            s.platforms.forEach((platform) => {
              if (obs.x + obs.width > platform.x && obs.x < platform.x + platform.width) {
                if (obs.y + obs.height >= platform.y && obs.y < platform.y + platform.height) {
                  hitGround = true;
                }
              }
            });

            if (hitGround || obs.y > LEVEL_HEIGHT) {
              // Crack and spawn dust
              createMudExplosion(obs.x + obs.width / 2, obs.y + obs.height, 8, '#475569');
              if (Math.abs(s.player.x - obs.x) < 400) {
                gameAudio.playLand();
              }
              // Reset
              obs.y = obs.startY ?? 100;
              obs.speedY = 0;
              obs.spawnTimer = 0;
            }

            // Hit player check
            if (checkCollision(s.player, obs) && !s.player.isHurt && s.player.invulnerableTimer <= 0) {
              damagePlayer();
              obs.y = obs.startY ?? 100;
              obs.speedY = 0;
              obs.spawnTimer = 0;
            }
          }
        }

        if (obs.type === 'spikes') {
          if (checkCollision(s.player, obs) && !s.player.isHurt && s.player.invulnerableTimer <= 0) {
            damagePlayer();
            // Knock upwards
            s.player.vy = -8;
          }
        }
      });
    };

    // TRIGGER & ACTIONS CHECKS
    const checkGameTriggers = () => {
      const s = stateRef.current;
      const p = s.player;

      // Handle Dialog speech bubbler decrement
      s.families.forEach((fam) => {
        if (fam.speechTimer > 0) fam.speechTimer--;
        if (fam.waveTimer > 0) fam.waveTimer--;
      });

      // Press Action key triggers
      const actionKey = keysPressed.current['e'];

      if (actionKey) {
        // Prevent key spamming by setting it false instantly
        keysPressed.current['e'] = false;

        // 1. REFUL WATER AT TANK PROXIMITY
        const nearTank = checkProximity(p, s.waterTank.x + s.waterTank.width / 2, s.waterTank.y + s.waterTank.height, 90);
        if (nearTank) {
          if (!p.hasWater) {
            p.hasWater = true;
            p.waterCarried = 1.0;
            gameAudio.playCollect();
            // Emit splash water particles
            createSplashExplosion(p.x + p.width / 2, p.y - 10, 15);
            // Spawn floating text
            spawnFloatingText(p.x, p.y - 30, "BUCKET FILLED! 💧", "#38bdf8");
          }
          return;
        }

        // 2. DELIVER TO FAMILIES PROXIMITY
        s.families.forEach((fam) => {
          if (fam.hasWater) return; // already helped

          const nearFamily = checkProximity(p, fam.x + fam.width / 2, fam.y, 95);
          if (nearFamily) {
            if (p.hasWater) {
              // SUCCESS WATER DELIVERY
              fam.hasWater = true;
              p.hasWater = false;
              p.waterCarried = 0;
              s.stats.familiesHelped++;
              s.stats.waterDelivered++;

              gameAudio.playDeliver();
              fam.dialogue = "THANK YOU SO MUCH! Real clean water! 💧";
              fam.speechTimer = 240;
              fam.waveTimer = 180;

              // Sparkle sparkles!
              createSparkleExplosion(fam.x + fam.width / 2, fam.y + fam.height / 2, 20);
              spawnFloatingText(fam.x + 20, fam.y - 20, "DELIVERED! 🎉", "#4ade80");

              if (s.stats.familiesHelped < s.stats.totalFamilies) {
                saveCheckpoint(fam.id);
                gameAudio.playCheckpoint();
                spawnFloatingText(fam.x + fam.width / 2, fam.y - 150, "CHECKPOINT REACHED!", "#22d3ee");
              }

              // Victory check
              if (s.stats.familiesHelped === s.stats.totalFamilies) {
                registerTimeout(window.setTimeout(() => {
                  setScreen('victory');
                  gameAudio.playVictory();
                  // massive firework display
                  createVictoryFireworks();
                }, 1000));
              }
            } else {
              // Help prompt dialog
              fam.dialogue = "Please, we need clean water! The tank is on the far left!";
              fam.speechTimer = 150;
              gameAudio.playClick();
            }
          }
        });
      }
    };

    // DMG PLAYER HANDLER
    const damagePlayer = (forceRespawn = false) => {
      const s = stateRef.current;
      const p = s.player;
      if (p.invulnerableTimer > 0 && !forceRespawn) return;

      p.lives--;
      p.hurtTimer = 25; // 25 frames of red flash
      p.invulnerableTimer = 75; // frames of blinking/invulnerable
      p.vx = p.direction === 'left' ? PHYSICS.KNOCKBACK_X : -PHYSICS.KNOCKBACK_X;
      p.vy = PHYSICS.KNOCKBACK_Y;
      p.isGrounded = false;
      
      cameraShake.current = 15; // shake camera!
      gameAudio.playHurt();

      if (forceRespawn) {
        restoreCheckpoint();
        return;
      }

      if (p.lives <= 0) {
        restoreCheckpoint();
        return;
      }

      // Spill a bit of water or splash it!
      if (p.hasWater) {
        createSplashExplosion(p.x + p.width / 2, p.y + p.height / 2, 10);
        // We let them keep the water but show they got hit hard
      }

      // Mud splash visual elements
      createMudExplosion(p.x + p.width / 2, p.y + p.height / 2, 8);
    };

    // VISUAL PARTICLES CREATIONS
    const createSplashExplosion = (x: number, y: number, count: number) => {
      const s = stateRef.current;
      const colors = ['#38bdf8', '#0ea5e9', '#0284c7', '#bae6fd'];
      for (let i = 0; i < count; i++) {
        s.particles.push({
          id: `pt_${Date.now()}_${Math.random()}`,
          x,
          y,
          vx: (Math.random() - 0.5) * 8,
          vy: -Math.random() * 6 - 2,
          color: colors[Math.floor(Math.random() * colors.length)],
          size: Math.random() * 4 + 3,
          alpha: 1.0,
          type: 'splash',
          life: 30 + Math.random() * 20,
          maxLife: 50,
          gravity: 0.25,
          bounce: true,
        });
      }
    };

    const createMudExplosion = (x: number, y: number, count: number, customColor?: string) => {
      const s = stateRef.current;
      const colors = [customColor ?? '#78350f', '#451a03', '#92400e', '#7c2d12'];
      for (let i = 0; i < count; i++) {
        s.particles.push({
          id: `pt_${Date.now()}_${Math.random()}`,
          x,
          y,
          vx: (Math.random() - 0.5) * 6,
          vy: -Math.random() * 4 - 1,
          color: colors[Math.floor(Math.random() * colors.length)],
          size: Math.random() * 3 + 2,
          alpha: 0.9,
          type: 'mud',
          life: 20 + Math.random() * 20,
          maxLife: 40,
          gravity: 0.2,
        });
      }
    };

    const createSparkleExplosion = (x: number, y: number, count: number) => {
      const s = stateRef.current;
      const colors = ['#facc15', '#4ade80', '#22d3ee', '#a78bfa', '#ffffff'];
      for (let i = 0; i < count; i++) {
        s.particles.push({
          id: `pt_${Date.now()}_${Math.random()}`,
          x,
          y,
          vx: (Math.random() - 0.5) * 7,
          vy: (Math.random() - 0.5) * 7 - 2,
          color: colors[Math.floor(Math.random() * colors.length)],
          size: Math.random() * 4 + 2,
          alpha: 1.0,
          type: 'sparkle',
          life: 40 + Math.random() * 30,
          maxLife: 70,
        });
      }
    };

    const createDustExplosion = (x: number, y: number, count: number) => {
      const s = stateRef.current;
      for (let i = 0; i < count; i++) {
        s.particles.push({
          id: `pt_${Date.now()}_${Math.random()}`,
          x,
          y,
          vx: (Math.random() - 0.5) * 3,
          vy: -Math.random() * 1.5,
          color: 'rgba(255,255,255,0.45)',
          size: Math.random() * 5 + 3,
          alpha: 0.6,
          type: 'dust',
          life: 15 + Math.random() * 15,
          maxLife: 30,
        });
      }
    };

    const spawnFloatingText = (x: number, y: number, text: string, color: string) => {
      const s = stateRef.current;
      // Add a special bubble particle representing floating text
      s.particles.push({
        id: `pt_text_${Date.now()}_${Math.random()}`,
        x,
        y,
        vx: 0,
        vy: -0.8,
        color,
        size: 14, // repurposed as font size
        alpha: 1.0,
        type: 'star', // repurposed as floating text flag
        life: 60,
        maxLife: 60,
        gravity: 0,
        bounce: false,
        // Carry text value
        id_val_custom: text as any,
      } as any);
    };

    const createVictoryFireworks = () => {
      const s = stateRef.current;
      const colors = ['#ef4444', '#3b82f6', '#10b981', '#f59e0b', '#ec4899', '#8b5cf6', '#06b6d4'];
      
      // Schedule fireworks every half second
      for (let f = 0; f < 8; f++) {
        registerTimeout(window.setTimeout(() => {
          if (stateRef.current.screen !== 'victory') return;
          const fx = 200 + Math.random() * (logicalWidth - 400) + cameraX.current;
          const fy = 100 + Math.random() * 180;
          const fcolor = colors[Math.floor(Math.random() * colors.length)];
          
          // explosion
          for (let p = 0; p < 25; p++) {
            const angle = (p / 25) * Math.PI * 2;
            const spd = 2.5 + Math.random() * 3.5;
            stateRef.current.particles.push({
              id: `pt_fw_${f}_${p}_${Math.random()}`,
              x: fx,
              y: fy,
              vx: Math.cos(angle) * spd,
              vy: Math.sin(angle) * spd,
              color: fcolor,
              size: Math.random() * 3.5 + 2.5,
              alpha: 1.0,
              type: 'firework',
              life: 50 + Math.random() * 30,
              maxLife: 80,
              gravity: 0.05,
            });
          }
          gameAudio.playVictory(); // play retro bell sound
        }, f * 450));
      }
    };

    // UPDATE PARTICLES SYSTEMS
    const updateGameParticles = () => {
      const s = stateRef.current;
      s.particles.forEach((p, idx) => {
        p.x += p.vx;
        p.y += p.vy;

        if (p.gravity !== undefined) {
          p.vy += p.gravity;
        }

        p.life--;
        p.alpha = Math.max(0, p.life / p.maxLife);

        if (p.bounce && p.y > LEVEL_HEIGHT - 30) {
          p.vy = -p.vy * 0.5;
          p.y = LEVEL_HEIGHT - 31;
        }

        if (p.life <= 0) {
          s.particles.splice(idx, 1);
        }
      });
    };

    const updateBackgroundParticles = () => {
      const s = stateRef.current;
      // Ambient bubble generation at water tank
      if (frameCounter.current % 40 === 0) {
        s.particles.push({
          id: `ambient_${Date.now()}`,
          x: s.waterTank.x + 20 + Math.random() * 40,
          y: s.waterTank.y + s.waterTank.height - 10,
          vx: (Math.random() - 0.5) * 0.5,
          vy: -Math.random() * 1.5 - 0.5,
          color: 'rgba(56, 189, 248, 0.4)',
          size: Math.random() * 4 + 2,
          alpha: 0.6,
          type: 'bubble',
          life: 90,
          maxLife: 90,
        });
      }

      s.particles.forEach((p, idx) => {
        p.x += p.vx;
        p.y += p.vy;
        p.life--;
        p.alpha = Math.max(0, p.life / p.maxLife);
        if (p.life <= 0) {
          s.particles.splice(idx, 1);
        }
      });
    };

    // RENDER DRAWING METHODS
    const draw = () => {
      const s = stateRef.current;
      ctx.clearRect(0, 0, logicalWidth, logicalHeight);

      // Camera Offset inside draw context
      const cx = cameraX.current;

      // Apply camera shake
      let shakeOffsetX = 0;
      let shakeOffsetY = 0;
      if (cameraShake.current > 0) {
        shakeOffsetX = (Math.random() - 0.5) * cameraShake.current;
        shakeOffsetY = (Math.random() - 0.5) * cameraShake.current;
      }

      ctx.save();
      ctx.translate(-cx + shakeOffsetX, shakeOffsetY);

      // 1. BACKDROP PARALLAX SKIES & MOUNTAINS
      drawSky(cx);

      // 2. PARALLAX CLOUDS & HILLS
      drawHillsAndClouds(cx);

      // 3. BACKGROUND SCENE ASSETS (Decorations: Waterfalls, trees, bushes, rivers)
      drawBackgroundDecorations(cx);

      // 4. PLATFORMS
      s.platforms.forEach((platform) => {
        drawPlatform(ctx, platform);
      });

      // 5. OBSTACLES (Spikes, mud, saws)
      s.obstacles.forEach((obs) => {
        drawObstacle(ctx, obs);
      });

      // 6. WATER TANK
      drawWaterTank(ctx, s.waterTank);

      // 7. FAMILIES HUTS & KIDS
      s.families.forEach((fam) => {
        drawFamily(ctx, fam);
      });

      // 8. ENEMIES & PROJECTILES
      s.enemies.forEach((enemy) => {
        drawEnemy(ctx, enemy);
      });
      s.projectiles.forEach((proj) => {
        drawProjectile(ctx, proj);
      });

      // 9. GAME PARTICLES
      s.particles.forEach((p) => {
        drawParticle(ctx, p);
      });

      // 10. MAIN HERO PLAYER
      drawPlayer(ctx, s.player);

      ctx.restore();
    };

    // --- PROCEDURAL PIXEL-ART DRAWING METHODS ---
    const drawSky = (cx: number) => {
      // Clean sky-gradient
      const grad = ctx.createLinearGradient(cx, 0, cx, logicalHeight);
      grad.addColorStop(0, '#bae6fd'); // sky blue light
      grad.addColorStop(1, '#f0f9ff'); // very soft blue white
      ctx.fillStyle = grad;
      ctx.fillRect(cx, 0, logicalWidth, logicalHeight);

      // Far mountains parallax (moves at 10% speed)
      ctx.fillStyle = '#93c5fd'; // light blue purple
      const mountCamX = cx * 0.1;
      
      ctx.beginPath();
      ctx.moveTo(cx - 50, 480);
      ctx.lineTo(cx + 100 - mountCamX, 280);
      ctx.lineTo(cx + 300 - mountCamX, 480);
      
      ctx.lineTo(cx + 450 - mountCamX, 220);
      ctx.lineTo(cx + 650 - mountCamX, 480);

      ctx.lineTo(cx + 800 - mountCamX, 260);
      ctx.lineTo(cx + 1000 - mountCamX, 480);
      
      ctx.lineTo(cx + 1200 - mountCamX, 200);
      ctx.lineTo(cx + 1450 - mountCamX, 480);

      // Right-side mountains extending
      ctx.lineTo(cx + 1800 - mountCamX, 230);
      ctx.lineTo(cx + 2100 - mountCamX, 480);
      ctx.lineTo(cx + 2500 - mountCamX, 190);
      ctx.lineTo(cx + 2900 - mountCamX, 480);
      ctx.lineTo(cx + 3400 - mountCamX, 220);
      ctx.lineTo(cx + 3900 - mountCamX, 480);

      ctx.fill();

      // Shadow overlay mountains (moves at 15% speed)
      ctx.fillStyle = '#60a5fa'; // solid blue shadow
      const mountCamX2 = cx * 0.15;
      ctx.beginPath();
      ctx.moveTo(cx - 50, 480);
      ctx.lineTo(cx + 220 - mountCamX2, 330);
      ctx.lineTo(cx + 450 - mountCamX2, 480);
      ctx.lineTo(cx + 600 - mountCamX2, 300);
      ctx.lineTo(cx + 820 - mountCamX2, 480);
      ctx.lineTo(cx + 1100 - mountCamX2, 320);
      ctx.lineTo(cx + 1380 - mountCamX2, 480);
      ctx.lineTo(cx + 1950 - mountCamX2, 310);
      ctx.lineTo(cx + 2400 - mountCamX2, 480);
      ctx.lineTo(cx + 2850 - mountCamX2, 290);
      ctx.lineTo(cx + 3300 - mountCamX2, 480);
      ctx.fill();
    };

    const drawHillsAndClouds = (cx: number) => {
      // Midground Hills parallax (moves at 25% speed)
      ctx.fillStyle = '#4ade80'; // Lush hills green
      const hillCamX = cx * 0.25;

      ctx.beginPath();
      ctx.moveTo(cx - 50, 500);
      // smooth sine curve hills
      for (let x = cx - 50; x < cx + logicalWidth + 100; x += 40) {
        const hY = 440 + Math.sin((x + hillCamX) * 0.0035) * 50 + Math.cos((x + hillCamX) * 0.001) * 20;
        ctx.lineTo(x, hY);
      }
      ctx.lineTo(cx + logicalWidth + 100, 550);
      ctx.lineTo(cx - 50, 550);
      ctx.fill();

      // Drawing Floating Clouds drifting (moves at 5% + slow offset)
      ctx.fillStyle = '#ffffff';
      const cloudOffset = (frameCounter.current * 0.15) % LEVEL_WIDTH;
      
      const drawSingleCloud = (x: number, y: number, r: number) => {
        // Draw standard retro round puffy pixel clusters
        ctx.beginPath();
        ctx.arc(x, y, r, 0, Math.PI * 2);
        ctx.arc(x + r, y - r * 0.3, r * 1.2, 0, Math.PI * 2);
        ctx.arc(x + r * 2.2, y, r * 0.9, 0, Math.PI * 2);
        ctx.arc(x + r * 1.3, y + r * 0.4, r, 0, Math.PI * 2);
        ctx.fill();
      };

      // Spaced out clouds
      for (let i = 0; i < 15; i++) {
        const cloudX = (i * 350 + cloudOffset - cx * 0.05) % (LEVEL_WIDTH + 400) - 200;
        const cloudY = 60 + Math.sin(i * 1.7) * 35;
        drawSingleCloud(cloudX, cloudY, 18);
      }
    };

    const drawBackgroundDecorations = (cx: number) => {
      // Draw tall green trees in background hills
      ctx.fillStyle = '#15803d'; // Forest dark green
      
      const drawTree = (tx: number, ty: number, size: number) => {
        // Wooden trunk
        ctx.fillStyle = '#78350f';
        ctx.fillRect(tx - size / 6, ty - size * 0.3, size / 3, size * 0.3);
        // Foliage triangles
        ctx.fillStyle = '#15803d';
        ctx.beginPath();
        ctx.moveTo(tx - size / 2, ty - size * 0.3);
        ctx.lineTo(tx, ty - size * 1.2);
        ctx.lineTo(tx + size / 2, ty - size * 0.3);
        ctx.fill();
      };

      // Spacing out background trees
      for (let i = 0; i < 40; i++) {
        const tx = i * 95 + 100;
        if (tx > cx - 50 && tx < cx + logicalWidth + 50) {
          // find ground height
          const ty = 490 + Math.sin(tx * 0.0035) * 50;
          drawTree(tx, ty, 25 + (tx % 15));
        }
      }

      // Animated Waterfalls on some floating cliffs
      ctx.fillStyle = '#38bdf8'; // clear water
      ctx.fillStyle = 'rgba(56, 189, 248, 0.75)';

      const waterfallTimeOffset = (frameCounter.current * 2) % 40;
      
      // Waterfall 1 at x = 1120 (behind platforms)
      ctx.fillRect(1110, 450, 40, 200);
      // splash foam details
      ctx.fillStyle = '#ffffff';
      for (let s = 0; s < 5; s++) {
        const fy = 450 + ((s * 40 + waterfallTimeOffset) % 200);
        ctx.fillRect(1110 + Math.sin(fy) * 3, fy, 4, 8);
      }
    };

    const drawPlatform = (c: CanvasRenderingContext2D, p: PlatformState) => {
      c.save();

      // Shaking platform if collapsing and standing
      if (p.type === 'collapsing' && p.collapseTimer !== undefined && p.collapseTimer > 0) {
        c.translate((Math.random() - 0.5) * 3, 0);
      }

      // Hide completely if collapsed and timer is running out
      if (p.type === 'collapsing' && p.collapseTimer !== undefined && p.collapseTimer === 0) {
        c.restore();
        return;
      }
      if (p.type === 'collapsing' && p.collapseTimer !== undefined && p.collapseTimer < 0 && p.collapseTimer > -60) {
        // is collapsed and waiting to restore (transparent/shivering)
        c.globalAlpha = 0.15;
      }

      // Grass vs Stone colors
      if (p.type === 'grass') {
        // Green Grass top
        c.fillStyle = '#16a34a'; // grass green
        c.fillRect(p.x, p.y, p.width, 14);

        // Brown Soil bottom
        c.fillStyle = '#78350f'; // soil brown
        c.fillRect(p.x, p.y + 14, p.width, p.height - 14);

        // Soil texture dots (Pixelated details)
        c.fillStyle = '#451a03';
        for (let ix = p.x + 8; ix < p.x + p.width - 4; ix += 32) {
          for (let iy = p.y + 20; iy < p.y + p.height - 8; iy += 24) {
            c.fillRect(ix + (iy % 5), iy, 6, 6);
          }
        }

        // Grassy blade pixel outlines
        c.fillStyle = '#15803d'; // darker green
        for (let ix = p.x; ix < p.x + p.width; ix += 10) {
          c.fillRect(ix, p.y + 10, 4, 4);
        }
      } else if (p.type === 'stone' || p.type === 'moving') {
        // Gray Stone Blocks
        c.fillStyle = '#64748b'; // slate gray
        c.fillRect(p.x, p.y, p.width, p.height);

        // Brick outlines
        c.strokeStyle = '#334155';
        c.lineWidth = 3;
        c.strokeRect(p.x, p.y, p.width, p.height);

        // Tech outline/accent for moving platforms
        if (p.type === 'moving') {
          c.fillStyle = '#0ea5e9'; // vibrant cyan sparkle
          c.fillRect(p.x + 4, p.y + 2, p.width - 8, 4);
        }
      } else if (p.type === 'collapsing') {
        // Wooden decaying bridge look
        c.fillStyle = '#b45309'; // amber brown
        c.fillRect(p.x, p.y, p.width, p.height);

        // Wood planks outlines
        c.strokeStyle = '#451a03';
        c.lineWidth = 2.5;
        for (let px = p.x + 12; px < p.x + p.width; px += 20) {
          c.beginPath();
          c.moveTo(px, p.y);
          c.lineTo(px, p.y + p.height);
          c.stroke();
        }
        c.strokeRect(p.x, p.y, p.width, p.height);
      }

      c.restore();
    };

    const drawObstacle = (c: CanvasRenderingContext2D, o: ObstacleState) => {
      c.save();

      if (o.type === 'spikes') {
        c.fillStyle = '#94a3b8'; // steel gray
        c.strokeStyle = '#475569';
        c.lineWidth = 2;

        const numSpikes = Math.ceil(o.width / 16);
        const spikeW = o.width / numSpikes;

        for (let i = 0; i < numSpikes; i++) {
          const sx = o.x + i * spikeW;
          c.beginPath();
          c.moveTo(sx, o.y + o.height);
          c.lineTo(sx + spikeW / 2, o.y);
          c.lineTo(sx + spikeW, o.y + o.height);
          c.closePath();
          c.fill();
          c.stroke();
        }
      } else if (o.type === 'mud_puddle') {
        // Muddy brown gooey water
        c.fillStyle = '#7c2d12'; // deep mud brown
        c.fillRect(o.x, o.y + 4, o.width, o.height - 4);

        // Puddle lip
        c.fillStyle = '#451a03';
        c.fillRect(o.x - 2, o.y, o.width + 4, 4);

        // Bubbles in mud
        c.fillStyle = '#92400e';
        const bubX = o.x + 10 + (frameCounter.current % (o.width - 20));
        c.fillRect(bubX, o.y + 3 + Math.sin(frameCounter.current * 0.1) * 2, 4, 4);
      } else if (o.type === 'saw_blade') {
        const cx = o.x + o.width / 2;
        const cy = o.y + o.height / 2;
        const r = o.width / 2;

        c.translate(cx, cy);
        c.rotate(((o.angle ?? 0) * Math.PI) / 180);

        // Metallic circle plate
        c.fillStyle = '#94a3b8';
        c.strokeStyle = '#1e293b';
        c.lineWidth = 3.5;
        c.beginPath();
        c.arc(0, 0, r - 6, 0, Math.PI * 2);
        c.fill();
        c.stroke();

        // Rusty inner ring
        c.strokeStyle = '#7c2d12';
        c.beginPath();
        c.arc(0, 0, r - 12, 0, Math.PI * 2);
        c.stroke();

        // Saw teeth
        c.fillStyle = '#cbd5e1';
        const teeth = 12;
        for (let i = 0; i < teeth; i++) {
          const angle = (i / teeth) * Math.PI * 2;
          c.beginPath();
          c.moveTo(Math.cos(angle) * (r - 6), Math.sin(angle) * (r - 6));
          c.lineTo(Math.cos(angle + 0.15) * r, Math.sin(angle + 0.15) * r);
          c.lineTo(Math.cos(angle + 0.3) * (r - 6), Math.sin(angle + 0.3) * (r - 6));
          c.closePath();
          c.fill();
          c.stroke();
        }

        // Center nut
        c.fillStyle = '#475569';
        c.fillRect(-4, -4, 8, 8);
      } else if (o.type === 'falling_rock') {
        // Boulder pixel circle
        c.fillStyle = '#64748b'; // slate dark rock
        c.strokeStyle = '#1e293b';
        c.lineWidth = 3;

        c.beginPath();
        c.arc(o.x + o.width / 2, o.y + o.height / 2, o.width / 2, 0, Math.PI * 2);
        c.fill();
        c.stroke();

        // Rock cracks/details
        c.strokeStyle = '#334155';
        c.beginPath();
        c.moveTo(o.x + 8, o.y + 8);
        c.lineTo(o.x + o.width - 8, o.y + o.height - 8);
        c.moveTo(o.x + o.width / 2, o.y + 4);
        c.lineTo(o.x + o.width / 3, o.y + o.height - 5);
        c.stroke();
      }

      c.restore();
    };

    const drawWaterTank = (c: CanvasRenderingContext2D, t: WaterTankState) => {
      c.save();

      // Large metal tank cylinder
      c.fillStyle = '#94a3b8'; // steel
      c.strokeStyle = '#334155';
      c.lineWidth = 4;
      
      // Draw cylinder body
      c.fillRect(t.x, t.y, t.width, t.height);
      c.strokeRect(t.x, t.y, t.width, t.height);

      // Rounded dome top
      c.fillStyle = '#cbd5e1';
      c.beginPath();
      c.arc(t.x + t.width / 2, t.y, t.width / 2, Math.PI, 0);
      c.closePath();
      c.fill();
      c.stroke();

      // Support legs
      c.fillStyle = '#475569';
      c.fillRect(t.x + 8, t.y + t.height, 12, 30);
      c.strokeRect(t.x + 8, t.y + t.height, 12, 30);
      c.fillRect(t.x + t.width - 20, t.y + t.height, 12, 30);
      c.strokeRect(t.x + t.width - 20, t.y + t.height, 12, 30);

      // Glass water indicators
      c.fillStyle = '#0f172a'; // dark frame
      c.fillRect(t.x + t.width / 2 - 12, t.y + 40, 24, t.height - 70);

      // Animated glowing bubbly water level
      const pulseWater = 0.5 + Math.sin(frameCounter.current * 0.05) * 0.05;
      c.fillStyle = '#0ea5e9'; // vibrant water
      const waterHeight = (t.height - 76) * t.waterLevel;
      c.fillRect(t.x + t.width / 2 - 8, t.y + t.height - 34 - waterHeight, 16, waterHeight);

      // Dripping Faucet nozzle
      c.fillStyle = '#64748b';
      c.fillRect(t.x + t.width, t.y + t.height - 60, 20, 14);
      c.strokeRect(t.x + t.width, t.y + t.height - 60, 20, 14);
      
      // Nozzle downward tip
      c.fillRect(t.x + t.width + 12, t.y + t.height - 46, 8, 12);

      // Water droplets animation
      t.drippingTimer++;
      const dripY = (t.y + t.height - 34) + ((t.drippingTimer * 1.5) % 25);
      c.fillStyle = '#38bdf8';
      c.fillRect(t.x + t.width + 14, dripY, 4, 6);

      // Glow sparkle on glass
      c.fillStyle = 'rgba(255,255,255,0.35)';
      c.fillRect(t.x + t.width / 2 - 8, t.y + 45, 4, t.height - 80);

      // Press Action prompt if near
      const distToPlayer = checkProximity(stateRef.current.player, t.x + t.width / 2, t.y + t.height, 90);
      if (distToPlayer && !stateRef.current.player.hasWater) {
        drawActionBubble(c, t.x + t.width / 2, t.y - 45, "Press E to collect");
      }

      c.restore();
    };

    const drawFamily = (c: CanvasRenderingContext2D, f: FamilyState) => {
      c.save();

      // Draw Traditional Thatch Hut
      // Base walls (Dark brown log texture)
      c.fillStyle = '#78350f'; // log brown
      c.fillRect(f.x, f.y - 70, f.width, 70);
      c.strokeStyle = '#451a03';
      c.lineWidth = 3;
      c.strokeRect(f.x, f.y - 70, f.width, 70);

      // Thatch Roof (Golden yellow pyramid)
      c.fillStyle = '#eab308'; // golden yellow
      c.strokeStyle = '#854d0e';
      c.lineWidth = 3.5;
      c.beginPath();
      c.moveTo(f.x - 12, f.y - 70);
      c.lineTo(f.x + f.width / 2, f.y - 120);
      c.lineTo(f.x + f.width + 12, f.y - 70);
      c.closePath();
      c.fill();
      c.stroke();

      // Doorway
      c.fillStyle = '#451a03';
      c.fillRect(f.x + 35, f.y - 40, 30, 40);

      // Hut windows
      c.fillStyle = f.hasWater ? '#38bdf8' : '#3b0712'; // happy blue vs sad red/black
      c.fillRect(f.x + 12, f.y - 50, 16, 16);
      c.strokeRect(f.x + 12, f.y - 50, 16, 16);

      // Water Faucet beside hut (dirty river water or clean shiny water)
      c.fillStyle = '#64748b';
      // Faucet pipe
      c.fillRect(f.x + f.width + 10, f.y - 25, 6, 25);
      c.fillRect(f.x + f.width, f.y - 25, 12, 6);

      if (checkpointRef.current?.familyId === f.id) {
        const checkpointPulse = checkpointFlashTimer.current > 0 ? Math.sin(frameCounter.current * 0.45) * 2.5 : 0;
        const markerX = f.x + f.width + 28;
        const markerY = f.y - 98;

        c.save();
        c.shadowColor = 'rgba(34, 211, 238, 0.9)';
        c.shadowBlur = checkpointFlashTimer.current > 0 ? 18 : 10;
        c.strokeStyle = '#67e8f9';
        c.fillStyle = '#22d3ee';
        c.lineWidth = 4;

        c.beginPath();
        c.moveTo(markerX, markerY + 20 + checkpointPulse);
        c.lineTo(markerX, markerY + 58);
        c.stroke();

        c.fillRect(markerX - 3, markerY + 16 + checkpointPulse, 6, 8);
        c.beginPath();
        c.moveTo(markerX, markerY + 20 + checkpointPulse);
        c.lineTo(markerX + 24, markerY + 30 + checkpointPulse);
        c.lineTo(markerX, markerY + 40 + checkpointPulse);
        c.closePath();
        c.fill();

        c.fillStyle = 'rgba(255, 255, 255, 0.9)';
        c.fillRect(markerX + 8, markerY + 28 + checkpointPulse, 4, 4);
        c.restore();
      }
      
      // Dripping water droplets
      const faucetTime = (frameCounter.current) % 30;
      if (f.hasWater) {
        c.fillStyle = '#38bdf8'; // Clean crystal blue water dripping!
        c.fillRect(f.x + f.width + 2, f.y - 19 + faucetTime * 0.5, 3, 5);
      } else {
        c.fillStyle = '#78350f'; // Muddy brown dirty sludge dripping!
        c.fillRect(f.x + f.width + 2, f.y - 19 + faucetTime * 0.4, 4, 4);
      }

      // Draw waiting child standing/sitting by doorway
      drawChild(c, f);

      // Dialogue Speech Bubble (If active or near)
      const nearPlayer = checkProximity(stateRef.current.player, f.x + f.width / 2, f.y, 95);
      
      if (f.speechTimer > 0) {
        drawSpeechBubble(c, f.x + f.width / 2, f.y - 135, f.dialogue);
      } else if (nearPlayer) {
        if (stateRef.current.player.hasWater) {
          drawActionBubble(c, f.x + f.width / 2, f.y - 135, "Press E to Deliver Water!");
        } else if (!f.hasWater) {
          drawSpeechBubble(c, f.x + f.width / 2, f.y - 135, "We need water!");
        }
      }

      c.restore();
    };

    const drawChild = (c: CanvasRenderingContext2D, f: FamilyState) => {
      c.save();
      const childX = f.x + 75;
      const childY = f.y;

      // Squatting or waving child
      const waveOffset = f.waveTimer > 0 ? Math.sin(frameCounter.current * 0.3) * 6 : 0;
      const breathing = Math.sin(frameCounter.current * 0.08) * 1.5;

      // Head / Skin
      c.fillStyle = '#fdba74'; // warm skin tone
      c.fillRect(childX, childY - 28 + breathing, 12, 12);

      // Hair
      c.fillStyle = '#1e293b'; // dark hair
      c.fillRect(childX - 1, childY - 32 + breathing, 14, 6);

      // Shirt
      c.fillStyle = f.hasWater ? '#10b981' : '#f43f5e'; // green happy shirt vs red sad
      c.fillRect(childX - 2, childY - 16, 16, 16);

      // Waving hand
      c.fillStyle = '#fdba74';
      if (f.waveTimer > 0) {
        // high arm
        c.fillRect(childX + 14, childY - 24 + waveOffset, 4, 8);
      } else {
        // low arm
        c.fillRect(childX - 6, childY - 14, 4, 6);
      }

      // Eyes (crying blue dots vs happy pixels)
      c.fillStyle = f.hasWater ? '#22c55e' : '#38bdf8';
      if (f.hasWater) {
        c.fillRect(childX + 3, childY - 23 + breathing, 2, 2);
        c.fillRect(childX + 7, childY - 23 + breathing, 2, 2);
      } else {
        // tears falling
        c.fillRect(childX + 2, childY - 22 + waveOffset * 0.1, 2, 2);
        c.fillRect(childX + 8, childY - 22 + waveOffset * 0.1, 2, 2);
      }

      c.restore();
    };

    const drawEnemy = (c: CanvasRenderingContext2D, e: EnemyState) => {
      c.save();

      // Flashing red if hit/hurt
      if (e.isHurt) {
        c.fillStyle = '#ef4444';
      }

      const breathing = Math.sin(frameCounter.current * 0.15) * 2.5;

      if (e.type === 'sludge') {
        // Large Toxic Mud Monster
        const scaleY = 1.0 + breathing * 0.04;
        c.translate(e.x + e.width / 2, e.y + e.height);
        c.scale(e.direction === 'right' ? 1 : -1, scaleY);

        // Outer sludge bubble shapes
        c.fillStyle = e.isHurt ? '#ef4444' : '#1e3a1e'; // Dark green sludge
        c.strokeStyle = '#052e16';
        c.lineWidth = 3;

        c.beginPath();
        c.moveTo(-e.width / 2, 0);
        c.quadraticCurveTo(-e.width / 2 - 4, -e.height * 0.5, -e.width * 0.3, -e.height);
        c.quadraticCurveTo(0, -e.height - 10, e.width * 0.3, -e.height);
        c.quadraticCurveTo(e.width / 2 + 4, -e.height * 0.5, e.width / 2, 0);
        c.closePath();
        c.fill();
        c.stroke();

        // Glowing toxic red/yellow eyes
        c.fillStyle = '#fbbf24'; // yellow outer
        c.fillRect(-12, -32, 6, 6);
        c.fillRect(6, -32, 6, 6);
        c.fillStyle = '#ef4444'; // red center
        c.fillRect(-11, -31, 4, 4);
        c.fillRect(7, -31, 4, 4);

        // Fangs / Teeth
        c.fillStyle = '#ffffff';
        c.fillRect(-6, -18, 3, 4);
        c.fillRect(3, -18, 3, 4);

        // Green bubbling toxic details
        c.fillStyle = '#4ade80';
        c.fillRect(-4, -40, 4, 4);
        c.fillRect(8, -12, 3, 3);
      } else if (e.type === 'slime') {
        // Squishy Mud Slime
        const sx = e.x + e.width / 2;
        const sy = e.y + e.height;
        c.translate(sx, sy);

        // Stretch when moving fast
        const stretchX = e.vy !== 0 ? 0.8 : 1.1 + Math.sin(frameCounter.current * 0.2) * 0.08;
        const stretchY = e.vy !== 0 ? 1.25 : 0.85 - Math.sin(frameCounter.current * 0.2) * 0.08;
        c.scale(stretchX, stretchY);

        c.fillStyle = e.isHurt ? '#ef4444' : '#451a03'; // slimy dark brown mud
        c.strokeStyle = '#1e1b4b';
        c.lineWidth = 2.5;

        c.beginPath();
        c.arc(0, -10, e.width / 2, Math.PI, 0, false);
        c.lineTo(e.width / 2, 0);
        c.lineTo(-e.width / 2, 0);
        c.closePath();
        c.fill();
        c.stroke();

        // Slime face
        c.fillStyle = '#ef4444';
        c.fillRect(-6, -10, 3, 3);
        c.fillRect(3, -10, 3, 3);
      } else if (e.type === 'spirit') {
        // Translucent floating poison gas spirit
        c.translate(e.x + e.width / 2, e.y + e.height / 2);
        
        c.fillStyle = e.isHurt ? '#ef4444' : 'rgba(168, 85, 247, 0.75)'; // glowing violet
        c.strokeStyle = '#6b21a8';
        c.lineWidth = 2.5;

        c.beginPath();
        c.arc(0, -5, e.width / 2, 0, Math.PI * 2);
        c.fill();
        c.stroke();

        // Spirit ghostly tail
        c.beginPath();
        c.moveTo(-e.width / 2 + 2, 4);
        c.lineTo(0, e.height / 2 + 8 + breathing * 0.5);
        c.lineTo(e.width / 2 - 2, 4);
        c.closePath();
        c.fill();
        c.stroke();

        // Sparkle poison face
        c.fillStyle = '#22d3ee'; // cyan eyes
        c.fillRect(-7, -8, 3, 3);
        c.fillRect(4, -8, 3, 3);
      } else if (e.type === 'bat') {
        // Flying cave bat with wing flapping animation
        const fx = e.x + e.width / 2;
        const fy = e.y + e.height / 2;
        c.translate(fx, fy);
        c.scale(e.direction === 'right' ? 1 : -1, 1);

        c.fillStyle = e.isHurt ? '#ef4444' : '#471465'; // bat purple
        c.strokeStyle = '#020617';
        c.lineWidth = 2.5;

        // Draw body
        c.beginPath();
        c.arc(0, 0, 7, 0, Math.PI * 2);
        c.fill();
        c.stroke();

        // Flapping Wings
        const wingFlap = Math.sin(frameCounter.current * 0.4) * e.height * 0.9;
        c.beginPath();
        c.moveTo(-4, 0);
        c.lineTo(-18, -wingFlap);
        c.lineTo(-12, wingFlap * 0.2);
        c.closePath();
        c.fill();
        c.stroke();

        c.beginPath();
        c.moveTo(4, 0);
        c.lineTo(18, -wingFlap);
        c.lineTo(12, wingFlap * 0.2);
        c.closePath();
        c.fill();
        c.stroke();

        // Small red glowing eyes
        c.fillStyle = '#f43f5e';
        c.fillRect(-3, -2, 1.5, 1.5);
        c.fillRect(1.5, -2, 1.5, 1.5);
      } else if (e.type === 'fish') {
        // Polluted Toxic Jumping Fish
        c.translate(e.x + e.width / 2, e.y + e.height / 2);
        
        // Face up on leap, down on falling
        const angle = e.vy > 0 ? Math.PI * 0.25 : -Math.PI * 0.25;
        c.rotate(angle);

        c.fillStyle = e.isHurt ? '#ef4444' : '#047857'; // toxic green scale
        c.strokeStyle = '#064e3b';
        c.lineWidth = 2.5;

        // Fish main oval
        c.beginPath();
        c.ellipse(0, 0, e.width / 2, e.height / 2, 0, 0, Math.PI * 2);
        c.fill();
        c.stroke();

        // Fins
        c.fillStyle = '#a855f7'; // mutated purple fins
        c.beginPath();
        c.moveTo(-e.width / 2, 0);
        c.lineTo(-e.width / 2 - 8, -6);
        c.lineTo(-e.width / 2 - 8, 6);
        c.closePath();
        c.fill();
        c.stroke();

        // Sickly mutated red eye
        c.fillStyle = '#ef4444';
        c.fillRect(4, -4, 4, 4);
      }

      c.restore();
    };

    const drawProjectile = (c: CanvasRenderingContext2D, proj: ProjectileState) => {
      c.save();
      // Glowing outer halo
      const pulseRadius = proj.radius + Math.sin(frameCounter.current * 0.3) * 2;
      c.fillStyle = 'rgba(120, 53, 15, 0.4)'; // glowing mud
      c.beginPath();
      c.arc(proj.x, proj.y, pulseRadius * 1.5, 0, Math.PI * 2);
      c.fill();

      // Core projectile
      c.fillStyle = proj.color;
      c.strokeStyle = '#1a0d00';
      c.lineWidth = 1.5;
      c.beginPath();
      c.arc(proj.x, proj.y, proj.radius, 0, Math.PI * 2);
      c.fill();
      c.stroke();
      c.restore();
    };

    const drawPlayer = (c: CanvasRenderingContext2D, p: PlayerState) => {
      c.save();

      // 1. Invulnerable Blinking frame bypass
      if (p.invulnerableTimer > 0 && Math.floor(frameCounter.current / 4) % 2 === 0) {
        c.restore();
        return;
      }

      // Hurt Red overlay color mapping
      if (p.isHurt) {
        c.shadowColor = '#ef4444';
        c.shadowBlur = 10;
      }

      // Base translation centering player
      c.translate(p.x + p.width / 2, p.y + p.height);

      // Handle Direction mirroring & victory bounce animation
      const victoryBounce = p.victoryTimer > 0 ? Math.abs(Math.sin(frameCounter.current * 0.2)) * 8 : 0;
      c.translate(0, -victoryBounce);

      if (p.direction === 'left') {
        c.scale(-1, 1);
      }

      // Outer bounding box checks (visualizing details)
      // IDLE vs WALKING frame vertical scaling
      const walkBounce = p.vx !== 0 ? Math.abs(Math.sin(p.walkFrame * Math.PI / 2)) * 3 : 0;
      const breathing = Math.sin(frameCounter.current * 0.08) * 1.0;

      // 1. BOOTS (Brown boots)
      c.fillStyle = '#78350f'; // boot brown
      if (p.vx !== 0) {
        // active walking boots frames
        if (p.walkFrame % 2 === 0) {
          c.fillRect(-12, -4, 6, 4);
          c.fillRect(4, -4, 6, 4);
        } else {
          c.fillRect(-10, -6, 6, 4);
          c.fillRect(6, -2, 6, 4);
        }
      } else {
        // resting feet
        c.fillRect(-12, -4, 7, 4);
        c.fillRect(5, -4, 7, 4);
      }

      // 2. PANTS (Orange pants)
      c.fillStyle = '#f97316'; // vibrant orange pants
      c.fillRect(-10, -14, 20, 10);
      // splits between legs
      c.fillStyle = '#0f172a';
      c.fillRect(-2, -8, 4, 4);

      // 3. PURPLE JACKET / BODY
      c.fillStyle = '#6b21a8'; // royal violet jacket
      c.fillRect(-12, -32 + breathing, 24, 18);
      // blue undershirt stripes
      c.fillStyle = '#38bdf8';
      c.fillRect(-2, -32 + breathing, 4, 18);

      // 4. FACE & SKIN (Warm peach)
      c.fillStyle = '#fecdd3'; // peach pink skin tone
      c.fillRect(-10, -42 + breathing, 20, 12);

      // 5. GREEN HEADBAND (Signature explorer headband)
      c.fillStyle = '#22c55e'; // forest green
      c.fillRect(-11, -44 + breathing, 22, 4);
      // tail ribbon
      c.fillRect(-13, -42 + breathing, 2, 4);

      // 6. HAIR (Brown puffy hair on top)
      c.fillStyle = '#1e293b'; // slate dark hair
      c.fillRect(-10, -48 + breathing, 20, 4);
      c.fillRect(-7, -50 + breathing, 14, 2);

      // 7. EYES & NOSE
      c.fillStyle = '#1e293b'; // dark eyes
      c.fillRect(4, -38 + breathing, 2, 3);
      c.fillRect(-1, -38 + breathing, 2, 3);
      c.fillStyle = '#f43f5e'; // red blush cheeks
      c.fillRect(6, -35 + breathing, 2, 2);

      // 8. WINNING HANDS OR WALKING SWING
      c.fillStyle = '#fecdd3'; // skin
      if (p.victoryTimer > 0) {
        // Raise hands in victory!
        c.fillRect(-15, -40, 4, 6);
        c.fillRect(11, -40, 4, 6);
      } else if (p.vx !== 0) {
        const armSwing = Math.sin(p.walkFrame * 0.5) * 4;
        c.fillRect(10, -28 + armSwing + breathing, 4, 6);
      } else {
        c.fillRect(10, -26 + breathing, 4, 6);
      }

      // --- WOODEN WATER BUCKET ON HEAD (When carrying water) ---
      if (p.hasWater) {
        c.save();
        // Carry mirroring back
        c.scale(p.direction === 'left' ? -1 : 1, 1);
        
        // Draw Bucket resting exactly on top of headband
        const buckY = -48 + breathing - walkBounce - victoryBounce - 14;
        const buckX = -12;

        // Wooden Bucket outline
        c.fillStyle = '#78350f'; // wooden brown
        c.fillRect(buckX, buckY, 24, 18);

        // Steel bands
        c.fillStyle = '#94a3b8';
        c.fillRect(buckX, buckY + 3, 24, 3);
        c.fillRect(buckX, buckY + 12, 24, 3);

        // Water level inside bucket
        c.fillStyle = '#38bdf8'; // splashing clear blue water
        c.fillRect(buckX + 2, buckY + 1, 20, 2);

        // Sparkle indicators on water
        if (frameCounter.current % 12 < 6) {
          c.fillStyle = '#ffffff';
          c.fillRect(buckX + 6, buckY + 1, 2, 1);
        }

        // Animated bouncing water label overhead
        c.fillStyle = '#e0f2fe';
        c.font = 'bold 9px monospace';
        c.textAlign = 'center';
        c.fillText("1 / 4", 0, buckY - 4);

        c.restore();
      }

      c.restore();
    };

    const drawParticle = (c: CanvasRenderingContext2D, p: ParticleState) => {
      c.save();
      c.globalAlpha = p.alpha;

      // Special check: Floating Text
      if (p.type === 'star' && (p as any).id_val_custom !== undefined) {
        c.fillStyle = p.color;
        c.font = 'bold 12px "Press Start 2P", monospace';
        c.strokeStyle = '#000000';
        c.lineWidth = 2.5;
        c.textAlign = 'center';
        c.strokeText((p as any).id_val_custom, p.x, p.y);
        c.fillText((p as any).id_val_custom, p.x, p.y);
        c.restore();
        return;
      }

      if (p.type === 'confetti') {
        c.fillStyle = p.color;
        c.fillRect(p.x, p.y, p.size, p.size);
      } else if (p.type === 'sparkle') {
        // Draw dynamic rotating 4-point golden star
        c.fillStyle = p.color;
        const s = p.size;
        c.beginPath();
        c.moveTo(p.x, p.y - s);
        c.lineTo(p.x + s * 0.3, p.y - s * 0.3);
        c.lineTo(p.x + s, p.y);
        c.lineTo(p.x + s * 0.3, p.y + s * 0.3);
        c.lineTo(p.x, p.y + s);
        c.lineTo(p.x - s * 0.3, p.y + s * 0.3);
        c.lineTo(p.x - s, p.y);
        c.lineTo(p.x - s * 0.3, p.y - s * 0.3);
        c.closePath();
        c.fill();
      } else {
        // Standard water, splash bubble circles
        c.fillStyle = p.color;
        c.beginPath();
        c.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        c.fill();
      }

      c.restore();
    };

    const drawSpeechBubble = (c: CanvasRenderingContext2D, x: number, y: number, text: string) => {
      c.save();
      c.fillStyle = '#ffffff';
      c.strokeStyle = '#1e293b';
      c.lineWidth = 3;

      const w = 220;
      const h = 70;

      // Draw bubble
      c.fillRect(x - w / 2, y - h / 2, w, h);
      c.strokeRect(x - w / 2, y - h / 2, w, h);

      // Speech bubble pointer
      c.beginPath();
      c.moveTo(x - 12, y + h / 2);
      c.lineTo(x, y + h / 2 + 12);
      c.lineTo(x + 12, y + h / 2);
      c.closePath();
      c.fill();
      
      // Pointer stroke
      c.beginPath();
      c.moveTo(x - 12, y + h / 2);
      c.lineTo(x, y + h / 2 + 12);
      c.lineTo(x + 12, y + h / 2);
      c.stroke();

      // Text inside bubble
      c.fillStyle = '#1e293b';
      c.font = 'bold 18px "VT323", monospace';
      c.textAlign = 'center';
      c.textBaseline = 'middle';
      
      // Auto line breaks helper
      const words = text.split(' ');
      let line = '';
      const lines = [];
      for (let n = 0; n < words.length; n++) {
        const testLine = line + words[n] + ' ';
        if (testLine.length > 20 && n > 0) {
          lines.push(line);
          line = words[n] + ' ';
        } else {
          line = testLine;
        }
      }
      lines.push(line);

      for (let i = 0; i < Math.min(2, lines.length); i++) {
        c.fillText(lines[i], x, y - 10 + i * 20);
      }

      c.restore();
    };

    const drawActionBubble = (c: CanvasRenderingContext2D, x: number, y: number, label: string) => {
      c.save();
      c.fillStyle = '#fbbf24'; // Warning action amber
      c.strokeStyle = '#78350f';
      c.lineWidth = 2.5;

      const w = 180;
      const h = 32;

      c.fillRect(x - w / 2, y, w, h);
      c.strokeRect(x - w / 2, y, w, h);

      c.fillStyle = '#451a03';
      c.font = 'bold 15px "VT323", monospace';
      c.textAlign = 'center';
      c.textBaseline = 'middle';
      c.fillText(label, x, y + h / 2);

      c.restore();
    };

    // UTILITIES
    const checkCollision = (rect1: { x: number; y: number; width: number; height: number }, rect2: { x: number; y: number; width: number; height: number }) => {
      return (
        rect1.x < rect2.x + rect2.width &&
        rect1.x + rect1.width > rect2.x &&
        rect1.y < rect2.y + rect2.height &&
        rect1.y + rect1.height > rect2.y
      );
    };

    const checkCircleBoxCollision = (circle: { x: number; y: number; radius: number }, rect: { x: number; y: number; width: number; height: number }) => {
      const closestX = Math.max(rect.x, Math.min(circle.x, rect.x + rect.width));
      const closestY = Math.max(rect.y, Math.min(circle.y, rect.y + rect.height));

      const dx = circle.x - closestX;
      const dy = circle.y - closestY;
      const distance = Math.sqrt(dx * dx + dy * dy);

      return distance < circle.radius;
    };

    const checkProximity = (rect: { x: number; y: number; width: number; height: number }, px: number, py: number, threshold: number) => {
      const cx = rect.x + rect.width / 2;
      const cy = rect.y + rect.height / 2;
      const dx = cx - px;
      const dy = cy - py;
      return Math.sqrt(dx * dx + dy * dy) < threshold;
    };

    // Tick loops
    const tick = (timestamp: number) => {
      if (!lastTimeRef.current) lastTimeRef.current = timestamp;
      const elapsed = timestamp - lastTimeRef.current;

      // Target lock at ~60fps
      if (elapsed > 16.6) {
        updateGame();
        draw();
        lastTimeRef.current = timestamp;
      }
      animFrameId = requestAnimationFrame(tick);
    };

    initLevel();
    animFrameId = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(animFrameId);
    };
  }, [screen, mobileKeyStates]);

  // Restart trigger handler
  useEffect(() => {
    if (resetSignal > 0) {
      clearPendingTimeouts();
      initLevel();
    }
  }, [resetSignal]);

  useEffect(() => {
    if (screen === 'playing') {
      initLevel();
      // Start ambient synthesizers
      gameAudio.startAmbient();
    } else {
      gameAudio.stopAmbient();
    }
  }, [screen]);

  useEffect(() => {
    return () => clearPendingTimeouts();
  }, []);

  return (
    <div className="relative w-full h-full flex items-center justify-center bg-[#0ea5e9]/10">
      <canvas
        ref={canvasRef}
        width={logicalWidth}
        height={logicalHeight}
        className="pixel-art border-8 border-slate-950 rounded-2xl w-full h-auto aspect-[16/9] shadow-2xl relative bg-[#bae6fd]"
        style={{
          boxShadow: '0px 20px 50px rgba(0,0,0,0.8), inset 0px 4px 0px rgba(255,255,255,0.2)',
          maxHeight: '94vh',
        }}
      />
    </div>
  );
}
