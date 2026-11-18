// ============================================================================
// עולם הנחשים של בארי - מנוע המשחק (מותאם למובייל ולמחשב)
// ============================================================================

const SAVE_KEY = 'beeri_snake_game_save_v1';

// הגדרות צורות וצבעים לפי רמת הנחש
const LEVEL_STYLES = [
  { name: 'עיגולים ירוקים', shape: 'circle', primary: '#4caf50', secondary: '#81c784', glow: '#a5d6a7' },
  { name: 'מעוינים כחולים', shape: 'diamond', primary: '#29b6f6', secondary: '#0288d1', glow: '#81d4fa' },
  { name: 'משושים כתומים', shape: 'hexagon', primary: '#ff9800', secondary: '#f57c00', glow: '#ffcc80' },
  { name: 'כוכבים סגולים', shape: 'star', primary: '#ab47bc', secondary: '#7b1fa2', glow: '#e1bee7' },
  { name: 'קשקשי דרקון טורקיז', shape: 'triangle', primary: '#00bfa5', secondary: '#00897b', glow: '#a7ffeb' },
  { name: 'טבעות זהב מלכותי', shape: 'ring', primary: '#ffd600', secondary: '#ffab00', glow: '#ffff8d' }
];

// מצב התחלתי של השחקן (לפי האפיון: 10 שקלים ו-15 יהלומים)
function getDefaultState() {
  return {
    money: 10,
    diamonds: 15,
    level: 1,
    xp: 0,
    xpToNext: 2,
    world: 1,
    maxWorldReached: 1,
    freeRoamUnlocked: false,
    upgrades: {
      biteLevel: 1,
      speedLevel: 1,
      hpLevel: 1,
      venomLevel: 1,
      hasArtificialTeeth: false,
      hasArmorSuit: false,
      hasLaserSuit: false,
      laserLevel: 1,
      collectorSnakes: 0,
      fighterSnakes: 0,
      guardSnakes: 0
    }
  };
}

let state = loadState();

function loadState() {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return getDefaultState();
    const parsed = JSON.parse(raw);
    return {
      ...getDefaultState(),
      ...parsed,
      upgrades: { ...getDefaultState().upgrades, ...(parsed.upgrades || {}) }
    };
  } catch (e) {
    return getDefaultState();
  }
}

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
let particles = [];
let floatingTexts = [];

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
  shootCooldown: 0,
  invulnerableTimer: 0,
  segments: []
};

function getPlayerStats() {
  const u = state.upgrades;
  const maxHp = 100 + (u.hpLevel - 1) * 35 + (u.hasArmorSuit ? 60 : 0);
  const baseSpeed = 4.0 + (u.speedLevel - 1) * 0.45;
  const biteDamage = 25 + (u.biteLevel - 1) * 15 + (u.hasArtificialTeeth ? 35 : 0);
  const venomDamage = 22 + (u.venomLevel - 1) * 15;
  const laserDamage = 32 + (u.laserLevel - 1) * 18;
  const radius = 16 + Math.min(state.level * 2.2, 26);
  const segCount = 8 + Math.min(state.level * 2, 28);
  return { maxHp, baseSpeed, biteDamage, venomDamage, laserDamage, radius, segCount };
}

function initPlayerSegments() {
  player.segments = [];
  const { segCount } = getPlayerStats();
  for (let i = 0; i < segCount; i++) {
    player.segments.push({ x: player.x - i * 12, y: player.y });
  }
}

// ============================================================================
// יצירת עולם (עולמות 1 עד 50)
// ============================================================================
function initWorld(worldNum) {
  state.world = Math.max(1, Math.min(50, worldNum));
  if (state.world > state.maxWorldReached) {
    state.maxWorldReached = state.world;
  }
  if (state.world >= 50) {
    state.freeRoamUnlocked = true;
  }
  saveState();

  const stats = getPlayerStats();
  player.maxHp = stats.maxHp;
  player.hp = player.maxHp;
  player.x = HOME_BASE.x;
  player.y = HOME_BASE.y;
  player.angle = 0;
  player.jumpZ = 0;
  initPlayerSegments();

  // יצירת עצים על שתי גדות הנהר (קרובים ונוחים להפלה עם נשיכה או ירי ארס)
  trees = [
    { x: RIVER.x - 32, y: 420, hp: 20, maxHp: 20, fallen: false },
    { x: RIVER.x - 32, y: 900, hp: 20, maxHp: 20, fallen: false },
    { x: RIVER.x - 32, y: 1380, hp: 20, maxHp: 20, fallen: false }
  ];
  bridges = [];

  // יצירת נחשים יריבים בעולם
  enemies = [];
  const totalSnakes = 6 + Math.min(Math.floor(state.world / 2), 10);

  for (let i = 0; i < totalSnakes; i++) {
    let enemyLevel;
    if (i < Math.ceil(totalSnakes * 0.65)) {
      enemyLevel = Math.max(1, state.level - 1 + (i % 2));
    } else {
      enemyLevel = state.level + 1;
    }

    const onRightSide = i >= Math.ceil(totalSnakes * 0.5);
    const minX = onRightSide ? RIVER.x + RIVER.width + 120 : 620;
    const maxX = onRightSide ? WORLD_WIDTH - 150 : RIVER.x - 100;

    spawnEnemySnake(
      minX + Math.random() * (maxX - minX),
      200 + Math.random() * (WORLD_HEIGHT - 400),
      enemyLevel,
      false
    );
  }

  rebuildHelpers();
  updateHUD();
  showToast(`🌍 עולם ${state.world}! אכול את כל ${enemies.length} הנחשים כדי לעבור לעולם הבא`);
}

