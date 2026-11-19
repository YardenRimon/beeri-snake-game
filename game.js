// ============================================================================
// עולם הנחשים של בארי - מנוע המשחק (מותאם למובייל ולמחשב)
// ============================================================================

const SAVE_KEY = 'beeri_snake_game_save_v2';
const LEGACY_SAVE_KEY = 'beeri_snake_game_save_v1';
const MAX_WORLDS = 150;

// הגדרות צורות וצבעים לפי רמת הנחש
const LEVEL_STYLES = [
  { name: 'עיגולים ירוקים', shape: 'circle', primary: '#4caf50', secondary: '#81c784', glow: '#a5d6a7' },
  { name: 'מעוינים כחולים', shape: 'diamond', primary: '#29b6f6', secondary: '#0288d1', glow: '#81d4fa' },
  { name: 'משושים כתומים', shape: 'hexagon', primary: '#ff9800', secondary: '#f57c00', glow: '#ffcc80' },
  { name: 'כוכבים סגולים', shape: 'star', primary: '#ab47bc', secondary: '#7b1fa2', glow: '#e1bee7' },
  { name: 'קשקשי דרקון טורקיז', shape: 'triangle', primary: '#00bfa5', secondary: '#00897b', glow: '#a7ffeb' },
  { name: 'טבעות זהב מלכותי', shape: 'ring', primary: '#ffd600', secondary: '#ffab00', glow: '#ffff8d' }
];

// 10 סוגי סביבות בסיס (מתוך 150 סביבות ייחודיות – עיצוב, צבעים וקישוטי שטח שונים לכל עולם)
const WORLD_BIOMES = [
  { name: 'יער ירוק', bgHue: 125, bgSat: 34, bgLight: 17, riverEdge: '#0277bd', riverMid: '#29b6f6', decor: 'bush', decorColors: ['#2e7d32', '#66bb6a', '#fdd835'] },
  { name: 'מדבר זהוב', bgHue: 38, bgSat: 45, bgLight: 22, riverEdge: '#00838f', riverMid: '#4dd0e1', decor: 'cactus', decorColors: ['#388e3c', '#d4a373', '#e9c46a'] },
  { name: 'ארץ קרח', bgHue: 202, bgSat: 42, bgLight: 24, riverEdge: '#4fc3f7', riverMid: '#b3e5fc', decor: 'crystal', decorColors: ['#e1f5fe', '#81d4fa', '#ffffff'] },
  { name: 'ארץ לבה', bgHue: 8, bgSat: 46, bgLight: 13, riverEdge: '#bf360c', riverMid: '#ff6d00', decor: 'lavaRock', decorColors: ['#4e342e', '#ff3d00', '#ffab00'] },
  { name: 'חוף טרופי', bgHue: 48, bgSat: 50, bgLight: 25, riverEdge: '#00acc1', riverMid: '#80deea', decor: 'palm', decorColors: ['#2e7d32', '#ffca28', '#ff8a65'] },
  { name: 'יער קריסטלים', bgHue: 272, bgSat: 38, bgLight: 16, riverEdge: '#6a1b9a', riverMid: '#e040fb', decor: 'crystal', decorColors: ['#ce93d8', '#80deea', '#ea80fc'] },
  { name: 'ביצה אפלה', bgHue: 152, bgSat: 30, bgLight: 12, riverEdge: '#1b5e20', riverMid: '#69f0ae', decor: 'lily', decorColors: ['#33691e', '#9ccc65', '#f48fb1'] },
  { name: 'קניון אדום', bgHue: 16, bgSat: 48, bgLight: 19, riverEdge: '#0288d1', riverMid: '#4fc3f7', decor: 'rock', decorColors: ['#8d6e63', '#d84315', '#ffab91'] },
  { name: 'עולם סייבר', bgHue: 222, bgSat: 52, bgLight: 11, riverEdge: '#00b8d4', riverMid: '#18ffff', decor: 'cyber', decorColors: ['#00e5ff', '#ff4081', '#7c4dff'] },
  { name: 'חלל וגלקסיה', bgHue: 252, bgSat: 44, bgLight: 9, riverEdge: '#311b92', riverMid: '#7c4dff', decor: 'star', decorColors: ['#fff59d', '#b388ff', '#80d8ff'] }
];

function getWorldTheme(worldNum) {
  const base = WORLD_BIOMES[(worldNum - 1) % WORLD_BIOMES.length];
  const cycle = Math.floor((worldNum - 1) / WORLD_BIOMES.length);
  const hueOffset = (cycle * 13 + worldNum * 5) % 30 - 15;
  const lightOffset = ((worldNum * 7) % 7) - 3;
  return {
    ...base,
    name: `${base.name} #${cycle + 1}`,
    bgHue: (base.bgHue + hueOffset + 360) % 360,
    bgLight: Math.max(7, Math.min(28, base.bgLight + lightOffset)),
    gridStep: 70 + ((worldNum * 11) % 30)
  };
}

// רמות קושי במשחק (ברירת מחדל: קשה)
const DIFFICULTIES = {
  normal: { label: '⚔️ רגיל', hpMult: 1.0, speedMult: 1.0, dmgMult: 1.0, enemySpit: false, spitCooldown: 180, cssClass: 'diff-normal' },
  hard: { label: '🔥 קשה', hpMult: 1.55, speedMult: 1.2, dmgMult: 1.5, enemySpit: true, spitCooldown: 155, cssClass: 'diff-hard' },
  insane: { label: '💀 מטורף', hpMult: 2.2, speedMult: 1.35, dmgMult: 2.2, enemySpit: true, spitCooldown: 110, cssClass: 'diff-insane' }
};

// משימות צדדיות (בנוסף לציד נחשים – מגבלת זמן של 2 דקות / 120 שניות למשימות המוגבלות בזמן!)
const QUEST_TEMPLATES = [
  { type: 'bridges', title: 'הפל עץ ליצירת גשר מעל הנהר 🪵', target: 1, rewardMoney: 14, rewardDiamonds: 8, timed: true, timeLimitSec: 120 },
  { type: 'cross_river', title: 'חצה את הנהר לצד השני 🌊', target: 1, rewardMoney: 15, rewardDiamonds: 10, timed: true, timeLimitSec: 120 },
  { type: 'jumps', title: 'קפוץ 8 פעמים באוויר ⬆️', target: 8, rewardMoney: 10, rewardDiamonds: 6, timed: true, timeLimitSec: 120 },
  { type: 'venom_shots', title: 'ירה 10 פעמים ארס או לייזר 🎯', target: 10, rewardMoney: 12, rewardDiamonds: 8, timed: true, timeLimitSec: 120 },
  { type: 'shop_buy', title: 'קנה שדרוג או נחש עוזר בחנות 🛒', target: 1, rewardMoney: 14, rewardDiamonds: 10, timed: false, timeLimitSec: 0 },
  { type: 'home_heal', title: 'התרפא בתוך הבית שלך עד חיים מלאים 🏠', target: 1, rewardMoney: 10, rewardDiamonds: 6, timed: false, timeLimitSec: 0 }
];

const RECORDS_KEY = 'beeri_snake_records_v1';

// מצב התחלתי של השחקן (לפי האפיון: 10 שקלים ו-15 יהלומים)
function getDefaultState() {
  return {
    money: 10,
    diamonds: 15,
    level: 1,
    levelProgress: 0,
    world: 1,
    maxWorldReached: 1,
    snakesEaten: 0,
    bossesDefeated: 0,
    score: 0,
    difficulty: 'hard',
    quests: {
      completed: 0,
      nextIndex: 0,
      active: []
    },
    upgrades: {
      biteLevel: 1,
      tailWhipLevel: 1,
      speedLevel: 1,
      hpLevel: 1,
      venomLevel: 1,
      hasArtificialTeeth: false,
      hasArmorSuit: false,
      hasLaserSuit: false,
      laserLevel: 1,
      collectorSnakes: 0,
      fighterSnakes: 0,
      guardSnakes: 0,
      collectorLevel: 1,
      fighterLevel: 1,
      guardLevel: 1
    }
  };
}

function getDefaultRecords() {
  return {
    bestWorld: 1,
    bestLevel: 1,
    bestMoney: 10,
    bestDiamonds: 15,
    bestScore: 0,
    totalSnakesEaten: 0,
    totalBossesDefeated: 0,
    runs: []
  };
}

let records = loadRecords();

function loadRecords() {
  try {
    const raw = localStorage.getItem(RECORDS_KEY);
    if (!raw) return getDefaultRecords();
    const parsed = JSON.parse(raw);
    return {
      ...getDefaultRecords(),
      ...parsed,
      runs: Array.isArray(parsed.runs) ? parsed.runs : []
    };
  } catch (e) {
    return getDefaultRecords();
  }
}

function saveRecords() {
  try {
    localStorage.setItem(RECORDS_KEY, JSON.stringify(records));
  } catch (e) {
    console.warn('Could not save records:', e);
  }
}

function updatePersonalRecords() {
  records.bestWorld = Math.max(records.bestWorld, state.world || 1);
  records.bestLevel = Math.max(records.bestLevel, state.level || 1);
  records.bestMoney = Math.max(records.bestMoney, state.money || 0);
  records.bestDiamonds = Math.max(records.bestDiamonds, state.diamonds || 0);
  records.bestScore = Math.max(records.bestScore, state.score || 0);
  saveRecords();
}

function recordCompletedRun() {
  if ((state.score || 0) <= 0 && (state.snakesEaten || 0) <= 0) return;
  updatePersonalRecords();
  const diffCfg = getDifficultyConfig();
  records.runs.push({
    score: state.score || 0,
    world: state.world || 1,
    level: state.level || 1,
    snakes: state.snakesEaten || 0,
    diff: diffCfg.label
  });
  records.runs.sort((a, b) => b.score - a.score || b.world - a.world);
  records.runs = records.runs.slice(0, 8);
  saveRecords();
}

function getDifficultyConfig() {
  return DIFFICULTIES[state.difficulty] || DIFFICULTIES.hard;
}

let state = loadState();

function loadState() {
  try {
    // איפוס שמירה ישנה כדי שכל שחקן יתחיל מחדש מעולם 1 עם הנתונים ההתחלתיים
    localStorage.removeItem(LEGACY_SAVE_KEY);
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return getDefaultState();
    const parsed = JSON.parse(raw);
    return {
      ...getDefaultState(),
      ...parsed,
      quests: { ...getDefaultState().quests, ...(parsed.quests || {}) },
      upgrades: { ...getDefaultState().upgrades, ...(parsed.upgrades || {}) }
    };
  } catch (e) {
    return getDefaultState();
  }
}

function ensureQuests() {
  if (!state.quests) state.quests = getDefaultState().quests;
  if (!Array.isArray(state.quests.active)) state.quests.active = [];

  while (state.quests.active.length < 3) {
    const idx = (state.quests.nextIndex || 0) % QUEST_TEMPLATES.length;
    state.quests.nextIndex = (state.quests.nextIndex || 0) + 1;
    const tmpl = QUEST_TEMPLATES[idx];
    const scale = 1 + Math.floor((state.quests.completed || 0) / 6);
    state.quests.active.push({
      id: `q_${Date.now()}_${Math.random()}`,
      type: tmpl.type,
      title: tmpl.title,
      target: tmpl.target,
      progress: 0,
      rewardMoney: tmpl.rewardMoney + (scale - 1) * 4,
      rewardDiamonds: tmpl.rewardDiamonds + (scale - 1) * 3,
      timed: tmpl.timed,
      timeRemaining: tmpl.timed ? tmpl.timeLimitSec : 0
    });
  }
}
ensureQuests();

function saveState() {
  try {
    localStorage.setItem(SAVE_KEY, JSON.stringify(state));
  } catch (e) {
    console.warn('Could not save state:', e);
  }
}

// ============================================================================
// הגדרת קנבס ועולם
// ============================================================================
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

const WORLD_WIDTH = 2600;
const WORLD_HEIGHT = 1800;

const HOME_BASE = {
  x: 400,
  y: WORLD_HEIGHT / 2,
  radius: 150
};

// נהר שחוצה את המפה ועצים לידו שאפשר להפיל עם נשיכה או ארס
const RIVER = {
  x: 1150,
  width: 120
};

let trees = [];
let bridges = [];
let enemies = [];
let helperEntities = [];
let projectiles = [];
let enemyProjectiles = [];
let hazards = [];
let pits = [];
let particles = [];
let floatingTexts = [];
let worldDecorations = [];
let currentWorldTheme = getWorldTheme(state.world);
let bossSpawnedThisWorld = false;
let crossedRiverThisWorld = false;
let questTickCounter = 0;
let tailWhipEffect = null;

// מערכת מזג אוויר ושינויי אקלים (בהיר, גשם, סופת ברקים, שלג/גיצים לפי אקלים העולם)
const weather = {
  type: 'clear', // 'clear' | 'rain' | 'storm'
  timer: 700,
  drops: [],
  lightningFlash: 0,
  boltPoints: null
};

// מחזור יום ולילה (24 שעות לפי השעון האמיתי, עם אפשרות החלפה ידנית)
let manualNightOverride = null;
function isNightTime() {
  if (manualNightOverride !== null) return manualNightOverride;
  const hour = new Date().getHours();
  return hour >= 19 || hour < 6;
}

