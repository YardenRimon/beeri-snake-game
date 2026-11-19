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

// 10 סוגי סביבות טבע אמיתיות (יוצרות 150 עולמות ייחודיים מהטבע: עולם 1 יער, עולם 2 ארץ סלעים ואבנים, עולם 3 מדבר וכו')
const WORLD_BIOMES = [
  { name: 'יער ירוק', bgHue: 122, bgSat: 35, bgLight: 17, riverEdge: '#0277bd', riverMid: '#29b6f6', decor: 'forest', decorCount: 64, decorColors: ['#2e7d32', '#43a047', '#66bb6a', '#8d6e63'] },
  { name: 'ארץ סלעים ואבנים', bgHue: 210, bgSat: 10, bgLight: 22, riverEdge: '#37474f', riverMid: '#607d8b', decor: 'stones', decorCount: 84, decorColors: ['#78909c', '#546e7a', '#90a4ae', '#6d4c41'] },
  { name: 'מדבר זהוב', bgHue: 38, bgSat: 48, bgLight: 24, riverEdge: '#00838f', riverMid: '#4dd0e1', decor: 'desert', decorCount: 58, decorColors: ['#2e7d32', '#d4a373', '#e9c46a', '#a1887f'] },
  { name: 'הרים מושלגים וקרח', bgHue: 202, bgSat: 40, bgLight: 25, riverEdge: '#4fc3f7', riverMid: '#b3e5fc', decor: 'ice', decorCount: 60, decorColors: ['#e1f5fe', '#81d4fa', '#cfd8dc', '#2e7d32'] },
  { name: 'הר געש ולבה', bgHue: 10, bgSat: 42, bgLight: 13, riverEdge: '#bf360c', riverMid: '#ff6d00', decor: 'lava', decorCount: 62, decorColors: ['#4e342e', '#3e2723', '#ff3d00', '#ffab00'] },
  { name: 'חוף ים טרופי', bgHue: 45, bgSat: 52, bgLight: 26, riverEdge: '#00acc1', riverMid: '#80deea', decor: 'beach', decorCount: 56, decorColors: ['#2e7d32', '#ffca28', '#ffab91', '#fff8e1'] },
  { name: 'סוואנה ואדמת עשב', bgHue: 48, bgSat: 36, bgLight: 20, riverEdge: '#0288d1', riverMid: '#4fc3f7', decor: 'savanna', decorCount: 60, decorColors: ['#9e9d24', '#c0ca33', '#558b2f', '#8d6e63'] },
  { name: 'ביצת מים ושושנים', bgHue: 152, bgSat: 30, bgLight: 12, riverEdge: '#1b5e20', riverMid: '#69f0ae', decor: 'swamp', decorCount: 64, decorColors: ['#33691e', '#558b2f', '#9ccc65', '#f48fb1'] },
  { name: 'קניון סלעים אדום', bgHue: 16, bgSat: 48, bgLight: 19, riverEdge: '#0277bd', riverMid: '#4fc3f7', decor: 'canyon', decorCount: 72, decorColors: ['#8d6e63', '#bf360c', '#d84315', '#ffab91'] },
  { name: 'אחו פרחים והרים', bgHue: 105, bgSat: 36, bgLight: 19, riverEdge: '#0288d1', riverMid: '#81d4fa', decor: 'meadow', decorCount: 68, decorColors: ['#66bb6a', '#ffee58', '#f06292', '#ba68c8'] }
];

const NATURE_REGION_NAMES = [
  '', 'עמק', 'פסגות', 'צפוני', 'דרומי', 'מזרחי', 'מערבי', 'פראי', 'עתיק', 'גבוה', 'עמוק', 'שליו', 'ירוק-עד', 'איתן', 'רחב'
];

