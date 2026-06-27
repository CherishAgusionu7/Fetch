/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { PlatformState, EnemyState, ObstacleState, FamilyState } from './types';

export const LEVEL_WIDTH = 3800;
export const LEVEL_HEIGHT = 700;
export const CAMERA_PADDING_X = 400;

export const PHYSICS = {
  GRAVITY: 0.5,
  FRICTION: 0.85,
  AIR_RESISTANCE: 0.98,
  WALK_SPEED: 4.5,
  JUMP_POWER: -10.5,
  MAX_FALL_SPEED: 12,
  KNOCKBACK_X: 6,
  KNOCKBACK_Y: -6,
};

export const WATER_FACTS = [
  "703 million people lack basic access to clean drinking water.",
  "Clean water improves community health, education, and local economies.",
  "Women and girls carry the burden of fetching water, walking miles each day.",
  "Waterborne illnesses kill more children under five than malaria and measles combined.",
  "Every $1 invested in clean water yields $4 to $12 in economic return.",
  "With clean water, women can earn incomes and children can attend school.",
  "Every $40 donated to charity: water provides one person with clean water for life.",
  "charity: water has funded over 137,000 water projects across 29 countries.",
  "A local clean water source can save a family up to 20 hours of walking time per week."
];

// Helper to generate platform objects
export const INITIAL_PLATFORMS: Omit<PlatformState, 'id'>[] = [
  // Starting Ground Zone (Water Tank)
  { x: 0, y: 550, width: 450, height: 150, type: 'grass' },
  
  // Transition steps from ground
  { x: 450, y: 600, width: 120, height: 100, type: 'grass' },
  
  // Platform for Family 1
  { x: 650, y: 500, width: 350, height: 200, type: 'grass' },
  
  // Gap 1: Obby Floating Islands
  { x: 1080, y: 440, width: 100, height: 30, type: 'stone' },
  { x: 1240, y: 390, width: 80, height: 30, type: 'moving', startX: 1240, startY: 390, endX: 1390, endY: 280, speed: 1.5, moveProgress: 0, moveDirection: 1 },
  { x: 1500, y: 350, width: 100, height: 30, type: 'stone' },

  // Platform for Family 2 (High Meadow)
  { x: 1650, y: 420, width: 450, height: 280, type: 'grass' },

  // Collapsing wood bridges over lower spike valley
  { x: 2100, y: 420, width: 150, height: 20, type: 'collapsing', collapseTimer: -1 },
  { x: 2300, y: 460, width: 100, height: 20, type: 'collapsing', collapseTimer: -1 },

  // Ground Valley for Family 3 (Lower plain with mud pit nearby)
  { x: 2450, y: 540, width: 500, height: 160, type: 'grass' },

  // Stepping stones leading up to Family 4
  { x: 3000, y: 480, width: 120, height: 30, type: 'stone' },
  { x: 3160, y: 400, width: 90, height: 30, type: 'moving', startX: 3160, startY: 400, endX: 3160, endY: 230, speed: 1.8, moveProgress: 0, moveDirection: 1 },
  { x: 3300, y: 280, width: 120, height: 30, type: 'stone' },

  // Highest platform for Family 4 (Far Right)
  { x: 3450, y: 240, width: 350, height: 460, type: 'grass' },
  
  // Lower ground filler to prevent falling out-of-bounds forever (acting as mud-valleys / spikes)
  { x: 1050, y: 650, width: 600, height: 50, type: 'stone' }, // Mud spikes below first floating islands
  { x: 2100, y: 670, width: 350, height: 30, type: 'stone' }, // Deep spike pit under collapsing bridges
];

// Initial hazards/obstacles
export const INITIAL_OBSTACLES: Omit<ObstacleState, 'id'>[] = [
  // Spike pits in Gap 1
  { type: 'spikes', x: 1100, y: 620, width: 150, height: 30 },
  { type: 'spikes', x: 1350, y: 620, width: 150, height: 30 },
  
  // Mud puddle on starting ground transition
  { type: 'mud_puddle', x: 480, y: 585, width: 80, height: 15 },
  
  // Mud puddle in Family 2 meadow
  { type: 'mud_puddle', x: 1850, y: 405, width: 90, height: 15 },

  // Deep Spike Valley between Family 2 & 3 (Under collapsing wood bridge)
  { type: 'spikes', x: 2120, y: 645, width: 300, height: 30 },

  // Saw Blades defending Family 3's access
  { type: 'saw_blade', x: 2600, y: 480, width: 44, height: 44, angle: 0 },
  { type: 'saw_blade', x: 2820, y: 480, width: 44, height: 44, angle: 180 },

  // Mud puddles in Valley 3
  { type: 'mud_puddle', x: 2700, y: 525, width: 100, height: 15 },

  // Falling Rocks falling on the way to Family 4
  { type: 'falling_rock', x: 3060, y: 150, width: 28, height: 28, startY: 100, speedY: 0, active: true, spawnTimer: 0 },
  { type: 'falling_rock', x: 3360, y: 50, width: 28, height: 28, startY: 50, speedY: 0, active: true, spawnTimer: 80 },

  // Saw blade protecting Family 4 (Highest top)
  { type: 'saw_blade', x: 3550, y: 180, width: 44, height: 44, angle: 90 },
];