// ============================================================================
// דמות השחקן
// ============================================================================
const player = {
  x: HOME_BASE.x,
  y: HOME_BASE.y,
  angle: 0,
  speed: 0,
  hp: 100,
  maxHp: 100,
  jumpZ: 0,
  jumpVz: 0,
  biteCooldown: 0,
  biteAnim: 0,
  tailWhipCooldown: 0,
  shootCooldown: 0,
  invulnerableTimer: 0,
  hazardCooldown: 0,
  segments: []
};

function getPlayerStats() {
  const u = state.upgrades;
  const maxHp = 100 + (u.hpLevel - 1) * 35 + (u.hasArmorSuit ? 60 : 0);
  const baseSpeed = Math.min(9.8, 4.0 + (u.speedLevel - 1) * 0.45);
  const biteDamage = 25 + (u.biteLevel - 1) * 15 + (u.hasArtificialTeeth ? 35 : 0);
  const tailWhipDamage = 28 + ((u.tailWhipLevel || 1) - 1) * 18 + state.level * 5;
  const tailWhipRange = 16 + Math.min(state.level * 2.2, 26) + 95 + ((u.tailWhipLevel || 1) - 1) * 20;
  const venomDamage = 22 + (u.venomLevel - 1) * 15;
  const laserDamage = 32 + (u.laserLevel - 1) * 18;
  const radius = 16 + Math.min(state.level * 2.2, 26);
  const segCount = 12 + Math.min((state.level - 1) * 3, 28);
  return { maxHp, baseSpeed, biteDamage, tailWhipDamage, tailWhipRange, venomDamage, laserDamage, radius, segCount };
}

function initPlayerSegments() {
  player.segments = [];
  const stats = getPlayerStats();
  const spacing = stats.radius * 0.75;
  for (let i = 0; i < stats.segCount; i++) {
    player.segments.push({ x: player.x - i * spacing, y: player.y });
  }
}

// ============================================================================
// יצירת עולם (עולמות 1 עד 150 – סביבה ייחודית לכל עולם)
// ============================================================================
function generateWorldDecorations(worldNum, theme) {
  const list = [];
  let seed = (worldNum * 2654435761) >>> 0;
  function rand() {
    seed = (seed * 1664525 + 1013904223) >>> 0;
    return seed / 4294967296;
  }

  for (let i = 0; i < 48; i++) {
    const x = 90 + rand() * (WORLD_WIDTH - 180);
    const y = 90 + rand() * (WORLD_HEIGHT - 180);
    if (x > RIVER.x - 75 && x < RIVER.x + RIVER.width + 75) continue;
    if (Math.hypot(x - HOME_BASE.x, y - HOME_BASE.y) < HOME_BASE.radius + 50) continue;
    list.push({
      x,
      y,
      size: 10 + rand() * 18,
      color: theme.decorColors[Math.floor(rand() * theme.decorColors.length)],
      rot: rand() * Math.PI * 2
    });
  }
  return list;
}

function initWorld(worldNum) {
  state.world = Math.max(1, Math.min(MAX_WORLDS, worldNum));
  if (state.world > state.maxWorldReached) {
    state.maxWorldReached = state.world;
  }
  currentWorldTheme = getWorldTheme(state.world);
  worldDecorations = generateWorldDecorations(state.world, currentWorldTheme);
  bossSpawnedThisWorld = false;
  crossedRiverThisWorld = false;
  ensureQuests();
  saveState();

  const stats = getPlayerStats();
  player.maxHp = stats.maxHp;
  player.hp = player.maxHp;
  player.x = HOME_BASE.x;
  player.y = HOME_BASE.y;
  player.angle = 0;
  player.jumpZ = 0;
  initPlayerSegments();

  // יצירת עצים על גדת הנהר להפלה ויצירת גשר
  trees = [
    { x: RIVER.x - 32, y: 420, hp: 20, maxHp: 20, fallen: false },
    { x: RIVER.x - 32, y: 900, hp: 20, maxHp: 20, fallen: false },
    { x: RIVER.x - 32, y: 1380, hp: 20, maxHp: 20, fallen: false }
  ];
  bridges = [];

  // יצירת נחשים יריבים בעולם: 20 נחשים קבועים + בוס בסוף העולם + מלכודות מאתגרות
  enemies = [];
  enemyProjectiles = [];
  hazards = [];
  const totalSnakes = 20;
  const diffCfg = getDifficultyConfig();

  for (let i = 0; i < totalSnakes; i++) {
    let enemyLevel;
    if (i < Math.ceil(totalSnakes * 0.45)) {
      enemyLevel = Math.max(1, state.level - 1 + (i % 2));
    } else if (i < Math.ceil(totalSnakes * 0.80)) {
      enemyLevel = state.level + 1;
    } else {
      enemyLevel = state.level + 2;
    }

    const onRightSide = i >= Math.ceil(totalSnakes * 0.5);
    const minX = onRightSide ? RIVER.x + RIVER.width + 120 : 120;
    const maxX = onRightSide ? WORLD_WIDTH - 150 : RIVER.x - 100;

    let spawnX = minX + Math.random() * (maxX - minX);
    let spawnY = 180 + Math.random() * (WORLD_HEIGHT - 360);
    for (let attempt = 0; attempt < 20; attempt++) {
      const candidateX = minX + Math.random() * (maxX - minX);
      const candidateY = 180 + Math.random() * (WORLD_HEIGHT - 360);
      if (Math.hypot(candidateX - HOME_BASE.x, candidateY - HOME_BASE.y) > HOME_BASE.radius + 120) {
        spawnX = candidateX;
        spawnY = candidateY;
        break;
      }
    }
    if (Math.hypot(spawnX - HOME_BASE.x, spawnY - HOME_BASE.y) <= HOME_BASE.radius + 120) {
      spawnX = HOME_BASE.x + HOME_BASE.radius + 150;
    }

    spawnEnemySnake(spawnX, spawnY, enemyLevel, false, false);
  }

  // יצירת מלכודות רעל מסתובבות שמגבירות את האתגר בכל עולם
  const hazardCount = 4 + Math.min(Math.floor(state.world / 2), 14);
  for (let h = 0; h < hazardCount; h++) {
    const onRight = h >= Math.floor(hazardCount / 2);
    const minX = onRight ? RIVER.x + RIVER.width + 90 : 100;
    const maxX = onRight ? WORLD_WIDTH - 100 : RIVER.x - 90;
    let hx = minX + Math.random() * (maxX - minX);
    let hy = 150 + Math.random() * (WORLD_HEIGHT - 300);
    if (Math.hypot(hx - HOME_BASE.x, hy - HOME_BASE.y) < HOME_BASE.radius + 110) {
      hy = hy < HOME_BASE.y ? 220 : WORLD_HEIGHT - 220;
    }
    const ang = Math.random() * Math.PI * 2;
    const spd = 1.1 + Math.min(state.world * 0.04, 1.4);
    hazards.push({
      x: hx,
      y: hy,
      vx: Math.cos(ang) * spd,
      vy: Math.sin(ang) * spd,
      radius: 22,
      angle: 0
    });
  }

  // יצירת מעט בורות קטנים במפה (רק נחשים ברמות 1 עד 10 יכולים ליפול אליהם!)
  pits = [];
  const pitCount = 4;
  for (let p = 0; p < pitCount; p++) {
    const onRight = p >= 2;
    const minX = onRight ? RIVER.x + RIVER.width + 110 : 120;
    const maxX = onRight ? WORLD_WIDTH - 120 : RIVER.x - 110;
    let px = minX + Math.random() * (maxX - minX);
    let py = 180 + Math.random() * (WORLD_HEIGHT - 360);
    if (Math.hypot(px - HOME_BASE.x, py - HOME_BASE.y) < HOME_BASE.radius + 140) {
      py = py < HOME_BASE.y ? 200 : WORLD_HEIGHT - 200;
    }
    pits.push({ x: px, y: py, radius: 20 });
  }

  updatePersonalRecords();
  rebuildHelpers();
  updateHUD();
  showToast(`🌍 עולם ${state.world} – ${currentWorldTheme.name} (${diffCfg.label})! הבס ${enemies.length} נחשים כדי להזמין את הבוס!`);
}

function spawnWorldBoss() {
  const diffCfg = getDifficultyConfig();
  const bossLevel = Math.max(state.level + 2, state.world + 2);
  const bossX = player.x < RIVER.x ? (RIVER.x + RIVER.width + 320) : 680;
  const bossY = WORLD_HEIGHT / 2 + (Math.random() - 0.5) * 300;
  spawnEnemySnake(bossX, bossY, bossLevel, false, true);
  showToast(`👑 בוס סוף עולם ${state.world} הגיע! הנחש הכי חזק בעולם – הבס אותו כדי להתקדם (${diffCfg.label})!`);
}

function spawnEnemySnake(x, y, level, isBurglar = false, isBoss = false) {
  const diffCfg = getDifficultyConfig();
  const style = LEVEL_STYLES[(level - 1) % LEVEL_STYLES.length];
  const radius = 13 + Math.min(level * 2.1, 25) + (isBoss ? 10 : 0);
  const maxHp = isBoss
    ? Math.round((180 + level * 45 + (state.world - 1) * 40) * diffCfg.hpMult)
    : Math.round((45 + level * 26 + (state.world - 1) * 10) * diffCfg.hpMult);
  const segCount = 6 + Math.min(level * 2, 16) + (isBoss ? 6 : 0);
  const segs = [];
  for (let i = 0; i < segCount; i++) {
    segs.push({ x: x - i * 10, y });
  }
  const baseSpeed = isBurglar
    ? (2.6 + Math.min(state.world * 0.05, 1.0))
    : isBoss
      ? (2.25 + Math.min(state.world * 0.08, 1.4))
      : (1.9 + Math.min(level * 0.14 + (state.world - 1) * 0.06, 2.0));
  enemies.push({
    x,
    y,
    angle: Math.random() * Math.PI * 2,
    speed: baseSpeed * diffCfg.speedMult,
    level,
    hp: maxHp,
    maxHp,
    radius,
    style,
    isBurglar,
    isBoss,
    segments: segs,
    turnTimer: 0,
    biteCooldown: 0,
    spitCooldown: 70 + Math.floor(Math.random() * 70),
    dashTelegraph: 0,
    dashTimer: 0,
    dashCooldown: 110 + Math.floor(Math.random() * 110)
  });
}

// הפלת עץ ליצירת גשר מעל הנהר
function knockDownTree(tree) {
  if (!tree || tree.fallen) return;
  tree.fallen = true;
  tree.hp = 0;
  bridges.push({ x: RIVER.x, y: tree.y, width: RIVER.width });
  spawnParticles(tree.x, tree.y, '#8d6e63', 18);
  addFloatingText(tree.x, tree.y - 30, '🪵 גשר נוצר!', '#ffe082');
  showToast('🪵 העץ נפל על הנהר ויצר גשר למעבר בטוח!');
  recordQuestProgress('bridges', 1);
}

// ============================================================================
// נחשים עוזרים (3 סוגים: אוסף כסף ויהלומים, לוחם, ושומר על הבית)
// ============================================================================
function rebuildHelpers() {
  helperEntities = [];
  const u = state.upgrades;

  for (let i = 0; i < u.collectorSnakes; i++) {
    helperEntities.push(createHelper('collector', i));
  }
  for (let i = 0; i < u.fighterSnakes; i++) {
    helperEntities.push(createHelper('fighter', i));
  }
  for (let i = 0; i < u.guardSnakes; i++) {
    helperEntities.push(createHelper('guard', i));
  }
}

function createHelper(type, index) {
  const u = state.upgrades;
  const levelMap = {
    collector: u.collectorLevel || 1,
    fighter: u.fighterLevel || 1,
    guard: u.guardLevel || 1
  };
  const hLevel = levelMap[type] || 1;
  const colors = {
    collector: '#ffd54f',
    fighter: '#ff5252',
    guard: '#40c4ff'
  };
  const labels = {
    collector: '💰 עוזר אוסף',
    fighter: '⚔️ עוזר לוחם',
    guard: '🛡️ עוזר שומר'
  };
  const startX = HOME_BASE.x + Math.cos(index * 1.7) * 90;
  const startY = HOME_BASE.y + Math.sin(index * 1.7) * 90;
  const segCount = 7 + Math.min((hLevel - 1) * 2, 10);
  const segs = [];
  for (let s = 0; s < segCount; s++) segs.push({ x: startX, y: startY });

  return {
    type,
    level: hLevel,
    label: `${labels[type]} ★${hLevel}`,
    color: colors[type],
    x: startX,
    y: startY,
    angle: index,
    speed: 3.3 + (hLevel - 1) * 0.45,
    radius: 12 + Math.min((hLevel - 1) * 2, 10),
    attackTimer: 0,
    segments: segs
  };
}

// ============================================================================
// קלט מהמשתמש (מותאם מלא למולטי-טאץ' במובייל + מקלדת ועכבר במחשב)
// ============================================================================
const keys = {};
let isTouchMode = 'ontouchstart' in window || navigator.maxTouchPoints > 0;

const mouse = {
  x: window.innerWidth / 2,
  y: window.innerHeight / 2,
  worldX: HOME_BASE.x + 150,
  worldY: HOME_BASE.y,
  down: false,
  activeOnDesktop: false
};

const camera = {
  x: 0,
  y: 0,
  zoom: 1,
  panX: 0,
  panY: 0,
  lookAheadX: 0,
  lookAheadY: 0,
  panPointerId: null,
  panLastX: 0,
  panLastY: 0
};

