import { useState, useEffect, useRef, useCallback } from "react";

const W = 800;
const H = 500;
const LANE_COUNT = 3;
const LANE_WIDTH = 90;
const HORIZON_Y = 140;
const GROUND_BOTTOM = H - 20;
const PERSPECTIVE_STRENGTH = 2.2;
const PLAYER_DRAW_Y = H - 90;
const INITIAL_SPEED = 3;
const SPEED_INCREMENT = 0.0003;
const MAX_LIVES = 3;
const INVINCIBLE_MS = 1500;
const FLASH_MS = 80;
const SPAWN_MIN = 55;
const SPAWN_MAX = 90;
const MOLE_WARN_TIME = 60;
const PHASE_SCORE = 300;

// Atleti palette
const C = {
  atletiRed: "#CB3234",
  atletiRedDark: "#A02020",
  atletiBlue: "#272E61",
  atletiBlueDark: "#1A1F45",
  white: "#FFFFFF",
  yellow: "#FFD700",
  gold: "#FFC107",
  skin: "#E8B87A",
  skinDark: "#C49A6C",
  hair: "#2C2C2C",
  suit: "#1B1B2F",
  suitLight: "#2C2C54",
  shirt: "#E8E8E8",
  tie: "#CB3234",
  shoe: "#111111",
  grass: "#2E8B47",
  grassDark: "#1E6B30",
  grassLight: "#3EA85A",
  skyDay: "#1A3A5C",
  skyHorizon: "#2D5A7B",
  lineWhite: "#FFFFFFCC",
  shadow: "rgba(0,0,0,0.25)",
  brown: "#8B6914",
  brownDark: "#6B4F10",
  moleNose: "#FF6B6B",
  coneOrange: "#FF6D00",
  coneStripe: "#FFFFFF",
  sprinklerBlue: "#64B5F6",
  cameraBlack: "#333333",
  cameraLens: "#5C6BC0",
  cameraFlash: "#FFEE58",
  barrelGray: "#757575",
  // Manchester phase
  manchRed: "#DA291C",
  manchYellow: "#FFE500",
  bottleBlue: "#42A5F5",
  coinGold: "#FFD700",
  // Madrid phase
  madridWhite: "#FFFFFF",
  madridGold: "#D4AF37",
  madridPurple: "#6A0DAD",
  walletBrown: "#8D6E63",
  watchGold: "#FFD54F",
};

// ============== STADIUMS ==============
const STADIUMS = [
  {
    name: "METROPOLITANO",
    subtitle: "Celebra por la banda sin que te paren",
    bgTop: C.skyDay,
    bgHorizon: C.skyHorizon,
    grassColor: C.grass,
    grassDark: C.grassDark,
    standColor: C.atletiRed,
    standColor2: C.atletiBlue,
    accentColor: C.atletiRedDark,
    obstacles: [
      { type: "player", name: "Rival caído", w: 50, h: 30, color: "#FFFFFF", detail: "#0055A4", pts: 10 },
      { type: "mole", name: "Topo", w: 36, h: 28, color: C.brown, detail: C.brownDark, pts: 25 },
      { type: "cone", name: "Cono", w: 24, h: 40, color: C.coneOrange, detail: C.coneStripe, pts: 15 },
      { type: "sprinkler", name: "Aspersor", w: 30, h: 20, color: C.sprinklerBlue, detail: "#90CAF9", pts: 15 },
      { type: "camera", name: "Cámara TV", w: 44, h: 36, color: C.cameraBlack, detail: C.cameraLens, pts: 20 },
    ],
  },
  {
    name: "OLD TRAFFORD",
    subtitle: "¡Cuidado con lo que te tiran!",
    bgTop: "#2C2C2C",
    bgHorizon: "#4A4A4A",
    grassColor: "#2D7A3E",
    grassDark: "#1A5C2A",
    standColor: C.manchRed,
    standColor2: "#FBE122",
    accentColor: "#B71C1C",
    obstacles: [
      { type: "bottle", name: "Botella", w: 18, h: 28, color: C.bottleBlue, detail: "#BBDEFB", pts: 15 },
      { type: "lighter", name: "Mechero", w: 14, h: 20, color: "#FF9800", detail: "#FFCC02", pts: 10 },
      { type: "scarf", name: "Bufanda", w: 50, h: 14, color: C.manchRed, detail: C.manchYellow, pts: 20 },
      { type: "coin", name: "Moneda", w: 18, h: 18, color: C.coinGold, detail: "#FFF176", pts: 25 },
      { type: "beer", name: "Cerveza", w: 22, h: 28, color: "#FDD835", detail: C.white, pts: 15 },
    ],
  },
  {
    name: "BERNABÉU",
    subtitle: "¡Agarra la cartera!",
    bgTop: "#1A1A2E",
    bgHorizon: "#2D2D5E",
    grassColor: "#2E8B47",
    grassDark: "#1E6B30",
    standColor: C.madridWhite,
    standColor2: C.madridPurple,
    accentColor: C.madridGold,
    obstacles: [
      { type: "pickpocket", name: "Carterista", w: 40, h: 44, color: "#212121", detail: C.skin, pts: 30 },
      { type: "wallet", name: "Cartera tirada", w: 28, h: 20, color: C.walletBrown, detail: "#A1887F", pts: 15 },
      { type: "watch", name: "Reloj robado", w: 22, h: 22, color: C.watchGold, detail: "#FFF8E1", pts: 20 },
      { type: "cone", name: "Cono VIP", w: 24, h: 40, color: C.madridGold, detail: C.white, pts: 15 },
      { type: "camera", name: "Cámara VAR", w: 44, h: 36, color: "#212121", detail: "#7C4DFF", pts: 20 },
    ],
  },
];

