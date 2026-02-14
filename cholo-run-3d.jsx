import { useState, useEffect, useRef, useCallback } from "react";

const W = 960;
const H = 540;
const LANE_COUNT = 3;
const HORIZON_Y = 118;
const GROUND_BOTTOM = H - 22;
const CAMERA_HEIGHT = H - 84;

const INITIAL_SPEED = 2.8;
const SPEED_GROW = 0.00033;
const MAX_LIVES = 3;
const INVINCIBLE_MS = 1250;
const PHASE_SCORE = 320;

const SPAWN_MIN = 42;
const SPAWN_MAX = 75;

const COLORS = {
  white: "#FFFFFF",
  black: "#121212",
  yellow: "#FFD400",
  red: "#CB3234",
  blue: "#253166",
  skin: "#E7B784",
  skinShadow: "#CFA173",
  suit: "#181A28",
  suitLight: "#2A2F45",
  grassA: "#2D8A47",
  grassB: "#236A37",
  shadow: "rgba(0,0,0,0.24)",
};

const STADIUMS = [
  {
    name: "METROPOLITANO",
    subtitle: "Celebración por banda",
    skyTop: "#152E4D",
    skyBottom: "#2E5677",
    standA: "#CB3234",
    standB: "#253166",
    accent: "#8E2022",
    obstacles: [
      { type: "player", name: "Rival", w: 52, h: 35, color: "#FFFFFF", detail: "#1E88E5", pts: 12, avoidBy: "lane" },
      { type: "mole", name: "Topo", w: 40, h: 32, color: "#7A5830", detail: "#5C4325", pts: 25, avoidBy: "lane" },
      { type: "cone", name: "Cono", w: 24, h: 42, color: "#FF6D00", detail: "#FFFFFF", pts: 15, avoidBy: "lane" },
      { type: "camera", name: "Cámara", w: 46, h: 36, color: "#3A3A3A", detail: "#5C6BC0", pts: 18, avoidBy: "lane" },
      { type: "sprinkler", name: "Aspersor", w: 30, h: 22, color: "#90A4AE", detail: "#64B5F6", pts: 14, avoidBy: "lane" },
    ],
  },
  {
    name: "OLD TRAFFORD",
    subtitle: "Ahora sí te tiran cosas",
    skyTop: "#272727",
    skyBottom: "#4B4B4B",
    standA: "#DA291C",
    standB: "#F7E85D",
    accent: "#AA1B13",
    obstacles: [
      { type: "bottle", name: "Botella", w: 18, h: 30, color: "#42A5F5", detail: "#BBDEFB", pts: 15, avoidBy: "duck" },
      { type: "lighter", name: "Mechero", w: 14, h: 22, color: "#FF9800", detail: "#FFD54F", pts: 12, avoidBy: "duck" },
      { type: "scarf", name: "Bufanda", w: 56, h: 16, color: "#DA291C", detail: "#F7E85D", pts: 20, avoidBy: "duck" },
      { type: "coin", name: "Moneda", w: 18, h: 18, color: "#FFD700", detail: "#FFF176", pts: 24, avoidBy: "duck" },
      { type: "beer", name: "Vaso", w: 24, h: 30, color: "#FDD835", detail: "#FFFFFF", pts: 16, avoidBy: "duck" },
    ],
  },
  {
    name: "BERNABÉU",
    subtitle: "Que no te birlen nada",
    skyTop: "#17172D",
    skyBottom: "#33335F",
    standA: "#FFFFFF",
    standB: "#6D4BC3",
    accent: "#D4AF37",
    obstacles: [
      { type: "pickpocket", name: "Carterista", w: 42, h: 46, color: "#252525", detail: "#D7B088", pts: 30, avoidBy: "lane" },
      { type: "wallet", name: "Cartera", w: 28, h: 20, color: "#8D6E63", detail: "#A1887F", pts: 16, avoidBy: "lane" },
      { type: "watch", name: "Reloj", w: 22, h: 22, color: "#FFD54F", detail: "#FFF8E1", pts: 22, avoidBy: "lane" },
      { type: "camera", name: "Cámara VAR", w: 46, h: 36, color: "#212121", detail: "#7C4DFF", pts: 18, avoidBy: "lane" },
      { type: "cone", name: "Cono VIP", w: 24, h: 42, color: "#D4AF37", detail: "#FFFFFF", pts: 14, avoidBy: "lane" },
    ],
  },
];