function getCameraZoom() {
  const minDim = Math.min(window.innerWidth, window.innerHeight);
  let baseZoom = 1.0;
  if (minDim < 500) baseZoom = 0.62;
  else if (minDim < 820) baseZoom = 0.76;
  const speed = getPlayerStats().baseSpeed;
  const speedFactor = 1 + Math.min((speed - 4.0) * 0.035, 0.20);
  return baseZoom / speedFactor;
}

window.addEventListener('keydown', (e) => {
  keys[e.code] = true;

  if (e.code === 'ArrowUp' || e.code === 'Space') {
    e.preventDefault();
    triggerJump();
  }
  if (e.code === 'ArrowDown') {
    e.preventDefault();
    triggerBite();
  }
  if (e.code === 'KeyE' || e.code === 'ShiftLeft' || e.code === 'ShiftRight') {
    e.preventDefault();
    triggerTailWhip();
  }
});

window.addEventListener('keyup', (e) => {
  keys[e.code] = false;
});

// תמיכה בעכבר רק במחשב (מתעלם מאירועי מגע כדי שלא ישבש את הג'ויסטיק!)
canvas.addEventListener('pointermove', (e) => {
  if (e.pointerType === 'mouse') {
    isTouchMode = false;
    mouse.activeOnDesktop = true;
    mouse.x = e.clientX;
    mouse.y = e.clientY;
  } else if (e.pointerId === camera.panPointerId) {
    // הזזת המראה עם האצבע על המפה במובייל
    const dx = (e.clientX - camera.panLastX) / camera.zoom;
    const dy = (e.clientY - camera.panLastY) / camera.zoom;
    camera.panX = Math.max(-500, Math.min(500, camera.panX - dx));
    camera.panY = Math.max(-500, Math.min(500, camera.panY - dy));
    camera.panLastX = e.clientX;
    camera.panLastY = e.clientY;
  }
});

canvas.addEventListener('pointerdown', (e) => {
  if (e.pointerType === 'mouse') {
    if (e.button === 0) {
      isTouchMode = false;
      mouse.activeOnDesktop = true;
      mouse.down = true;
      mouse.x = e.clientX;
      mouse.y = e.clientY;
      triggerShoot();
    }
  } else {
    isTouchMode = true;
    mouse.activeOnDesktop = false;
    if (camera.panPointerId === null && e.pointerId !== joystick.pointerId) {
      camera.panPointerId = e.pointerId;
      camera.panLastX = e.clientX;
      camera.panLastY = e.clientY;
    }
  }
});

window.addEventListener('pointerup', (e) => {
  if (e.pointerType === 'mouse') {
    mouse.down = false;
  }
  if (e.pointerId === camera.panPointerId) {
    camera.panPointerId = null;
  }
});

window.addEventListener('pointercancel', (e) => {
  if (e.pointerId === camera.panPointerId) {
    camera.panPointerId = null;
  }
});

// ג'ויסטיק וירטואלי למובייל עם תמיכה מלאה במולטי-טאץ' (pointerId ייעודי)
const joystick = { active: false, pointerId: null, dx: 0, dy: 0 };
const joystickZone = document.getElementById('joystickZone');
const joystickKnob = document.getElementById('joystickKnob');

joystickZone.addEventListener('pointerdown', (e) => {
  e.preventDefault();
  e.stopPropagation();
  isTouchMode = true;
  mouse.activeOnDesktop = false;
  joystick.active = true;
  joystick.pointerId = e.pointerId;
  try {
    joystickZone.setPointerCapture(e.pointerId);
  } catch (_) {}
  updateJoystick(e);
});

joystickZone.addEventListener('pointermove', (e) => {
  if (joystick.active && e.pointerId === joystick.pointerId) {
    e.preventDefault();
    updateJoystick(e);
  }
});

function releaseJoystick(e) {
  if (joystick.active && e.pointerId === joystick.pointerId) {
    joystick.active = false;
    joystick.pointerId = null;
    joystick.dx = 0;
    joystick.dy = 0;
    joystickKnob.style.transform = 'translate(-50%, -50%)';
  }
}

joystickZone.addEventListener('pointerup', releaseJoystick);
joystickZone.addEventListener('pointercancel', releaseJoystick);

function updateJoystick(e) {
  const rect = joystickZone.getBoundingClientRect();
  const cx = rect.left + rect.width / 2;
  const cy = rect.top + rect.height / 2;
  let dx = e.clientX - cx;
  let dy = e.clientY - cy;
  const dist = Math.hypot(dx, dy);
  const maxDist = rect.width / 2 - 16;
  if (dist > maxDist) {
    dx = (dx / dist) * maxDist;
    dy = (dy / dist) * maxDist;
  }
  joystick.dx = dx / maxDist;
  joystick.dy = dy / maxDist;
  joystickKnob.style.transform = `translate(calc(-50% + ${dx}px), calc(-50% + ${dy}px))`;
}

// כפתורי פעולה במובייל - מגיבים מיד ב-pointerdown בלי להפריע לג'ויסטיק!
function bindMobileButton(btnId, handler) {
  const btn = document.getElementById(btnId);
  btn.addEventListener('pointerdown', (e) => {
    e.preventDefault();
    e.stopPropagation();
    isTouchMode = true;
    mouse.activeOnDesktop = false;
    handler();
  });
}

bindMobileButton('btnJump', triggerJump);
bindMobileButton('btnBite', triggerBite);
bindMobileButton('btnShoot', triggerShoot);
bindMobileButton('btnTailWhip', triggerTailWhip);

// ============================================================================
// פעולות השחקן: קפיצה (חץ למעלה), נשיכה (חץ למטה), הצלפת זנב וירי ארס/לייזר
// ============================================================================
function triggerTailWhip() {
  if (player.tailWhipCooldown > 0) return;
  player.tailWhipCooldown = 28;
  const stats = getPlayerStats();
  const tail = player.segments[player.segments.length - 1] || player;
  const centerX = (player.x + tail.x) / 2;
  const centerY = (player.y + tail.y) / 2;

  tailWhipEffect = {
    x: centerX,
    y: centerY,
    radius: stats.tailWhipRange,
    life: 16,
    maxLife: 16
  };

  let hitCount = 0;
  for (let i = enemies.length - 1; i >= 0; i--) {
    const en = enemies[i];
    const dHead = Math.hypot(en.x - player.x, en.y - player.y);
    const dTail = Math.hypot(en.x - tail.x, en.y - tail.y);
    const dist = Math.min(dHead, dTail);

    if (dist <= stats.tailWhipRange + en.radius) {
      hitCount++;
      // הצלפת הזנב הודפת נחשים אחרים לאחור וגורמת נזק לפי שדרוג עוצמת ההצלפה!
      const pushAng = Math.atan2(en.y - centerY, en.x - centerX);
      const knock = 45 + ((state.upgrades.tailWhipLevel || 1) - 1) * 14;
      en.x = Math.max(80, Math.min(WORLD_WIDTH - 80, en.x + Math.cos(pushAng) * knock));
      en.y = Math.max(80, Math.min(WORLD_HEIGHT - 80, en.y + Math.sin(pushAng) * knock));

      if (en.level <= state.level || en.isBoss) {
        damageEnemy(i, stats.tailWhipDamage, '🌀 הצלפה!');
      } else {
        const bigDmg = Math.round(stats.tailWhipDamage * 0.55);
        en.hp -= bigDmg;
        addFloatingText(en.x, en.y - 25, `🌀 הדף! -${bigDmg}`, '#ffb74d');
        if (en.hp <= 0) eatEnemy(i);
      }
    }
  }

  spawnParticles(tail.x, tail.y, '#ffa726', 16);
  if (hitCount === 0) {
    addFloatingText(tail.x, tail.y - 20, '🌀 הצלפה!', '#ffcc80');
  }
}
function triggerJump() {
  if (player.jumpZ === 0) {
    player.jumpVz = 9.5;
    spawnParticles(player.x, player.y, '#ffffff', 10);
    addFloatingText(player.x, player.y - 25, '⬆️ קפיצה!', '#81d4fa');
    recordQuestProgress('jumps', 1);
  }
}

function triggerBite() {
  if (player.biteCooldown > 0) return;
  player.biteCooldown = 15;
  player.biteAnim = 12;

  const stats = getPlayerStats();
  const biteRange = stats.radius + 75;
  let hitAny = false;

  // בדיקת נשיכה של עץ ליד הנהר כדי להפיל אותו לגשר!
  for (const tree of trees) {
    if (!tree.fallen && Math.hypot(tree.x - player.x, tree.y - player.y) <= biteRange + 25) {
      knockDownTree(tree);
      hitAny = true;
    }
  }

  // בדיקת נשיכה של נחשים יריבים (וגם של הבוס בסוף העולם)
  for (let i = enemies.length - 1; i >= 0; i--) {
    const en = enemies[i];
    const dist = Math.hypot(en.x - player.x, en.y - player.y);
    if (dist <= biteRange + en.radius) {
      if (en.level <= state.level || en.isBoss) {
        damageEnemy(i, stats.biteDamage, '🦷 נשיכה!');
        hitAny = true;
      } else {
        addFloatingText(en.x, en.y - 30, '⚠️ גדול מדי לנשיכה!', '#ff5252');
      }
    }
  }

  if (!hitAny) {
    addFloatingText(player.x, player.y - 30, '🦷 נשיכה!', '#ffd54f');
  }
}

function triggerShoot() {
  if (player.shootCooldown > 0) return;
  const stats = getPlayerStats();
  const isLaser = state.upgrades.hasLaserSuit;
  player.shootCooldown = isLaser ? 11 : 18;
  recordQuestProgress('venom_shots', 1);

  // במחשב עם עכבר פעיל יורים לכיוון העכבר; במובייל יורים לכיוון שבו הנחש פונה (עם נעילה חכמה על עץ או אויב קרוב ממול)
  let targetAngle = player.angle;
  if (!isTouchMode && mouse.activeOnDesktop) {
    targetAngle = Math.atan2(mouse.worldY - player.y, mouse.worldX - player.x);
  } else {
    // סיוע כיוון עדין במובייל לעבר עץ או נחש שנמצאים בכיוון הפנים של הנחש
    let bestTarget = null;
    let bestDist = 420;
    const candidates = [
      ...trees.filter((t) => !t.fallen),
      ...enemies
    ];
    for (const c of candidates) {
      const d = Math.hypot(c.x - player.x, c.y - player.y);
      if (d < bestDist) {
        const ang = Math.atan2(c.y - player.y, c.x - player.x);
        let diff = ang - player.angle;
        while (diff > Math.PI) diff -= Math.PI * 2;
        while (diff < -Math.PI) diff += Math.PI * 2;
        if (Math.abs(diff) < 0.7) {
          bestDist = d;
          bestTarget = c;
        }
      }
    }
    if (bestTarget) {
      targetAngle = Math.atan2(bestTarget.y - player.y, bestTarget.x - player.x);
    }
  }

  projectiles.push({
    x: player.x + Math.cos(targetAngle) * stats.radius,
    y: player.y + Math.sin(targetAngle) * stats.radius,
    vx: Math.cos(targetAngle) * (isLaser ? 13.5 : 9.5),
    vy: Math.sin(targetAngle) * (isLaser ? 13.5 : 9.5),
    isLaser,
    damage: isLaser ? stats.laserDamage : stats.venomDamage,
    life: isLaser ? 60 : 52
  });
}

// ============================================================================
// לוגיקת קרב, אכילה, עליית רמות ושלל
// ============================================================================
function damageEnemy(enemyIndex, dmg, label = '', options = {}) {
  const en = enemies[enemyIndex];
  if (!en) return;
  en.hp -= dmg;
  spawnParticles(en.x, en.y, en.style.primary, 8);
  addFloatingText(en.x, en.y - 20, `${label} -${Math.round(dmg)}`, '#ff8a80');

  if (en.hp <= 0) {
    eatEnemy(enemyIndex, options);
  }
}

function eatEnemy(enemyIndex, options = {}) {
  const en = enemies[enemyIndex];
  if (!en) return;
  enemies.splice(enemyIndex, 1);

  spawnParticles(en.x, en.y, '#ffd600', 22);

  let moneyGain = 0;
  let diamondGain = 0;

  if (en.level >= 3) {
    moneyGain = 5 + en.level * 4;
    diamondGain = 3 + en.level * 2;
  } else {
    if (Math.random() < 0.5) {
      moneyGain = 5 + en.level * 3;
    } else {
      diamondGain = 3 + en.level * 2;
    }
  }

  if (en.isBoss) {
    moneyGain = 20 + (state.world - 1) * 10;
    diamondGain = 20 + (state.world - 1) * 8;
    showToast(`👑 ניצחת את בוס עולם ${state.world}! קיבלת +${moneyGain}₪ ו-+${diamondGain}💎!`);
  } else if (options.byCollector) {
    const collectorBonus = 1 + ((state.upgrades.collectorLevel || 1) - 1) * 0.25;
    if (moneyGain > 0) moneyGain = Math.ceil(moneyGain * collectorBonus);
    if (diamondGain > 0) diamondGain = Math.ceil(diamondGain * collectorBonus);
  }

  state.money += moneyGain;
  state.diamonds += diamondGain;
  state.snakesEaten = (state.snakesEaten || 0) + 1;
  if (en.isBoss) state.bossesDefeated = (state.bossesDefeated || 0) + 1;
  state.score = (state.score || 0) + (en.isBoss ? 250 : 25 * en.level);

  records.totalSnakesEaten = (records.totalSnakesEaten || 0) + 1;
  if (en.isBoss) records.totalBossesDefeated = (records.totalBossesDefeated || 0) + 1;
  updatePersonalRecords();

  let rewardMsg = '🍽️ נאכל! ';
  if (moneyGain > 0) rewardMsg += `+${moneyGain}₪ `;
  if (diamondGain > 0) rewardMsg += `+${diamondGain}💎`;
  addFloatingText(en.x, en.y - 35, rewardMsg, '#69f0ae');

  saveState();
  updateHUD();
  checkWorldProgress();
}