function laneToX(lane, depth) {
  const t = depth;
  const centerX = W / 2;
  const spread = LANE_WIDTH * (1.8 + (1 - t) * PERSPECTIVE_STRENGTH);
  return centerX + (lane - 1) * spread;
}

function depthToY(depth) {
  return HORIZON_Y + (GROUND_BOTTOM - HORIZON_Y) * (1 - depth);
}

function depthScale(depth) {
  return 0.3 + (1 - depth) * 0.7;
}

function px(ctx, x, y, w, h, color) {
  ctx.fillStyle = color;
  ctx.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h));
}

// ============== DRAWING FUNCTIONS ==============
function drawSky(ctx, stadium) {
  const grad = ctx.createLinearGradient(0, 0, 0, HORIZON_Y + 40);
  grad.addColorStop(0, stadium.bgTop);
  grad.addColorStop(1, stadium.bgHorizon);
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, W, HORIZON_Y + 40);
}

function drawStands(ctx, stadium, scrollX) {
  // Left stand
  const grad1 = ctx.createLinearGradient(0, 40, 0, HORIZON_Y + 20);
  grad1.addColorStop(0, stadium.standColor);
  grad1.addColorStop(1, stadium.standColor2);
  ctx.fillStyle = grad1;
  ctx.beginPath();
  ctx.moveTo(0, 30);
  ctx.lineTo(180, HORIZON_Y - 10);
  ctx.lineTo(180, HORIZON_Y + 20);
  ctx.lineTo(0, H * 0.55);
  ctx.closePath();
  ctx.fill();

  // Right stand
  ctx.beginPath();
  ctx.moveTo(W, 30);
  ctx.lineTo(W - 180, HORIZON_Y - 10);
  ctx.lineTo(W - 180, HORIZON_Y + 20);
  ctx.lineTo(W, H * 0.55);
  ctx.closePath();
  ctx.fill();

  // Crowd dots
  const colors = [stadium.standColor, stadium.standColor2, "#E8B87A", "#C49A6C", stadium.accentColor];
  for (let side = 0; side < 2; side++) {
    for (let row = 0; row < 6; row++) {
      for (let col = 0; col < 12; col++) {
        const baseX = side === 0 ? 10 + col * 14 : W - 10 - col * 14;
        const baseY = 45 + row * 18 + col * (side === 0 ? 1.5 : 1.5);
        const jitter = Math.sin(scrollX * 0.02 + col * 2 + row * 3) * 2;
        const color = colors[(col + row) % colors.length];
        px(ctx, baseX + jitter, baseY, 8, 8, C.skin);
        px(ctx, baseX + jitter - 1, baseY + 8, 10, 10, color);
        // Some wave arms
        if ((col + row + Math.floor(scrollX * 0.05)) % 5 === 0) {
          px(ctx, baseX + jitter + 2, baseY - 6, 4, 6, color);
        }
      }
    }
  }

  // Stadium name banner
  ctx.fillStyle = "rgba(0,0,0,0.6)";
  ctx.fillRect(W / 2 - 120, 8, 240, 24);
  ctx.fillStyle = C.white;
  ctx.font = "bold 14px monospace";
  ctx.textAlign = "center";
  ctx.fillText(stadium.name, W / 2, 25);
}

function drawGround(ctx, stadium, scrollX) {
  // Base grass
  const grad = ctx.createLinearGradient(0, HORIZON_Y, 0, H);
  grad.addColorStop(0, stadium.grassDark);
  grad.addColorStop(0.3, stadium.grassColor);
  grad.addColorStop(1, stadium.grassColor);
  ctx.fillStyle = grad;
  ctx.fillRect(0, HORIZON_Y, W, H - HORIZON_Y);

  // Perspective grass stripes
  for (let i = 0; i < 12; i++) {
    const depth = 1 - ((i * 0.08 + (scrollX * 0.01) % 0.08) % 1);
    if (depth < 0 || depth > 1) continue;
    const y = depthToY(depth);
    const nextY = depthToY(Math.max(0, depth - 0.04));
    if (i % 2 === 0) {
      ctx.fillStyle = "rgba(255,255,255,0.04)";
      ctx.fillRect(0, y, W, nextY - y);
    }
  }

  // Sideline
  for (let d = 0; d < 1; d += 0.01) {
    const y = depthToY(d);
    const sc = depthScale(d);
    const cx = laneToX(1, d);
    const leftX = cx - LANE_WIDTH * sc * 2.2;
    ctx.fillStyle = C.lineWhite;
    ctx.fillRect(leftX - 2, y, Math.max(1, 3 * sc), 2);
  }

  // Lane markers (subtle dashed)
  for (let lane = 0; lane < LANE_COUNT; lane++) {
    for (let d = 0; d < 1; d += 0.03) {
      const segD = (d + (scrollX * 0.005) % 0.06) % 1;
      if (segD > 1) continue;
      const y = depthToY(segD);
      const sc = depthScale(segD);
      const x = laneToX(lane, segD);
      ctx.fillStyle = "rgba(255,255,255,0.08)";
      ctx.fillRect(x - sc * 2, y, sc * 4, Math.max(1, sc * 4));
    }
  }
}