function px(ctx, x, y, w, h, c) {
  ctx.fillStyle = c;
  ctx.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h));
}

function laneToX(lane, depth, cameraLane) {
  const center = W / 2 - (cameraLane - 1) * (22 + (1 - depth) * 14);
  const spread = 55 + (1 - depth) * 220;
  return center + (lane - 1) * spread;
}

function depthToY(depth) {
  return HORIZON_Y + (GROUND_BOTTOM - HORIZON_Y) * (1 - depth);
}

function depthScale(depth) {
  return 0.25 + (1 - depth) * 0.8;
}

function drawSky(ctx, stadium) {
  const grad = ctx.createLinearGradient(0, 0, 0, HORIZON_Y + 40);
  grad.addColorStop(0, stadium.skyTop);
  grad.addColorStop(1, stadium.skyBottom);
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, W, HORIZON_Y + 40);
}

function drawStands(ctx, stadium, scrollX) {
  const standGrad = ctx.createLinearGradient(0, 30, 0, HORIZON_Y + 40);
  standGrad.addColorStop(0, stadium.standA);
  standGrad.addColorStop(1, stadium.standB);
  ctx.fillStyle = standGrad;

  ctx.beginPath();
  ctx.moveTo(0, 36);
  ctx.lineTo(224, HORIZON_Y - 20);
  ctx.lineTo(224, HORIZON_Y + 24);
  ctx.lineTo(0, H * 0.6);
  ctx.closePath();
  ctx.fill();

  ctx.beginPath();
  ctx.moveTo(W, 36);
  ctx.lineTo(W - 224, HORIZON_Y - 20);
  ctx.lineTo(W - 224, HORIZON_Y + 24);
  ctx.lineTo(W, H * 0.6);
  ctx.closePath();
  ctx.fill();

  const crowd = [stadium.standA, stadium.standB, stadium.accent, "#CE9C6E", "#F2D2B4"];
  for (let side = 0; side < 2; side++) {
    for (let r = 0; r < 7; r++) {
      for (let c = 0; c < 15; c++) {
        const wave = Math.sin(scrollX * 0.02 + r + c) * 1.8;
        const x = side === 0 ? 14 + c * 13 + wave : W - 14 - c * 13 + wave;
        const y = 44 + r * 15 + c * 0.9;
        px(ctx, x, y, 7, 7, "#E9BA88");
        px(ctx, x - 1, y + 7, 9, 10, crowd[(r + c) % crowd.length]);
      }
    }
  }

  ctx.fillStyle = "rgba(0,0,0,0.55)";
  ctx.fillRect(W / 2 - 180, 10, 360, 28);
  ctx.fillStyle = COLORS.white;
  ctx.textAlign = "center";
  ctx.font = "bold 16px monospace";
  ctx.fillText(stadium.name, W / 2, 29);
}