function spawnEnemySnake(x, y, level, isBurglar = false) {
  const style = LEVEL_STYLES[(level - 1) % LEVEL_STYLES.length];
  const radius = 13 + Math.min(level * 2.1, 25);
  const maxHp = 35 + level * 22;
  const segCount = 6 + Math.min(level * 2, 20);
  const segs = [];
  for (let i = 0; i < segCount; i++) {
    segs.push({ x: x - i * 10, y });
  }
  enemies.push({
    x,
    y,
    angle: Math.random() * Math.PI * 2,
    speed: isBurglar ? 2.4 : 1.65 + Math.min(level * 0.12, 1.4),
    level,
    hp: maxHp,
    maxHp,
    radius,
    style,
    isBurglar,
    segments: segs,
    turnTimer: 0
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
  const segs = [];
  for (let s = 0; s < 7; s++) segs.push({ x: startX, y: startY });

  return {
    type,
    label: labels[type],
    color: colors[type],
    x: startX,
    y: startY,
    angle: index,
    speed: 3.3,
    radius: 12,
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
  panPointerId: null,
  panLastX: 0,
  panLastY: 0
};

function getCameraZoom() {
  const minDim = Math.min(window.innerWidth, window.innerHeight);
  if (minDim < 500) return 0.62;
  if (minDim < 820) return 0.76;
  return 1.0;
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

// ============================================================================
// פעולות השחקן: קפיצה (חץ למעלה), נשיכה (חץ למטה), ירי ארס/לייזר
// ============================================================================
function triggerJump() {
  if (player.jumpZ === 0) {
    player.jumpVz = 9.5;
    spawnParticles(player.x, player.y, '#ffffff', 10);
    addFloatingText(player.x, player.y - 25, '⬆️ קפיצה!', '#81d4fa');
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

  // בדיקת נשיכה של נחשים יריבים
  for (let i = enemies.length - 1; i >= 0; i--) {
    const en = enemies[i];
    const dist = Math.hypot(en.x - player.x, en.y - player.y);
    if (dist <= biteRange + en.radius) {
      if (en.level <= state.level) {
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
function damageEnemy(enemyIndex, dmg, label = '') {
  const en = enemies[enemyIndex];
  if (!en) return;
  en.hp -= dmg;
  spawnParticles(en.x, en.y, en.style.primary, 8);
  addFloatingText(en.x, en.y - 20, `${label} -${Math.round(dmg)}`, '#ff8a80');

  if (en.hp <= 0) {
    eatEnemy(enemyIndex);
  }
}

function eatEnemy(enemyIndex) {
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

  state.money += moneyGain;
  state.diamonds += diamondGain;

  let rewardMsg = '🍽️ נאכל! ';
  if (moneyGain > 0) rewardMsg += `+${moneyGain}₪ `;
  if (diamondGain > 0) rewardMsg += `+${diamondGain}💎`;
  addFloatingText(en.x, en.y - 35, rewardMsg, '#69f0ae');

  // גדילה ועליית רמה
  state.xp += 1;
  if (state.xp >= state.xpToNext) {
    state.xp = 0;
    state.xpToNext = Math.min(2 + Math.floor(state.level / 2), 6);
    state.level += 1;

    const newStyle = LEVEL_STYLES[(state.level - 1) % LEVEL_STYLES.length];
    const stats = getPlayerStats();
    player.maxHp = stats.maxHp;
    player.hp = player.maxHp;

    while (player.segments.length < stats.segCount) {
      const tail = player.segments[player.segments.length - 1];
      player.segments.push({ x: tail.x, y: tail.y });
    }

    showToast(`🎉 עלית לרמה ${state.level}! הנחש שינה צבע וצורה ל-${newStyle.name}!`);
    spawnParticles(player.x, player.y, newStyle.primary, 35);
  }

  saveState();
  updateHUD();

  if (enemies.length === 0) {
    if (state.world < 50) {
      showToast(`🏆 ניקית את כל הנחשים בעולם ${state.world}! עובר לעולם ${state.world + 1}...`);
      setTimeout(() => {
        initWorld(state.world + 1);
      }, 1500);
    } else {
      state.freeRoamUnlocked = true;
      saveState();
      updateHUD();
      showToast(`👑 הגעת לעולם 50 וניצחת! כעת פתוח לך מסע חופשי בין כל 50 העולמות!`);
    }
  }
}

function sendPlayerHome(reason) {
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
  if (player.shootCooldown > 0) player.shootCooldown--;
  if (player.invulnerableTimer > 0) player.invulnerableTimer--;

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
      player.angle += diff * 0.25;
      // מהירות אחידה ומלאה תמיד (ללא האטה בפניות!)
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
    player.angle += diff * 0.25;
    player.speed = stats.baseSpeed;
  } else if (!isTouchMode && mouse.activeOnDesktop) {
    const distToMouse = Math.hypot(mouse.worldX - player.x, mouse.worldY - player.y);
    if (distToMouse > 24) {
      const targetAngle = Math.atan2(mouse.worldY - player.y, mouse.worldX - player.x);
      let diff = targetAngle - player.angle;
      while (diff > Math.PI) diff -= Math.PI * 2;
      while (diff < -Math.PI) diff += Math.PI * 2;
      player.angle += diff * 0.22;
      player.speed = stats.baseSpeed;
    } else {
      player.speed = 0;
    }
  } else {
    player.speed = 0;
  }

  let nextX = player.x + Math.cos(player.angle) * player.speed;
  let nextY = player.y + Math.sin(player.angle) * player.speed;

  // בדיקת חציית נהר: אפשר לחצות אם יש גשר עץ או אם קופצים באוויר
  const inRiver = nextX > RIVER.x - stats.radius && nextX < RIVER.x + RIVER.width + stats.radius;
  if (inRiver && player.jumpZ <= 2) {
    const onBridge = bridges.some((b) => Math.abs(nextY - b.y) < 58);
    if (!onBridge) {
      if (player.x <= RIVER.x) nextX = RIVER.x - stats.radius;
      else nextX = RIVER.x + RIVER.width + stats.radius;
      if (Math.random() < 0.06) {
        addFloatingText(player.x, player.y - 30, '🌊 קפוץ (⬆️) או נשוך/ירה על עץ לגשר!', '#4fc3f7');
      }
    }
  }

  player.x = Math.max(stats.radius, Math.min(WORLD_WIDTH - stats.radius, nextX));
  player.y = Math.max(stats.radius, Math.min(WORLD_HEIGHT - stats.radius, nextY));

  // עדכון חוליות גוף הנחש
  updateSegments(player.segments, player.x, player.y, stats.radius * 0.72);

  // ריפוי אוטומטי בבית
  const distHome = Math.hypot(player.x - HOME_BASE.x, player.y - HOME_BASE.y);
  if (distHome < HOME_BASE.radius && player.hp < player.maxHp) {
    player.hp = Math.min(player.maxHp, player.hp + 0.45);
    updateHUD();
  }

  if (mouse.down && !isTouchMode) {
    triggerShoot();
  }

  // לידת נחש פורץ מדי פעם
  burglarSpawnTimer--;
  if (burglarSpawnTimer <= 0 && enemies.length > 0) {
    burglarSpawnTimer = 780;
    if (state.money > 5 && Math.random() < 0.4) {
      spawnEnemySnake(HOME_BASE.x + 480, HOME_BASE.y + (Math.random() - 0.5) * 480, Math.max(1, state.level - 1), true);
      showToast('🦹 נחש פורץ מתקרב לבית שלך! נחש שומר או אתה יכולים לעצור אותו!');
    }
  }

  updateProjectiles();
  updateHelpers();
  updateEnemies(stats);

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

  // עדכון מצלמה עם התחשבות בזום ובהזזת התצוגה (Pan)
  const viewW = canvas.width / camera.zoom;
  const viewH = canvas.height / camera.zoom;
  camera.x = Math.max(0, Math.min(WORLD_WIDTH - viewW, player.x - viewW / 2 + camera.panX));
  camera.y = Math.max(0, Math.min(WORLD_HEIGHT - viewH, player.y - viewH / 2 + camera.panY));
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
        } else {
          en.hp -= p.damage * 0.45;
          addFloatingText(en.x, en.y - 20, `-${Math.round(p.damage * 0.45)}`, '#ffab91');
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
  for (const h of helperEntities) {
    if (h.attackTimer > 0) h.attackTimer--;

    let target = null;

    if (h.type === 'guard') {
      target = enemies.find((e) => e.isBurglar || Math.hypot(e.x - HOME_BASE.x, e.y - HOME_BASE.y) < HOME_BASE.radius + 220);
      if (!target) {
        h.angle += 0.03;
        h.x = HOME_BASE.x + Math.cos(h.angle) * (HOME_BASE.radius - 20);
        h.y = HOME_BASE.y + Math.sin(h.angle) * (HOME_BASE.radius - 20);
      }
    } else if (h.type === 'collector') {
      target = enemies.find((e) => e.level <= state.level);
    } else if (h.type === 'fighter') {
      let minDist = 420;
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
      if (d < target.radius + h.radius + 12 && h.attackTimer <= 0) {
        h.attackTimer = 28;
        const idx = enemies.indexOf(target);
        if (idx !== -1) {
          damageEnemy(idx, 18 + state.level * 4, h.label);
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
  for (let i = enemies.length - 1; i >= 0; i--) {
    const en = enemies[i];

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
        continue;
      }
    } else {
      en.turnTimer--;
      if (en.turnTimer <= 0) {
        en.turnTimer = 40 + Math.random() * 60;
        en.angle += (Math.random() - 0.5) * 1.4;
      }
    }

    let nx = en.x + Math.cos(en.angle) * en.speed;
    let ny = en.y + Math.sin(en.angle) * en.speed;

    if (nx < 80 || nx > WORLD_WIDTH - 80) en.angle = Math.PI - en.angle;
    if (ny < 80 || ny > WORLD_HEIGHT - 80) en.angle = -en.angle;
    if (!en.isBurglar && Math.hypot(nx - HOME_BASE.x, ny - HOME_BASE.y) < HOME_BASE.radius + 35) {
      en.angle += Math.PI;
    }
    if (nx > RIVER.x - 20 && nx < RIVER.x + RIVER.width + 20) {
      en.angle = Math.PI - en.angle;
    }

    en.x += Math.cos(en.angle) * en.speed;
    en.y += Math.sin(en.angle) * en.speed;
    updateSegments(en.segments, en.x, en.y, en.radius * 0.7);

    if (player.jumpZ < 8) {
      const dist = Math.hypot(en.x - player.x, en.y - player.y);
      if (dist < en.radius + playerStats.radius) {
        if (en.level > state.level) {
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
        }
      }
    }
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

  // רקע הקרקע
  const worldHue = ((state.world - 1) * 28) % 360;
  ctx.fillStyle = night ? `hsl(${worldHue}, 28%, 9%)` : `hsl(${(115 + worldHue) % 360}, 32%, 18%)`;
  ctx.fillRect(0, 0, WORLD_WIDTH, WORLD_HEIGHT);

  // רשת עדינה
  ctx.strokeStyle = night ? 'rgba(255,255,255,0.04)' : 'rgba(255,255,255,0.06)';
  ctx.lineWidth = 1;
  for (let x = 0; x < WORLD_WIDTH; x += 80) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, WORLD_HEIGHT);
    ctx.stroke();
  }
  for (let y = 0; y < WORLD_HEIGHT; y += 80) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(WORLD_WIDTH, y);
    ctx.stroke();
  }

  // ציור הנהר
  const riverGrad = ctx.createLinearGradient(RIVER.x, 0, RIVER.x + RIVER.width, 0);
  riverGrad.addColorStop(0, '#0277bd');
  riverGrad.addColorStop(0.5, '#29b6f6');
  riverGrad.addColorStop(1, '#0277bd');
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
    drawSnakeBody(h.segments, h.radius, 'circle', h.color, '#ffffff');
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 12px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(h.label, h.x, h.y - h.radius - 10);
  }

  // ציור נחשי אויב
  for (const en of enemies) {
    const isSmallerOrEqual = en.level <= state.level;
    drawSnakeBody(
      en.segments,
      en.radius,
      en.style.shape,
      en.isBurglar ? '#d50000' : en.style.primary,
      en.style.secondary
    );
    drawSnakeEyes(en.x, en.y, en.angle, en.radius, false, false);

    const barW = 54;
    const barH = 7;
    ctx.fillStyle = 'rgba(0,0,0,0.6)';
    ctx.fillRect(en.x - barW / 2, en.y - en.radius - 22, barW, barH);
    ctx.fillStyle = isSmallerOrEqual ? '#00e676' : '#ff1744';
    ctx.fillRect(en.x - barW / 2, en.y - en.radius - 22, barW * Math.max(0, en.hp / en.maxHp), barH);

    ctx.font = 'bold 13px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillStyle = isSmallerOrEqual ? '#b9f6ca' : '#ff8a80';
    const tag = en.isBurglar
      ? `🦹 פורץ לבית! (רמה ${en.level})`
      : isSmallerOrEqual
        ? `🟢 רמה ${en.level} (אפשר לאכול!)`
        : `🔴 רמה ${en.level} (גדול ממך!)`;
    ctx.fillText(tag, en.x, en.y - en.radius - 28);
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

  if (night) {
    ctx.fillStyle = 'rgba(5, 10, 28, 0.36)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
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

// ============================================================================
// ממשק משתמש, חנות שדרוגים ובחירת עולמות
// ============================================================================
function updateHUD() {
  const style = LEVEL_STYLES[(state.level - 1) % LEVEL_STYLES.length];
  document.getElementById('worldNum').textContent = state.world;
  document.getElementById('snakesLeft').textContent = enemies.length;
  document.getElementById('playerLevel').textContent = state.level;
  document.getElementById('shapeName').textContent = style.name;
  document.getElementById('moneyCount').textContent = state.money;
  document.getElementById('diamondCount').textContent = state.diamonds;

  const hpPct = Math.max(0, Math.min(100, (player.hp / player.maxHp) * 100));
  document.getElementById('hpBarFill').style.width = `${hpPct}%`;
  document.getElementById('hpText').textContent = `${Math.ceil(player.hp)}/${player.maxHp}`;

  const worldSelectBtn = document.getElementById('worldSelectBtn');
  if (state.freeRoamUnlocked || state.maxWorldReached >= 2) {
    worldSelectBtn.classList.remove('hidden');
  }

  document.getElementById('dayNightBtn').textContent = isNightTime() ? '🌙' : '☀️';
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
      title: `🏠 נחש עוזר שומר על הבית (יש לך: ${u.guardSnakes})`,
      desc: 'שומר על הבית שלך כדי שנחשים פורצים לא יגנבו כסף!',
      costMoney: 8 + u.guardSnakes * 8,
      costDiamonds: 4,
      action: () => {
        u.guardSnakes++;
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
    const card = document.createElement('div');
    card.className = 'shop-card';

    let priceParts = [];
    if (item.costMoney > 0) priceParts.push(`${item.costMoney} ₪`);
    if (item.costDiamonds > 0) priceParts.push(`${item.costDiamonds} 💎`);
    const priceLabel = item.owned ? 'נרכש ✅' : `קנה (${priceParts.join(' + ')})`;

    card.innerHTML = `
      <div>
        <h4>${item.title}</h4>
        <p>${item.desc}</p>
      </div>
      <button class="buy-btn" ${item.owned || !canAfford ? 'disabled' : ''}>${priceLabel}</button>
    `;

    const btn = card.querySelector('.buy-btn');
    btn.addEventListener('click', () => {
      if (item.owned) return;
      if (state.money < item.costMoney || state.diamonds < item.costDiamonds) return;
      state.money -= item.costMoney;
      state.diamonds -= item.costDiamonds;
      item.action();
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

document.getElementById('worldSelectBtn').addEventListener('click', () => {
  const grid = document.getElementById('worldsGrid');
  grid.innerHTML = '';
  const maxUnlocked = state.freeRoamUnlocked ? 50 : Math.max(state.maxWorldReached, 50);
  for (let w = 1; w <= maxUnlocked; w++) {
    const btn = document.createElement('button');
    btn.className = 'world-tile' + (w === state.world ? ' active' : '');
    btn.textContent = `עולם ${w}`;
    btn.addEventListener('click', () => {
      document.getElementById('worldsModal').classList.add('hidden');
      initWorld(w);
    });
    grid.appendChild(btn);
  }
  document.getElementById('worldsModal').classList.remove('hidden');
});

document.getElementById('closeWorldsBtn').addEventListener('click', () => {
  document.getElementById('worldsModal').classList.add('hidden');
});

document.getElementById('dayNightBtn').addEventListener('click', () => {
  manualNightOverride = !isNightTime();
  updateHUD();
  showToast(isNightTime() ? '🌙 מצב לילה הופעל!' : '☀️ מצב יום הופעל!');
});

document.getElementById('resetBtn').addEventListener('click', () => {
  if (confirm('האם לאפס את השמירה ולהתחיל מחדש מרמה 1 עם 10 שקלים ו-15 יהלומים?')) {
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