function drawPlayerChar(ctx, x, y, lane, targetLane, frame, isDucking, isInvincible, now) {
  if (isInvincible && Math.floor(now / FLASH_MS) % 2 === 0) return;

  const sc = 1;
  const bob = Math.sin(frame * 0.25) * 3;
  const lean = (targetLane - lane) * 4;

  ctx.save();
  ctx.translate(x, y + bob);

  // Shadow
  ctx.fillStyle = C.shadow;
  ctx.beginPath();
  ctx.ellipse(0, 24, 18, 6, 0, 0, Math.PI * 2);
  ctx.fill();

  // Legs with running animation
  const legSwing = Math.sin(frame * 0.3) * 8;
  // Left leg
  px(ctx, -8 + lean * 0.3, 6, 7 * sc, 16 + legSwing, C.suit);
  px(ctx, -10 + lean * 0.3, 22 + legSwing, 9 * sc, 5, C.shoe);
  // Right leg
  px(ctx, 2 + lean * 0.3, 6, 7 * sc, 16 - legSwing, C.suit);
  px(ctx, 0 + lean * 0.3, 22 - legSwing, 9 * sc, 5, C.shoe);

  if (isDucking) {
    // Ducking - body compressed
    px(ctx, -12 + lean, -8, 24, 16, C.suit);
    px(ctx, -10 + lean, -6, 20, 12, C.suitLight);
    // Head ducked
    px(ctx, -7 + lean, -18, 14, 12, C.skin);
    px(ctx, -7 + lean, -20, 14, 5, C.hair);
    px(ctx, 5 + lean, -18, 5, 7, C.hair);
    // Arms covering
    px(ctx, -16 + lean, -10, 6, 14, C.suit);
    px(ctx, 10 + lean, -10, 6, 14, C.suit);
  } else {
    // Body
    px(ctx, -10 + lean, -18, 20, 26, C.suit);
    px(ctx, -8 + lean, -16, 16, 22, C.suitLight);
    // White shirt
    px(ctx, -4 + lean, -18, 8, 10, C.shirt);
    // Tie
    px(ctx, -2 + lean, -16, 4, 14, C.tie);

    // Arms pumping
    const armSwing = Math.sin(frame * 0.3) * 10;
    // Left arm
    px(ctx, -16 + lean, -14 + armSwing, 7, 16, C.suit);
    px(ctx, -17 + lean, 0 + armSwing, 6, 6, C.skin);
    // Right arm
    px(ctx, 10 + lean, -14 - armSwing, 7, 16, C.suit);
    px(ctx, 11 + lean, 0 - armSwing, 6, 6, C.skin);

    // Head
    px(ctx, -7 + lean, -34, 14, 18, C.skin);
    // Eyes
    px(ctx, -4 + lean, -27, 3, 3, "#111");
    px(ctx, 3 + lean, -27, 3, 3, "#111");
    // Eyebrows (intense)
    px(ctx, -5 + lean, -30, 5, 2, C.hair);
    px(ctx, 2 + lean, -30, 5, 2, C.hair);
    // Mouth (shouting celebration)
    px(ctx, -3 + lean, -22, 7, 3, "#111");
    px(ctx, -2 + lean, -21, 5, 2, "#C62828");

    // Hair
    px(ctx, -7 + lean, -36, 14, 6, C.hair);
    px(ctx, 5 + lean, -34, 6, 9, C.hair);
    px(ctx, 8 + lean, -32, 4, 7, "#444");
  }

  ctx.restore();
}