function drawGround(ctx, stadium, scrollX, cameraLane) {
  const grad = ctx.createLinearGradient(0, HORIZON_Y, 0, H);
  grad.addColorStop(0, COLORS.grassB);
  grad.addColorStop(1, COLORS.grassA);
  ctx.fillStyle = grad;
  ctx.fillRect(0, HORIZON_Y, W, H - HORIZON_Y);

  for (let i = 0; i < 14; i++) {
    const d = 1 - ((i * 0.08 + (scrollX * 0.012) % 0.08) % 1);
    const y = depthToY(d);
    const y2 = depthToY(Math.max(0, d - 0.045));
    if (i % 2 === 0) {
      ctx.fillStyle = "rgba(255,255,255,0.04)";
      ctx.fillRect(0, y, W, y2 - y);
    }
  }

  for (let d = 0; d < 1; d += 0.01) {
    const y = depthToY(d);
    const left = laneToX(1, d, cameraLane) - (78 + (1 - d) * 95);
    px(ctx, left, y, Math.max(1, 3 - d), 2, "#FFFFFFCC");
  }

  for (let lane = 0; lane < LANE_COUNT; lane++) {
    for (let d = 0; d < 1; d += 0.03) {
      const seg = (d + (scrollX * 0.006) % 0.07) % 1;
      const y = depthToY(seg);
      const sc = depthScale(seg);
      const x = laneToX(lane, seg, cameraLane);
      px(ctx, x - sc * 2, y, sc * 4, Math.max(1, sc * 4), "rgba(255,255,255,0.08)");
    }
  }

  ctx.fillStyle = "rgba(0,0,0,0.22)";
  ctx.fillRect(0, CAMERA_HEIGHT + 15, W, H - (CAMERA_HEIGHT + 15));
}

function drawCoachBack(ctx, x, y, frame, isDucking, isInvincible, now, laneLean) {
  if (isInvincible && Math.floor(now / 70) % 2 === 0) return;

  const bob = Math.sin(frame * 0.22) * 3;
  const lean = laneLean * 9;
  ctx.save();
  ctx.translate(x, y + bob);

  ctx.fillStyle = COLORS.shadow;
  ctx.beginPath();
  ctx.ellipse(0, 42, 58, 14, 0, 0, Math.PI * 2);
  ctx.fill();

  const legSwing = Math.sin(frame * 0.32) * 12;
  px(ctx, -24 + lean * 0.4, 10, 16, 44 + legSwing, COLORS.suit);
  px(ctx, 8 + lean * 0.4, 10, 16, 44 - legSwing, COLORS.suit);
  px(ctx, -28 + lean * 0.4, 48 + legSwing, 22, 8, COLORS.black);
  px(ctx, 6 + lean * 0.4, 48 - legSwing, 22, 8, COLORS.black);

  if (isDucking) {
    px(ctx, -36 + lean, -14, 72, 38, COLORS.suit);
    px(ctx, -30 + lean, -10, 60, 30, COLORS.suitLight);
    px(ctx, -20 + lean, -34, 40, 22, COLORS.skin);
    px(ctx, -20 + lean, -40, 40, 10, COLORS.black);
    px(ctx, -42 + lean, -8, 12, 24, COLORS.suit);
    px(ctx, 30 + lean, -8, 12, 24, COLORS.suit);
  } else {
    px(ctx, -34 + lean, -36, 68, 58, COLORS.suit);
    px(ctx, -30 + lean, -32, 60, 50, COLORS.suitLight);
    px(ctx, -6 + lean, -36, 12, 34, COLORS.red);

    const armSwing = Math.sin(frame * 0.32) * 15;
    px(ctx, -52 + lean, -24 + armSwing, 16, 38, COLORS.suit);
    px(ctx, 36 + lean, -24 - armSwing, 16, 38, COLORS.suit);
    px(ctx, -50 + lean, 10 + armSwing, 12, 10, COLORS.skin);
    px(ctx, 38 + lean, 10 - armSwing, 12, 10, COLORS.skin);

    px(ctx, -20 + lean, -68, 40, 34, COLORS.skin);
    px(ctx, -20 + lean, -74, 40, 10, COLORS.black);
    px(ctx, -22 + lean, -70, 44, 8, "#323232");
    px(ctx, -14 + lean, -44, 6, 4, COLORS.skinShadow);
    px(ctx, 8 + lean, -44, 6, 4, COLORS.skinShadow);
  }

  ctx.restore();
}

