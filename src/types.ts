/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type GameScreen = 'menu' | 'intro' | 'playing' | 'gameover' | 'victory';

export interface PlayerState {
  x: number;
  y: number;
  vx: number;
  vy: number;
  width: number;
  height: number;
  direction: 'left' | 'right';
  isGrounded: boolean;
  hasWater: boolean; // is carrying a bucket of water
  waterCarried: number; // 0 to 1
  lives: number;
  maxLives: number;
  isHurt: boolean;
  hurtTimer: number; // frames left of hurt visual
  invulnerableTimer: number; // frames left of invulnerability
  victoryTimer: number; // frames left of victory dancing
  walkFrame: number;
  walkTimer: number;
  idleTimer: number;
  doubleJumpsLeft?: number;
}

export type EnemyType = 'sludge' | 'slime' | 'spirit' | 'bat' | 'fish';

export interface EnemyState {
  id: string;
  type: EnemyType;
  x: number;
  y: number;
  vx: number;
  vy: number;
  width: number;
  height: number;
  direction: 'left' | 'right';
  patrolMinX: number;
  patrolMaxX: number;
  spawnY: number;
  health: number;
  isHurt: boolean;
  hurtTimer: number;
  animFrame: number;
  animTimer: number;
  actionTimer: number;
  shootTimer: number;
}

export interface ProjectileState {
  id: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  color: string;
  life: number;
}

export type PlatformType = 'grass' | 'stone' | 'moving' | 'collapsing';

export interface PlatformState {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  type: PlatformType;
  startX?: number;
  startY?: number;
  endX?: number;
  endY?: number;
  speed?: number;
  moveProgress?: number;
  moveDirection?: number; // 1 or -1
  collapseTimer?: number; // for collapsing platform
  isPlayerOn?: boolean;
}

export type ObstacleType = 'spikes' | 'mud_puddle' | 'falling_rock' | 'saw_blade';

export interface ObstacleState {
  id: string;
  type: ObstacleType;
  x: number;
  y: number;
  width: number;
  height: number;
  angle?: number;
  speedY?: number;
  startY?: number;
  active?: boolean;
  spawnTimer?: number;
}

export interface FamilyState {
  id: number;
  name: string;
  x: number; // Hut center x
  y: number; // Hut base y
  width: number;
  height: number;
  hasWater: boolean; // has received water
  dialogue: string;
  speechTimer: number;
  waveTimer: number;
}

export type ParticleType = 'water' | 'splash' | 'sparkle' | 'mud' | 'dust' | 'confetti' | 'firework' | 'star' | 'bubble';

export interface ParticleState {
  id: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  size: number;
  alpha: number;
  type: ParticleType;
  life: number;
  maxLife: number;
  gravity?: number;
  bounce?: boolean;
}

export interface WaterTankState {
  x: number;
  y: number;
  width: number;
  height: number;
  waterLevel: number; // 0 to 1
  drippingTimer: number;
}

export interface GameStats {
  score: number;
  timeRemaining: number; // in seconds
  familiesHelped: number;
  totalFamilies: number;
  waterDelivered: number; // buckets
  isSoundMuted: boolean;
}

export interface GameState {
  screen: GameScreen;
  player: PlayerState;
  enemies: EnemyState[];
  projectiles: ProjectileState[];
  platforms: PlatformState[];
  obstacles: ObstacleState[];
  families: FamilyState[];
  waterTank: WaterTankState;
  particles: ParticleState[];
  stats: GameStats;
}