function checkWorldProgress() {
  const remainingRegular = enemies.filter((e) => !e.isBurglar);
  if (remainingRegular.length > 0) return;

  if (!bossSpawnedThisWorld) {
    enemies = [];
    bossSpawnedThisWorld = true;
    spawnWorldBoss();
    updateHUD();
    return;
  }

  // ניקוי עולם + עליית רמה כל 4 עולמות!
  enemies = [];
  state.levelProgress = (state.levelProgress || 0) + 1;
  if (state.levelProgress >= 4) {
    state.levelProgress = 0;
    state.level += 1;
    const newStyle = LEVEL_STYLES[(state.level - 1) % LEVEL_STYLES.length];
    const stats = getPlayerStats();
    player.maxHp = stats.maxHp;
    player.hp = player.maxHp;
    while (player.segments.length < stats.segCount) {
      const tail = player.segments[player.segments.length - 1];
      const prev = player.segments[player.segments.length - 2] || tail;
      const ang = Math.atan2(tail.y - prev.y, tail.x - prev.x);
      player.segments.push({ x: tail.x + Math.cos(ang) * 12, y: tail.y + Math.sin(ang) * 12 });
    }
    updatePersonalRecords();
    showToast(`🎉 השלמת 4 עולמות ועלית לרמה ${state.level}! הנחש השתנה ל-${newStyle.name}!`);
    spawnParticles(player.x, player.y, newStyle.primary, 35);
  }
  saveState();

  if (state.world < MAX_WORLDS) {
    showToast(`🏆 סיימת את עולם ${state.world}! עובר לעולם ${state.world + 1}...`);
    setTimeout(() => {
      initWorld(state.world + 1);
    }, 1500);
  } else {
    updateHUD();
    showToast(`👑 כל הכבוד! ניצחת את כל ${MAX_WORLDS} העולמות!`);
  }
}

function sendPlayerHome(reason) {
  recordCompletedRun();
  spawnParticles(player.x, player.y, '#ff1744', 25);
  player.x = HOME_BASE.x;
  player.y = HOME_BASE.y;
  player.hp = player.maxHp;
  player.jumpZ = 0;
  player.invulnerableTimer = 90;
  initPlayerSegments();
  updateHUD();
  showToast(`🏠 ${reason} – חזרת לבית שלך, החיים התמלאו מחדש!`);
}

// ============================================================================
// עדכון לולאת המשחק
// ============================================================================
let burglarSpawnTimer = 450;

function update() {
  const stats = getPlayerStats();
  player.maxHp = stats.maxHp;
  camera.zoom = getCameraZoom();

  if (player.biteCooldown > 0) player.biteCooldown--;
  if (player.biteAnim > 0) player.biteAnim--;
  if (player.tailWhipCooldown > 0) player.tailWhipCooldown--;
  if (player.shootCooldown > 0) player.shootCooldown--;
  if (player.invulnerableTimer > 0) player.invulnerableTimer--;
  if (player.hazardCooldown > 0) player.hazardCooldown--;
  if (tailWhipEffect) {
    tailWhipEffect.life--;
    if (tailWhipEffect.life <= 0) tailWhipEffect = null;
  }

  // חישוב מיקום עכבר בעולם עם התחשבות בזום
  mouse.worldX = camera.x + mouse.x / camera.zoom;
  mouse.worldY = camera.y + mouse.y / camera.zoom;

  // קפיצה (ציר Z)
  if (player.jumpZ > 0 || player.jumpVz !== 0) {
    player.jumpZ += player.jumpVz;
    player.jumpVz -= 0.55;
    if (player.jumpZ <= 0) {
      player.jumpZ = 0;
      player.jumpVz = 0;
    }
  }

  // ==========================================================================
  // תנועת השחקן: מהירות מלאה ואחידה גם בפניות, ללא הליכה הפוכה אחורה!
  // ==========================================================================
  let keyDx = 0;
  let keyDy = 0;
  if (keys['ArrowRight'] || keys['KeyD']) keyDx += 1;
  if (keys['ArrowLeft'] || keys['KeyA']) keyDx -= 1;
  if (keys['KeyW']) keyDy -= 1;
  if (keys['KeyS']) keyDy += 1;

  if (joystick.active) {
    const joyMag = Math.hypot(joystick.dx, joystick.dy);
    if (joyMag > 0.12) {
      const targetAngle = Math.atan2(joystick.dy, joystick.dx);
      let diff = targetAngle - player.angle;
      while (diff > Math.PI) diff -= Math.PI * 2;
      while (diff < -Math.PI) diff += Math.PI * 2;
      player.angle += diff * 0.48;
      // מהירות אחידה ומלאה עם פניות חדות גם במהירות גבוהה
      player.speed = stats.baseSpeed;
      camera.panX *= 0.85;
      camera.panY *= 0.85;
    } else {
      player.speed = 0;
    }
  } else if (keyDx !== 0 || keyDy !== 0) {
    const targetAngle = Math.atan2(keyDy, keyDx);
    let diff = targetAngle - player.angle;
    while (diff > Math.PI) diff -= Math.PI * 2;
    while (diff < -Math.PI) diff += Math.PI * 2;
    player.angle += diff * 0.48;
    player.speed = stats.baseSpeed;
  } else if (!isTouchMode && mouse.activeOnDesktop) {
    const distToMouse = Math.hypot(mouse.worldX - player.x, mouse.worldY - player.y);
    const stopRadius = Math.max(24, stats.baseSpeed * 3.5);
    if (distToMouse > stopRadius) {
      const targetAngle = Math.atan2(mouse.worldY - player.y, mouse.worldX - player.x);
      let diff = targetAngle - player.angle;
      while (diff > Math.PI) diff -= Math.PI * 2;
      while (diff < -Math.PI) diff += Math.PI * 2;
      player.angle += diff * 0.42;
      player.speed = distToMouse < stopRadius + 28
        ? Math.min(stats.baseSpeed, Math.max(1.5, (distToMouse - stopRadius + 10) * 0.4))
        : stats.baseSpeed;
    } else {
      player.speed = 0;
    }
  } else {
    player.speed = 0;
  }

  let nextX = player.x + Math.cos(player.angle) * player.speed;
  let nextY = player.y + Math.sin(player.angle) * player.speed;

  // בדיקת חציית נהר: אי אפשר לקפוץ מעל הנחל – חייבים קודם להפיל עץ ליצירת גשר!
  const inRiver = nextX > RIVER.x - stats.radius && nextX < RIVER.x + RIVER.width + stats.radius;
  if (inRiver) {
    const onBridge = bridges.some((b) => Math.abs(nextY - b.y) < 58);
    if (!onBridge) {
      if (player.x <= RIVER.x) nextX = RIVER.x - stats.radius;
      else nextX = RIVER.x + RIVER.width + stats.radius;
      if (Math.random() < 0.06) {
        addFloatingText(player.x, player.y - 30, '🌳 אי אפשר לקפוץ מעל הנחל! הפל עץ לגשר', '#ffe082');
      }
    }
  }

  player.x = Math.max(stats.radius, Math.min(WORLD_WIDTH - stats.radius, nextX));
  player.y = Math.max(stats.radius, Math.min(WORLD_HEIGHT - stats.radius, nextY));

  if (!crossedRiverThisWorld && player.x > RIVER.x + RIVER.width + 30) {
    crossedRiverThisWorld = true;
    recordQuestProgress('cross_river', 1);
  }

  // עדכון חוליות גוף הנחש
  updateSegments(player.segments, player.x, player.y, stats.radius * 0.72);

  // כלל נחש קלאסי: אם הראש נוגע בחלק אחר בגוף שלך – אתה נפסל!
  if (player.speed > 0 && player.jumpZ < 6 && player.invulnerableTimer <= 0) {
    for (let i = 4; i < player.segments.length; i++) {
      const seg = player.segments[i];
      const t = i / Math.max(1, player.segments.length - 1);
      const segR = stats.radius * (1 - t * 0.42);
      if (Math.hypot(seg.x - player.x, seg.y - player.y) < (stats.radius + segR) * 0.72) {
        sendPlayerHome('התנגשת בגוף של עצמך');
        return;
      }
    }
  }

  // ריפוי אוטומטי בבית
  const distHome = Math.hypot(player.x - HOME_BASE.x, player.y - HOME_BASE.y);
  if (distHome < HOME_BASE.radius && player.hp < player.maxHp) {
    player.hp = Math.min(player.maxHp, player.hp + 0.45);
    if (player.hp >= player.maxHp) {
      recordQuestProgress('home_heal', 1);
    }
    updateHUD();
  }

  if (mouse.down && !isTouchMode) {
    triggerShoot();
  }

  // לידת נחש פורץ מדי פעם (לפני הבוס)
  burglarSpawnTimer--;
  if (burglarSpawnTimer <= 0 && !bossSpawnedThisWorld && enemies.length > 0) {
    burglarSpawnTimer = 780;
    if (state.money > 5 && Math.random() < 0.4) {
      spawnEnemySnake(HOME_BASE.x + 480, HOME_BASE.y + (Math.random() - 0.5) * 480, Math.max(1, state.level - 1), true);
      showToast('🦹 נחש פורץ מתקרב לבית שלך! נחש שומר או אתה יכולים לעצור אותו!');
    }
  }

  updateProjectiles();
  updateEnemyProjectiles(stats);
  updateHazards(stats);
  updateHelpers();
  updateEnemies(stats);
  updateWeather();
  tickTimedQuests();

  for (let i = particles.length - 1; i >= 0; i--) {
    const p = particles[i];
    p.x += p.vx;
    p.y += p.vy;
    p.life--;
    if (p.life <= 0) particles.splice(i, 1);
  }
  for (let i = floatingTexts.length - 1; i >= 0; i--) {
    const ft = floatingTexts[i];
    ft.y -= 0.8;
    ft.life--;
    if (ft.life <= 0) floatingTexts.splice(i, 1);
  }

  // מבט קדימה וזום מותאם לשליטה קלה במהירות גבוהה
  const targetLookX = player.speed > 0 ? Math.cos(player.angle) * Math.min(player.speed * 13, 95) : 0;
  const targetLookY = player.speed > 0 ? Math.sin(player.angle) * Math.min(player.speed * 13, 95) : 0;
  camera.lookAheadX += (targetLookX - camera.lookAheadX) * 0.1;
  camera.lookAheadY += (targetLookY - camera.lookAheadY) * 0.1;

  const viewW = canvas.width / camera.zoom;
  const viewH = canvas.height / camera.zoom;
  camera.x = Math.max(0, Math.min(WORLD_WIDTH - viewW, player.x - viewW / 2 + camera.panX + camera.lookAheadX));
  camera.y = Math.max(0, Math.min(WORLD_HEIGHT - viewH, player.y - viewH / 2 + camera.panY + camera.lookAheadY));
}

function updateSegments(segments, headX, headY, spacing) {
  if (!segments.length) return;
  segments[0].x = headX;
  segments[0].y = headY;
  for (let i = 1; i < segments.length; i++) {
    const prev = segments[i - 1];
    const curr = segments[i];
    const dx = prev.x - curr.x;
    const dy = prev.y - curr.y;
    const dist = Math.hypot(dx, dy);
    if (dist > spacing) {
      const angle = Math.atan2(dy, dx);
      curr.x = prev.x - Math.cos(angle) * spacing;
      curr.y = prev.y - Math.sin(angle) * spacing;
    }
  }
}

function updateProjectiles() {
  for (let i = projectiles.length - 1; i >= 0; i--) {
    const p = projectiles[i];
    p.x += p.vx;
    p.y += p.vy;
    p.life--;

    // פגיעת ארס או לייזר בעץ ליד הנהר -> מפילה את העץ ויוצרת גשר!
    for (const tree of trees) {
      if (!tree.fallen && Math.hypot(p.x - tree.x, p.y - tree.y) < 46) {
        tree.hp -= p.damage;
        spawnParticles(tree.x, tree.y, '#8d6e63', 10);
        if (tree.hp <= 0) {
          knockDownTree(tree);
        } else {
          addFloatingText(tree.x, tree.y - 25, '🌳 פגע בעץ! ירה שוב להפלה', '#ffe082');
        }
        p.life = 0;
        break;
      }
    }

    // פגיעה בנחשי אויב
    for (let j = enemies.length - 1; j >= 0; j--) {
      const en = enemies[j];
      if (Math.hypot(p.x - en.x, p.y - en.y) < en.radius + 14) {
        if (en.level <= state.level) {
          damageEnemy(j, p.damage, p.isLaser ? '⚡ לייזר!' : '🧪 ארס!');
        } else if (en.isBoss) {
          damageEnemy(j, p.damage * 0.65, p.isLaser ? '⚡ בוס!' : '🧪 בוס!');
        } else {
          en.hp -= p.damage * 0.3;
          addFloatingText(en.x, en.y - 20, `-${Math.round(p.damage * 0.3)}`, '#ffab91');
          if (en.hp <= 0) eatEnemy(j);
        }
        p.life = 0;
        break;
      }
    }

    if (p.life <= 0) projectiles.splice(i, 1);
  }
}