function drawObstacle(ctx, obs, stadium) {
  const def = stadium.obstacles[obs.type];
  if (!def) return;

  ctx.save();
  ctx.translate(obs.screenX, obs.screenY);
  ctx.scale(obs.scale, obs.scale);

  switch (def.type) {
    case "player":
      px(ctx, -22, -10, 44, 18, def.color);
      px(ctx, -20, -8, 40, 14, def.detail);
      px(ctx, -28, -16, 14, 12, COLORS.skin);
      px(ctx, 14, -6, 16, 10, def.color);
      px(ctx, 26, -4, 8, 8, COLORS.black);
      break;
    case "mole": {
      const phase = obs.molePhase ?? 1;
      const h = Math.max(0, Math.min(1, phase)) * 30;
      px(ctx, -20, -2, 40, 8, "#5D4037");
      if (h > 2) {
        px(ctx, -14, -h, 28, h, def.color);
        px(ctx, -12, -h + 2, 24, Math.max(0, h - 4), def.detail);
      }
      if (phase < 0.25) {
        ctx.strokeStyle = `rgba(255,0,0,${0.4 + Math.sin(Date.now() * 0.01) * 0.3})`;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(0, -4, 16 + Math.sin(Date.now() * 0.01) * 3, 0, Math.PI * 2);
        ctx.stroke();
      }
      break;
    }
    case "cone":
      px(ctx, -8, -34, 16, 4, def.color);
      px(ctx, -6, -30, 12, 8, def.color);
      px(ctx, -7, -28, 14, 3, def.detail);
      px(ctx, -4, -22, 8, 12, def.color);
      px(ctx, -10, -2, 20, 4, def.color);
      break;
    case "camera":
      px(ctx, -2, -4, 4, 20, "#555");
      px(ctx, -18, -28, 36, 24, def.color);
      px(ctx, -8, -22, 16, 14, def.detail);
      px(ctx, -3, -17, 6, 6, "#E3F2FD");
      break;
    case "sprinkler": {
      px(ctx, -6, -6, 12, 10, def.color);
      const t = Date.now() * 0.007;
      for (let i = 0; i < 8; i++) {
        const a = t + i * 0.7;
        px(ctx, Math.cos(a) * 12, -14 - Math.abs(Math.sin(a)) * 10, 3, 3, def.detail);
      }
      break;
    }
    case "bottle":
      px(ctx, -7, -24, 14, 22, def.detail);
      px(ctx, -6, -22, 12, 18, def.color);
      px(ctx, -3, -28, 6, 6, COLORS.white);
      break;
    case "lighter":
      px(ctx, -5, -16, 10, 16, def.color);
      px(ctx, -2, -20, 4, 5, "#FF5722");
      px(ctx, -1, -23, 2, 3, COLORS.yellow);
      break;
    case "scarf":
      for (let s = 0; s < 6; s++) {
        const wave = Math.sin(Date.now() * 0.004 + s) * 3;
        px(ctx, -24 + s * 9, -8 + wave, 10, 10, s % 2 ? def.detail : def.color);
      }
      break;
    case "coin": {
      const bob = Math.sin(Date.now() * 0.006) * 3;
      px(ctx, -8, -8 + bob, 16, 16, def.color);
      px(ctx, -6, -6 + bob, 12, 12, def.detail);
      break;
    }
    case "beer":
      px(ctx, -8, -22, 16, 22, "#FFF9C4");
      px(ctx, -7, -20, 14, 18, def.color);
      px(ctx, -8, -26, 16, 5, COLORS.white);
      break;
    case "pickpocket":
      px(ctx, -10, -38, 20, 30, def.color);
      px(ctx, -8, -42, 16, 10, "#111");
      px(ctx, -4, -36, 3, 2, "#FF5252");
      px(ctx, 2, -36, 3, 2, "#FF5252");
      px(ctx, -16, -20, 8, 8, def.detail);
      px(ctx, 10, -20, 8, 8, def.detail);
      break;
    case "wallet":
      px(ctx, -12, -8, 24, 16, def.color);
      px(ctx, -10, -6, 20, 12, def.detail);
      break;
    case "watch": {
      const bob = Math.sin(Date.now() * 0.004) * 2;
      px(ctx, -10, -10 + bob, 20, 20, def.color);
      px(ctx, -8, -8 + bob, 16, 16, def.detail);
      break;
    }
    default:
      break;
  }

  ctx.restore();
}