function drawObstacleAtPos(ctx, obs, stadium) {
  const { screenX, screenY, scale, type: obsType } = obs;
  const obstDef = stadium.obstacles[obsType];
  if (!obstDef) return;

  ctx.save();
  ctx.translate(screenX, screenY);
  ctx.scale(scale, scale);

  const t = obstDef.type;

  switch (t) {
    case "player": // Rival player on ground
      // Body lying down
      px(ctx, -20, -10, 40, 16, obstDef.color);
      px(ctx, -18, -8, 36, 12, obstDef.detail);
      // Head
      px(ctx, -25, -14, 12, 12, C.skin);
      // Legs
      px(ctx, 12, -6, 14, 8, obstDef.color);
      px(ctx, 24, -4, 8, 6, C.shoe);
      // Number on shirt
      px(ctx, -4, -6, 8, 8, obstDef.detail);
      break;

    case "mole": // Topo coming out of ground
      const molePhase = obs.molePhase || 0;
      const moleH = Math.min(1, molePhase) * 28;
      // Dirt mound
      px(ctx, -20, -4, 40, 10, "#5D4037");
      px(ctx, -16, -2, 32, 6, "#795548");
      // Mole body
      if (moleH > 4) {
        px(ctx, -14, -moleH, 28, moleH, obstDef.color);
        px(ctx, -12, -moleH + 2, 24, moleH - 4, obstDef.detail);
        // Eyes
        if (moleH > 14) {
          px(ctx, -8, -moleH + 4, 5, 5, "#111");
          px(ctx, 4, -moleH + 4, 5, 5, "#111");
          px(ctx, -6, -moleH + 5, 2, 2, C.white);
          px(ctx, 6, -moleH + 5, 2, 2, C.white);
        }
        // Nose
        if (moleH > 10) {
          px(ctx, -3, -moleH + 10, 6, 5, C.moleNose);
        }
        // Claws
        if (moleH > 20) {
          px(ctx, -18, -8, 6, 8, obstDef.color);
          px(ctx, 12, -8, 6, 8, obstDef.color);
          for (let c = 0; c < 3; c++) {
            px(ctx, -18 + c * 2, -10, 2, 4, "#FFE0B2");
            px(ctx, 12 + c * 2, -10, 2, 4, "#FFE0B2");
          }
        }
      }
      // Warning circle before appearing
      if (molePhase < 0.3) {
        ctx.strokeStyle = `rgba(255,0,0,${0.5 + Math.sin(Date.now() * 0.01) * 0.3})`;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(0, -5, 18 + Math.sin(Date.now() * 0.015) * 4, 0, Math.PI * 2);
        ctx.stroke();
      }
      break;

    case "cone":
      // Traffic cone
      px(ctx, -8, -36, 16, 4, obstDef.color);
      px(ctx, -6, -32, 12, 8, obstDef.color);
      px(ctx, -7, -30, 14, 3, obstDef.detail);
      px(ctx, -4, -24, 8, 12, obstDef.color);
      px(ctx, -5, -18, 10, 3, obstDef.detail);
      px(ctx, -2, -12, 4, 12, obstDef.color);
      px(ctx, -10, -2, 20, 4, obstDef.color);
      break;

    case "sprinkler":
      // Sprinkler head
      px(ctx, -6, -6, 12, 10, "#78909C");
      px(ctx, -4, -10, 8, 6, "#546E7A");
      // Water spray
      const spray = Date.now() * 0.005;
      for (let i = 0; i < 8; i++) {
        const angle = spray + i * 0.8;
        const dist = 12 + Math.sin(angle * 3) * 6;
        const sx = Math.cos(angle) * dist;
        const sy = -10 - Math.abs(Math.sin(angle)) * dist * 0.5;
        px(ctx, sx, sy, 3, 3, `rgba(100,181,246,${0.4 + Math.sin(angle) * 0.3})`);
      }
      break;

    case "camera":
      // Camera on tripod
      px(ctx, -2, -4, 4, 20, "#555");
      px(ctx, -8, 12, 6, 4, "#444");
      px(ctx, 2, 12, 6, 4, "#444");
      // Camera body
      px(ctx, -18, -28, 36, 24, obstDef.color);
      px(ctx, -16, -26, 32, 20, "#444");
      // Lens
      px(ctx, -8, -22, 16, 14, obstDef.detail);
      px(ctx, -5, -19, 10, 8, "#3949AB");
      px(ctx, -2, -16, 4, 4, C.white);
      // Red light
      px(ctx, 12, -26, 4, 4, "#FF1744");
      break;

    case "bottle":
      px(ctx, -7, -22, 14, 20, obstDef.detail);
      px(ctx, -6, -20, 12, 16, obstDef.color);
      px(ctx, -4, -26, 8, 6, "#90CAF9");
      px(ctx, -3, -28, 6, 4, C.white);
      px(ctx, -4, -10, 8, 8, "#1E88E5");
      break;

    case "lighter":
      px(ctx, -5, -16, 10, 16, obstDef.color);
      px(ctx, -4, -14, 8, 12, "#FFB74D");
      px(ctx, -2, -19, 4, 5, "#FF5722");
      px(ctx, -1, -22, 2, 4, C.yellow);
      break;

    case "scarf":
      // Wavy scarf
      for (let s = 0; s < 5; s++) {
        const wave = Math.sin(Date.now() * 0.003 + s) * 3;
        px(ctx, -22 + s * 10, -8 + wave, 10, 10, s % 2 === 0 ? obstDef.color : obstDef.detail);
      }
      // Fringe
      for (let f = 0; f < 4; f++) {
        px(ctx, -22 + f * 3, 2, 2, 5, obstDef.color);
        px(ctx, 18 + f * 3, 2, 2, 5, obstDef.color);
      }
      break;

    case "coin":
      const coinBob = Math.sin(Date.now() * 0.005) * 3;
      px(ctx, -8, -8 + coinBob, 16, 16, obstDef.color);
      px(ctx, -6, -6 + coinBob, 12, 12, obstDef.detail);
      px(ctx, -3, -3 + coinBob, 6, 6, "#FFA000");
      // Spin effect
      ctx.fillStyle = "rgba(255,255,255,0.3)";
      ctx.fillRect(-2, -8 + coinBob, 2, 16);
      break;

    case "beer":
      px(ctx, -8, -22, 16, 22, "#FFF9C4");
      px(ctx, -7, -20, 14, 18, obstDef.color);
      px(ctx, -8, -26, 16, 6, C.white);
      px(ctx, -7, -28, 14, 3, "#F5F5F5");
      px(ctx, 8, -18, 5, 12, "#FFF9C4");
      px(ctx, 10, -16, 4, 8, "#FFF9C4");
      break;

    case "pickpocket":
      // Shady figure
      px(ctx, -10, -38, 20, 30, obstDef.color);
      px(ctx, -8, -36, 16, 26, "#333");
      // Hood
      px(ctx, -8, -42, 16, 10, obstDef.color);
      px(ctx, -6, -40, 12, 6, "#1A1A1A");
      // Eyes (shifty)
      px(ctx, -4, -36, 3, 2, "#FF5252");
      px(ctx, 2, -36, 3, 2, "#FF5252");
      // Grabbing hands
      px(ctx, -16, -20, 8, 8, obstDef.detail);
      px(ctx, 10, -20, 8, 8, obstDef.detail);
      // Legs
      px(ctx, -8, -8, 7, 12, obstDef.color);
      px(ctx, 2, -8, 7, 12, obstDef.color);
      px(ctx, -8, 4, 8, 4, "#212121");
      px(ctx, 2, 4, 8, 4, "#212121");
      break;

    case "wallet":
      px(ctx, -12, -8, 24, 16, obstDef.color);
      px(ctx, -10, -6, 20, 12, obstDef.detail);
      // Cards sticking out
      px(ctx, -6, -12, 12, 6, "#42A5F5");
      px(ctx, -4, -14, 8, 4, "#66BB6A");
      break;

    case "watch":
      const watchBob = Math.sin(Date.now() * 0.004) * 2;
      px(ctx, -10, -10 + watchBob, 20, 20, obstDef.color);
      px(ctx, -8, -8 + watchBob, 16, 16, obstDef.detail);
      px(ctx, -5, -5 + watchBob, 10, 10, "#FFF8E1");
      // Watch hands
      px(ctx, -1, -4 + watchBob, 2, 6, "#333");
      px(ctx, -1, -1 + watchBob, 5, 2, "#333");
      // Strap
      px(ctx, -3, -14 + watchBob, 6, 4, "#5D4037");
      px(ctx, -3, 10 + watchBob, 6, 4, "#5D4037");
      break;
  }

  ctx.restore();
}