function updateHelpers() {
  const u = state.upgrades;
  const guardRange = HOME_BASE.radius + 220 + ((u.guardLevel || 1) - 1) * 80;
  const fighterRange = 420 + ((u.fighterLevel || 1) - 1) * 70;

  for (const h of helperEntities) {
    if (h.attackTimer > 0) h.attackTimer--;

    let target = null;

    if (h.type === 'guard') {
      target = enemies.find((e) => e.isBurglar || Math.hypot(e.x - HOME_BASE.x, e.y - HOME_BASE.y) < guardRange);
      if (!target) {
        h.angle += 0.03 + (h.level - 1) * 0.006;
        h.x = HOME_BASE.x + Math.cos(h.angle) * (HOME_BASE.radius - 20);
        h.y = HOME_BASE.y + Math.sin(h.angle) * (HOME_BASE.radius - 20);
      }
    } else if (h.type === 'collector') {
      target = enemies.find((e) => e.level <= state.level && !e.isBoss);
    } else if (h.type === 'fighter') {
      let minDist = fighterRange;
      for (const e of enemies) {
        const d = Math.hypot(e.x - player.x, e.y - player.y);
        if (d < minDist) {
          minDist = d;
          target = e;
        }
      }
    }

    if (target) {
      const angle = Math.atan2(target.y - h.y, target.x - h.x);
      h.x += Math.cos(angle) * h.speed;
      h.y += Math.sin(angle) * h.speed;

      const d = Math.hypot(target.x - h.x, target.y - h.y);
      const cooldown = Math.max(12, 28 - (h.level - 1) * 3);

      // נחש לוחם משודרג (רמה 2+) יורה גם ארס/לייזר מרחוק!
      if (h.type === 'fighter' && h.level >= 2 && d < 280 && d > target.radius + h.radius + 14 && h.attackTimer <= 0) {
        h.attackTimer = cooldown;
        const shotSpeed = h.level >= 3 ? 11.5 : 8.5;
        projectiles.push({
          x: h.x,
          y: h.y,
          vx: Math.cos(angle) * shotSpeed,
          vy: Math.sin(angle) * shotSpeed,
          isLaser: h.level >= 3,
          damage: 16 + h.level * 8 + state.level * 3,
          life: 40
        });
      } else if (d < target.radius + h.radius + 12 && h.attackTimer <= 0) {
        h.attackTimer = cooldown;
        const idx = enemies.indexOf(target);
        if (idx !== -1) {
          const dmg = 18 + state.level * 4 + (h.level - 1) * 14;
          damageEnemy(idx, dmg, h.label, { byCollector: h.type === 'collector' });
        }
      }
    } else if (h.type !== 'guard') {
      const dToPlayer = Math.hypot(player.x - h.x, player.y - h.y);
      if (dToPlayer > 85) {
        const angle = Math.atan2(player.y - h.y, player.x - h.x);
        h.x += Math.cos(angle) * h.speed;
        h.y += Math.sin(angle) * h.speed;
      }
    }

    updateSegments(h.segments, h.x, h.y, 10);
  }
}

function updateEnemies(playerStats) {
  const playerOutsideHome = Math.hypot(player.x - HOME_BASE.x, player.y - HOME_BASE.y) > HOME_BASE.radius + 10;
  const diffCfg = getDifficultyConfig();
  let burglarEscaped = false;

  for (let i = enemies.length - 1; i >= 0; i--) {
    const en = enemies[i];
    if (en.biteCooldown > 0) en.biteCooldown--;
    if (en.spitCooldown > 0) en.spitCooldown--;

    let moveSpeed = en.speed;

    if (en.isBurglar) {
      en.angle = Math.atan2(HOME_BASE.y - en.y, HOME_BASE.x - en.x);
      if (Math.hypot(en.x - HOME_BASE.x, en.y - HOME_BASE.y) < HOME_BASE.radius - 20) {
        const stolen = Math.min(state.money, 4);
        if (stolen > 0) {
          state.money -= stolen;
          saveState();
          updateHUD();
          showToast(`🚨 נחש פורץ נכנס לבית וגנב ${stolen}₪! קנה נחש שומר בחנות להגנה!`);
        }
        enemies.splice(i, 1);
        burglarEscaped = true;
        continue;
      }
    } else {
      const distToPlayer = Math.hypot(player.x - en.x, player.y - en.y);
      const chaseRange = en.isBoss ? 1400 : (400 + Math.min(state.world * 10, 200));

      if ((en.level > state.level || en.isBoss) && playerOutsideHome && distToPlayer < chaseRange) {
        // נחשים גדולים ובוסים רודפים אחרי השחקן, מסתערים ויורקים ארס
        if (en.dashCooldown > 0) en.dashCooldown--;
        if (en.dashTelegraph > 0) {
          en.dashTelegraph--;
          if (en.dashTelegraph === 0) en.dashTimer = 22;
        }
        if (en.dashTimer > 0) en.dashTimer--;

        if (en.dashCooldown <= 0 && en.dashTelegraph === 0 && en.dashTimer === 0 && distToPlayer < 320) {
          en.dashTelegraph = 24;
          en.dashCooldown = en.isBoss ? 140 : 190;
        }

        const targetAngle = Math.atan2(player.y - en.y, player.x - en.x);
        let diff = targetAngle - en.angle;
        while (diff > Math.PI) diff -= Math.PI * 2;
        while (diff < -Math.PI) diff += Math.PI * 2;
        en.angle += diff * (en.isBoss ? 0.11 : 0.085);
        moveSpeed = en.dashTimer > 0 ? en.speed * 1.95 : (en.dashTelegraph > 0 ? en.speed * 0.45 : en.speed * 1.15);

        // ירי ארס סגול מצד נחשים חזקים (ברמה קשה/מטורפת) ומצד הבוס תמיד!
        if ((diffCfg.enemySpit || en.isBoss) && en.spitCooldown <= 0 && distToPlayer < 420) {
          en.spitCooldown = (en.isBoss ? 105 : diffCfg.spitCooldown) + Math.floor(Math.random() * 45);
          const aim = Math.atan2(player.y - en.y, player.x - en.x);
          const sp = 6.2 * diffCfg.speedMult;
          enemyProjectiles.push({
            x: en.x + Math.cos(aim) * en.radius,
            y: en.y + Math.sin(aim) * en.radius,
            vx: Math.cos(aim) * sp,
            vy: Math.sin(aim) * sp,
            damage: Math.round((10 + en.level * 3) * diffCfg.dmgMult * (en.isBoss ? 1.25 : 1)),
            life: 68
          });
        }
      } else if (en.level < state.level && distToPlayer < 220) {
        const fleeAngle = Math.atan2(en.y - player.y, en.x - player.x);
        let diff = fleeAngle - en.angle;
        while (diff > Math.PI) diff -= Math.PI * 2;
        while (diff < -Math.PI) diff += Math.PI * 2;
        en.angle += diff * 0.1;
        moveSpeed = en.speed * 1.08;
      } else {
        en.turnTimer--;
        if (en.turnTimer <= 0) {
          en.turnTimer = 40 + Math.random() * 60;
          en.angle += (Math.random() - 0.5) * 1.4;
        }
      }
    }

    let nx = en.x + Math.cos(en.angle) * moveSpeed;
    let ny = en.y + Math.sin(en.angle) * moveSpeed;

    if (nx < 80 || nx > WORLD_WIDTH - 80) en.angle = Math.PI - en.angle;
    if (ny < 80 || ny > WORLD_HEIGHT - 80) en.angle = -en.angle;
    if (!en.isBurglar && Math.hypot(nx - HOME_BASE.x, ny - HOME_BASE.y) < HOME_BASE.radius + 35) {
      en.angle += Math.PI;
    }
    if (!en.isBoss && nx > RIVER.x - 20 && nx < RIVER.x + RIVER.width + 20) {
      en.angle = Math.PI - en.angle;
    }

    en.x += Math.cos(en.angle) * moveSpeed;
    en.y += Math.sin(en.angle) * moveSpeed;
    updateSegments(en.segments, en.x, en.y, en.radius * 0.7);

    if (player.jumpZ < 8) {
      const dist = Math.hypot(en.x - player.x, en.y - player.y);
      if (dist < en.radius + playerStats.radius) {
        if (en.level > state.level && !en.isBoss) {
          if (player.invulnerableTimer <= 0) {
            sendPlayerHome(`נחש גדול ברמה ${en.level} תפס אותך`);
            break;
          }
        } else {
          if (player.biteCooldown <= 0) {
            player.biteCooldown = 14;
            player.biteAnim = 10;
            damageEnemy(i, playerStats.biteDamage, '🦷 נשיכה!');
          }
          // בוסים ונחשים באותה רמה/קטנים נושכים בחזרה בעוצמה לפי רמת הקושי
          if (en.hp > 0 && en.biteCooldown <= 0 && player.invulnerableTimer <= 0) {
            en.biteCooldown = en.isBoss ? 28 : (en.level === state.level ? 32 : 48);
            const rawRet = en.isBoss ? (16 + en.level * 4) : (en.level === state.level ? (10 + en.level * 3) : (4 + en.level));
            const retDmg = Math.round(rawRet * diffCfg.dmgMult);
            player.hp -= retDmg;
            addFloatingText(player.x, player.y - 32, `-${retDmg} ❤️`, '#ff5252');
            updateHUD();
            if (player.hp <= 0) {
              sendPlayerHome(en.isBoss ? `בוס עולם ${state.world} הביס אותך` : 'נגמרו לך החיים בקרב');
              break;
            }
          }
        }
      }
    }

    // בדיקת נפילה לבור קטן (רק נחשים ברמות 1 עד 10)
    if (en.hp > 0 && !en.isBoss && en.level >= 1 && en.level <= 10) {
      for (const pit of pits) {
        if (Math.hypot(en.x - pit.x, en.y - pit.y) < pit.radius + 6) {
          spawnParticles(pit.x, pit.y, '#90a4ae', 14);
          addFloatingText(pit.x, pit.y - 20, '🕳️ נחש נפל לבור!', '#cfd8dc');
          enemies.splice(i, 1);
          burglarEscaped = true;
          updateHUD();
          break;
        }
      }
    }
  }

  if (burglarEscaped) {
    checkWorldProgress();
  }
}

function updateEnemyProjectiles(playerStats) {
  for (let i = enemyProjectiles.length - 1; i >= 0; i--) {
    const ep = enemyProjectiles[i];
    ep.x += ep.vx;
    ep.y += ep.vy;
    ep.life--;

    // הבית מגן מפני כדורי ארס של אויבים
    if (Math.hypot(ep.x - HOME_BASE.x, ep.y - HOME_BASE.y) < HOME_BASE.radius) {
      enemyProjectiles.splice(i, 1);
      continue;
    }

    if (player.jumpZ < 6 && player.invulnerableTimer <= 0) {
      const dist = Math.hypot(ep.x - player.x, ep.y - player.y);
      if (dist < playerStats.radius + 9) {
        player.hp -= ep.damage;
        spawnParticles(player.x, player.y, '#d500f9', 12);
        addFloatingText(player.x, player.y - 30, `💜 ארס אויב! -${ep.damage}`, '#ea80fc');
        enemyProjectiles.splice(i, 1);
        updateHUD();
        if (player.hp <= 0) {
          sendPlayerHome('נפגעת מארס אויב');
          break;
        }
        continue;
      }
    }

    if (ep.life <= 0) enemyProjectiles.splice(i, 1);
  }
}

function updateHazards(playerStats) {
  const diffCfg = getDifficultyConfig();
  for (const h of hazards) {
    h.angle += 0.05;
    let nx = h.x + h.vx;
    let ny = h.y + h.vy;

    if (nx < 70 || nx > WORLD_WIDTH - 70) h.vx = -h.vx;
    if (ny < 70 || ny > WORLD_HEIGHT - 70) h.vy = -h.vy;
    if (Math.hypot(nx - HOME_BASE.x, ny - HOME_BASE.y) < HOME_BASE.radius + 45) {
      h.vx = -h.vx;
      h.vy = -h.vy;
    }
    if (nx > RIVER.x - 30 && nx < RIVER.x + RIVER.width + 30) {
      h.vx = -h.vx;
    }

    h.x += h.vx;
    h.y += h.vy;

    if (player.jumpZ < 8 && player.invulnerableTimer <= 0 && player.hazardCooldown <= 0) {
      const dist = Math.hypot(h.x - player.x, h.y - player.y);
      if (dist < playerStats.radius + h.radius - 4) {
        player.hazardCooldown = 35;
        const dmg = Math.round((12 + Math.min(state.world * 2, 20)) * diffCfg.dmgMult);
        player.hp -= dmg;
        spawnParticles(player.x, player.y, '#ff1744', 14);
        addFloatingText(player.x, player.y - 30, `☠️ מלכודת! -${dmg}`, '#ff5252');
        updateHUD();
        if (player.hp <= 0) {
          sendPlayerHome('נפגעת ממלכודת רעל');
          break;
        }
      }
    }
  }

  // בדיקת נפילה לבור קטן לשחקן (רק ברמות 1 עד 10, ואם לא קופצים מעליו)
  if (state.level >= 1 && state.level <= 10 && player.jumpZ < 6 && player.invulnerableTimer <= 0) {
    for (const pit of pits) {
      if (Math.hypot(pit.x - player.x, pit.y - player.y) < pit.radius + 8) {
        sendPlayerHome('נפלת לתוך בור קטן');
        break;
      }
    }
  }
}