function drawHUD(ctx, score, lives, combo, phase) {
  ctx.textAlign = "left";
  ctx.fillStyle = COLORS.white;
  ctx.font = "bold 24px monospace";
  ctx.fillText(`${score}`, 20, H - 18);
  ctx.font = "11px monospace";
  ctx.fillStyle = "#C8C8C8";
  ctx.fillText("PTS", 20 + ctx.measureText(`${score}`).width + 8, H - 18);

  if (combo > 1) {
    ctx.fillStyle = COLORS.yellow;
    ctx.font = "bold 18px monospace";
    ctx.fillText(`x${combo}`, 20, H - 40);
  }

  for (let i = 0; i < MAX_LIVES; i++) {
    const x = W - 36 - i * 32;
    const y = H - 34;
    const c = i < lives ? COLORS.red : "#444";
    px(ctx, x, y, 6, 6, c);
    px(ctx, x + 8, y, 6, 6, c);
    px(ctx, x - 2, y + 4, 18, 6, c);
    px(ctx, x, y + 10, 14, 4, c);
  }

  ctx.fillStyle = "rgba(0,0,0,0.45)";
  ctx.fillRect(W / 2 - 70, H - 28, 140, 22);
  ctx.fillStyle = COLORS.white;
  ctx.textAlign = "center";
  ctx.font = "bold 12px monospace";
  ctx.fillText(`FASE ${phase + 1}/${STADIUMS.length}`, W / 2, H - 12);
}

function drawPhaseTransition(ctx, p, toStadium) {
  ctx.fillStyle = `rgba(0,0,0,${Math.sin(p * Math.PI) * 0.86})`;
  ctx.fillRect(0, 0, W, H);
  if (p > 0.28 && p < 0.72) {
    ctx.fillStyle = COLORS.white;
    ctx.font = "bold 30px monospace";
    ctx.textAlign = "center";
    ctx.fillText(`SIGUIENTE: ${toStadium.name}`, W / 2, H / 2 - 16);
    ctx.fillStyle = COLORS.yellow;
    ctx.font = "16px monospace";
    ctx.fillText(toStadium.subtitle, W / 2, H / 2 + 16);
  }
}