function drawPhaseTransition(ctx, progress, fromStadium, toStadium) {
  ctx.fillStyle = `rgba(0,0,0,${Math.sin(progress * Math.PI)})`;
  ctx.fillRect(0, 0, W, H);

  if (progress > 0.3 && progress < 0.7) {
    ctx.fillStyle = C.white;
    ctx.font = "bold 28px monospace";
    ctx.textAlign = "center";
    ctx.fillText(`SIGUIENTE: ${toStadium.name}`, W / 2, H / 2 - 20);
    ctx.font = "16px monospace";
    ctx.fillStyle = C.yellow;
    ctx.fillText(toStadium.subtitle, W / 2, H / 2 + 15);
  }
}

function drawHUD(ctx, score, lives, combo, speed, phase) {
  // Score
  ctx.fillStyle = C.white;
  ctx.font = "bold 22px monospace";
  ctx.textAlign = "left";
  ctx.fillText(`${score}`, 20, H - 12);
  ctx.font = "11px monospace";
  ctx.fillStyle = "#AAA";
  ctx.fillText("PTS", 20 + ctx.measureText(`${score}`).width + 6, H - 12);

  // Combo
  if (combo > 1) {
    ctx.fillStyle = C.yellow;
    ctx.font = "bold 18px monospace";
    ctx.textAlign = "left";
    ctx.fillText(`x${combo}`, 20, H - 34);
  }

  // Lives
  for (let i = 0; i < MAX_LIVES; i++) {
    const hx = W - 36 - i * 32;
    const hy = H - 30;
    const col = i < lives ? C.atletiRed : "#444";
    // Pixel heart
    px(ctx, hx, hy, 6, 6, col);
    px(ctx, hx + 8, hy, 6, 6, col);
    px(ctx, hx - 2, hy + 4, 18, 6, col);
    px(ctx, hx, hy + 10, 14, 4, col);
    px(ctx, hx + 2, hy + 14, 10, 2, col);
    px(ctx, hx + 4, hy + 16, 6, 2, col);
  }

  // Phase indicator
  ctx.fillStyle = "rgba(0,0,0,0.4)";
  ctx.fillRect(W / 2 - 60, H - 26, 120, 20);
  ctx.fillStyle = C.white;
  ctx.font = "bold 12px monospace";
  ctx.textAlign = "center";
  ctx.fillText(`FASE ${phase + 1} / ${STADIUMS.length}`, W / 2, H - 11);
}