// Initial Enemies spaced out on patrols
export const INITIAL_ENEMIES: Omit<EnemyState, 'id'>[] = [
  // Sludge Monster patrolling near Family 1
  {
    type: 'sludge',
    x: 850,
    y: 450,
    vx: 1.0,
    vy: 0,
    width: 50,
    height: 50,
    direction: 'left',
    patrolMinX: 700,
    patrolMaxX: 950,
    spawnY: 450,
    health: 2,
    isHurt: false,
    hurtTimer: 0,
    animFrame: 0,
    animTimer: 0,
    actionTimer: 0,
    shootTimer: 0,
  },
  // Mud Slimes in Spike Gap 1 jumping around
  {
    type: 'slime',
    x: 1090,
    y: 400,
    vx: 0,
    vy: 0,
    width: 32,
    height: 24,
    direction: 'left',
    patrolMinX: 1080,
    patrolMaxX: 1140,
    spawnY: 400,
    health: 1,
    isHurt: false,
    hurtTimer: 0,
    animFrame: 0,
    animTimer: 0,
    actionTimer: 120,
    shootTimer: 0,
  },
  // Flying Poison Water Spirit near Family 2
  {
    type: 'spirit',
    x: 1450,
    y: 200,
    vx: 1.2,
    vy: 0.5,
    width: 36,
    height: 40,
    direction: 'right',
    patrolMinX: 1350,
    patrolMaxX: 1550,
    spawnY: 200,
    health: 1,
    isHurt: false,
    hurtTimer: 0,
    animFrame: 0,
    animTimer: 0,
    actionTimer: 0,
    shootTimer: 90, // shoots poison mud
  },
  // Toxic Blob patrolling Family 2's Meadow
  {
    type: 'sludge',
    x: 1950,
    y: 370,
    vx: -1.2,
    vy: 0,
    width: 44,
    height: 44,
    direction: 'left',
    patrolMinX: 1750,
    patrolMaxX: 2050,
    spawnY: 370,
    health: 2,
    isHurt: false,
    hurtTimer: 0,
    animFrame: 0,
    animTimer: 0,
    actionTimer: 0,
    shootTimer: 0,
  },
  // Flying Bat guarding the collapsing bridge section
  {
    type: 'bat',
    x: 2200,
    y: 280,
    vx: 1.8,
    vy: 0,
    width: 36,
    height: 24,
    direction: 'left',
    patrolMinX: 2100,
    patrolMaxX: 2350,
    spawnY: 280,
    health: 1,
    isHurt: false,
    hurtTimer: 0,
    animFrame: 0,
    animTimer: 0,
    actionTimer: 0,
    shootTimer: 0,
  },
  // Jump Slime in Valley 3
  {
    type: 'slime',
    x: 2550,
    y: 500,
    vx: 0,
    vy: 0,
    width: 32,
    height: 24,
    direction: 'right',
    patrolMinX: 2480,
    patrolMaxX: 2650,
    spawnY: 500,
    health: 1,
    isHurt: false,
    hurtTimer: 0,
    animFrame: 0,
    animTimer: 0,
    actionTimer: 60,
    shootTimer: 0,
  },
  // Flying Poison Spirit patrolling above Valley 3 shooting down mud projectiles
  {
    type: 'spirit',
    x: 2750,
    y: 300,
    vx: -1.0,
    vy: 0.2,
    width: 36,
    height: 40,
    direction: 'left',
    patrolMinX: 2600,
    patrolMaxX: 2900,
    spawnY: 300,
    health: 2,
    isHurt: false,
    hurtTimer: 0,
    animFrame: 0,
    animTimer: 0,
    actionTimer: 0,
    shootTimer: 100,
  },
  // Jumping fish jumping from puddles under the stepping stones
  {
    type: 'fish',
    x: 3040,
    y: 630,
    vx: 0,
    vy: -9,
    width: 24,
    height: 36,
    direction: 'left',
    patrolMinX: 3040,
    patrolMaxX: 3040,
    spawnY: 630,
    health: 1,
    isHurt: false,
    hurtTimer: 0,
    animFrame: 0,
    animTimer: 0,
    actionTimer: 0,
    shootTimer: 0,
  }
];

// Initial Families structure and position
export const INITIAL_FAMILIES: FamilyState[] = [
  {
    id: 1,
    name: "Amina's Family",
    x: 820,
    y: 500,
    width: 100,
    height: 100,
    hasWater: false,
    dialogue: "We walk 4 hours to fetch dirty water! So thirsty!",
    speechTimer: 180,
    waveTimer: 0,
  },
  {
    id: 2,
    name: "Kofi's Family",
    x: 1880,
    y: 420,
    width: 100,
    height: 100,
    hasWater: false,
    dialogue: "The children are sick from dirty water. Please help!",
    speechTimer: 180,
    waveTimer: 0,
  },
  {
    id: 3,
    name: "Mateo's Family",
    x: 2850,
    y: 540,
    width: 100,
    height: 100,
    hasWater: false,
    dialogue: "Access to clean water means we can grow fresh food!",
    speechTimer: 180,
    waveTimer: 0,
  },
  {
    id: 4,
    name: "Sumi's Family",
    x: 3620,
    y: 240,
    width: 100,
    height: 100,
    hasWater: false,
    dialogue: "Clean water means my sister and I can finally go to school!",
    speechTimer: 180,
    waveTimer: 0,
  }
];