function updateWeather() {
  weather.timer--;
  if (weather.lightningFlash > 0) weather.lightningFlash -= 0.06;
  if (weather.lightningFlash < 0) weather.lightningFlash = 0;

  if (weather.timer <= 0) {
    const roll = Math.random();
    if (weather.type === 'clear') {
      weather.type = roll < 0.55 ? 'rain' : 'storm';
      weather.timer = 650 + Math.floor(Math.random() * 450);
    } else if (weather.type === 'rain') {
      weather.type = roll < 0.45 ? 'storm' : 'clear';
      weather.timer = 600 + Math.floor(Math.random() * 450);
    } else {
      weather.type = roll < 0.6 ? 'clear' : 'rain';
      weather.timer = 700 + Math.floor(Math.random() * 500);
    }

    const theme = currentWorldTheme || getWorldTheme(state.world);
    const isIce = theme.name.includes('קרח');
    const isLava = theme.name.includes('לבה');
    if (weather.type === 'rain') {
      showToast(isIce ? '❄️ התחילה סופת שלג!' : (isLava ? '🌋 גשם גיצים ואפר!' : '🌧️ התחיל גשם בעולם!'));
    } else if (weather.type === 'storm') {
      showToast('⛈️ סופת ברקים משתוללת!');
    } else {
      showToast('🌤️ מזג האוויר התבהר!');
    }
  }

  if (weather.type !== 'clear') {
    const targetDrops = weather.type === 'storm' ? 90 : 50;
    while (weather.drops.length < targetDrops) {
      weather.drops.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        len: 10 + Math.random() * 14,
        speed: weather.type === 'storm' ? 13 : 9
      });
    }
    for (const d of weather.drops) {
      d.x -= weather.type === 'storm' ? 3.2 : 1.5;
      d.y += d.speed;
      if (d.y > canvas.height) {
        d.y = -20;
        d.x = Math.random() * (canvas.width + 120);
      }
      if (d.x < -20) d.x += canvas.width + 40;
    }

    // ברקים אקראיים בסופת ברקים
    if (weather.type === 'storm' && Math.random() < 0.008) {
      weather.lightningFlash = 0.75;
      const bx = 80 + Math.random() * (canvas.width - 160);
      const pts = [{ x: bx, y: 0 }];
      let cy = 0;
      let cx = bx;
      while (cy < canvas.height * 0.7) {
        cy += 45 + Math.random() * 40;
        cx += (Math.random() - 0.5) * 65;
        pts.push({ x: cx, y: cy });
      }
      weather.boltPoints = pts;
    }
  } else {
    weather.drops = [];
    weather.boltPoints = null;
  }
}