export default function CholoRun() {
  const canvasRef = useRef(null);
  const gameRef = useRef(null);
  const touchRef = useRef({ x: 0, y: 0 });

  const [gameState, setGameState] = useState("menu");
  const [finalScore, setFinalScore] = useState(0);
  const [highScore, setHighScore] = useState(0);

  const initGame = useCallback(() => {
    gameRef.current = {
      lane: 1,
      targetLane: 1,
      laneSmooth: 1,
      isDucking: false,
      duckTimer: 0,
      isInvincible: false,
      invTimer: 0,
      frame: 0,
      score: 0,
      combo: 0,
      lives: MAX_LIVES,
      speed: INITIAL_SPEED,
      scrollX: 0,
      obstacles: [],
      particles: [],
      floats: [],
      spawnTimer: 0,
      spawnInterval: SPAWN_MIN + Math.random() * (SPAWN_MAX - SPAWN_MIN),
      phase: 0,
      phaseTransition: -1,
      phaseTransitionTarget: 0,
      shakeTimer: 0,
      shakeX: 0,
      shakeY: 0,
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

    if (action === "left" && g.targetLane > 0) g.targetLane -= 1;
    else if (action === "right" && g.targetLane < 2) g.targetLane += 1;
    else if (action === "duck") {
      g.isDucking = true;
      g.duckTimer = 390;
    }
  }, [gameState, startGame]);

  useEffect(() => {
    const onKey = (e) => {
      if (["ArrowLeft", "KeyA"].includes(e.code)) {
        e.preventDefault();
        handleInput("left");
      } else if (["ArrowRight", "KeyD"].includes(e.code)) {
        e.preventDefault();
        handleInput("right");
      } else if (["ArrowDown", "KeyS", "Space"].includes(e.code)) {
        e.preventDefault();
        handleInput("duck");
      } else if (["ArrowUp", "KeyW", "Enter"].includes(e.code)) {
        e.preventDefault();
        handleInput("start");
      }
    };

    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [handleInput]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const onTouchStart = (e) => {
      e.preventDefault();
      const t = e.touches[0];
      touchRef.current = { x: t.clientX, y: t.clientY };
    };

    const onTouchEnd = (e) => {
      e.preventDefault();
      const t = e.changedTouches[0];
      if (!t) return;
      const dx = t.clientX - touchRef.current.x;
      const dy = t.clientY - touchRef.current.y;

      if (gameState !== "playing") {
        startGame();
        return;
      }

      if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 26) {
        handleInput(dx > 0 ? "right" : "left");
      } else if (dy > 18) {
        handleInput("duck");
      } else if (Math.abs(dx) < 15 && Math.abs(dy) < 15) {
        const rect = canvas.getBoundingClientRect();
        const tx = (t.clientX - rect.left) / rect.width;
        if (tx < 0.33) handleInput("left");
        else if (tx > 0.66) handleInput("right");
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

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    let raf;

    const loop = () => {
      raf = requestAnimationFrame(loop);
      const now = Date.now();
      ctx.imageSmoothingEnabled = false;

      if (gameState === "menu") {
        const stadium = STADIUMS[0];
        drawSky(ctx, stadium);
        drawStands(ctx, stadium, now * 0.02);
        drawGround(ctx, stadium, now * 0.02, 1);
        drawCoachBack(ctx, W / 2, CAMERA_HEIGHT, now * 0.03, false, false, now, 0);

        ctx.fillStyle = "rgba(0,0,0,0.52)";
        ctx.fillRect(W / 2 - 330, 108, 660, 264);
        ctx.textAlign = "center";
        ctx.fillStyle = COLORS.white;
        ctx.font = "bold 56px monospace";
        ctx.fillText("CHOLO RUN", W / 2, 172);
        ctx.fillStyle = COLORS.red;
        ctx.font = "bold 22px monospace";
        ctx.fillText("Pseudo primera persona detrás del míster", W / 2, 208);
        ctx.fillStyle = "#CCCCCC";
        ctx.font = "15px monospace";
        ctx.fillText("Esquiva por carriles, agáchate a tiempo y supera estadios", W / 2, 236);
        ctx.fillStyle = COLORS.yellow;
        ctx.font = "bold 16px monospace";
        ctx.fillText("← → mover | ↓ / espacio agacharse", W / 2, 272);

        const blink = Math.sin(now * 0.006) > 0;
        if (blink) {
          ctx.fillStyle = COLORS.white;
          ctx.font = "bold 20px monospace";
          ctx.fillText("PULSA CUALQUIER TECLA O TOCA PARA EMPEZAR", W / 2, 326);
        }

        if (highScore > 0) {
          ctx.fillStyle = "#FFD54F";
          ctx.font = "bold 18px monospace";
          ctx.fillText(`RÉCORD: ${highScore}`, W / 2, 358);
        }
        return;
      }

      if (gameState === "gameover") {
        const stadium = STADIUMS[Math.min(STADIUMS.length - 1, 1)];
        drawSky(ctx, stadium);
        drawStands(ctx, stadium, now * 0.02);
        drawGround(ctx, stadium, now * 0.02, 1);

        ctx.fillStyle = "rgba(0,0,0,0.62)";
        ctx.fillRect(W / 2 - 260, 94, 520, 326);
        ctx.textAlign = "center";
        ctx.fillStyle = COLORS.red;
        ctx.font = "bold 52px monospace";
        ctx.fillText("GAME OVER", W / 2, 170);

        ctx.fillStyle = COLORS.white;
        ctx.font = "bold 62px monospace";
        ctx.fillText(`${finalScore}`, W / 2, 244);
        ctx.fillStyle = "#BBB";
        ctx.font = "15px monospace";
        ctx.fillText("PUNTOS", W / 2, 268);

        if (finalScore >= highScore && finalScore > 0) {
          ctx.fillStyle = COLORS.yellow;
          ctx.font = "bold 24px monospace";
          ctx.fillText("¡NUEVO RÉCORD!", W / 2, 306);
        }

        const blink = Math.sin(now * 0.006) > 0;
        if (blink) {
          ctx.fillStyle = COLORS.white;
          ctx.font = "bold 18px monospace";
          ctx.fillText("TOCA O PULSA PARA REINICIAR", W / 2, 360);
        }
        return;
      }

      const g = gameRef.current;
      if (!g) return;

      const dt = Math.min((now - g.lastNow) / 16.67, 3);
      g.lastNow = now;
      g.frame += dt;

      if (g.phaseTransition >= 0) {
        g.phaseTransition += 0.01 * dt;
        if (g.phaseTransition >= 1) {
          g.phase = g.phaseTransitionTarget;
          g.phaseTransition = -1;
          g.obstacles = [];
          g.spawnTimer = 0;
          g.spawnInterval = SPAWN_MIN + Math.random() * (SPAWN_MAX - SPAWN_MIN);
        }
      }

      const nextPhaseScore = (g.phase + 1) * PHASE_SCORE;
      if (g.phase < STADIUMS.length - 1 && g.phaseTransition < 0 && g.score >= nextPhaseScore) {
        g.phaseTransition = 0;
        g.phaseTransitionTarget = g.phase + 1;
      }

      const stadium = STADIUMS[g.phase];
      g.speed = INITIAL_SPEED + g.score * SPEED_GROW;
      g.scrollX += g.speed * dt * 10;
      g.laneSmooth += (g.targetLane - g.laneSmooth) * 0.18 * dt;

      if (g.isDucking) {
        g.duckTimer -= 16.67 * dt;
        if (g.duckTimer <= 0) g.isDucking = false;
      }

      if (g.isInvincible) {
        g.invTimer -= 16.67 * dt;
        if (g.invTimer <= 0) g.isInvincible = false;
      }

      if (g.shakeTimer > 0) {
        g.shakeTimer -= 16.67 * dt;
        g.shakeX = (Math.random() - 0.5) * 5;
        g.shakeY = (Math.random() - 0.5) * 5;
      } else {
        g.shakeX = 0;
        g.shakeY = 0;
      }

      if (g.phaseTransition < 0) {
        g.spawnTimer += dt;
        if (g.spawnTimer >= g.spawnInterval) {
          g.spawnTimer = 0;
          const lane = Math.floor(Math.random() * LANE_COUNT);
          const type = Math.floor(Math.random() * stadium.obstacles.length);
          const isMole = stadium.obstacles[type].type === "mole";
          g.obstacles.push({
            lane,
            type,
            depth: 1,
            active: true,
            molePhase: isMole ? -0.55 : undefined,
            screenX: 0,
            screenY: 0,
            scale: 1,
          });

          const speedBias = Math.min(16, g.speed * 2.2);
          const phaseBias = g.phase * 3;
          g.spawnInterval = Math.max(28, SPAWN_MIN + Math.random() * (SPAWN_MAX - SPAWN_MIN) - speedBias - phaseBias);
        }
      }

      g.obstacles.forEach((obs) => {
        if (obs.molePhase !== undefined) {
          obs.molePhase += 0.017 * dt;
          obs.depth = obs.molePhase < 0 ? 0.35 : obs.depth - g.speed * 0.004 * dt;
        } else {
          obs.depth -= g.speed * 0.006 * dt;
        }

        const d = Math.max(0, obs.depth);
        obs.scale = depthScale(d);
        obs.screenX = laneToX(obs.lane, d, g.laneSmooth);
        obs.screenY = depthToY(d);

        if (obs.active && obs.depth < 0.13 && obs.depth > -0.03) {
          const def = stadium.obstacles[obs.type];
          const sameLane = Math.abs(obs.lane - g.laneSmooth) < 0.58;
          const avoidedByLane = !sameLane;
          const avoidedByDuck = def.avoidBy === "duck" && g.isDucking;
          const avoided = avoidedByLane || avoidedByDuck;

          if (!avoided && !g.isInvincible) {
            obs.active = false;
            g.lives -= 1;
            g.combo = 0;
            g.isInvincible = true;
            g.invTimer = INVINCIBLE_MS;
            g.shakeTimer = 240;

            for (let i = 0; i < 10; i++) {
              g.particles.push({
                x: obs.screenX,
                y: obs.screenY,
                vx: (Math.random() - 0.5) * 8,
                vy: -Math.random() * 6,
                life: 1,
                color: COLORS.red,
              });
            }

            if (g.lives <= 0) {
              setFinalScore(g.score);
              setHighScore((prev) => Math.max(prev, g.score));
              setGameState("gameover");
            }
          }
        }

        if (obs.active && obs.depth < -0.03) {
          obs.active = false;
          g.combo += 1;
          const pts = stadium.obstacles[obs.type].pts * Math.min(5, g.combo);
          g.score += pts;
          g.floats.push({ x: W / 2, y: CAMERA_HEIGHT - 118, text: `+${pts}`, life: 1, color: g.combo >= 3 ? COLORS.yellow : COLORS.white });
        }
      });

      g.obstacles = g.obstacles.filter((o) => o.depth > -0.14);

      g.particles.forEach((p) => {
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.vy += 0.32 * dt;
        p.life -= 0.03 * dt;
      });
      g.particles = g.particles.filter((p) => p.life > 0);

      g.floats.forEach((f) => {
        f.y -= 1.6 * dt;
        f.life -= 0.02 * dt;
      });
      g.floats = g.floats.filter((f) => f.life > 0);

      ctx.save();
      ctx.translate(g.shakeX, g.shakeY);

      drawSky(ctx, stadium);
      drawStands(ctx, stadium, g.scrollX);
      drawGround(ctx, stadium, g.scrollX, g.laneSmooth);

      const sorted = [...g.obstacles].sort((a, b) => b.depth - a.depth);
      sorted.forEach((obs) => {
        if (obs.depth > 0 && obs.depth < 1) drawObstacle(ctx, obs, stadium);
      });

      drawCoachBack(ctx, W / 2, CAMERA_HEIGHT, g.frame, g.isDucking, g.isInvincible, now, g.targetLane - g.laneSmooth);

      g.particles.forEach((p) => {
        ctx.globalAlpha = p.life;
        px(ctx, p.x, p.y, 4, 4, p.color);
        ctx.globalAlpha = 1;
      });

      g.floats.forEach((f) => {
        ctx.globalAlpha = f.life;
        ctx.fillStyle = f.color;
        ctx.font = "bold 20px monospace";
        ctx.textAlign = "center";
        ctx.fillText(f.text, f.x, f.y);
        ctx.globalAlpha = 1;
      });

      drawHUD(ctx, g.score, g.lives, g.combo, g.phase);

      if (g.phaseTransition >= 0) {
        drawPhaseTransition(ctx, g.phaseTransition, STADIUMS[g.phaseTransitionTarget]);
      }

      ctx.restore();
    };

    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [gameState, finalScore, highScore]);

  return (
    <div style={{
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      minHeight: "100vh",
      background: "#0A0D19",
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
          border: "3px solid #CB3234",
          borderRadius: "4px",
          maxWidth: "100%",
          imageRendering: "pixelated",
          cursor: "pointer",
          boxShadow: "0 0 40px rgba(203,50,52,0.3), 0 0 80px rgba(203,50,52,0.1)",
        }}
        onClick={() => {
          if (gameState !== "playing") startGame();
        }}
      />
      <div style={{ color: "#6D6D6D", fontSize: "11px", marginTop: "10px", textAlign: "center", lineHeight: 1.6 }}>
        Perspectiva pseudo 1ª persona (cámara detrás del entrenador) · ← → carril · ↓ / espacio agacharse
      </div>
    </div>
  );
}