// ============== MAIN COMPONENT ==============
export default function CholoRun() {
  const canvasRef = useRef(null);
  const gameRef = useRef(null);
  const [gameState, setGameState] = useState("menu");
  const [finalScore, setFinalScore] = useState(0);
  const [highScore, setHighScore] = useState(0);

  const initGame = useCallback(() => {
    gameRef.current = {
      playerLane: 1,
      targetLane: 1,
      laneSmooth: 1,
      isDucking: false,
      duckTimer: 0,
      frame: 0,
      isInvincible: false,
      invTimer: 0,
      obstacles: [],
      particles: [],
      floats: [],
      score: 0,
      combo: 0,
      lives: MAX_LIVES,
      speed: INITIAL_SPEED,
      scrollX: 0,
      spawnTimer: 0,
      spawnInterval: SPAWN_MAX,
      phase: 0,
      phaseTransition: -1,
      phaseTransitionTarget: 0,
      shakeX: 0,
      shakeY: 0,
      shakeTimer: 0,
      lastNow: Date.now(),
    };
  }, []);

  const startGame = useCallback(() => {
    initGame();
    setGameState("playing");
  }, [initGame]);

  const handleInput = useCallback((action) => {
    if (gameState !== "playing") {
      startGame();
      return;
    }
    const g = gameRef.current;
    if (!g || g.phaseTransition >= 0) return;

    if (action === "left" && g.targetLane > 0) {
      g.targetLane--;
    } else if (action === "right" && g.targetLane < 2) {
      g.targetLane++;
    } else if (action === "duck") {
      g.isDucking = true;
      g.duckTimer = 400;
    }
  }, [gameState, startGame]);

  // Keyboard
  useEffect(() => {
    const onKey = (e) => {
      if (["ArrowLeft", "KeyA"].includes(e.code)) { e.preventDefault(); handleInput("left"); }
      else if (["ArrowRight", "KeyD"].includes(e.code)) { e.preventDefault(); handleInput("right"); }
      else if (["ArrowDown", "KeyS", "Space"].includes(e.code)) { e.preventDefault(); handleInput("duck"); }
      else if (["ArrowUp", "KeyW", "Enter"].includes(e.code)) { e.preventDefault(); handleInput("start"); }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [handleInput]);

  // Touch - swipe
  const touchRef = useRef({ startX: 0, startY: 0 });
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const onTouchStart = (e) => {
      e.preventDefault();
      const t = e.touches[0];
      touchRef.current = { startX: t.clientX, startY: t.clientY };
    };

    const onTouchEnd = (e) => {
      e.preventDefault();
      if (!e.changedTouches[0]) return;
      const t = e.changedTouches[0];
      const dx = t.clientX - touchRef.current.startX;
      const dy = t.clientY - touchRef.current.startY;

      if (gameState !== "playing") {
        startGame();
        return;
      }

      if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 30) {
        handleInput(dx > 0 ? "right" : "left");
      } else if (dy > 20) {
        handleInput("duck");
      } else if (Math.abs(dx) < 15 && Math.abs(dy) < 15) {
        // Tap - use position
        const rect = canvas.getBoundingClientRect();
        const tapX = (t.clientX - rect.left) / rect.width;
        if (tapX < 0.33) handleInput("left");
        else if (tapX > 0.66) handleInput("right");
        else handleInput("duck");
      }
    };

    canvas.addEventListener("touchstart", onTouchStart, { passive: false });
    canvas.addEventListener("touchend", onTouchEnd, { passive: false });
    return () => {
      canvas.removeEventListener("touchstart", onTouchStart);
      canvas.removeEventListener("touchend", onTouchEnd);
    };
  }, [gameState, handleInput, startGame]);

  // Game loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    let raf;

    const loop = () => {
      raf = requestAnimationFrame(loop);
      const now = Date.now();
      ctx.imageSmoothingEnabled = false;

      // ====== MENU ======
      if (gameState === "menu") {
        ctx.fillStyle = C.skyDay;
        ctx.fillRect(0, 0, W, H);

        const stadium = STADIUMS[0];
        drawSky(ctx, stadium);
        drawStands(ctx, stadium, now * 0.02);
        drawGround(ctx, stadium, now * 0.02);
        drawPlayerChar(ctx, W / 2, PLAYER_DRAW_Y, 1, 1, now * 0.06, false, false, now);

        // Title card
        ctx.fillStyle = "rgba(0,0,0,0.7)";
        ctx.fillRect(0, 60, W, 130);
        px(ctx, 0, 60, W, 3, C.atletiRed);
        px(ctx, 0, 187, W, 3, C.atletiRed);

        ctx.fillStyle = C.white;
        ctx.font = "bold 40px monospace";
        ctx.textAlign = "center";
        ctx.fillText("CELEBRACIÓN", W / 2, 105);
        ctx.fillStyle = C.yellow;
        ctx.font = "bold 32px monospace";
        ctx.fillText("POR LA BANDA", W / 2, 142);
        ctx.fillStyle = C.atletiRed;
        ctx.font = "bold 14px monospace";
        ctx.fillText("⚽ 4-0 EDITION ⚽", W / 2, 170);

        // Instructions
        const blink = Math.sin(now * 0.004) > 0;
        if (blink) {
          ctx.fillStyle = C.white;
          ctx.font = "bold 18px monospace";
          ctx.fillText("PULSA CUALQUIER TECLA O TOCA", W / 2, 230);
        }

        ctx.fillStyle = "#AAA";
        ctx.font = "13px monospace";
        ctx.fillText("← → Cambiar carril  |  ↓ Espacio Agacharse", W / 2, 265);
        ctx.fillText("Móvil: Desliza o toca izq/centro/dcha", W / 2, 285);

        if (highScore > 0) {
          ctx.fillStyle = C.gold;
          ctx.font = "bold 16px monospace";
          ctx.fillText(`RÉCORD: ${highScore}`, W / 2, 320);
        }

        ctx.fillStyle = "#555";
        ctx.font = "10px monospace";
        ctx.fillText("Metropolitano → Old Trafford → Bernabéu", W / 2, H - 20);
        return;
      }

      // ====== GAME OVER ======
      if (gameState === "gameover") {
        ctx.fillStyle = "#0A0A1A";
        ctx.fillRect(0, 0, W, H);

        ctx.fillStyle = "rgba(203,50,52,0.15)";
        ctx.fillRect(0, 0, W, H);

        ctx.fillStyle = C.atletiRed;
        ctx.fillRect(W / 2 - 200, 80, 400, 4);

        ctx.fillStyle = C.white;
        ctx.font = "bold 36px monospace";
        ctx.textAlign = "center";
        ctx.fillText("¡FINAL!", W / 2, 130);

        ctx.fillStyle = C.yellow;
        ctx.font = "bold 64px monospace";
        ctx.fillText(`${finalScore}`, W / 2, 210);
        ctx.fillStyle = "#AAA";
        ctx.font = "16px monospace";
        ctx.fillText("PUNTOS", W / 2, 235);

        const g = gameRef.current;
        if (g) {
          ctx.fillStyle = "#888";
          ctx.font = "14px monospace";
          ctx.fillText(`Llegaste a: ${STADIUMS[Math.min(g.phase, STADIUMS.length - 1)].name}`, W / 2, 270);
        }

        if (finalScore >= highScore && finalScore > 0) {
          ctx.fillStyle = C.gold;
          ctx.font = "bold 22px monospace";
          ctx.fillText("🏆 ¡NUEVO RÉCORD! 🏆", W / 2, 310);
        }

        ctx.fillStyle = C.atletiRed;
        ctx.fillRect(W / 2 - 200, 335, 400, 4);

        const blink = Math.sin(now * 0.004) > 0;
        if (blink) {
          ctx.fillStyle = C.white;
          ctx.font = "bold 16px monospace";
          ctx.fillText("TOCA O PULSA PARA REINTENTAR", W / 2, 380);
        }
        return;
      }

      // ====== PLAYING ======
      const g = gameRef.current;
      if (!g) return;

      const dt = Math.min((now - g.lastNow) / 16.67, 3);
      g.lastNow = now;

      // Phase transition
      if (g.phaseTransition >= 0) {
        g.phaseTransition += 0.008 * dt;
        if (g.phaseTransition >= 1) {
          g.phase = g.phaseTransitionTarget;
          g.phaseTransition = -1;
          g.obstacles = [];
          g.spawnTimer = 0;
        }
      }

      // Check phase advancement
      const nextPhaseScore = (g.phase + 1) * PHASE_SCORE;
      if (g.score >= nextPhaseScore && g.phase < STADIUMS.length - 1 && g.phaseTransition < 0) {
        g.phaseTransition = 0;
        g.phaseTransitionTarget = g.phase + 1;
      }

      const stadium = STADIUMS[g.phase];

      // Speed
      g.speed = INITIAL_SPEED + g.score * SPEED_INCREMENT;
      g.scrollX += g.speed * dt * 10;
      g.frame += dt;

      // Smooth lane movement
      g.laneSmooth += (g.targetLane - g.laneSmooth) * 0.15 * dt;

      // Duck
      if (g.isDucking) {
        g.duckTimer -= 16.67 * dt;
        if (g.duckTimer <= 0) g.isDucking = false;
      }

      // Invincibility
      if (g.isInvincible) {
        g.invTimer -= 16.67 * dt;
        if (g.invTimer <= 0) g.isInvincible = false;
      }

      // Shake
      if (g.shakeTimer > 0) {
        g.shakeTimer -= 16.67 * dt;
        g.shakeX = (Math.random() - 0.5) * 6;
        g.shakeY = (Math.random() - 0.5) * 6;
      } else {
        g.shakeX = 0;
        g.shakeY = 0;
      }

      // Spawn
      if (g.phaseTransition < 0) {
        g.spawnTimer += dt;
        const interval = SPAWN_MIN + Math.random() * (SPAWN_MAX - SPAWN_MIN) - g.speed * 3;
        if (g.spawnTimer > Math.max(25, interval)) {
          g.spawnTimer = 0;
          const lane = Math.floor(Math.random() * LANE_COUNT);
          const obsType = Math.floor(Math.random() * stadium.obstacles.length);
          const isMole = stadium.obstacles[obsType].type === "mole";

          g.obstacles.push({
            lane,
            depth: 1,
            type: obsType,
            active: true,
            molePhase: isMole ? -0.5 : undefined,
            screenX: 0,
            screenY: 0,
            scale: 1,
          });
        }
      }

      // Update obstacles
      g.obstacles.forEach(obs => {
        if (obs.molePhase !== undefined) {
          obs.molePhase += 0.015 * dt;
          if (obs.molePhase < 0) {
            obs.depth = 0.35 + Math.random() * 0.15;
          } else {
            obs.depth -= g.speed * 0.004 * dt;
          }
        } else {
          obs.depth -= g.speed * 0.006 * dt;
        }

        obs.scale = depthScale(Math.max(0, obs.depth));
        obs.screenX = laneToX(obs.lane, Math.max(0, obs.depth));
        obs.screenY = depthToY(Math.max(0, obs.depth));

        // Collision
        if (obs.active && obs.depth < 0.12 && obs.depth > -0.02) {
          const sameLane = Math.abs(obs.lane - g.laneSmooth) < 0.6;
          const obsDef = stadium.obstacles[obs.type];
          const isDuckable = obsDef.type === "scarf" || obsDef.type === "bottle" || obsDef.type === "lighter" || obsDef.type === "coin" || obsDef.type === "beer";
          const avoided = !sameLane || (g.isDucking && isDuckable);

          if (!avoided && !g.isInvincible) {
            obs.active = false;
            g.lives--;
            g.combo = 0;
            g.isInvincible = true;
            g.invTimer = INVINCIBLE_MS;
            g.shakeTimer = 300;

            for (let i = 0; i < 10; i++) {
              g.particles.push({
                x: obs.screenX,
                y: obs.screenY,
                vx: (Math.random() - 0.5) * 8,
                vy: -Math.random() * 6,
                life: 1,
                color: C.atletiRed,
              });
            }

            if (g.lives <= 0) {
              setFinalScore(g.score);
              setHighScore(prev => Math.max(prev, g.score));
              setGameState("gameover");
              return;
            }
          }
        }

        // Score for passed obstacles
        if (obs.active && obs.depth < -0.02) {
          obs.active = false;
          g.combo++;
          const pts = stadium.obstacles[obs.type].pts * Math.min(g.combo, 5);
          g.score += pts;
          g.floats.push({
            x: W / 2,
            y: PLAYER_DRAW_Y - 50,
            text: `+${pts}`,
            life: 1,
            color: g.combo >= 3 ? C.yellow : C.white,
          });
        }
      });

      g.obstacles = g.obstacles.filter(o => o.depth > -0.1);

      // Particles
      g.particles.forEach(p => {
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.vy += 0.3 * dt;
        p.life -= 0.025 * dt;
      });
      g.particles = g.particles.filter(p => p.life > 0);

      // Floats
      g.floats.forEach(f => {
        f.y -= 1.5 * dt;
        f.life -= 0.02 * dt;
      });
      g.floats = g.floats.filter(f => f.life > 0);

      // ====== DRAW ======
      ctx.save();
      ctx.translate(g.shakeX, g.shakeY);

      drawSky(ctx, stadium);
      drawStands(ctx, stadium, g.scrollX);
      drawGround(ctx, stadium, g.scrollX);

      // Sort obstacles by depth (far first)
      const sorted = [...g.obstacles].sort((a, b) => b.depth - a.depth);
      sorted.forEach(obs => {
        if (obs.depth > 0 && obs.depth < 1) {
          drawObstacleAtPos(ctx, obs, stadium);
        }
      });

      // Player
      const playerX = laneToX(g.laneSmooth, 0.05);
      drawPlayerChar(ctx, playerX, PLAYER_DRAW_Y, g.laneSmooth, g.targetLane, g.frame, g.isDucking, g.isInvincible, now);

      // Particles
      g.particles.forEach(p => {
        ctx.globalAlpha = p.life;
        px(ctx, p.x, p.y, 4, 4, p.color);
        ctx.globalAlpha = 1;
      });

      // Floating texts
      g.floats.forEach(f => {
        ctx.globalAlpha = f.life;
        ctx.fillStyle = f.color;
        ctx.font = "bold 20px monospace";
        ctx.textAlign = "center";
        ctx.fillText(f.text, f.x, f.y);
        ctx.globalAlpha = 1;
      });

      drawHUD(ctx, g.score, g.lives, g.combo, g.speed, g.phase);

      // Phase transition overlay
      if (g.phaseTransition >= 0) {
        drawPhaseTransition(ctx, g.phaseTransition, STADIUMS[g.phase], STADIUMS[g.phaseTransitionTarget]);
      }

      ctx.restore();
    };

    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [gameState, highScore, finalScore]);

  return (
    <div style={{
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      minHeight: "100vh",
      background: "#0A0A1A",
      fontFamily: "monospace",
      padding: "8px",
      boxSizing: "border-box",
      userSelect: "none",
    }}>
      <canvas
        ref={canvasRef}
        width={W}
        height={H}
        style={{
          border: "3px solid " + C.atletiRed,
          borderRadius: "4px",
          maxWidth: "100%",
          imageRendering: "pixelated",
          cursor: "pointer",
          boxShadow: `0 0 40px rgba(203,50,52,0.3), 0 0 80px rgba(203,50,52,0.1)`,
        }}
        onClick={() => { if (gameState !== "playing") startGame(); }}
      />
      <div style={{ color: "#666", fontSize: "11px", marginTop: "10px", textAlign: "center", lineHeight: "1.6" }}>
        ← → Cambiar carril &nbsp;|&nbsp; ↓ Espacio Agacharse &nbsp;|&nbsp; Móvil: Desliza o toca
      </div>
    </div>
  );
}