function getWorldTheme(worldNum) {
  const base = WORLD_BIOMES[(worldNum - 1) % WORLD_BIOMES.length];
  const cycle = Math.floor((worldNum - 1) / WORLD_BIOMES.length);
  const hueOffset = cycle === 0 ? 0 : (((cycle * 11 + worldNum * 3) % 24) - 12);
  const lightOffset = cycle === 0 ? 0 : (((worldNum * 5) % 6) - 3);
  const regionSuffix = cycle > 0 ? ` – ${NATURE_REGION_NAMES[cycle % NATURE_REGION_NAMES.length]}` : '';
  return {
    ...base,
    name: `${base.name}${regionSuffix}`,
    bgHue: (base.bgHue + hueOffset + 360) % 360,
    bgLight: Math.max(9, Math.min(28, base.bgLight + lightOffset)),
    textureStep: 85 + ((worldNum * 13) % 35)
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
  { type: 'home_heal', title: 'התרפא בתוך המחילה שלך עד חיים מלאים 🌿', target: 1, rewardMoney: 10, rewardDiamonds: 6, timed: false, timeLimitSec: 0 }
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
      goldSuitLevel: 1,
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
let pits = [];
let particles = [];
let floatingTexts = [];
let worldDecorations = [];
let currentWorldTheme = getWorldTheme(state.world);
let bossSpawnedThisWorld = false;
let crossedRiverThisWorld = false;
let questTickCounter = 0;
let tailWhipEffect = null;

// לייזר הגנה קטן יחיד המקיף את מחילת הבית ומרחיק אויבים בנזק קל
const burrowLaser = {
  angle: 0,
  x: HOME_BASE.x + HOME_BASE.radius,
  y: HOME_BASE.y,
  cooldown: 0,
  beamTimer: 0,
  targetX: HOME_BASE.x,
  targetY: HOME_BASE.y
};

// נשר נדיר אחד לכל עולם (מופיע רק לעיתים רחוקות ולפעמים עוקב אחר השחקן)
let worldEagle = null;

function createWorldEagle() {
  return {
    phase: 'hidden', // 'hidden' | 'warning' | 'active' | 'leaving'
    timer: 1500 + Math.floor(Math.random() * 1200),
    x: -180,
    y: WORLD_HEIGHT / 2,
    angle: 0,
    speed: 4.1,
    altitude: 1.2,
    wingPhase: 0,
    following: false,
    swoopTimer: 160,
    swoopDuration: 0,
    hitCooldown: 0,
    dodgeNotified: false
  };
}

let goldCannonCooldowns = [0, 15, 30, 45];

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
  const goldTier = u.hasArmorSuit ? (u.goldSuitLevel || 1) : 0;
  const maxHp = 100 + (u.hpLevel - 1) * 35 + (u.hasArmorSuit ? 60 + (goldTier - 1) * 40 : 0);
  const baseSpeed = Math.min(9.8, 4.0 + (u.speedLevel - 1) * 0.45);
  const biteDamage = 25 + (u.biteLevel - 1) * 15 + (u.hasArtificialTeeth ? 35 : 0);
  const tailWhipDamage = 28 + ((u.tailWhipLevel || 1) - 1) * 18 + state.level * 5;
  const tailWhipRange = 16 + Math.min(state.level * 2.2, 26) + 95 + ((u.tailWhipLevel || 1) - 1) * 20;
  const venomDamage = 22 + (u.venomLevel - 1) * 15;
  const laserDamage = 32 + (u.laserLevel - 1) * 18;
  const goldCannonCount = u.hasArmorSuit ? Math.min(4, 1 + goldTier) : 0;
  const goldCannonDamage = 5 + Math.max(0, goldTier - 1) * 2;
  const radius = 16 + Math.min(state.level * 2.2, 26);
  const segCount = 12 + Math.min((state.level - 1) * 3, 28);
  return {
    maxHp,
    baseSpeed,
    biteDamage,
    tailWhipDamage,
    tailWhipRange,
    venomDamage,
    laserDamage,
    goldCannonCount,
    goldCannonDamage,
    radius,
    segCount
  };
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

  const count = theme.decorCount || 58;
  for (let i = 0; i < count; i++) {
    const x = 80 + rand() * (WORLD_WIDTH - 160);
    const y = 80 + rand() * (WORLD_HEIGHT - 160);
    if (x > RIVER.x - 75 && x < RIVER.x + RIVER.width + 75) continue;
    if (Math.hypot(x - HOME_BASE.x, y - HOME_BASE.y) < HOME_BASE.radius + 55) continue;
    list.push({
      x,
      y,
      size: 12 + rand() * 20,
      color: theme.decorColors[Math.floor(rand() * theme.decorColors.length)],
      color2: theme.decorColors[Math.floor(rand() * theme.decorColors.length)],
      rot: rand() * Math.PI * 2,
      variant: Math.floor(rand() * 3)
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
  worldEagle = createWorldEagle();
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

  // יצירת נחשים יריבים בעולם: 20 נחשים קבועים + בוס בסוף העולם
  enemies = [];
  enemyProjectiles = [];
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
    radius: duel.active ? 130 : stats.tailWhipRange,
    life: 16,
    maxLife: 16
  };

  if (duel.active) {
    duel.whipPulseFrames = 14;
    if (!duel.roundOver) {
      const dHead = Math.hypot(duel.opponent.x - player.x, duel.opponent.y - player.y);
      const dTail = Math.hypot(duel.opponent.x - tail.x, duel.opponent.y - tail.y);
      if (Math.min(dHead, dTail) <= 145 && duel.opponent.jumpZ < 8) {
        const pushAng = Math.atan2(duel.opponent.y - centerY, duel.opponent.x - centerX);
        sendDuelHit(20, Math.cos(pushAng) * 65, Math.sin(pushAng) * 65, '🌀 הצלפה!');
      } else {
        addFloatingText(tail.x, tail.y - 20, '🌀 הצלפה!', '#ffcc80');
      }
    }
    spawnParticles(tail.x, tail.y, '#ffa726', 16);
    return;
  }

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
    if (!duel.active) recordQuestProgress('jumps', 1);
  }
}

function triggerBite() {
  if (player.biteCooldown > 0) return;
  player.biteCooldown = 15;
  player.biteAnim = 12;

  if (duel.active) {
    if (!duel.roundOver) {
      const dOpp = Math.hypot(duel.opponent.x - player.x, duel.opponent.y - player.y);
      if (dOpp <= 98 && duel.opponent.jumpZ < 8) {
        const dmg = state.upgrades.hasArtificialTeeth ? 28 : 24;
        const pushAng = Math.atan2(duel.opponent.y - player.y, duel.opponent.x - player.x);
        sendDuelHit(dmg, Math.cos(pushAng) * 28, Math.sin(pushAng) * 28, '🦷 נשיכה!');
        return;
      }
    }
    addFloatingText(player.x, player.y - 30, '🦷 נשיכה!', '#ffd54f');
    return;
  }

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

  if (duel.active) {
    fireDuelProjectile(isLaser);
    return;
  }

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

  // ניקוי עולם + עליית רמה כל 3 עולמות!
  enemies = [];
  state.levelProgress = (state.levelProgress || 0) + 1;
  if (state.levelProgress >= 3) {
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
    showToast(`🎉 השלמת 3 עולמות ועלית לרמה ${state.level}! הנחש השתנה ל-${newStyle.name}!`);
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
  showToast(`🌿 ${reason} – חזרת למחילה שלך, החיים התמלאו מחדש!`);
}

// ============================================================================
// עדכון לולאת המשחק
// ============================================================================
let burglarSpawnTimer = 450;

function applyPlayerMovementInput(baseSpeed) {
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
      player.speed = baseSpeed;
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
    player.speed = baseSpeed;
  } else if (!isTouchMode && mouse.activeOnDesktop) {
    const distToMouse = Math.hypot(mouse.worldX - player.x, mouse.worldY - player.y);
    const stopRadius = Math.max(24, baseSpeed * 3.5);
    if (distToMouse > stopRadius) {
      const targetAngle = Math.atan2(mouse.worldY - player.y, mouse.worldX - player.x);
      let diff = targetAngle - player.angle;
      while (diff > Math.PI) diff -= Math.PI * 2;
      while (diff < -Math.PI) diff += Math.PI * 2;
      player.angle += diff * 0.42;
      player.speed = distToMouse < stopRadius + 28
        ? Math.min(baseSpeed, Math.max(1.5, (distToMouse - stopRadius + 10) * 0.4))
        : baseSpeed;
    } else {
      player.speed = 0;
    }
  } else {
    player.speed = 0;
  }
}

function update() {
  if (duel.active) {
    updateDuel();
    return;
  }

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

  // תנועת השחקן: מהירות מלאה ואחידה גם בפניות, ללא הליכה הפוכה אחורה
  applyPlayerMovementInput(stats.baseSpeed);

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
      showToast('🦹 נחש פורץ מתקרב למחילה שלך! לייזר ההגנה או נחש שומר יעצרו אותו!');
    }
  }

  updateGoldSuitCannons(stats);
  updateProjectiles();
  updateEnemyProjectiles(stats);
  updatePits();
  updateHelpers();
  updateEnemies(stats);
  updateBurrowLaser();
  updateWorldEagle(stats);
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
    if (!p.isMiniCannon) {
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
    }

    // פגיעה בנחשי אויב
    for (let j = enemies.length - 1; j >= 0; j--) {
      const en = enemies[j];
      if (Math.hypot(p.x - en.x, p.y - en.y) < en.radius + 14) {
        const hitLabel = p.isMiniCannon ? '🟡 תותח!' : (p.isLaser ? '⚡ לייזר!' : '🧪 ארס!');
        if (en.level <= state.level) {
          damageEnemy(j, p.damage, hitLabel);
        } else if (en.isBoss) {
          damageEnemy(j, p.damage * 0.65, p.isLaser ? '⚡ בוס!' : (p.isMiniCannon ? '🟡 בוס!' : '🧪 בוס!'));
        } else {
          const bigDmg = p.isMiniCannon ? Math.max(2, Math.round(p.damage * 0.45)) : p.damage * 0.3;
          en.hp -= bigDmg;
          addFloatingText(en.x, en.y - 20, `-${Math.round(bigDmg)}`, '#ffab91');
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

    if (en.repelTimer > 0) {
      en.repelTimer--;
      const awayAng = Math.atan2(en.y - HOME_BASE.y, en.x - HOME_BASE.x);
      en.angle = awayAng;
      moveSpeed = en.speed * 1.25;
    } else if (en.isBurglar) {
      en.angle = Math.atan2(HOME_BASE.y - en.y, HOME_BASE.x - en.x);
      if (Math.hypot(en.x - HOME_BASE.x, en.y - HOME_BASE.y) < HOME_BASE.radius - 20) {
        const stolen = Math.min(state.money, 4);
        if (stolen > 0) {
          state.money -= stolen;
          saveState();
          updateHUD();
          showToast(`🚨 נחש פורץ נכנס למחילה וגנב ${stolen}₪! קנה נחש שומר בחנות להגנה!`);
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

function updatePits() {
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

function getGoldCannonMountPoint(segments, headRadius, segIndex, side) {
  const seg = segments[segIndex] || segments[0];
  const prev = segments[Math.max(0, segIndex - 1)] || seg;
  const next = segments[Math.min(segments.length - 1, segIndex + 1)] || seg;
  const dir = Math.atan2(prev.y - next.y, prev.x - next.x);
  const t = segIndex / Math.max(1, segments.length - 1);
  const r = headRadius * (1 - t * 0.42);
  const perp = dir + (side * Math.PI) / 2;
  return {
    x: seg.x + Math.cos(perp) * (r + 3),
    y: seg.y + Math.sin(perp) * (r + 3),
    dir
  };
}

function getGoldCannonConfigs(count) {
  const layout = [
    { segIndex: 1, side: -1 },
    { segIndex: 1, side: 1 },
    { segIndex: 3, side: -1 },
    { segIndex: 3, side: 1 }
  ];
  return layout.slice(0, count);
}

// תותחים קטנים וחלשים המורכבים על חליפת הזהב ויורים לעזרת השחקן
function updateGoldSuitCannons(stats) {
  if (!stats.goldCannonCount || !player.segments.length) return;
  const configs = getGoldCannonConfigs(stats.goldCannonCount);
  for (let c = 0; c < configs.length; c++) {
    if (goldCannonCooldowns[c] > 0) {
      goldCannonCooldowns[c]--;
      continue;
    }
    const cfg = configs[c];
    const mount = getGoldCannonMountPoint(player.segments, stats.radius, cfg.segIndex, cfg.side);
    let nearest = null;
    let bestDist = 340;
    for (const en of enemies) {
      const d = Math.hypot(en.x - mount.x, en.y - mount.y);
      if (d < bestDist) {
        bestDist = d;
        nearest = en;
      }
    }
    if (nearest) {
      const aim = Math.atan2(nearest.y - mount.y, nearest.x - mount.x);
      projectiles.push({
        x: mount.x,
        y: mount.y,
        vx: Math.cos(aim) * 9.5,
        vy: Math.sin(aim) * 9.5,
        isLaser: false,
        isMiniCannon: true,
        damage: stats.goldCannonDamage,
        life: 38
      });
      goldCannonCooldowns[c] = 58 + (c % 2) * 10;
    }
  }
}

// לייזר הגנה קטן יחיד המקיף את מחילת הבית: נזק קל בלבד והרחקת אויבים מהמחילה
function updateBurrowLaser() {
  burrowLaser.angle = (burrowLaser.angle + 0.022) % (Math.PI * 2);
  burrowLaser.x = HOME_BASE.x + Math.cos(burrowLaser.angle) * (HOME_BASE.radius + 4);
  burrowLaser.y = HOME_BASE.y + Math.sin(burrowLaser.angle) * (HOME_BASE.radius + 4);
  if (burrowLaser.cooldown > 0) burrowLaser.cooldown--;
  if (burrowLaser.beamTimer > 0) burrowLaser.beamTimer--;
  if (burrowLaser.cooldown > 0) return;

  let targetIdx = -1;
  let closestDist = HOME_BASE.radius + 195;
  for (let i = 0; i < enemies.length; i++) {
    const en = enemies[i];
    const distToBurrow = Math.hypot(en.x - HOME_BASE.x, en.y - HOME_BASE.y);
    if (distToBurrow < closestDist) {
      closestDist = distToBurrow;
      targetIdx = i;
    }
  }
  if (targetIdx === -1) return;

  const en = enemies[targetIdx];
  burrowLaser.cooldown = 44;
  burrowLaser.beamTimer = 14;
  burrowLaser.targetX = en.x;
  burrowLaser.targetY = en.y;

  const mildDmg = 4;
  en.hp -= mildDmg;
  const pushAng = Math.atan2(en.y - HOME_BASE.y, en.x - HOME_BASE.x);
  en.x = Math.max(80, Math.min(WORLD_WIDTH - 80, en.x + Math.cos(pushAng) * 28));
  en.y = Math.max(80, Math.min(WORLD_HEIGHT - 80, en.y + Math.sin(pushAng) * 28));
  en.angle = pushAng;
  en.repelTimer = 38;

  spawnParticles(en.x, en.y, '#80d8ff', 4);
  if (Math.random() < 0.45) {
    addFloatingText(en.x, en.y - 22, `⚡ -${mildDmg} הרחקה`, '#80d8ff');
  }
  if (en.hp <= 0) {
    eatEnemy(targetIdx);
  }
}

// נשר נדיר (בדיוק 1 בכל עולם) – מופיע לעיתים רחוקות, מרחף, לפעמים עוקב וצולל
function updateWorldEagle(playerStats) {
  if (!worldEagle) worldEagle = createWorldEagle();
  worldEagle.wingPhase += 0.22;
  if (worldEagle.hitCooldown > 0) worldEagle.hitCooldown--;

  if (worldEagle.phase === 'hidden') {
    worldEagle.timer--;
    if (worldEagle.timer <= 0) {
      const fromLeft = Math.random() < 0.5;
      worldEagle.x = fromLeft ? 40 : WORLD_WIDTH - 40;
      worldEagle.y = 220 + Math.random() * (WORLD_HEIGHT - 440);
      worldEagle.angle = Math.atan2(player.y - worldEagle.y, player.x - worldEagle.x);
      worldEagle.following = Math.random() < 0.55;
      worldEagle.phase = 'warning';
      worldEagle.timer = 105;
      worldEagle.altitude = 1.15;
      worldEagle.swoopTimer = 110;
      worldEagle.swoopDuration = 0;
      worldEagle.dodgeNotified = false;
      showToast(
        worldEagle.following
          ? '🦅 זהירות! הנשר של העולם הגיע ועוקב אחריך! התחמק או הסתתר במחילה!'
          : '🦅 נשר נדיר מרחף בשמי העולם – שמור מרחק!'
      );
    }
    return;
  }

  if (worldEagle.phase === 'warning') {
    worldEagle.x += Math.cos(worldEagle.angle) * worldEagle.speed * 0.85;
    worldEagle.y += Math.sin(worldEagle.angle) * worldEagle.speed * 0.85;
    worldEagle.timer--;
    if (worldEagle.timer <= 0) {
      worldEagle.phase = 'active';
      worldEagle.timer = 400 + Math.floor(Math.random() * 90);
    }
    return;
  }

  if (worldEagle.phase === 'active') {
    const playerInBurrow = Math.hypot(player.x - HOME_BASE.x, player.y - HOME_BASE.y) < HOME_BASE.radius;
    const distFromBurrow = Math.hypot(worldEagle.x - HOME_BASE.x, worldEagle.y - HOME_BASE.y);

    if (playerInBurrow && distFromBurrow < HOME_BASE.radius + 140) {
      const awayAng = Math.atan2(worldEagle.y - HOME_BASE.y, worldEagle.x - HOME_BASE.x);
      let diff = awayAng - worldEagle.angle;
      while (diff > Math.PI) diff -= Math.PI * 2;
      while (diff < -Math.PI) diff += Math.PI * 2;
      worldEagle.angle += diff * 0.08;
    } else if (worldEagle.following && !playerInBurrow) {
      const targetAngle = Math.atan2(player.y - worldEagle.y, player.x - worldEagle.x);
      let diff = targetAngle - worldEagle.angle;
      while (diff > Math.PI) diff -= Math.PI * 2;
      while (diff < -Math.PI) diff += Math.PI * 2;
      worldEagle.angle += diff * 0.032;
    } else {
      worldEagle.angle += Math.sin(worldEagle.wingPhase * 0.08) * 0.014;
    }

    worldEagle.x += Math.cos(worldEagle.angle) * worldEagle.speed;
    worldEagle.y += Math.sin(worldEagle.angle) * worldEagle.speed;
    if (worldEagle.x < 90 || worldEagle.x > WORLD_WIDTH - 90) worldEagle.angle = Math.PI - worldEagle.angle;
    if (worldEagle.y < 90 || worldEagle.y > WORLD_HEIGHT - 90) worldEagle.angle = -worldEagle.angle;
    worldEagle.x = Math.max(70, Math.min(WORLD_WIDTH - 70, worldEagle.x));
    worldEagle.y = Math.max(70, Math.min(WORLD_HEIGHT - 70, worldEagle.y));

    if (worldEagle.swoopDuration > 0) {
      worldEagle.swoopDuration--;
      const progress = 1 - worldEagle.swoopDuration / 68;
      worldEagle.altitude = 1.0 - Math.sin(progress * Math.PI) * 0.82;

      if (worldEagle.altitude < 0.36 && !playerInBurrow && worldEagle.hitCooldown <= 0) {
        const d = Math.hypot(worldEagle.x - player.x, worldEagle.y - player.y);
        if (d < playerStats.radius + 24) {
          if (player.jumpZ >= 8 || player.invulnerableTimer > 0) {
            if (!worldEagle.dodgeNotified) {
              worldEagle.dodgeNotified = true;
              addFloatingText(player.x, player.y - 38, '🦅 התחמקת מהנשר!', '#81d4fa');
            }
          } else {
            const diffCfg = getDifficultyConfig();
            const dmg = Math.round(32 * diffCfg.dmgMult);
            player.hp -= dmg;
            player.invulnerableTimer = 45;
            worldEagle.hitCooldown = 110;
            worldEagle.swoopDuration = 0;
            worldEagle.altitude = 0.9;
            spawnParticles(player.x, player.y, '#ffcc80', 18);
            addFloatingText(player.x, player.y - 36, `🦅 הנשר פגע בך! -${dmg}`, '#ff5252');
            updateHUD();
            if (player.hp <= 0) {
              sendPlayerHome('הנשר תפס אותך מהשמיים');
              return;
            }
          }
        }
      }
    } else {
      worldEagle.altitude += (1.0 - worldEagle.altitude) * 0.08;
      worldEagle.swoopTimer--;
      if (worldEagle.swoopTimer <= 0 && !playerInBurrow) {
        worldEagle.swoopDuration = 68;
        worldEagle.swoopTimer = 190 + Math.floor(Math.random() * 80);
        worldEagle.dodgeNotified = false;
      }
    }

    worldEagle.timer--;
    if (worldEagle.timer <= 0) {
      worldEagle.phase = 'leaving';
      worldEagle.swoopDuration = 0;
      worldEagle.timer = 150;
      worldEagle.angle = worldEagle.x < WORLD_WIDTH / 2 ? Math.PI : 0;
    }
    return;
  }

  if (worldEagle.phase === 'leaving') {
    worldEagle.altitude = Math.min(1.5, worldEagle.altitude + 0.018);
    worldEagle.x += Math.cos(worldEagle.angle) * worldEagle.speed * 1.25;
    worldEagle.y += Math.sin(worldEagle.angle) * worldEagle.speed * 1.25;
    worldEagle.timer--;
    if (worldEagle.timer <= 0 || worldEagle.x < -120 || worldEagle.x > WORLD_WIDTH + 120) {
      worldEagle.phase = 'hidden';
      // מופיע רק לעיתים רחוקות (~40 עד 65 שניות בין הופעות)
      worldEagle.timer = 2400 + Math.floor(Math.random() * 1500);
    }
  }
}

// ============================================================================
// ציור המשחק על הקנבס
// ============================================================================
function draw() {
  if (duel.active) {
    drawDuel();
    return;
  }
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  const night = isNightTime();

  ctx.save();
  ctx.scale(camera.zoom, camera.zoom);
  ctx.translate(-camera.x, -camera.y);

  // רקע הקרקע הייחודי מהטבע לכל אחד מ-150 העולמות
  const theme = currentWorldTheme || getWorldTheme(state.world);
  const light = night ? Math.max(5, theme.bgLight - 9) : theme.bgLight;
  ctx.fillStyle = `hsl(${theme.bgHue}, ${theme.bgSat}%, ${light}%)`;
  ctx.fillRect(0, 0, WORLD_WIDTH, WORLD_HEIGHT);

  // טקסטורת קרקע טבעית לפי סוג הסביבה (ללא רשת מלאכותית)
  const step = theme.textureStep || 95;
  ctx.strokeStyle = night ? 'rgba(255,255,255,0.035)' : 'rgba(255,255,255,0.055)';
  ctx.lineWidth = 1.6;
  for (let x = 45; x < WORLD_WIDTH; x += step) {
    for (let y = 45; y < WORLD_HEIGHT; y += step) {
      const jx = ((x * 3 + y * 7) % 29) - 14;
      const jy = ((x * 5 + y * 2) % 29) - 14;
      const px = x + jx;
      const py = y + jy;
      if (theme.decor === 'desert' || theme.decor === 'beach' || theme.decor === 'canyon') {
        ctx.beginPath();
        ctx.arc(px, py, 16, 0.25, Math.PI - 0.25);
        ctx.stroke();
      } else if (theme.decor === 'stones' || theme.decor === 'lava') {
        ctx.beginPath();
        ctx.arc(px, py, 3.2, 0, Math.PI * 2);
        ctx.stroke();
      } else {
        ctx.beginPath();
        ctx.moveTo(px - 3, py + 4);
        ctx.lineTo(px - 6, py - 4);
        ctx.moveTo(px + 2, py + 4);
        ctx.lineTo(px + 5, py - 5);
        ctx.stroke();
      }
    }
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

  // ציור מחילת הבית הטבעית של השחקן + לייזר הגנה יחיד
  ctx.save();
  ctx.beginPath();
  ctx.arc(HOME_BASE.x, HOME_BASE.y, HOME_BASE.radius, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(121, 85, 72, 0.22)';
  ctx.fill();
  ctx.lineWidth = 3.5;
  ctx.strokeStyle = '#8d6e63';
  ctx.setLineDash([10, 8]);
  ctx.stroke();
  ctx.setLineDash([]);

  // תלולית אדמה טבעית ומסביבה אבנים וצמחייה של מחילת נחש בטבע
  ctx.beginPath();
  ctx.ellipse(HOME_BASE.x, HOME_BASE.y + 4, 64, 46, 0, 0, Math.PI * 2);
  ctx.fillStyle = '#5d4037';
  ctx.fill();
  ctx.lineWidth = 3;
  ctx.strokeStyle = '#3e2723';
  ctx.stroke();

  const burrowDecor = [
    { dx: -44, dy: 14, r: 9, c: '#78909c' },
    { dx: -28, dy: 29, r: 7, c: '#8d6e63' },
    { dx: 44, dy: 15, r: 10, c: '#78909c' },
    { dx: 34, dy: -22, r: 7, c: '#66bb6a' },
    { dx: -39, dy: -19, r: 8, c: '#4caf50' },
    { dx: 18, dy: 32, r: 8, c: '#90a4ae' },
    { dx: 0, dy: -31, r: 7, c: '#558b2f' }
  ];
  for (const bd of burrowDecor) {
    ctx.beginPath();
    ctx.arc(HOME_BASE.x + bd.dx, HOME_BASE.y + bd.dy, bd.r, 0, Math.PI * 2);
    ctx.fillStyle = bd.c;
    ctx.fill();
  }

  // פתח המחילה הכהה אל מתחת לאדמה
  ctx.beginPath();
  ctx.ellipse(HOME_BASE.x, HOME_BASE.y + 8, 36, 23, 0, 0, Math.PI * 2);
  ctx.fillStyle = '#1b110d';
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(HOME_BASE.x, HOME_BASE.y + 11, 24, 15, 0, 0, Math.PI * 2);
  ctx.fillStyle = '#070403';
  ctx.fill();

  // קרן לייזר ההגנה הקלה המרחיקה תוקפים
  if (burrowLaser.beamTimer > 0) {
    ctx.save();
    ctx.strokeStyle = '#ff5252';
    ctx.shadowColor = '#80d8ff';
    ctx.shadowBlur = 10;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(burrowLaser.x, burrowLaser.y);
    ctx.lineTo(burrowLaser.targetX, burrowLaser.targetY);
    ctx.stroke();
    ctx.strokeStyle = '#e0f7fa';
    ctx.lineWidth = 1.2;
    ctx.stroke();
    ctx.restore();
  }

  // משדר הלייזר הקטן היחיד המקיף את המחילה
  ctx.beginPath();
  ctx.arc(burrowLaser.x, burrowLaser.y, 9, 0, Math.PI * 2);
  ctx.fillStyle = '#37474f';
  ctx.fill();
  ctx.lineWidth = 2;
  ctx.strokeStyle = '#80d8ff';
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(burrowLaser.x, burrowLaser.y, 4, 0, Math.PI * 2);
  ctx.fillStyle = burrowLaser.beamTimer > 0 ? '#ff5252' : '#40c4ff';
  ctx.fill();

  ctx.font = 'bold 19px sans-serif';
  ctx.fillStyle = '#ffe0b2';
  ctx.textAlign = 'center';
  ctx.fillText('🌿 מחילת הבית שלך (מוגן + לייזר הרחקה)', HOME_BASE.x, HOME_BASE.y - HOME_BASE.radius - 14);
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
        ? `🦹 פורץ למחילה! (רמה ${en.level})`
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

  // ציור קליעים (ארס, לייזר ותותחי זהב)
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
    } else if (p.isMiniCannon) {
      ctx.fillStyle = '#ffd600';
      ctx.strokeStyle = '#ff8f00';
      ctx.lineWidth = 1.5;
      ctx.shadowColor = '#ffd600';
      ctx.shadowBlur = 7;
      ctx.beginPath();
      ctx.arc(p.x, p.y, 4.5, 0, Math.PI * 2);
      ctx.fill();
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
    state.upgrades.hasArmorSuit,
    state.upgrades.hasArmorSuit,
    pStats.goldCannonCount
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

  // ציור הנשר הנדיר בשמי העולם (אם הופיע)
  drawWorldEagle();

  ctx.restore();

  // תאורת לילה
  if (night) {
    ctx.fillStyle = 'rgba(5, 10, 28, 0.36)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }
}

function drawSnakeBody(segments, headRadius, shape, primaryColor, secondaryColor, hasArmor = false, isGoldSuit = false, goldCannonCount = 0) {
  const nowSec = Date.now() * 0.008;
  for (let i = segments.length - 1; i >= 0; i--) {
    const seg = segments[i];
    const t = i / Math.max(1, segments.length - 1);
    const r = headRadius * (1 - t * 0.42);

    ctx.save();
    ctx.translate(seg.x, seg.y);
    if (isGoldSuit) {
      const grad = ctx.createRadialGradient(-r * 0.3, -r * 0.3, r * 0.1, 0, 0, r * 1.15);
      grad.addColorStop(0, '#fffde7');
      grad.addColorStop(0.32, '#ffd600');
      grad.addColorStop(0.75, '#ffb300');
      grad.addColorStop(1, '#c67100');
      ctx.fillStyle = grad;
      ctx.strokeStyle = '#fff59d';
      ctx.lineWidth = 3;
      ctx.shadowColor = 'rgba(255, 214, 0, 0.55)';
      ctx.shadowBlur = 9;
    } else {
      ctx.fillStyle = i % 2 === 0 ? primaryColor : secondaryColor;
      ctx.strokeStyle = hasArmor ? '#ffd600' : 'rgba(0,0,0,0.4)';
      ctx.lineWidth = hasArmor ? 3 : 2;
    }

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

    // נצנוצי זהב נראים לעין על החליפה
    if (isGoldSuit && i % 2 === 0 && Math.sin(nowSec + i * 0.9) > 0.35) {
      ctx.shadowBlur = 0;
      ctx.fillStyle = '#ffffff';
      const gl = Math.max(2.5, r * 0.25);
      ctx.fillRect(-gl * 0.25, -gl, gl * 0.5, gl * 2);
      ctx.fillRect(-gl, -gl * 0.25, gl * 2, gl * 0.5);
    }
    ctx.restore();
  }

  // ציור תותחים קטנים עוזרים המורכבים על חליפת הזהב
  if (isGoldSuit && goldCannonCount > 0 && segments.length > 3) {
    const mounts = getGoldCannonConfigs(goldCannonCount);
    for (const m of mounts) {
      const pt = getGoldCannonMountPoint(segments, headRadius, m.segIndex, m.side);
      ctx.save();
      ctx.translate(pt.x, pt.y);
      ctx.rotate(pt.dir);
      // בסיס התותח הקטן
      ctx.beginPath();
      ctx.arc(0, 0, 5.2, 0, Math.PI * 2);
      ctx.fillStyle = '#5d4037';
      ctx.fill();
      ctx.lineWidth = 1.6;
      ctx.strokeStyle = '#ffd600';
      ctx.stroke();
      // קנה תותח זהוב קטן
      ctx.fillStyle = '#ffca28';
      ctx.fillRect(0, -2.1, 9.5, 4.2);
      ctx.strokeRect(0, -2.1, 9.5, 4.2);
      ctx.fillStyle = '#263238';
      ctx.fillRect(8.5, -1.5, 2, 3);
      ctx.restore();
    }
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

// ציור הנשר הנדיר (1 בכל עולם) עם צל על הקרקע, התראת צלילה וכנפיים נעות
function drawWorldEagle() {
  if (!worldEagle || worldEagle.phase === 'hidden') return;

  const scale = 0.85 + (1.2 - worldEagle.altitude) * 0.28;
  const shadowY = worldEagle.y + 44 * worldEagle.altitude;
  const flap = Math.sin(worldEagle.wingPhase) * 10;

  // צל על הקרקע
  ctx.save();
  ctx.fillStyle = `rgba(0, 0, 0, ${0.42 - worldEagle.altitude * 0.16})`;
  ctx.beginPath();
  ctx.ellipse(worldEagle.x, shadowY, 34 * scale, 16 * scale, worldEagle.angle, 0, Math.PI * 2);
  ctx.fill();

  // סימון אזהרה בזמן צלילת הנשר
  if (worldEagle.swoopDuration > 0 && worldEagle.altitude < 0.72) {
    ctx.strokeStyle = 'rgba(255, 82, 82, 0.75)';
    ctx.lineWidth = 3;
    ctx.setLineDash([7, 5]);
    ctx.beginPath();
    ctx.arc(worldEagle.x, worldEagle.y, 44, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);
  }
  ctx.restore();

  // גוף וכנפי הנשר בשמיים
  const drawY = worldEagle.y - worldEagle.altitude * 44;
  ctx.save();
  ctx.translate(worldEagle.x, drawY);
  ctx.rotate(worldEagle.angle);
  ctx.scale(scale, scale);

  // זנב פרוס
  ctx.fillStyle = '#4e342e';
  ctx.beginPath();
  ctx.moveTo(-14, 0);
  ctx.lineTo(-34, -14);
  ctx.lineTo(-38, 0);
  ctx.lineTo(-34, 14);
  ctx.closePath();
  ctx.fill();

  // כנפיים גדולות מתנפנפות
  ctx.fillStyle = '#5d4037';
  ctx.strokeStyle = '#3e2723';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(8, -6);
  ctx.quadraticCurveTo(-8, -46 - flap, -28, -32 - flap * 0.5);
  ctx.lineTo(-14, -4);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(8, 6);
  ctx.quadraticCurveTo(-8, 46 + flap, -28, 32 + flap * 0.5);
  ctx.lineTo(-14, 4);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // גוף הנשר
  ctx.fillStyle = '#6d4c41';
  ctx.beginPath();
  ctx.ellipse(0, 0, 22, 11, 0, 0, Math.PI * 2);
  ctx.fill();

  // ראש לבן + מקור צהוב מעוקל
  ctx.fillStyle = '#fafafa';
  ctx.beginPath();
  ctx.arc(20, 0, 10, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#ffb300';
  ctx.beginPath();
  ctx.moveTo(27, -4);
  ctx.lineTo(39, 1);
  ctx.lineTo(27, 5);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = '#111';
  ctx.beginPath();
  ctx.arc(23, -3, 2, 0, Math.PI * 2);
  ctx.arc(23, 3, 2, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  ctx.save();
  ctx.font = 'bold 14px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillStyle = worldEagle.following ? '#ffab91' : '#ffe082';
  ctx.fillText(worldEagle.following ? '🦅 נשר עוקב אחריך! התחמק!' : '🦅 נשר בשמיים', worldEagle.x, drawY - 34);
  ctx.restore();
}

// ציור קישוטי טבע אמיתי ייחודיים לכל עולם (יער, סלעים ואבנים, מדבר וכו')
function drawWorldDecorations(theme) {
  for (const d of worldDecorations) {
    ctx.save();
    ctx.translate(d.x, d.y);
    ctx.rotate(d.rot);
    ctx.globalAlpha = 0.72;

    if (theme.decor === 'stones' || theme.decor === 'canyon') {
      // מקבץ אבנים וסלעים טבעיים (מראה עשיר לעולם האבנים והקניון)
      const rockCount = theme.decor === 'stones' ? 3 : 2;
      for (let s = 0; s < rockCount; s++) {
        const ox = s === 0 ? 0 : (s === 1 ? d.size * 0.75 : -d.size * 0.65);
        const oy = s === 0 ? 0 : (s === 1 ? d.size * 0.35 : -d.size * 0.4);
        const sr = s === 0 ? d.size * 0.85 : d.size * 0.5;
        ctx.fillStyle = s % 2 === 0 ? d.color : d.color2;
        ctx.strokeStyle = 'rgba(0,0,0,0.35)';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(ox - sr, oy + sr * 0.25);
        ctx.lineTo(ox - sr * 0.5, oy - sr * 0.75);
        ctx.lineTo(ox + sr * 0.55, oy - sr * 0.65);
        ctx.lineTo(ox + sr, oy + sr * 0.3);
        ctx.lineTo(ox + sr * 0.2, oy + sr * 0.75);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
      }
    } else if (theme.decor === 'forest' || theme.decor === 'savanna') {
      // צמרות עצים, שיחים טבעיים וגזע
      ctx.fillStyle = '#4e342e';
      ctx.beginPath();
      ctx.arc(0, 3, d.size * 0.28, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = d.color;
      ctx.beginPath();
      ctx.arc(0, 0, d.size * 0.9, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = d.color2;
      ctx.beginPath();
      ctx.arc(-d.size * 0.25, -d.size * 0.25, d.size * 0.5, 0, Math.PI * 2);
      ctx.fill();
    } else if (theme.decor === 'desert') {
      if (d.variant === 0) {
        // קקטוס מדברי ירוק
        ctx.fillStyle = '#2e7d32';
        ctx.beginPath();
        ctx.arc(0, 0, d.size * 0.45, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillRect(-d.size * 0.22, -d.size * 0.9, d.size * 0.44, d.size * 1.8);
        ctx.fillRect(-d.size * 0.7, -d.size * 0.25, d.size * 1.4, d.size * 0.35);
      } else {
        // סלע דיונה מדברי
        ctx.fillStyle = d.color;
        ctx.beginPath();
        ctx.ellipse(0, 0, d.size * 0.95, d.size * 0.6, 0, 0, Math.PI * 2);
        ctx.fill();
      }
    } else if (theme.decor === 'ice') {
      // עץ אורן מושלג או גוש קרח
      ctx.fillStyle = d.variant === 0 ? '#b3e5fc' : '#e1f5fe';
      ctx.beginPath();
      ctx.moveTo(0, -d.size);
      ctx.lineTo(d.size * 0.85, d.size * 0.7);
      ctx.lineTo(-d.size * 0.85, d.size * 0.7);
      ctx.closePath();
      ctx.fill();
    } else if (theme.decor === 'lava') {
      // סלעי בזלת כהים וגיצים וולקניים
      ctx.fillStyle = d.variant === 2 ? '#ff6d00' : '#3e2723';
      ctx.beginPath();
      ctx.arc(0, 0, d.size * 0.78, 0, Math.PI * 2);
      ctx.fill();
      if (d.variant === 2) {
        ctx.fillStyle = '#ffd54f';
        ctx.beginPath();
        ctx.arc(0, 0, d.size * 0.35, 0, Math.PI * 2);
        ctx.fill();
      }
    } else if (theme.decor === 'beach') {
      // דקל חוף טרופי או צדף
      ctx.fillStyle = d.color;
      for (let f = 0; f < 5; f++) {
        ctx.save();
        ctx.rotate((f * Math.PI * 2) / 5);
        ctx.beginPath();
        ctx.ellipse(d.size * 0.5, 0, d.size * 0.55, d.size * 0.18, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }
    } else if (theme.decor === 'swamp') {
      // שושנת מים וטחב ביצה
      ctx.fillStyle = '#33691e';
      ctx.beginPath();
      ctx.arc(0, 0, d.size * 0.85, 0.3, Math.PI * 2 - 0.3);
      ctx.lineTo(0, 0);
      ctx.closePath();
      ctx.fill();
      if (d.variant === 1) {
        ctx.fillStyle = '#f48fb1';
        ctx.beginPath();
        ctx.arc(0, 0, d.size * 0.3, 0, Math.PI * 2);
        ctx.fill();
      }
    } else {
      // אחו פרחים והרים: שיחים ופרחים צבעוניים
      ctx.fillStyle = '#4caf50';
      ctx.beginPath();
      ctx.arc(0, 0, d.size * 0.65, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = d.color;
      ctx.beginPath();
      ctx.arc(0, 0, d.size * 0.3, 0, Math.PI * 2);
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

  // עדכון חלונית רמה ושיא בצד המסך (עליית רמה כל 3 עולמות)
  const lvlProg = state.levelProgress || 0;
  document.getElementById('sideLevelNum').textContent = state.level;
  document.getElementById('sideShapeName').textContent = style.name;
  document.getElementById('xpCount').textContent = lvlProg;
  document.getElementById('xpNeed').textContent = '3';
  document.getElementById('levelXpFill').style.width = `${Math.min(100, (lvlProg / 3) * 100)}%`;
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
      title: `👑 חליפת זהב נוצצת (+2 תותחים קטנים)`,
      desc: 'ציפוי זהב אמיתי ומבריק שנראה על הנחש + 60 חיים + 2 תותחים קטנים וחלשים שיורים ועוזרים לך!',
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
      title: `✨👑 שדרוג חליפת זהב ותותחים (רמה ${u.goldSuitLevel || 1}/3)`,
      desc: 'מוסיף עוד תותח קטן עוזר על חליפת הזהב (עד 4 תותחים!), מחזק מעט את הירי ומוסיף +40 חיים!',
      costMoney: 16 * (u.goldSuitLevel || 1),
      costDiamonds: 10 * (u.goldSuitLevel || 1),
      owned: (u.goldSuitLevel || 1) >= 3,
      locked: !u.hasArmorSuit,
      lockedLabel: 'קנה קודם חליפת זהב',
      action: () => {
        u.goldSuitLevel = (u.goldSuitLevel || 1) + 1;
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
      title: `🌿 נחש עוזר שומר על המחילה (יש לך: ${u.guardSnakes})`,
      desc: 'שומר על מחילת הבית שלך כדי שנחשים פורצים לא יגנבו כסף!',
      costMoney: 8 + u.guardSnakes * 8,
      costDiamonds: 4,
      action: () => {
        u.guardSnakes++;
        rebuildHelpers();
      }
    },
    {
      title: `⬆️🛡️ שדרוג נחשים שומרים (רמה ${u.guardLevel || 1})`,
      desc: 'מגדיל את מהירות, כוח וטווח ההגנה של השומרים סביב המחילה!',
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

// ============================================================================
// מערכת קרבות 1 נגד 1 בסריקת ברקוד (QR Code PvP Duel)
// ============================================================================
const PUBLIC_GAME_URL = 'https://yardenrimon.github.io/beeri-snake-game/';
const DUEL_BROKERS = ['wss://broker.emqx.io:8084/mqtt', 'wss://broker.hivemq.com:8884/mqtt'];
const DUEL_WIDTH = 1500;
const DUEL_HEIGHT = 1000;
const DUEL_MAX_HP = 200;
const DUEL_NAME_KEY = 'beeri_snake_duel_name_v1';

const duel = {
  active: false,
  roundOver: false,
  role: 'host',
  roomCode: '',
  myId: 'p_' + Math.random().toString(36).slice(2, 10),
  myName: localStorage.getItem(DUEL_NAME_KEY) || 'בארי',
  oppId: '',
  oppName: 'יריב',
  oppProfile: null,
  myHp: DUEL_MAX_HP,
  oppHp: DUEL_MAX_HP,
  myWins: 0,
  oppWins: 0,
  arenaSeed: 1,
  arenaDecor: [],
  client: null,
  brokerIndex: 0,
  connectTimer: null,
  joinInterval: null,
  syncInterval: null,
  whipPulseFrames: 0,
  lastOppSeen: 0,
  oppHitGraceUntil: 0,
  savedSoloPlayer: null,
  projectiles: [],
  opponent: {
    x: 1180,
    y: 500,
    targetX: 1180,
    targetY: 500,
    angle: Math.PI,
    targetAngle: Math.PI,
    jumpZ: 0,
    targetZ: 0,
    biteAnim: 0,
    tailWhipEffect: null,
    segments: []
  },
  qrStream: null,
  qrScanRaf: null,
  qrCanvasHelper: null
};

function getMyDuelProfile() {
  const style = LEVEL_STYLES[(state.level - 1) % LEVEL_STYLES.length];
  const stats = getPlayerStats();
  return {
    shape: style.shape,
    primary: style.primary,
    secondary: style.secondary,
    hasArmorSuit: Boolean(state.upgrades.hasArmorSuit),
    goldCannonCount: stats.goldCannonCount || 0,
    hasArtificialTeeth: Boolean(state.upgrades.hasArtificialTeeth),
    hasLaserSuit: Boolean(state.upgrades.hasLaserSuit)
  };
}

function getDuelRoomUrl(code) {
  return `${PUBLIC_GAME_URL}?duel=${code}`;
}

function setDuelStatus(text) {
  const el = document.getElementById('duelStatusText');
  if (el) el.textContent = text;
}

function renderDuelQr(roomCode) {
  const canvasEl = document.getElementById('duelQrCanvas');
  const codeBadge = document.getElementById('duelRoomCodeDisplay');
  if (codeBadge) codeBadge.textContent = roomCode;
  if (!canvasEl) return;

  const c = canvasEl.getContext('2d');
  c.fillStyle = '#ffffff';
  c.fillRect(0, 0, canvasEl.width, canvasEl.height);

  if (typeof qrcode === 'undefined') {
    c.fillStyle = '#333';
    c.font = 'bold 14px sans-serif';
    c.textAlign = 'center';
    c.fillText(`קוד קרב: ${roomCode}`, canvasEl.width / 2, canvasEl.height / 2);
    return;
  }

  const qr = qrcode(0, 'M');
  qr.addData(getDuelRoomUrl(roomCode));
  qr.make();
  const count = qr.getModuleCount();
  const margin = 12;
  const cellSize = (canvasEl.width - margin * 2) / count;
  c.fillStyle = '#111111';
  for (let r = 0; r < count; r++) {
    for (let col = 0; col < count; col++) {
      if (qr.isDark(r, col)) {
        c.fillRect(
          Math.floor(margin + col * cellSize),
          Math.floor(margin + r * cellSize),
          Math.ceil(cellSize),
          Math.ceil(cellSize)
        );
      }
    }
  }
}

function switchDuelTab(mode) {
  const isHost = mode === 'host';
  document.getElementById('tabHostDuel').classList.toggle('active', isHost);
  document.getElementById('tabJoinDuel').classList.toggle('active', !isHost);
  document.getElementById('duelHostPanel').classList.toggle('hidden', !isHost);
  document.getElementById('duelJoinPanel').classList.toggle('hidden', isHost);
  if (isHost) {
    stopQrScanner();
  }
}

function disconnectDuelTransport() {
  if (duel.connectTimer) {
    clearTimeout(duel.connectTimer);
    duel.connectTimer = null;
  }
  if (duel.joinInterval) {
    clearInterval(duel.joinInterval);
    duel.joinInterval = null;
  }
  if (duel.syncInterval) {
    clearInterval(duel.syncInterval);
    duel.syncInterval = null;
  }
  if (duel.client) {
    try { duel.client.end(true); } catch (_) {}
    duel.client = null;
  }
}

function publishDuel(payload) {
  if (!duel.client || !duel.client.connected || !duel.roomCode) return;
  try {
    duel.client.publish(`beeri-snake-pvp/v1/room-${duel.roomCode}`, JSON.stringify(payload), { qos: 0 });
  } catch (_) {}
}

function connectDuelRoom(roomCode, role, brokerIdx = 0) {
  disconnectDuelTransport();
  duel.role = role;
  duel.roomCode = roomCode;
  duel.brokerIndex = brokerIdx;

  if (role === 'host') {
    renderDuelQr(roomCode);
  }

  if (typeof mqtt === 'undefined') {
    setDuelStatus('⚠️ נדרש חיבור לאינטרנט כדי לשחק קרב חי מול חבר.');
    return;
  }

  setDuelStatus(role === 'host'
    ? `⏳ מתחבר לשרת הקרב (קוד ${roomCode})...`
    : `⏳ מתחבר לחדר קרב ${roomCode}...`);

  const brokerUrl = DUEL_BROKERS[brokerIdx];
  const client = mqtt.connect(brokerUrl, {
    clientId: `beeri_${duel.myId}_${Math.floor(Math.random() * 9999)}`,
    clean: true,
    connectTimeout: 4500,
    reconnectPeriod: 0
  });
  duel.client = client;

  let established = false;
  duel.connectTimer = setTimeout(() => {
    if (!established && brokerIdx + 1 < DUEL_BROKERS.length) {
      connectDuelRoom(roomCode, role, brokerIdx + 1);
    } else if (!established) {
      setDuelStatus('❌ לא הצלחנו להתחבר כרגע. בדקו חיבור אינטרנט ונסו שוב.');
    }
  }, 4500);

  client.on('connect', () => {
    established = true;
    if (duel.connectTimer) {
      clearTimeout(duel.connectTimer);
      duel.connectTimer = null;
    }
    const topic = `beeri-snake-pvp/v1/room-${roomCode}`;
    client.subscribe(topic, () => {
      if (role === 'host') {
        setDuelStatus(`🟢 ממתין ליריב שיסרוק את הברקוד (קוד ${roomCode})...`);
      } else {
        setDuelStatus(`🟢 מחובר! מצטרף לקרב בחדר ${roomCode}...`);
        const sendJoin = () => {
          publishDuel({ t: 'join', from: duel.myId, name: duel.myName, profile: getMyDuelProfile() });
        };
        sendJoin();
        duel.joinInterval = setInterval(sendJoin, 1000);
      }
    });
  });

  client.on('message', (_, raw) => {
    try {
      const msg = JSON.parse(raw.toString());
      if (!msg || msg.from === duel.myId) return;
      handleDuelMessage(msg);
    } catch (_) {}
  });
}

function handleDuelMessage(msg) {
  if (msg.t === 'join' && duel.role === 'host') {
    duel.oppId = msg.from;
    duel.oppName = msg.name || 'שחקן 2';
    duel.oppProfile = msg.profile || getMyDuelProfile();
    if (!duel.active) {
      duel.arenaSeed = Math.floor(Math.random() * 100000);
      beginDuelMatch();
    }
    const startMsg = {
      t: 'start',
      from: duel.myId,
      name: duel.myName,
      profile: getMyDuelProfile(),
      arenaSeed: duel.arenaSeed
    };
    publishDuel(startMsg);
    setTimeout(() => publishDuel(startMsg), 350);
    return;
  }

  if (msg.t === 'start' && duel.role === 'guest' && !duel.active) {
    if (duel.joinInterval) {
      clearInterval(duel.joinInterval);
      duel.joinInterval = null;
    }
    duel.oppId = msg.from;
    duel.oppName = msg.name || 'מארח';
    duel.oppProfile = msg.profile || getMyDuelProfile();
    duel.arenaSeed = msg.arenaSeed || 1;
    beginDuelMatch();
    return;
  }

  if (!duel.active) return;

  if (msg.t === 's') {
    duel.lastOppSeen = Date.now();
    duel.opponent.targetX = Number(msg.x) || duel.opponent.targetX;
    duel.opponent.targetY = Number(msg.y) || duel.opponent.targetY;
    duel.opponent.targetAngle = Number(msg.a) || 0;
    duel.opponent.targetZ = Number(msg.z) || 0;
    duel.opponent.biteAnim = msg.bite ? 10 : Math.max(0, duel.opponent.biteAnim - 1);
    if (typeof msg.hp === 'number' && !duel.roundOver) {
      const incomingHp = Math.max(0, Math.min(DUEL_MAX_HP, msg.hp));
      if (incomingHp <= duel.oppHp || Date.now() > duel.oppHitGraceUntil) {
        duel.oppHp = incomingHp;
        updateDuelHUD();
      }
    }
    if (msg.whip && !duel.opponent.tailWhipEffect) {
      duel.opponent.tailWhipEffect = {
        x: duel.opponent.x,
        y: duel.opponent.y,
        radius: 130,
        life: 14,
        maxLife: 14
      };
    }
  } else if (msg.t === 'shot') {
    duel.projectiles.push({
      owner: 'opp',
      x: msg.x,
      y: msg.y,
      vx: msg.vx,
      vy: msg.vy,
      isLaser: Boolean(msg.isLaser),
      isMiniCannon: Boolean(msg.isMiniCannon),
      damage: msg.dmg || 16,
      life: 55
    });
  } else if (msg.t === 'hit') {
    if (duel.roundOver || player.jumpZ >= 8 || player.invulnerableTimer > 0) return;
    const dmg = Math.max(1, Number(msg.dmg) || 12);
    duel.myHp = Math.max(0, duel.myHp - dmg);
    player.x = Math.max(30, Math.min(DUEL_WIDTH - 30, player.x + (Number(msg.kx) || 0)));
    player.y = Math.max(30, Math.min(DUEL_HEIGHT - 30, player.y + (Number(msg.ky) || 0)));
    player.invulnerableTimer = 4;
    spawnParticles(player.x, player.y, '#ff5252', 12);
    addFloatingText(player.x, player.y - 30, `-${dmg} ❤️`, '#ff5252');
    updateDuelHUD();
    sendDuelState();
    if (duel.myHp <= 0) {
      publishDuel({ t: 'ko', from: duel.myId });
      finishDuelRound(false);
    }
  } else if (msg.t === 'ko') {
    if (!duel.roundOver) {
      duel.oppHp = 0;
      finishDuelRound(true);
    }
  } else if (msg.t === 'rematch') {
    document.getElementById('duelResultModal').classList.add('hidden');
    resetDuelRound();
  } else if (msg.t === 'leave') {
    showToast(`🚪 ${duel.oppName} יצא מהקרב.`);
    leaveDuel(false);
  }
}

function generateDuelArenaDecor(seedInput) {
  let seed = (seedInput * 2654435761) >>> 0;
  function rand() {
    seed = (seed * 1664525 + 1013904223) >>> 0;
    return seed / 4294967296;
  }
  const items = [];
  const colors = ['#43a047', '#66bb6a', '#ffee58', '#90a4ae'];
  for (let i = 0; i < 42; i++) {
    items.push({
      x: 90 + rand() * (DUEL_WIDTH - 180),
      y: 90 + rand() * (DUEL_HEIGHT - 180),
      r: 8 + rand() * 14,
      color: colors[Math.floor(rand() * colors.length)]
    });
  }
  return items;
}

function beginDuelMatch() {
  stopQrScanner();
  document.getElementById('duelModal').classList.add('hidden');
  document.getElementById('shopModal').classList.add('hidden');
  document.getElementById('questsModal').classList.add('hidden');
  document.getElementById('recordsModal').classList.add('hidden');

  if (!duel.savedSoloPlayer) {
    duel.savedSoloPlayer = {
      x: player.x,
      y: player.y,
      angle: player.angle,
      hp: player.hp,
      maxHp: player.maxHp,
      segments: player.segments.map((s) => ({ x: s.x, y: s.y }))
    };
  }

  duel.active = true;
  duel.myWins = 0;
  duel.oppWins = 0;
  duel.lastOppSeen = Date.now();
  duel.arenaDecor = generateDuelArenaDecor(duel.arenaSeed);

  document.getElementById('hud').classList.add('hidden');
  document.getElementById('levelSideCard').classList.add('hidden');
  document.getElementById('controlsHint').classList.add('hidden');
  document.getElementById('duelHud').classList.remove('hidden');

  try {
    if (window.location.search.includes('duel=')) {
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  } catch (_) {}

  resetDuelRound();
  if (duel.syncInterval) clearInterval(duel.syncInterval);
  duel.syncInterval = setInterval(sendDuelState, 50);
}

function resetDuelRound() {
  duel.roundOver = false;
  duel.myHp = DUEL_MAX_HP;
  duel.oppHp = DUEL_MAX_HP;
  duel.projectiles = [];
  particles = [];
  floatingTexts = [];
  tailWhipEffect = null;

  const isHost = duel.role === 'host';
  player.x = isHost ? 320 : DUEL_WIDTH - 320;
  player.y = DUEL_HEIGHT / 2;
  player.angle = isHost ? 0 : Math.PI;
  player.jumpZ = 0;
  player.jumpVz = 0;
  player.invulnerableTimer = 45;
  player.segments = [];
  for (let i = 0; i < 14; i++) {
    player.segments.push({ x: player.x - Math.cos(player.angle) * i * 13, y: player.y });
  }

  const ox = isHost ? DUEL_WIDTH - 320 : 320;
  const oAng = isHost ? Math.PI : 0;
  duel.opponent = {
    x: ox,
    y: DUEL_HEIGHT / 2,
    targetX: ox,
    targetY: DUEL_HEIGHT / 2,
    angle: oAng,
    targetAngle: oAng,
    jumpZ: 0,
    targetZ: 0,
    biteAnim: 0,
    tailWhipEffect: null,
    segments: []
  };
  for (let i = 0; i < 14; i++) {
    duel.opponent.segments.push({ x: ox - Math.cos(oAng) * i * 13, y: duel.opponent.y });
  }

  updateDuelHUD();
  sendDuelState();
  showToast(`⚔️ הקרב התחיל! ${duel.myName} נגד ${duel.oppName}!`);
}

function updateDuelHUD() {
  document.getElementById('duelMyName').textContent = duel.myName;
  document.getElementById('duelOppName').textContent = duel.oppName;
  document.getElementById('duelMyHpText').textContent = `${Math.ceil(duel.myHp)}/${DUEL_MAX_HP}`;
  document.getElementById('duelOppHpText').textContent = `${Math.ceil(duel.oppHp)}/${DUEL_MAX_HP}`;
  document.getElementById('duelMyHpFill').style.width = `${Math.max(0, (duel.myHp / DUEL_MAX_HP) * 100)}%`;
  document.getElementById('duelOppHpFill').style.width = `${Math.max(0, (duel.oppHp / DUEL_MAX_HP) * 100)}%`;
  document.getElementById('duelScoreText').textContent = `⚔️ ${duel.myWins} : ${duel.oppWins}`;
}

function sendDuelState() {
  if (!duel.active) return;
  publishDuel({
    t: 's',
    from: duel.myId,
    x: Math.round(player.x),
    y: Math.round(player.y),
    a: Number(player.angle.toFixed(2)),
    z: Math.round(player.jumpZ),
    hp: Math.round(duel.myHp),
    bite: player.biteAnim > 0,
    whip: duel.whipPulseFrames > 0
  });
  if (duel.whipPulseFrames > 0) duel.whipPulseFrames = 0;
}

function sendDuelHit(dmg, kx, ky, label) {
  duel.oppHp = Math.max(0, duel.oppHp - dmg);
  duel.oppHitGraceUntil = Date.now() + 300;
  spawnParticles(duel.opponent.x, duel.opponent.y, '#ffd600', 10);
  addFloatingText(duel.opponent.x, duel.opponent.y - 26, `${label} -${dmg}`, '#ffd54f');
  updateDuelHUD();
  publishDuel({
    t: 'hit',
    from: duel.myId,
    dmg,
    kx: Math.round(kx),
    ky: Math.round(ky)
  });
}

function fireDuelProjectile(isLaser) {
  let targetAngle = player.angle;
  if (!isTouchMode && mouse.activeOnDesktop) {
    targetAngle = Math.atan2(mouse.worldY - player.y, mouse.worldX - player.x);
  } else {
    const angToOpp = Math.atan2(duel.opponent.y - player.y, duel.opponent.x - player.x);
    let diff = angToOpp - player.angle;
    while (diff > Math.PI) diff -= Math.PI * 2;
    while (diff < -Math.PI) diff += Math.PI * 2;
    if (Math.abs(diff) < 0.85) targetAngle = angToOpp;
  }

  const spd = isLaser ? 13 : 9.5;
  const dmg = isLaser ? 20 : 16;
  const proj = {
    owner: 'me',
    x: player.x + Math.cos(targetAngle) * 20,
    y: player.y + Math.sin(targetAngle) * 20,
    vx: Math.cos(targetAngle) * spd,
    vy: Math.sin(targetAngle) * spd,
    isLaser,
    isMiniCannon: false,
    damage: dmg,
    life: 55
  };
  duel.projectiles.push(proj);
  publishDuel({ t: 'shot', from: duel.myId, x: proj.x, y: proj.y, vx: proj.vx, vy: proj.vy, isLaser, isMiniCannon: false, dmg });
}

function finishDuelRound(iWon) {
  if (duel.roundOver) return;
  duel.roundOver = true;
  if (iWon) duel.myWins++;
  else duel.oppWins++;
  updateDuelHUD();

  document.getElementById('duelResultTitle').textContent = iWon
    ? `🏆 ${duel.myName} ניצח בקרב!`
    : `💥 ${duel.oppName} ניצח בסיבוב הזה!`;
  document.getElementById('duelResultSubtitle').textContent = iWon
    ? 'כל הכבוד! רוצה סיבוב נוסף מול היריב?'
    : 'כמעט! לחצו על סיבוב נוסף לנקמה מהירה!';
  document.getElementById('duelResultScore').textContent = `${duel.myName} ${duel.myWins} : ${duel.oppWins} ${duel.oppName}`;
  document.getElementById('duelResultModal').classList.remove('hidden');
}

function leaveDuel(notifyPeer = true) {
  if (notifyPeer && duel.active) {
    publishDuel({ t: 'leave', from: duel.myId });
  }
  disconnectDuelTransport();
  stopQrScanner();
  duel.active = false;
  duel.roundOver = false;

  document.getElementById('duelHud').classList.add('hidden');
  document.getElementById('duelResultModal').classList.add('hidden');
  document.getElementById('hud').classList.remove('hidden');
  document.getElementById('levelSideCard').classList.remove('hidden');
  document.getElementById('controlsHint').classList.remove('hidden');

  if (duel.savedSoloPlayer) {
    player.x = duel.savedSoloPlayer.x;
    player.y = duel.savedSoloPlayer.y;
    player.angle = duel.savedSoloPlayer.angle;
    player.hp = duel.savedSoloPlayer.hp;
    player.maxHp = duel.savedSoloPlayer.maxHp;
    player.segments = duel.savedSoloPlayer.segments;
    duel.savedSoloPlayer = null;
  }
  updateHUD();
  showToast('🌿 חזרת למשחק הרגיל!');
}

function updateDuel() {
  const radius = 19;
  camera.zoom = getCameraZoom();

  if (player.biteCooldown > 0) player.biteCooldown--;
  if (player.biteAnim > 0) player.biteAnim--;
  if (player.tailWhipCooldown > 0) player.tailWhipCooldown--;
  if (player.shootCooldown > 0) player.shootCooldown--;
  if (player.invulnerableTimer > 0) player.invulnerableTimer--;
  if (tailWhipEffect) {
    tailWhipEffect.life--;
    if (tailWhipEffect.life <= 0) tailWhipEffect = null;
  }
  if (duel.opponent.tailWhipEffect) {
    duel.opponent.tailWhipEffect.life--;
    if (duel.opponent.tailWhipEffect.life <= 0) duel.opponent.tailWhipEffect = null;
  }

  mouse.worldX = camera.x + mouse.x / camera.zoom;
  mouse.worldY = camera.y + mouse.y / camera.zoom;

  if (player.jumpZ > 0 || player.jumpVz !== 0) {
    player.jumpZ += player.jumpVz;
    player.jumpVz -= 0.55;
    if (player.jumpZ <= 0) {
      player.jumpZ = 0;
      player.jumpVz = 0;
    }
  }

  applyPlayerMovementInput(5.6);
  player.x = Math.max(radius + 20, Math.min(DUEL_WIDTH - radius - 20, player.x + Math.cos(player.angle) * player.speed));
  player.y = Math.max(radius + 20, Math.min(DUEL_HEIGHT - radius - 20, player.y + Math.sin(player.angle) * player.speed));
  updateSegments(player.segments, player.x, player.y, radius * 0.72);

  if (mouse.down && !isTouchMode) triggerShoot();

  // תותחי חליפת זהב חלשים בזירת הקרב
  if (state.upgrades.hasArmorSuit && !duel.roundOver) {
    const pStats = getPlayerStats();
    const configs = getGoldCannonConfigs(pStats.goldCannonCount);
    for (let c = 0; c < configs.length; c++) {
      if (goldCannonCooldowns[c] > 0) {
        goldCannonCooldowns[c]--;
        continue;
      }
      const mount = getGoldCannonMountPoint(player.segments, radius, configs[c].segIndex, configs[c].side);
      if (Math.hypot(duel.opponent.x - mount.x, duel.opponent.y - mount.y) < 360) {
        const aim = Math.atan2(duel.opponent.y - mount.y, duel.opponent.x - mount.x);
        const proj = {
          owner: 'me',
          x: mount.x,
          y: mount.y,
          vx: Math.cos(aim) * 9.5,
          vy: Math.sin(aim) * 9.5,
          isLaser: false,
          isMiniCannon: true,
          damage: 5,
          life: 40
        };
        duel.projectiles.push(proj);
        publishDuel({ t: 'shot', from: duel.myId, x: proj.x, y: proj.y, vx: proj.vx, vy: proj.vy, isLaser: false, isMiniCannon: true, dmg: 5 });
        goldCannonCooldowns[c] = 68 + (c % 2) * 12;
      }
    }
  }

  // החלקת תנועת היריב
  const opp = duel.opponent;
  opp.x += (opp.targetX - opp.x) * 0.32;
  opp.y += (opp.targetY - opp.y) * 0.32;
  opp.jumpZ += (opp.targetZ - opp.jumpZ) * 0.35;
  let angDiff = opp.targetAngle - opp.angle;
  while (angDiff > Math.PI) angDiff -= Math.PI * 2;
  while (angDiff < -Math.PI) angDiff += Math.PI * 2;
  opp.angle += angDiff * 0.35;
  updateSegments(opp.segments, opp.x, opp.y, radius * 0.72);

  // עדכון קליעים בקרב
  for (let i = duel.projectiles.length - 1; i >= 0; i--) {
    const p = duel.projectiles[i];
    p.x += p.vx;
    p.y += p.vy;
    p.life--;

    if (p.owner === 'me' && !duel.roundOver && opp.jumpZ < 8) {
      if (Math.hypot(p.x - opp.x, p.y - opp.y) < radius + 12) {
        const lbl = p.isMiniCannon ? '🟡 תותח!' : (p.isLaser ? '⚡ לייזר!' : '🧪 ארס!');
        sendDuelHit(p.damage, p.vx * 1.4, p.vy * 1.4, lbl);
        p.life = 0;
      }
    } else if (p.owner === 'opp' && player.jumpZ < 8) {
      if (Math.hypot(p.x - player.x, p.y - player.y) < radius + 10) {
        p.life = 0;
      }
    }
    if (p.life <= 0) duel.projectiles.splice(i, 1);
  }

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

  const viewW = canvas.width / camera.zoom;
  const viewH = canvas.height / camera.zoom;
  camera.x = Math.max(0, Math.min(Math.max(0, DUEL_WIDTH - viewW), player.x - viewW / 2));
  camera.y = Math.max(0, Math.min(Math.max(0, DUEL_HEIGHT - viewH), player.y - viewH / 2));
}

function drawDuel() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  const night = isNightTime();
  const radius = 19;

  ctx.save();
  ctx.scale(camera.zoom, camera.zoom);
  ctx.translate(-camera.x, -camera.y);

  // זירת טבע ירוקה לקרב 1 נגד 1
  ctx.fillStyle = night ? '#112217' : '#1b3622';
  ctx.fillRect(0, 0, DUEL_WIDTH, DUEL_HEIGHT);

  ctx.strokeStyle = 'rgba(236, 64, 122, 0.75)';
  ctx.lineWidth = 6;
  ctx.strokeRect(14, 14, DUEL_WIDTH - 28, DUEL_HEIGHT - 28);

  for (const d of duel.arenaDecor) {
    ctx.save();
    ctx.globalAlpha = 0.5;
    ctx.fillStyle = d.color;
    ctx.beginPath();
    ctx.arc(d.x, d.y, d.r, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  // קליעים בזירה
  for (const p of duel.projectiles) {
    ctx.save();
    if (p.isLaser) {
      ctx.strokeStyle = p.owner === 'me' ? '#ff1744' : '#ff9100';
      ctx.lineWidth = 5;
      ctx.beginPath();
      ctx.moveTo(p.x, p.y);
      ctx.lineTo(p.x - p.vx * 1.8, p.y - p.vy * 1.8);
      ctx.stroke();
    } else if (p.isMiniCannon) {
      ctx.fillStyle = '#ffd600';
      ctx.beginPath();
      ctx.arc(p.x, p.y, 4.5, 0, Math.PI * 2);
      ctx.fill();
    } else {
      ctx.fillStyle = p.owner === 'me' ? '#76ff03' : '#e040fb';
      ctx.beginPath();
      ctx.arc(p.x, p.y, 8, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  // ציור נחש היריב
  const opp = duel.opponent;
  const opProf = duel.oppProfile || LEVEL_STYLES[1];
  if (opp.jumpZ > 0) {
    ctx.fillStyle = 'rgba(0,0,0,0.35)';
    ctx.beginPath();
    ctx.arc(opp.x, opp.y + 10, radius, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.save();
  ctx.translate(0, -opp.jumpZ * 2.2);
  drawSnakeBody(opp.segments, radius, opProf.shape || 'diamond', opProf.primary || '#ff5252', opProf.secondary || '#ff8a80', Boolean(opProf.hasArmorSuit), Boolean(opProf.hasArmorSuit), opProf.goldCannonCount || 0);
  drawSnakeEyes(opp.x, opp.y, opp.angle, radius, Boolean(opProf.hasArtificialTeeth || opp.biteAnim > 0), Boolean(opProf.hasLaserSuit));
  ctx.restore();

  // תג שם ומד חיים מעל היריב
  ctx.fillStyle = 'rgba(0,0,0,0.65)';
  ctx.fillRect(opp.x - 36, opp.y - 42, 72, 7);
  ctx.fillStyle = '#ff5252';
  ctx.fillRect(opp.x - 36, opp.y - 42, 72 * Math.max(0, duel.oppHp / DUEL_MAX_HP), 7);
  ctx.font = 'bold 14px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillStyle = '#ff8a80';
  ctx.fillText(duel.oppName, opp.x, opp.y - 48);

  if (opp.tailWhipEffect) {
    const prog = 1 - opp.tailWhipEffect.life / opp.tailWhipEffect.maxLife;
    ctx.save();
    ctx.strokeStyle = `rgba(255, 82, 82, ${1 - prog})`;
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(opp.tailWhipEffect.x, opp.tailWhipEffect.y, opp.tailWhipEffect.radius * (0.4 + prog * 0.6), 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }

  // ציור נחש השחקן
  const myProf = getMyDuelProfile();
  if (player.jumpZ > 0) {
    ctx.fillStyle = 'rgba(0,0,0,0.35)';
    ctx.beginPath();
    ctx.arc(player.x, player.y + 10, radius, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.save();
  ctx.translate(0, -player.jumpZ * 2.2);
  drawSnakeBody(player.segments, radius, myProf.shape, myProf.primary, myProf.secondary, myProf.hasArmorSuit, myProf.hasArmorSuit, myProf.goldCannonCount);
  drawSnakeEyes(player.x, player.y, player.angle, radius, myProf.hasArtificialTeeth || player.biteAnim > 0, myProf.hasLaserSuit);
  ctx.restore();

  ctx.fillStyle = 'rgba(0,0,0,0.65)';
  ctx.fillRect(player.x - 36, player.y - 42, 72, 7);
  ctx.fillStyle = '#00e676';
  ctx.fillRect(player.x - 36, player.y - 42, 72 * Math.max(0, duel.myHp / DUEL_MAX_HP), 7);
  ctx.font = 'bold 14px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillStyle = '#b9f6ca';
  ctx.fillText(`${duel.myName} (אתה)`, player.x, player.y - 48);

  if (tailWhipEffect) {
    const progress = 1 - tailWhipEffect.life / tailWhipEffect.maxLife;
    ctx.save();
    ctx.strokeStyle = `rgba(255, 167, 38, ${1 - progress})`;
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.arc(tailWhipEffect.x, tailWhipEffect.y, tailWhipEffect.radius * (0.4 + progress * 0.65), 0, Math.PI * 2);
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

  // חץ כיוון ליריב אם הוא מחוץ למסך
  const oppSX = (opp.x - camera.x) * camera.zoom;
  const oppSY = (opp.y - camera.y) * camera.zoom;
  if (oppSX < 20 || oppSX > canvas.width - 20 || oppSY < 60 || oppSY > canvas.height - 20) {
    const cx = canvas.width / 2;
    const cy = canvas.height / 2;
    const ang = Math.atan2(oppSY - cy, oppSX - cx);
    const ex = Math.max(40, Math.min(canvas.width - 40, cx + Math.cos(ang) * (canvas.width * 0.4)));
    const ey = Math.max(95, Math.min(canvas.height - 140, cy + Math.sin(ang) * (canvas.height * 0.35)));
    ctx.save();
    ctx.fillStyle = 'rgba(236, 64, 122, 0.9)';
    ctx.beginPath();
    ctx.arc(ex, ey, 16, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 14px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('⚔️', ex, ey + 5);
    ctx.restore();
  }
}

function extractDuelCodeFromText(text) {
  if (!text) return null;
  const urlMatch = String(text).match(/[?&]duel=(\d{4})/);
  if (urlMatch) return urlMatch[1];
  const digitsMatch = String(text).trim().match(/^(\d{4})$/);
  return digitsMatch ? digitsMatch[1] : null;
}

function stopQrScanner() {
  if (duel.qrScanRaf) {
    cancelAnimationFrame(duel.qrScanRaf);
    duel.qrScanRaf = null;
  }
  if (duel.qrStream) {
    duel.qrStream.getTracks().forEach((t) => t.stop());
    duel.qrStream = null;
  }
  const wrap = document.getElementById('qrCameraWrap');
  const startBtn = document.getElementById('startQrScanBtn');
  const stopBtn = document.getElementById('stopQrScanBtn');
  if (wrap) wrap.classList.add('hidden');
  if (startBtn) startBtn.classList.remove('hidden');
  if (stopBtn) stopBtn.classList.add('hidden');
}

async function startQrScanner() {
  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
    setDuelStatus('⚠️ הדפדפן לא תומך במצלמה ישירה – אפשר לסרוק במצלמת הטלפון הרגילה או להקליד קוד!');
    return;
  }
  stopQrScanner();
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: 'environment' } }, audio: false });
    duel.qrStream = stream;
    const video = document.getElementById('qrVideo');
    video.srcObject = stream;
    await video.play();

    document.getElementById('qrCameraWrap').classList.remove('hidden');
    document.getElementById('startQrScanBtn').classList.add('hidden');
    document.getElementById('stopQrScanBtn').classList.remove('hidden');
    setDuelStatus('📷 כוונו את המצלמה אל הברקוד של היריב...');

    const detector = ('BarcodeDetector' in window) ? new window.BarcodeDetector({ formats: ['qr_code'] }) : null;
    if (!duel.qrCanvasHelper) duel.qrCanvasHelper = document.createElement('canvas');
    let lastTick = 0;

    const scanLoop = async (ts) => {
      if (!duel.qrStream) return;
      if (ts - lastTick >= 120 && video.readyState >= 2) {
        lastTick = ts;
        let foundRaw = null;
        if (detector) {
          try {
            const res = await detector.detect(video);
            if (res && res.length) foundRaw = res[0].rawValue;
          } catch (_) {}
        }
        if (!foundRaw && typeof jsQR !== 'undefined' && video.videoWidth > 0) {
          const hc = duel.qrCanvasHelper;
          hc.width = video.videoWidth;
          hc.height = video.videoHeight;
          const hctx = hc.getContext('2d', { willReadFrequently: true });
          hctx.drawImage(video, 0, 0, hc.width, hc.height);
          const imgData = hctx.getImageData(0, 0, hc.width, hc.height);
          const qrRes = jsQR(imgData.data, hc.width, hc.height);
          if (qrRes && qrRes.data) foundRaw = qrRes.data;
        }
        const code = extractDuelCodeFromText(foundRaw);
        if (code) {
          stopQrScanner();
          document.getElementById('duelJoinCodeInput').value = code;
          showToast(`📷 הברקוד נסרק בהצלחה! מצטרף לחדר ${code}...`);
          connectDuelRoom(code, 'guest');
          return;
        }
      }
      duel.qrScanRaf = requestAnimationFrame(scanLoop);
    };
    duel.qrScanRaf = requestAnimationFrame(scanLoop);
  } catch (err) {
    setDuelStatus('❌ לא ניתנה גישה למצלמה – סרקו במצלמת הטלפון הרגילה או הקלידו את קוד החדר.');
  }
}

function openDuelModal(defaultTab = 'host', prefillCode = '') {
  document.getElementById('duelNameInput').value = duel.myName;
  document.getElementById('duelModal').classList.remove('hidden');
  if (defaultTab === 'join') {
    switchDuelTab('join');
    if (prefillCode) {
      document.getElementById('duelJoinCodeInput').value = prefillCode;
      connectDuelRoom(prefillCode, 'guest');
    } else {
      setDuelStatus('סרוק את הברקוד של היריב או הקלד קוד חדר בן 4 ספרות.');
    }
  } else {
    switchDuelTab('host');
    const code = duel.roomCode || String(1000 + Math.floor(Math.random() * 9000));
    connectDuelRoom(code, 'host');
  }
}

document.getElementById('duelBtn').addEventListener('click', () => openDuelModal('host'));
document.getElementById('closeDuelBtn').addEventListener('click', () => {
  stopQrScanner();
  if (!duel.active) disconnectDuelTransport();
  document.getElementById('duelModal').classList.add('hidden');
});
document.getElementById('duelNameInput').addEventListener('input', (e) => {
  const val = e.target.value.trim();
  duel.myName = val || 'שחקן';
  localStorage.setItem(DUEL_NAME_KEY, duel.myName);
});
document.getElementById('tabHostDuel').addEventListener('click', () => {
  switchDuelTab('host');
  const code = String(1000 + Math.floor(Math.random() * 9000));
  connectDuelRoom(code, 'host');
});
document.getElementById('tabJoinDuel').addEventListener('click', () => {
  disconnectDuelTransport();
  switchDuelTab('join');
  setDuelStatus('סרוק ברקוד עם המצלמה או הקלד קוד בן 4 ספרות מהמסך השני.');
});
document.getElementById('newDuelRoomBtn').addEventListener('click', () => {
  const code = String(1000 + Math.floor(Math.random() * 9000));
  connectDuelRoom(code, 'host');
});
document.getElementById('copyDuelLinkBtn').addEventListener('click', async () => {
  if (!duel.roomCode) return;
  const link = getDuelRoomUrl(duel.roomCode);
  try {
    await navigator.clipboard.writeText(link);
    showToast('📋 הקישור לקרב הועתק!');
  } catch (_) {
    showToast(`קוד הקרב: ${duel.roomCode}`);
  }
});
document.getElementById('shareDuelWaBtn').addEventListener('click', () => {
  if (!duel.roomCode) return;
  const txt = `בואו להילחם מולי ב"עולם הנחשים של בארי"! לחצו להצטרפות לקרב: ${getDuelRoomUrl(duel.roomCode)}`;
  window.open(`https://wa.me/?text=${encodeURIComponent(txt)}`, '_blank');
});
document.getElementById('startQrScanBtn').addEventListener('click', startQrScanner);
document.getElementById('stopQrScanBtn').addEventListener('click', stopQrScanner);
document.getElementById('joinDuelCodeBtn').addEventListener('click', () => {
  const code = extractDuelCodeFromText(document.getElementById('duelJoinCodeInput').value);
  if (!code) {
    setDuelStatus('⚠️ הקלידו קוד תקין בן 4 ספרות.');
    return;
  }
  connectDuelRoom(code, 'guest');
});
document.getElementById('leaveDuelBtn').addEventListener('click', () => leaveDuel(true));
document.getElementById('duelExitAfterResultBtn').addEventListener('click', () => leaveDuel(true));
document.getElementById('duelRematchBtn').addEventListener('click', () => {
  document.getElementById('duelResultModal').classList.add('hidden');
  publishDuel({ t: 'rematch', from: duel.myId });
  resetDuelRound();
});

// הפעלת המשחק!
initWorld(state.world);
const _urlDuelCode = extractDuelCodeFromText(window.location.search);
if (_urlDuelCode) {
  openDuelModal('join', _urlDuelCode);
}

function gameLoop() {
  update();
  draw();
  requestAnimationFrame(gameLoop);
}
requestAnimationFrame(gameLoop);