// ============================================================================
// ציור המשחק על הקנבס
// ============================================================================
function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  const night = isNightTime();

  ctx.save();
  ctx.scale(camera.zoom, camera.zoom);
  ctx.translate(-camera.x, -camera.y);

  // רקע הקרקע הייחודי לכל אחד מ-150 העולמות
  const theme = currentWorldTheme || getWorldTheme(state.world);
  const light = night ? Math.max(5, theme.bgLight - 9) : theme.bgLight;
  ctx.fillStyle = `hsl(${theme.bgHue}, ${theme.bgSat}%, ${light}%)`;
  ctx.fillRect(0, 0, WORLD_WIDTH, WORLD_HEIGHT);

  // רשת עדינה
  ctx.strokeStyle = theme.decor === 'cyber'
    ? 'rgba(0, 229, 255, 0.14)'
    : (night ? 'rgba(255,255,255,0.04)' : 'rgba(255,255,255,0.06)');
  ctx.lineWidth = 1;
  for (let x = 0; x < WORLD_WIDTH; x += theme.gridStep) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, WORLD_HEIGHT);
    ctx.stroke();
  }
  for (let y = 0; y < WORLD_HEIGHT; y += theme.gridStep) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(WORLD_WIDTH, y);
    ctx.stroke();
  }

  // קישוטי שטח ייחודיים לפי הסביבה של העולם
  drawWorldDecorations(theme);

  // ציור הנהר לפי סביבת העולם
  const riverGrad = ctx.createLinearGradient(RIVER.x, 0, RIVER.x + RIVER.width, 0);
  riverGrad.addColorStop(0, theme.riverEdge);
  riverGrad.addColorStop(0.5, theme.riverMid);
  riverGrad.addColorStop(1, theme.riverEdge);
  ctx.fillStyle = riverGrad;
  ctx.fillRect(RIVER.x, 0, RIVER.width, WORLD_HEIGHT);

  // ציור גשרי עץ שנפלו על הנהר
  for (const b of bridges) {
    ctx.fillStyle = '#6d4c41';
    ctx.strokeStyle = '#3e2723';
    ctx.lineWidth = 4;
    ctx.fillRect(b.x - 16, b.y - 48, b.width + 32, 96);
    ctx.strokeRect(b.x - 16, b.y - 48, b.width + 32, 96);

    ctx.fillStyle = '#ffe082';
    ctx.font = 'bold 14px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('🪵 גשר עץ', b.x + b.width / 2, b.y + 5);
  }

  // ציור עצים ליד הנהר
  for (const t of trees) {
    if (t.fallen) continue;
    ctx.fillStyle = '#5d4037';
    ctx.beginPath();
    ctx.arc(t.x, t.y, 15, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#2e7d32';
    ctx.beginPath();
    ctx.arc(t.x, t.y - 6, 32, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#fff';
    ctx.font = 'bold 13px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('🌳 נשוך/ירה לגשר', t.x, t.y - 44);
  }

  // ציור בורות קטנים במפה (סכנה לרמות 1–10)
  for (const pit of pits) {
    ctx.save();
    ctx.beginPath();
    ctx.arc(pit.x, pit.y, pit.radius + 5, 0, Math.PI * 2);
    ctx.fillStyle = '#455a64';
    ctx.fill();
    ctx.beginPath();
    ctx.arc(pit.x, pit.y, pit.radius, 0, Math.PI * 2);
    ctx.fillStyle = '#050709';
    ctx.fill();
    ctx.strokeStyle = '#90a4ae';
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.fillStyle = '#cfd8dc';
    ctx.font = 'bold 11px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('🕳️ בור (1–10)', pit.x, pit.y - pit.radius - 8);
    ctx.restore();
  }

  // ציור מלכודות רעל מסתובבות
  for (const h of hazards) {
    ctx.save();
    ctx.translate(h.x, h.y);
    ctx.rotate(h.angle);
    ctx.fillStyle = '#b71c1c';
    ctx.strokeStyle = '#ff5252';
    ctx.lineWidth = 2;
    ctx.beginPath();
    for (let s = 0; s < 12; s++) {
      const r = s % 2 === 0 ? h.radius + 4 : h.radius * 0.55;
      const a = (s * Math.PI) / 6;
      if (s === 0) ctx.moveTo(Math.cos(a) * r, Math.sin(a) * r);
      else ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r);
    }
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.restore();
  }

  // ציור הבית של השחקן
  ctx.save();
  ctx.beginPath();
  ctx.arc(HOME_BASE.x, HOME_BASE.y, HOME_BASE.radius, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(76, 175, 80, 0.16)';
  ctx.fill();
  ctx.lineWidth = 4;
  ctx.strokeStyle = '#66bb6a';
  ctx.setLineDash([12, 8]);
  ctx.stroke();
  ctx.setLineDash([]);

  ctx.font = 'bold 20px sans-serif';
  ctx.fillStyle = '#a5d6a7';
  ctx.textAlign = 'center';
  ctx.fillText('🏠 הבית שלך (אזור מוגן ומילוי חיים)', HOME_BASE.x, HOME_BASE.y - HOME_BASE.radius - 14);
  ctx.restore();

  // ציור נחשים עוזרים
  for (const h of helperEntities) {
    drawSnakeBody(h.segments, h.radius, 'circle', h.color, '#ffffff', h.level >= 2);
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 12px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(h.label, h.x, h.y - h.radius - 10);
  }

  // ציור נחשי אויב ובוסים
  for (const en of enemies) {
    const isSmallerOrEqual = en.level <= state.level;
    drawSnakeBody(
      en.segments,
      en.radius,
      en.style.shape,
      en.isBurglar ? '#d50000' : en.style.primary,
      en.style.secondary,
      en.isBoss
    );
    drawSnakeEyes(en.x, en.y, en.angle, en.radius, en.isBoss, false);

    // טבעת התראה לפני הסתערות (Dash)
    if (en.dashTelegraph > 0) {
      ctx.save();
      ctx.strokeStyle = '#ffab00';
      ctx.lineWidth = 3;
      ctx.setLineDash([5, 5]);
      ctx.beginPath();
      ctx.arc(en.x, en.y, en.radius + 12, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }

    const barW = en.isBoss ? 84 : 54;
    const barH = en.isBoss ? 9 : 7;
    ctx.fillStyle = 'rgba(0,0,0,0.65)';
    ctx.fillRect(en.x - barW / 2, en.y - en.radius - 22, barW, barH);
    ctx.fillStyle = en.isBoss ? '#ffd600' : (isSmallerOrEqual ? '#00e676' : '#ff1744');
    ctx.fillRect(en.x - barW / 2, en.y - en.radius - 22, barW * Math.max(0, en.hp / en.maxHp), barH);

    ctx.font = en.isBoss ? 'bold 15px sans-serif' : 'bold 13px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillStyle = en.isBoss ? '#ffd600' : (isSmallerOrEqual ? '#b9f6ca' : '#ff8a80');
    const tag = en.isBoss
      ? `👑 בוס עולם ${state.world}! (רמה ${en.level})`
      : en.isBurglar
        ? `🦹 פורץ לבית! (רמה ${en.level})`
        : isSmallerOrEqual
          ? `🟢 רמה ${en.level} (אפשר לאכול!)`
          : `🔴 רמה ${en.level} (גדול ממך!)`;
    ctx.fillText(tag, en.x, en.y - en.radius - 28);
  }

  // ציור כדורי ארס סגולים של האויבים
  for (const ep of enemyProjectiles) {
    ctx.save();
    ctx.fillStyle = '#d500f9';
    ctx.shadowColor = '#d500f9';
    ctx.shadowBlur = 12;
    ctx.beginPath();
    ctx.arc(ep.x, ep.y, 9, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#f3e5f5';
    ctx.beginPath();
    ctx.arc(ep.x, ep.y, 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  // ציור קליעים (ארס ולייזר)
  for (const p of projectiles) {
    ctx.save();
    if (p.isLaser) {
      ctx.strokeStyle = '#ff1744';
      ctx.shadowColor = '#ff1744';
      ctx.shadowBlur = 12;
      ctx.lineWidth = 5;
      ctx.beginPath();
      ctx.moveTo(p.x, p.y);
      ctx.lineTo(p.x - p.vx * 1.8, p.y - p.vy * 1.8);
      ctx.stroke();
    } else {
      ctx.fillStyle = '#76ff03';
      ctx.shadowColor = '#76ff03';
      ctx.shadowBlur = 10;
      ctx.beginPath();
      ctx.arc(p.x, p.y, 8, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  // ציור הנחש של השחקן
  const pStats = getPlayerStats();
  const pStyle = LEVEL_STYLES[(state.level - 1) % LEVEL_STYLES.length];

  if (player.jumpZ > 0) {
    ctx.fillStyle = 'rgba(0,0,0,0.38)';
    ctx.beginPath();
    ctx.arc(player.x, player.y + 12, pStats.radius, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.save();
  ctx.translate(0, -player.jumpZ * 2.2);
  if (player.invulnerableTimer > 0 && Math.floor(player.invulnerableTimer / 5) % 2 === 0) {
    ctx.globalAlpha = 0.55;
  }

  drawSnakeBody(
    player.segments,
    pStats.radius * (1 + player.jumpZ * 0.015),
    pStyle.shape,
    pStyle.primary,
    pStyle.secondary,
    state.upgrades.hasArmorSuit
  );
  drawSnakeEyes(
    player.x,
    player.y,
    player.angle,
    pStats.radius,
    state.upgrades.hasArtificialTeeth || player.biteAnim > 0,
    state.upgrades.hasLaserSuit
  );
  ctx.restore();

  // גל הלם של הצלפת זנב
  if (tailWhipEffect) {
    const progress = 1 - tailWhipEffect.life / tailWhipEffect.maxLife;
    ctx.save();
    ctx.strokeStyle = `rgba(255, 167, 38, ${1 - progress})`;
    ctx.fillStyle = `rgba(255, 213, 79, ${(1 - progress) * 0.18})`;
    ctx.lineWidth = 6 * (1 - progress) + 2;
    ctx.beginPath();
    ctx.arc(tailWhipEffect.x, tailWhipEffect.y, tailWhipEffect.radius * (0.4 + progress * 0.65), 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.restore();
  }

  // קו כיוון לייזר
  if (state.upgrades.hasLaserSuit) {
    ctx.save();
    ctx.strokeStyle = 'rgba(255, 23, 68, 0.35)';
    ctx.setLineDash([6, 6]);
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(player.x, player.y - player.jumpZ * 2.2);
    const aimX = (!isTouchMode && mouse.activeOnDesktop) ? mouse.worldX : player.x + Math.cos(player.angle) * 260;
    const aimY = (!isTouchMode && mouse.activeOnDesktop) ? mouse.worldY : player.y + Math.sin(player.angle) * 260;
    ctx.lineTo(aimX, aimY);
    ctx.stroke();
    ctx.restore();
  }

  for (const pt of particles) {
    ctx.fillStyle = pt.color;
    ctx.beginPath();
    ctx.arc(pt.x, pt.y, pt.size, 0, Math.PI * 2);
    ctx.fill();
  }

  for (const ft of floatingTexts) {
    ctx.font = 'bold 15px sans-serif';
    ctx.fillStyle = ft.color;
    ctx.textAlign = 'center';
    ctx.fillText(ft.text, ft.x, ft.y);
  }

  ctx.restore();

  // תאורת לילה
  if (night) {
    ctx.fillStyle = 'rgba(5, 10, 28, 0.36)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }

  // אפקטי מזג אוויר (גשם, שלג, גיצים, סופת ברקים)
  if (weather.type !== 'clear') {
    const wTheme = currentWorldTheme || getWorldTheme(state.world);
    const isIce = wTheme.name.includes('קרח');
    const isLava = wTheme.name.includes('לבה');

    ctx.save();
    if (weather.type === 'storm') {
      ctx.fillStyle = 'rgba(10, 15, 30, 0.22)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }

    for (const d of weather.drops) {
      if (isIce) {
        ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
        ctx.beginPath();
        ctx.arc(d.x, d.y, 2.5, 0, Math.PI * 2);
        ctx.fill();
      } else if (isLava) {
        ctx.fillStyle = 'rgba(255, 138, 0, 0.85)';
        ctx.beginPath();
        ctx.arc(d.x, d.y, 2.5, 0, Math.PI * 2);
        ctx.fill();
      } else {
        ctx.strokeStyle = weather.type === 'storm' ? 'rgba(179, 229, 252, 0.72)' : 'rgba(129, 212, 250, 0.58)';
        ctx.lineWidth = weather.type === 'storm' ? 2 : 1.5;
        ctx.beginPath();
        ctx.moveTo(d.x, d.y);
        ctx.lineTo(d.x - 4, d.y + d.len);
        ctx.stroke();
      }
    }

    if (weather.lightningFlash > 0 && weather.boltPoints) {
      ctx.strokeStyle = `rgba(255, 255, 200, ${weather.lightningFlash})`;
      ctx.lineWidth = 3.5;
      ctx.beginPath();
      weather.boltPoints.forEach((pt, idx) => {
        if (idx === 0) ctx.moveTo(pt.x, pt.y);
        else ctx.lineTo(pt.x, pt.y);
      });
      ctx.stroke();

      ctx.fillStyle = `rgba(255, 255, 255, ${weather.lightningFlash * 0.35})`;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }
    ctx.restore();
  }
}

function drawSnakeBody(segments, headRadius, shape, primaryColor, secondaryColor, hasArmor = false) {
  for (let i = segments.length - 1; i >= 0; i--) {
    const seg = segments[i];
    const t = i / Math.max(1, segments.length - 1);
    const r = headRadius * (1 - t * 0.42);

    ctx.save();
    ctx.translate(seg.x, seg.y);
    ctx.fillStyle = i % 2 === 0 ? primaryColor : secondaryColor;
    ctx.strokeStyle = hasArmor ? '#ffd600' : 'rgba(0,0,0,0.4)';
    ctx.lineWidth = hasArmor ? 3 : 2;

    ctx.beginPath();
    if (shape === 'diamond' && i > 0) {
      ctx.moveTo(0, -r);
      ctx.lineTo(r, 0);
      ctx.lineTo(0, r);
      ctx.lineTo(-r, 0);
      ctx.closePath();
    } else if (shape === 'hexagon' && i > 0) {
      for (let s = 0; s < 6; s++) {
        const a = (s * Math.PI) / 3;
        if (s === 0) ctx.moveTo(Math.cos(a) * r, Math.sin(a) * r);
        else ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r);
      }
      ctx.closePath();
    } else if (shape === 'star' && i > 0) {
      for (let s = 0; s < 10; s++) {
        const rad = s % 2 === 0 ? r * 1.15 : r * 0.55;
        const a = (s * Math.PI) / 5;
        if (s === 0) ctx.moveTo(Math.cos(a) * rad, Math.sin(a) * rad);
        else ctx.lineTo(Math.cos(a) * rad, Math.sin(a) * rad);
      }
      ctx.closePath();
    } else if (shape === 'triangle' && i > 0) {
      for (let s = 0; s < 3; s++) {
        const a = (s * Math.PI * 2) / 3;
        if (s === 0) ctx.moveTo(Math.cos(a) * r * 1.15, Math.sin(a) * r * 1.15);
        else ctx.lineTo(Math.cos(a) * r * 1.15, Math.sin(a) * r * 1.15);
      }
      ctx.closePath();
    } else {
      ctx.arc(0, 0, r, 0, Math.PI * 2);
    }

    ctx.fill();
    ctx.stroke();
    ctx.restore();
  }
}

function drawSnakeEyes(x, y, angle, radius, showTeeth, showLaserVisor) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(angle);

  if (showTeeth) {
    ctx.fillStyle = '#eceff1';
    ctx.beginPath();
    ctx.moveTo(radius * 0.8, -radius * 0.45);
    ctx.lineTo(radius * 1.45, -radius * 0.2);
    ctx.lineTo(radius * 0.8, -radius * 0.05);
    ctx.moveTo(radius * 0.8, radius * 0.45);
    ctx.lineTo(radius * 1.45, radius * 0.2);
    ctx.lineTo(radius * 0.8, radius * 0.05);
    ctx.fill();
  }

  if (showLaserVisor) {
    ctx.fillStyle = '#ff1744';
    ctx.fillRect(radius * 0.15, -radius * 0.65, radius * 0.45, radius * 1.3);
  } else {
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.arc(radius * 0.35, -radius * 0.42, radius * 0.26, 0, Math.PI * 2);
    ctx.arc(radius * 0.35, radius * 0.42, radius * 0.26, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#111';
    ctx.beginPath();
    ctx.arc(radius * 0.43, -radius * 0.42, radius * 0.13, 0, Math.PI * 2);
    ctx.arc(radius * 0.43, radius * 0.42, radius * 0.13, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.restore();
}

// ציור קישוטי שטח ייחודיים לכל עולם
function drawWorldDecorations(theme) {
  for (const d of worldDecorations) {
    ctx.save();
    ctx.translate(d.x, d.y);
    ctx.rotate(d.rot);
    ctx.fillStyle = d.color;
    ctx.globalAlpha = 0.65;

    if (theme.decor === 'crystal' || theme.decor === 'cyber') {
      ctx.beginPath();
      ctx.moveTo(0, -d.size);
      ctx.lineTo(d.size * 0.7, 0);
      ctx.lineTo(0, d.size);
      ctx.lineTo(-d.size * 0.7, 0);
      ctx.closePath();
      ctx.fill();
    } else if (theme.decor === 'star') {
      ctx.beginPath();
      for (let s = 0; s < 10; s++) {
        const rad = s % 2 === 0 ? d.size : d.size * 0.4;
        const a = (s * Math.PI) / 5;
        if (s === 0) ctx.moveTo(Math.cos(a) * rad, Math.sin(a) * rad);
        else ctx.lineTo(Math.cos(a) * rad, Math.sin(a) * rad);
      }
      ctx.closePath();
      ctx.fill();
    } else if (theme.decor === 'cactus' || theme.decor === 'palm') {
      ctx.beginPath();
      ctx.arc(0, 0, d.size * 0.65, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillRect(-d.size * 0.25, -d.size, d.size * 0.5, d.size * 2);
    } else {
      ctx.beginPath();
      ctx.arc(0, 0, d.size * 0.75, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }
}

// ============================================================================
// מערכת משימות עם הגבלת זמן וקנס + ממשק משתמש וחנות שדרוגים
// ============================================================================
function recordQuestProgress(type, amount = 1) {
  ensureQuests();
  let changed = false;

  for (let i = state.quests.active.length - 1; i >= 0; i--) {
    const q = state.quests.active[i];
    if (q.type !== type) continue;

    q.progress = Math.min(q.target, q.progress + amount);
    changed = true;

    if (q.progress >= q.target) {
      state.money += q.rewardMoney;
      state.diamonds += q.rewardDiamonds;
      state.quests.completed = (state.quests.completed || 0) + 1;
      showToast(`🎉 משימה הושלמה: ${q.title}! +${q.rewardMoney}₪ +${q.rewardDiamonds}💎`);
      spawnParticles(player.x, player.y, '#00e676', 25);
      state.quests.active.splice(i, 1);
      ensureQuests();
    }
  }

  if (changed) {
    saveState();
    updateHUD();
    if (!document.getElementById('questsModal').classList.contains('hidden')) {
      renderQuests();
    }
  }
}

function tickTimedQuests() {
  const shopOpen = !document.getElementById('shopModal').classList.contains('hidden');
  const questsOpen = !document.getElementById('questsModal').classList.contains('hidden');
  if (shopOpen || questsOpen) return;

  questTickCounter++;
  if (questTickCounter < 60) return;
  questTickCounter = 0;

  let changed = false;
  for (let i = state.quests.active.length - 1; i >= 0; i--) {
    const q = state.quests.active[i];
    if (!q.timed) continue;

    q.timeRemaining = Math.max(0, q.timeRemaining - 1);
    changed = true;

    if (q.timeRemaining <= 0) {
      const lostMoney = Math.min(state.money, 4);
      const lostDiamonds = Math.min(state.diamonds, 3);
      state.money -= lostMoney;
      state.diamonds -= lostDiamonds;
      showToast(`⏰ נגמר הזמן למשימה "${q.title}"! קנס: -${lostMoney}₪ -${lostDiamonds}💎`);
      state.quests.active.splice(i, 1);
      ensureQuests();
    }
  }

  if (changed) {
    saveState();
    updateHUD();
  }
}

function renderQuests() {
  ensureQuests();
  document.getElementById('completedQuestsCount').textContent = state.quests.completed || 0;
  const container = document.getElementById('questsList');
  container.innerHTML = '';

  for (const q of state.quests.active) {
    const pct = Math.min(100, Math.round((q.progress / q.target) * 100));
    const timerHtml = q.timed
      ? `<span style="color: ${q.timeRemaining <= 15 ? '#ff5252' : '#ffd54f'};">⏱️ נותרו ${q.timeRemaining} שנ'</span>`
      : `<span style="color: #a5d6a7;">♾️ ללא הגבלת זמן</span>`;

    const card = document.createElement('div');
    card.className = 'shop-card';
    card.innerHTML = `
      <div>
        <h4>${q.title}</h4>
        <p>התקדמות: <strong>${q.progress}/${q.target}</strong> | ${timerHtml}</p>
      </div>
      <div class="quest-progress-bg">
        <div class="quest-progress-fill" style="width: ${pct}%;"></div>
      </div>
      <div class="quest-reward">🎁 פרס: +${q.rewardMoney} ₪ ו-+${q.rewardDiamonds} 💎</div>
    `;
    container.appendChild(card);
  }
}

function positionFloatingUI() {
  const hudEl = document.getElementById('hud');
  const hudBottom = hudEl ? hudEl.offsetHeight : 62;
  const sideCard = document.getElementById('levelSideCard');
  const toasts = document.getElementById('toastContainer');
  if (sideCard) sideCard.style.top = `${hudBottom + 8}px`;
  if (toasts) toasts.style.top = `${hudBottom + 10}px`;
}

function renderRecords() {
  updatePersonalRecords();
  const summary = document.getElementById('recordsSummary');
  summary.innerHTML = `
    <div class="record-stat"><div class="rec-val">${records.bestScore}</div><div class="rec-lbl">🏆 שיא ניקוד</div></div>
    <div class="record-stat"><div class="rec-val">${records.bestWorld}/150</div><div class="rec-lbl">🌍 עולם שיא</div></div>
    <div class="record-stat"><div class="rec-val">${records.bestLevel}</div><div class="rec-lbl">⭐ רמה שיא</div></div>
    <div class="record-stat"><div class="rec-val">${records.bestMoney} ₪</div><div class="rec-lbl">💵 שיא כסף</div></div>
    <div class="record-stat"><div class="rec-val">${records.bestDiamonds} 💎</div><div class="rec-lbl">💎 שיא יהלומים</div></div>
    <div class="record-stat"><div class="rec-val">${records.totalSnakesEaten || 0}</div><div class="rec-lbl">🐍 סה"כ נחשים שנאכלו</div></div>
    <div class="record-stat"><div class="rec-val">${records.totalBossesDefeated || 0}</div><div class="rec-lbl">👑 בוסים שהובסו</div></div>
  `;

  const tbody = document.getElementById('recordsTableBody');
  const liveRun = {
    score: state.score || 0,
    world: state.world || 1,
    level: state.level || 1,
    snakes: state.snakesEaten || 0,
    diff: `${getDifficultyConfig().label} (חי)`
  };
  const combined = [...(records.runs || [])];
  if (liveRun.score > 0 || liveRun.snakes > 0 || combined.length === 0) {
    combined.push(liveRun);
  }
  combined.sort((a, b) => b.score - a.score || b.world - a.world);

  tbody.innerHTML = '';
  combined.slice(0, 8).forEach((run, i) => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : i + 1}</td>
      <td><strong>${run.score}</strong></td>
      <td>${run.world}</td>
      <td>${run.level}</td>
      <td>${run.snakes}</td>
      <td>${run.diff}</td>
    `;
    tbody.appendChild(tr);
  });
}

function updateHUD() {
  const style = LEVEL_STYLES[(state.level - 1) % LEVEL_STYLES.length];
  const diffCfg = getDifficultyConfig();
  const regularLeft = enemies.filter((e) => !e.isBurglar).length;

  document.getElementById('worldNum').textContent = state.world;
  document.getElementById('worldBiome').textContent = currentWorldTheme ? `(${currentWorldTheme.name})` : '';
  document.getElementById('snakesLeft').textContent = bossSpawnedThisWorld ? '👑 בוס' : regularLeft;
  document.getElementById('playerLevel').textContent = state.level;
  document.getElementById('shapeName').textContent = style.name;
  document.getElementById('moneyCount').textContent = state.money;
  document.getElementById('diamondCount').textContent = state.diamonds;

  const hpPct = Math.max(0, Math.min(100, (player.hp / player.maxHp) * 100));
  document.getElementById('hpBarFill').style.width = `${hpPct}%`;
  document.getElementById('hpText').textContent = `${Math.ceil(player.hp)}/${player.maxHp}`;

  // עדכון חלונית רמה ושיא בצד המסך
  const lvlProg = state.levelProgress || 0;
  document.getElementById('sideLevelNum').textContent = state.level;
  document.getElementById('sideShapeName').textContent = style.name;
  document.getElementById('xpCount').textContent = lvlProg;
  document.getElementById('xpNeed').textContent = '4';
  document.getElementById('levelXpFill').style.width = `${Math.min(100, (lvlProg / 4) * 100)}%`;
  document.getElementById('sideBestWorld').textContent = Math.max(records.bestWorld || 1, state.world || 1);
  document.getElementById('sideBestScore').textContent = Math.max(records.bestScore || 0, state.score || 0);

  const diffBtn = document.getElementById('difficultyBtn');
  if (diffBtn) {
    diffBtn.textContent = diffCfg.label;
    diffBtn.className = `action-btn diff-btn ${diffCfg.cssClass}`;
  }

  const questsBtn = document.getElementById('questsBtn');
  if (questsBtn) {
    const timedMin = state.quests.active
      .filter((q) => q.timed)
      .reduce((min, q) => Math.min(min, q.timeRemaining), Infinity);
    questsBtn.textContent = Number.isFinite(timedMin) ? `📜 משימות (⏱️${timedMin}ש)` : '📜 משימות';
  }

  document.getElementById('dayNightBtn').textContent = isNightTime() ? '🌙' : '☀️';
  positionFloatingUI();
}

function renderShop() {
  document.getElementById('shopMoney').textContent = state.money;
  document.getElementById('shopDiamonds').textContent = state.diamonds;

  const u = state.upgrades;
  const upgradesItems = [
    {
      title: `🦷 שדרוג עוצמת נשיכה (רמה ${u.biteLevel})`,
      desc: 'מחזק את הנשיכה שלך כדי לאכול נחשים מהר יותר.',
      costMoney: 6 * u.biteLevel,
      costDiamonds: 0,
      action: () => { u.biteLevel++; }
    },
    {
      title: `🌀 שדרוג עוצמת הצלפת זנב (רמה ${u.tailWhipLevel || 1})`,
      desc: 'מגדיל את הנזק, הטווח וההדף של מכת הזנב!',
      costMoney: 7 * (u.tailWhipLevel || 1),
      costDiamonds: 4 * (u.tailWhipLevel || 1),
      action: () => { u.tailWhipLevel = (u.tailWhipLevel || 1) + 1; }
    },
    {
      title: `⚡ שדרוג מהירות (רמה ${u.speedLevel})`,
      desc: 'הנחש שלך זז מהר יותר במפה.',
      costMoney: 5 * u.speedLevel,
      costDiamonds: 0,
      action: () => { u.speedLevel++; }
    },
    {
      title: `❤️ תוספת חיים (רמה ${u.hpLevel})`,
      desc: 'מגדיל את מד החיים המקסימלי של הנחש.',
      costMoney: 0,
      costDiamonds: 6 * u.hpLevel,
      action: () => {
        u.hpLevel++;
        player.maxHp = getPlayerStats().maxHp;
        player.hp = player.maxHp;
      }
    },
    {
      title: `🧪 שדרוג ארס (רמה ${u.venomLevel})`,
      desc: 'ארס חזק שמוריד חיים לנחשים ומפיל עצים לגשר בירייה אחת!',
      costMoney: 0,
      costDiamonds: 8 * u.venomLevel,
      action: () => { u.venomLevel++; }
    },
    {
      title: `🔩 שיניים מלאכותיות`,
      desc: 'שיני מתכת מיוחדות שמכפילות את עוצמת הנשיכה!',
      costMoney: 15,
      costDiamonds: 10,
      owned: u.hasArtificialTeeth,
      action: () => { u.hasArtificialTeeth = true; }
    }
  ];

  const helpersItems = [
    {
      title: `🤖 חליפת לייזר מתקדמת`,
      desc: 'חליפה שיורה קרני לייזר חזקות!',
      costMoney: 10,
      costDiamonds: 12,
      owned: u.hasLaserSuit,
      action: () => { u.hasLaserSuit = true; }
    },
    {
      title: `🔥 שדרוג עוצמת לייזר (רמה ${u.laserLevel})`,
      desc: 'מחזק את קרני הלייזר של החליפה שלך.',
      costMoney: 0,
      costDiamonds: 10 * u.laserLevel,
      action: () => { u.laserLevel++; }
    },
    {
      title: `🛡️ חליפת שריון זהב`,
      desc: 'חליפה מיוחדת שמוסיפה הגנה וחיים לנחש.',
      costMoney: 18,
      costDiamonds: 8,
      owned: u.hasArmorSuit,
      action: () => {
        u.hasArmorSuit = true;
        player.maxHp = getPlayerStats().maxHp;
        player.hp = player.maxHp;
      }
    },
    {
      title: `💰 נחש עוזר אוסף משאבים (יש לך: ${u.collectorSnakes})`,
      desc: 'נחש שצד נחשים קטנים בשבילך ומביא כסף ויהלומים!',
      costMoney: 8 + u.collectorSnakes * 8,
      costDiamonds: 0,
      action: () => {
        u.collectorSnakes++;
        rebuildHelpers();
      }
    },
    {
      title: `⬆️💰 שדרוג נחשים אוספים (רמה ${u.collectorLevel || 1})`,
      desc: 'מגדיל מהירות, כוח ומעניק +25% בונוס שלל מהאוספים!',
      costMoney: 10 * (u.collectorLevel || 1),
      costDiamonds: 5 * (u.collectorLevel || 1),
      locked: u.collectorSnakes === 0,
      lockedLabel: 'קנה קודם נחש אוסף',
      action: () => {
        u.collectorLevel = (u.collectorLevel || 1) + 1;
        rebuildHelpers();
      }
    },
    {
      title: `⚔️ נחש עוזר לוחם (יש לך: ${u.fighterSnakes})`,
      desc: 'נחש שנלחם לצידך ביחד מול נחשים אחרים!',
      costMoney: 10 + u.fighterSnakes * 10,
      costDiamonds: 5,
      action: () => {
        u.fighterSnakes++;
        rebuildHelpers();
      }
    },
    {
      title: `⬆️⚔️ שדרוג נחשים לוחמים (רמה ${u.fighterLevel || 1})`,
      desc: 'מגביר מהירות, נזק, קצב תקיפה ויורה ארס/לייזר מרחוק (מרמה 2)!',
      costMoney: 12 * (u.fighterLevel || 1),
      costDiamonds: 6 * (u.fighterLevel || 1),
      locked: u.fighterSnakes === 0,
      lockedLabel: 'קנה קודם נחש לוחם',
      action: () => {
        u.fighterLevel = (u.fighterLevel || 1) + 1;
        rebuildHelpers();
      }
    },
    {
      title: `🏠 נחש עוזר שומר על הבית (יש לך: ${u.guardSnakes})`,
      desc: 'שומר על הבית שלך כדי שנחשים פורצים לא יגנבו כסף!',
      costMoney: 8 + u.guardSnakes * 8,
      costDiamonds: 4,
      action: () => {
        u.guardSnakes++;
        rebuildHelpers();
      }
    },
    {
      title: `⬆️🛡️ שדרוג נחשים שומרים (רמה ${u.guardLevel || 1})`,
      desc: 'מגדיל את מהירות, כוח וטווח ההגנה של השומרים סביב הבית!',
      costMoney: 10 * (u.guardLevel || 1),
      costDiamonds: 5 * (u.guardLevel || 1),
      locked: u.guardSnakes === 0,
      lockedLabel: 'קנה קודם נחש שומר',
      action: () => {
        u.guardLevel = (u.guardLevel || 1) + 1;
        rebuildHelpers();
      }
    }
  ];

  fillShopSection('upgradesList', upgradesItems);
  fillShopSection('helpersList', helpersItems);
}

function fillShopSection(containerId, items) {
  const container = document.getElementById(containerId);
  container.innerHTML = '';

  for (const item of items) {
    const canAfford = state.money >= item.costMoney && state.diamonds >= item.costDiamonds;
    const isDisabled = Boolean(item.owned || item.locked || !canAfford);
    const card = document.createElement('div');
    card.className = 'shop-card';

    let priceParts = [];
    if (item.costMoney > 0) priceParts.push(`${item.costMoney} ₪`);
    if (item.costDiamonds > 0) priceParts.push(`${item.costDiamonds} 💎`);
    const priceLabel = item.owned
      ? 'נרכש ✅'
      : item.locked
        ? (item.lockedLabel || 'נעול')
        : `קנה (${priceParts.join(' + ')})`;

    card.innerHTML = `
      <div>
        <h4>${item.title}</h4>
        <p>${item.desc}</p>
      </div>
      <button class="buy-btn" ${isDisabled ? 'disabled' : ''}>${priceLabel}</button>
    `;

    const btn = card.querySelector('.buy-btn');
    btn.addEventListener('click', () => {
      if (item.owned || item.locked) return;
      if (state.money < item.costMoney || state.diamonds < item.costDiamonds) return;
      state.money -= item.costMoney;
      state.diamonds -= item.costDiamonds;
      item.action();
      recordQuestProgress('shop_buy', 1);
      saveState();
      updateHUD();
      renderShop();
      showToast(`✅ רכשת בהצלחה: ${item.title}`);
    });

    container.appendChild(card);
  }
}

// ============================================================================
// אירועי כפתורים ב-HUD
// ============================================================================
document.getElementById('shopBtn').addEventListener('click', () => {
  renderShop();
  document.getElementById('shopModal').classList.remove('hidden');
});

document.getElementById('closeShopBtn').addEventListener('click', () => {
  document.getElementById('shopModal').classList.add('hidden');
});

document.getElementById('questsBtn').addEventListener('click', () => {
  renderQuests();
  document.getElementById('questsModal').classList.remove('hidden');
});

document.getElementById('closeQuestsBtn').addEventListener('click', () => {
  document.getElementById('questsModal').classList.add('hidden');
});

document.getElementById('recordsBtn').addEventListener('click', () => {
  renderRecords();
  document.getElementById('recordsModal').classList.remove('hidden');
});

document.getElementById('closeRecordsBtn').addEventListener('click', () => {
  document.getElementById('recordsModal').classList.add('hidden');
});

document.getElementById('difficultyBtn').addEventListener('click', () => {
  const order = ['normal', 'hard', 'insane'];
  const idx = order.indexOf(state.difficulty);
  state.difficulty = order[(idx + 1) % order.length];
  saveState();
  const diffCfg = getDifficultyConfig();
  showToast(`רמת הקושי שונתה ל-${diffCfg.label}!`);
  initWorld(state.world);
});

document.getElementById('dayNightBtn').addEventListener('click', () => {
  manualNightOverride = !isNightTime();
  updateHUD();
  showToast(isNightTime() ? '🌙 מצב לילה הופעל!' : '☀️ מצב יום הופעל!');
});

document.getElementById('resetBtn').addEventListener('click', () => {
  if (confirm('האם לאפס את השמירה ולהתחיל מחדש מרמה 1 עם 10 שקלים ו-15 יהלומים?')) {
    recordCompletedRun();
    localStorage.removeItem(SAVE_KEY);
    state = getDefaultState();
    initWorld(1);
  }
});

// ============================================================================
// כלי עזר (חלקיקים, טקסטים צפים, שינוי גודל מסך)
// ============================================================================
function spawnParticles(x, y, color, count) {
  for (let i = 0; i < count; i++) {
    const a = Math.random() * Math.PI * 2;
    const sp = 1 + Math.random() * 4.5;
    particles.push({
      x,
      y,
      vx: Math.cos(a) * sp,
      vy: Math.sin(a) * sp,
      color,
      size: 3 + Math.random() * 4,
      life: 18 + Math.random() * 15
    });
  }
}

function addFloatingText(x, y, text, color = '#fff') {
  floatingTexts.push({ x, y, text, color, life: 42 });
}

function showToast(msg) {
  const container = document.getElementById('toastContainer');
  const el = document.createElement('div');
  el.className = 'toast';
  el.textContent = msg;
  container.appendChild(el);
  setTimeout(() => el.remove(), 2900);
}

function resizeCanvas() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  positionFloatingUI();
}
window.addEventListener('resize', resizeCanvas);
resizeCanvas();

// הפעלת המשחק!
initWorld(state.world);

function gameLoop() {
  update();
  draw();
  requestAnimationFrame(gameLoop);
}
requestAnimationFrame(gameLoop);