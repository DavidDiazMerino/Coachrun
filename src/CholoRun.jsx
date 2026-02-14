import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import {
  CAMERA_HEIGHT,
  COLORS,
  H,
  W,
} from "./game/constants";
import { STADIUMS } from "./game/stadiums";
import { drawSky } from "./game/render/drawSky";
import { drawStands } from "./game/render/drawStands";
import { drawGround } from "./game/render/drawGround";
import { drawCoachBack } from "./game/render/drawCoachBack";
import { drawObstacle, drawBooster } from "./game/render/drawObstacle";
import { drawHUD } from "./game/render/drawHUD";
import { px } from "./game/render/projection";
import { createInitialGameState, updateGameState } from "./game/core/updateGame";
import {
  CHALLENGES,
  PROGRESSION_KEYS,
  deriveActiveCosmetics,
  evaluateProgress,
  getNextChallenge,
  isBrowserRuntime,
  resolveCosmeticTheme,
  safeReadJSON,
  safeWriteJSON,
} from "./game/progression";

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

function drawTrophy(ctx, x, y, now) {
  const bob = Math.sin(now * 0.003) * 4;
  const glow = 0.5 + Math.sin(now * 0.005) * 0.3;

  ctx.save();
  ctx.translate(x, y + bob);

  // Glow
  ctx.globalAlpha = glow * 0.4;
  ctx.fillStyle = "#FFD600";
  ctx.beginPath();
  ctx.arc(0, -40, 60, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalAlpha = 1;

  // Cup body
  px(ctx, -30, -80, 60, 50, "#FFD600");
  px(ctx, -26, -76, 52, 42, "#FFF176");
  // Handles
  px(ctx, -42, -72, 14, 30, "#FFD600");
  px(ctx, 28, -72, 14, 30, "#FFD600");
  // Stem
  px(ctx, -8, -30, 16, 20, "#FFD600");
  // Base
  px(ctx, -24, -12, 48, 12, "#FFD600");
  px(ctx, -20, -8, 40, 8, "#FFF176");
  // Star
  px(ctx, -4, -64, 8, 8, "#FF6F00");

  // Sparkle particles
  for (let i = 0; i < 6; i++) {
    const angle = now * 0.002 + i * 1.05;
    const radius = 50 + Math.sin(now * 0.004 + i) * 10;
    const sx = Math.cos(angle) * radius;
    const sy = Math.sin(angle) * radius - 40;
    ctx.globalAlpha = 0.6 + Math.sin(now * 0.006 + i) * 0.3;
    px(ctx, sx - 2, sy - 2, 4, 4, "#FFFFFF");
  }
  ctx.globalAlpha = 1;

  ctx.restore();
}

const UI_SCALE = Math.min(W / 960, H / 540);
const s = (value) => Math.round(value * UI_SCALE);

function drawTrail(ctx, now, laneDrift, trailTheme) {
  const pulseBoost = trailTheme.pulse ? (Math.sin(now * 0.018) + 1.4) * 0.2 : 1;
  for (let i = 0; i < 7; i++) {
    const y = CAMERA_HEIGHT + 4 + i * 11;
    const width = 40 - i * 3;
    const alpha = Math.max(0.05, (0.4 - i * 0.04) * pulseBoost);
    ctx.globalAlpha = alpha;
    px(ctx, W / 2 - width / 2 - laneDrift * 10, y, width, 4, trailTheme.color);
  }
  ctx.globalAlpha = 1;
}

function formatTime(ms) {
  const totalSec = Math.floor(ms / 1000);
  const min = Math.floor(totalSec / 60);
  const sec = totalSec % 60;
  return `${min}:${sec.toString().padStart(2, "0")}`;
}

export default function CholoRun() {
  const STORAGE_KEYS = {
    highScore: "choloRun.highScore",
    gamesPlayed: "choloRun.gamesPlayed",
    bestCombo: "choloRun.bestCombo",
    bestPhase: "choloRun.bestPhase",
    totalDodges: "choloRun.totalDodges",
    totalNearMisses: "choloRun.totalNearMisses",
    bestNoDamageDodges: "choloRun.bestNoDamageDodges",
    phase3PerfectRuns: "choloRun.phase3PerfectRuns",
  };

  const readStoredNumber = (key, fallback = 0) => {
    try {
      if (!isBrowserRuntime()) return fallback;
      const value = window.localStorage.getItem(key);
      if (value === null) return fallback;
      const parsed = Number(value);
      return Number.isFinite(parsed) ? parsed : fallback;
    } catch {
      return fallback;
    }
  };

  const writeStoredNumber = (key, value) => {
    try {
      if (!isBrowserRuntime()) return;
      window.localStorage.setItem(key, String(value));
    } catch {
      // Modo incógnito / storage bloqueado: ignoramos sin romper el juego.
    }
  };

  const canvasRef = useRef(null);
  const gameRef = useRef(null);
  const pointerRef = useRef({ x: 0, y: 0, active: false });

  const [gameState, setGameState] = useState("menu");
  const [finalScore, setFinalScore] = useState(0);
  const [finalTime, setFinalTime] = useState(0);
  const [shareText, setShareText] = useState(null);
  const [highScore, setHighScore] = useState(0);
  const [gamesPlayed, setGamesPlayed] = useState(0);
  const [bestCombo, setBestCombo] = useState(0);
  const [bestPhase, setBestPhase] = useState(0);
  const [totalDodges, setTotalDodges] = useState(0);
  const [totalNearMisses, setTotalNearMisses] = useState(0);
  const [bestNoDamageDodges, setBestNoDamageDodges] = useState(0);
  const [phase3PerfectRuns, setPhase3PerfectRuns] = useState(0);

  const profile = useMemo(() => ({
    gamesPlayed,
    highScore,
    bestCombo,
    bestPhase,
    totalDodges,
    totalNearMisses,
    bestNoDamageDodges,
    phase3PerfectRuns,
  }), [gamesPlayed, highScore, bestCombo, bestPhase, totalDodges, totalNearMisses, bestNoDamageDodges, phase3PerfectRuns]);

  const progression = useMemo(() => evaluateProgress(profile), [profile]);
  const nextChallenge = useMemo(() => getNextChallenge(progression.challenges), [progression.challenges]);
  const activeCosmetics = useMemo(() => deriveActiveCosmetics(progression.unlocks), [progression.unlocks]);
  const cosmeticTheme = useMemo(() => resolveCosmeticTheme(activeCosmetics), [activeCosmetics]);

  useEffect(() => {
    if (!isBrowserRuntime()) return;

    setHighScore(readStoredNumber(STORAGE_KEYS.highScore));
    setGamesPlayed(readStoredNumber(STORAGE_KEYS.gamesPlayed));
    setBestCombo(readStoredNumber(STORAGE_KEYS.bestCombo));
    setBestPhase(readStoredNumber(STORAGE_KEYS.bestPhase));
    setTotalDodges(readStoredNumber(STORAGE_KEYS.totalDodges));
    setTotalNearMisses(readStoredNumber(STORAGE_KEYS.totalNearMisses));
    setBestNoDamageDodges(readStoredNumber(STORAGE_KEYS.bestNoDamageDodges));
    setPhase3PerfectRuns(readStoredNumber(STORAGE_KEYS.phase3PerfectRuns));

    const storedUnlocks = safeReadJSON(PROGRESSION_KEYS.unlocks, null);
    const storedChallenges = safeReadJSON(PROGRESSION_KEYS.challenges, null);
    if (!storedUnlocks || !storedChallenges) {
      const initial = evaluateProgress({
        gamesPlayed: readStoredNumber(STORAGE_KEYS.gamesPlayed),
        highScore: readStoredNumber(STORAGE_KEYS.highScore),
        bestCombo: readStoredNumber(STORAGE_KEYS.bestCombo),
        bestPhase: readStoredNumber(STORAGE_KEYS.bestPhase),
        totalDodges: readStoredNumber(STORAGE_KEYS.totalDodges),
        totalNearMisses: readStoredNumber(STORAGE_KEYS.totalNearMisses),
        bestNoDamageDodges: readStoredNumber(STORAGE_KEYS.bestNoDamageDodges),
        phase3PerfectRuns: readStoredNumber(STORAGE_KEYS.phase3PerfectRuns),
      });
      safeWriteJSON(PROGRESSION_KEYS.unlocks, initial.unlocks);
      safeWriteJSON(PROGRESSION_KEYS.challenges, initial.challenges);
    }
  }, []);

  useEffect(() => {
    if (!isBrowserRuntime()) return;
    safeWriteJSON(PROGRESSION_KEYS.unlocks, progression.unlocks);
    safeWriteJSON(PROGRESSION_KEYS.challenges, progression.challenges);
  }, [progression.unlocks, progression.challenges]);

  const initGame = useCallback(() => {
    gameRef.current = createInitialGameState();
  }, []);

  const startGame = useCallback(() => {
    initGame();
    setShareText(null);
    setGameState("playing");
  }, [initGame]);

  const shareResult = useCallback(async (score, timeMs, isVictory) => {
    const timeStr = formatTime(timeMs);
    const text = isVictory
      ? `He completado Cholo Run con ${score} puntos en ${timeStr}. CAMPEON!`
      : `He llegado a ${score} puntos en Cholo Run en ${timeStr}. Puedes superarlo?`;

    const url = window.location.href;

    if (navigator.share) {
      try {
        await navigator.share({ title: "Cholo Run", text, url });
        return;
      } catch (e) {
        if (e.name === "AbortError") return;
      }
    }

    try {
      await navigator.clipboard.writeText(`${text}\n${url}`);
      setShareText("Copiado!");
      setTimeout(() => setShareText(null), 2000);
    } catch {
      // Silent fail
    }
  }, []);

  const saveEndGameStats = useCallback((g, score) => {
    setFinalScore(score);
    setFinalTime(g.elapsedTime);
    setHighScore((prev) => {
      const nextHighScore = Math.max(prev, score);
      if (nextHighScore > prev) {
        writeStoredNumber(STORAGE_KEYS.highScore, nextHighScore);
      }
      return nextHighScore;
    });

    const nextGamesPlayed = gamesPlayed + 1;
    const nextBestCombo = Math.max(bestCombo, g.maxCombo || 0);
    const nextBestPhase = Math.max(bestPhase, g.maxPhase || g.phase || 0);
    const nextTotalDodges = totalDodges + (g.telemetry?.dodges || 0);
    const nextTotalNearMisses = totalNearMisses + (g.telemetry?.nearMisses || 0);
    const nextBestNoDamageDodges = Math.max(bestNoDamageDodges, g.telemetry?.noDamageDodges || 0);
    const perfectPhase3 = (g.maxPhase || g.phase || 0) >= 2 && g.telemetry?.hitsTaken === 0 ? 1 : 0;
    const nextPhase3PerfectRuns = phase3PerfectRuns + perfectPhase3;

    setGamesPlayed(nextGamesPlayed);
    setBestCombo(nextBestCombo);
    setBestPhase(nextBestPhase);
    setTotalDodges(nextTotalDodges);
    setTotalNearMisses(nextTotalNearMisses);
    setBestNoDamageDodges(nextBestNoDamageDodges);
    setPhase3PerfectRuns(nextPhase3PerfectRuns);

    writeStoredNumber(STORAGE_KEYS.gamesPlayed, nextGamesPlayed);
    writeStoredNumber(STORAGE_KEYS.bestCombo, nextBestCombo);
    writeStoredNumber(STORAGE_KEYS.bestPhase, nextBestPhase);
    writeStoredNumber(STORAGE_KEYS.totalDodges, nextTotalDodges);
    writeStoredNumber(STORAGE_KEYS.totalNearMisses, nextTotalNearMisses);
    writeStoredNumber(STORAGE_KEYS.bestNoDamageDodges, nextBestNoDamageDodges);
    writeStoredNumber(STORAGE_KEYS.phase3PerfectRuns, nextPhase3PerfectRuns);
  }, [gamesPlayed, bestCombo, bestPhase, totalDodges, totalNearMisses, bestNoDamageDodges, phase3PerfectRuns]);

  const handleInput = useCallback((action) => {
    if (gameState !== "playing") {
      if (action !== "share") startGame();
      return;
    }

    const g = gameRef.current;
    if (!g || g.phaseTransition >= 0) return;

    if (action === "left" && g.targetLane > 0) g.targetLane -= 1;
    else if (action === "right" && g.targetLane < 2) g.targetLane += 1;
    else if (action === "duck") {
      g.isDucking = true;
      g.duckTimer = 390;
    } else if (action === "jump") {
      if (!g.isJumping) {
        g.isJumping = true;
        g.jumpTimer = 500;
      }
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
      } else if (["ArrowUp", "KeyW"].includes(e.code)) {
        e.preventDefault();
        handleInput(gameState === "playing" ? "jump" : "start");
      } else if (e.code === "Enter") {
        e.preventDefault();
        handleInput("start");
      }
    };

    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [handleInput, gameState]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const onPointerDown = (e) => {
      e.preventDefault();
      pointerRef.current = { x: e.clientX, y: e.clientY, active: true };
    };

    const onPointerUp = (e) => {
      if (!pointerRef.current.active) return;
      e.preventDefault();

      const dx = e.clientX - pointerRef.current.x;
      const dy = e.clientY - pointerRef.current.y;
      pointerRef.current.active = false;

      // Handle share button tap on end screens
      if (gameState === "gameover" || gameState === "victory") {
        const rect = canvas.getBoundingClientRect();
        const tapX = (e.clientX - rect.left) / rect.width * W;
        const tapY = (e.clientY - rect.top) / rect.height * H;

        // Share button bounds
        const btnLeft = W / 2 - s(100);
        const btnTop = gameState === "victory" ? s(560) : s(310);
        const btnW = s(200);
        const btnH = s(40);

        if (tapX >= btnLeft && tapX <= btnLeft + btnW && tapY >= btnTop && tapY <= btnTop + btnH) {
          shareResult(finalScore, finalTime, gameState === "victory");
          return;
        }

        startGame();
        return;
      }

      if (gameState !== "playing") {
        startGame();
        return;
      }

      if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 26) {
        handleInput(dx > 0 ? "right" : "left");
        return;
      }

      if (dy > 20) {
        handleInput("duck");
        return;
      }

      if (dy < -20) {
        handleInput("jump");
        return;
      }

      if (Math.abs(dx) < 16 && Math.abs(dy) < 16) {
        const rect = canvas.getBoundingClientRect();
        const tx = (e.clientX - rect.left) / rect.width;
        if (tx < 0.33) handleInput("left");
        else if (tx > 0.66) handleInput("right");
        else handleInput("duck");
      }
    };

    canvas.addEventListener("pointerdown", onPointerDown, { passive: false });
    canvas.addEventListener("pointerup", onPointerUp, { passive: false });
    canvas.addEventListener("pointercancel", onPointerUp, { passive: false });
    return () => {
      canvas.removeEventListener("pointerdown", onPointerDown);
      canvas.removeEventListener("pointerup", onPointerUp);
      canvas.removeEventListener("pointercancel", onPointerUp);
    };
  }, [gameState, handleInput, startGame, shareResult, finalScore, finalTime]);

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
        drawGround(ctx, now * 0.02, 1);
        drawTrail(ctx, now, 0, cosmeticTheme.trail);
        drawCoachBack(ctx, W / 2, CAMERA_HEIGHT, now * 0.03, false, false, now, 0, cosmeticTheme.coach, 0);

        ctx.fillStyle = "rgba(0,0,0,0.52)";
        ctx.fillRect(W / 2 - s(330), s(86), s(660), s(340));
        ctx.textAlign = "center";
        ctx.fillStyle = COLORS.white;
        ctx.font = `bold ${s(56)}px monospace`;
        ctx.fillText("CHOLO RUN", W / 2, s(148));
        ctx.fillStyle = COLORS.red;
        ctx.font = `bold ${s(22)}px monospace`;
        ctx.fillText("Pseudo primera persona detrás del míster", W / 2, s(184));
        ctx.fillStyle = "#CCCCCC";
        ctx.font = `${s(15)}px monospace`;
        ctx.fillText("Esquiva, agáchate, salta y supera estadios", W / 2, s(212));
        ctx.fillStyle = COLORS.yellow;
        ctx.font = `bold ${s(15)}px monospace`;
        ctx.fillText("← → mover | ↓ agacharse | ↑ saltar", W / 2, s(244));
        ctx.fillText("Desliza ← → ↓ ↑ en móvil", W / 2, s(266));

        const blink = Math.sin(now * 0.006) > 0;
        if (blink) {
          ctx.fillStyle = COLORS.white;
          ctx.font = `bold ${s(20)}px monospace`;
          ctx.fillText("TOCA O PULSA PARA EMPEZAR", W / 2, s(306));
        }

        if (highScore > 0) {
          ctx.fillStyle = "#FFD54F";
          ctx.font = `bold ${s(18)}px monospace`;
          ctx.fillText(`RÉCORD: ${highScore}`, W / 2, s(338));
        }

        ctx.fillStyle = "#9E9E9E";
        ctx.font = `${s(14)}px monospace`;
        ctx.fillText(`Partidas: ${gamesPlayed || 0} · Mejor combo: ${bestCombo || 0} · Mejor fase: ${(bestPhase || 0) + 1}`, W / 2, s(362));

        const completed = CHALLENGES.filter((c) => progression.challenges[c.id]?.completed).length;
        ctx.fillStyle = "#8EE69B";
        ctx.fillText(`Desafíos: ${completed}/${CHALLENGES.length}`, W / 2, s(384));

        if (nextChallenge) {
          const progress = progression.challenges[nextChallenge.id];
          ctx.fillStyle = "#B7D7FF";
          ctx.fillText(`Siguiente objetivo: ${nextChallenge.label} (${progress?.current || 0}/${nextChallenge.target})`, W / 2, s(404));
        } else {
          ctx.fillStyle = "#B7D7FF";
          ctx.fillText("¡Todos los desafíos completados!", W / 2, s(404));
        }
        return;
      }

      if (gameState === "victory") {
        const stadium = STADIUMS[2];
        drawSky(ctx, stadium);
        drawStands(ctx, stadium, now * 0.02);
        drawGround(ctx, now * 0.02, 1);

        ctx.fillStyle = "rgba(0,0,0,0.6)";
        ctx.fillRect(0, 0, W, H);

        drawTrophy(ctx, W / 2, s(280), now);

        ctx.textAlign = "center";
        ctx.fillStyle = "#FFD600";
        ctx.font = `bold ${s(42)}px monospace`;
        ctx.fillText("CAMPEON!", W / 2, s(420));

        ctx.fillStyle = COLORS.white;
        ctx.font = `bold ${s(52)}px monospace`;
        ctx.fillText(`${finalScore}`, W / 2, s(480));
        ctx.fillStyle = "#BBB";
        ctx.font = `${s(14)}px monospace`;
        ctx.fillText("PUNTOS", W / 2, s(500));

        ctx.fillStyle = "#B0BEC5";
        ctx.font = `bold ${s(18)}px monospace`;
        ctx.fillText(`Tiempo: ${formatTime(finalTime)}`, W / 2, s(530));

        // Share button
        ctx.fillStyle = "#1E88E5";
        ctx.fillRect(W / 2 - s(100), s(560), s(200), s(40));
        ctx.fillStyle = COLORS.white;
        ctx.font = `bold ${s(16)}px monospace`;
        ctx.textAlign = "center";
        ctx.fillText(shareText || "COMPARTIR", W / 2, s(585));

        const blink = Math.sin(now * 0.006) > 0;
        if (blink) {
          ctx.fillStyle = COLORS.white;
          ctx.font = `bold ${s(16)}px monospace`;
          ctx.fillText("TOCA PARA VOLVER A JUGAR", W / 2, s(640));
        }

        if (finalScore >= highScore && finalScore > 0) {
          ctx.fillStyle = COLORS.yellow;
          ctx.font = `bold ${s(20)}px monospace`;
          ctx.fillText("¡NUEVO RÉCORD!", W / 2, s(450));
        }
        return;
      }

      if (gameState === "gameover") {
        const stadium = STADIUMS[Math.min(STADIUMS.length - 1, 1)];
        drawSky(ctx, stadium);
        drawStands(ctx, stadium, now * 0.02);
        drawGround(ctx, now * 0.02, 1);

        ctx.fillStyle = "rgba(0,0,0,0.62)";
        ctx.fillRect(W / 2 - s(260), s(94), s(520), s(360));
        ctx.textAlign = "center";
        ctx.fillStyle = COLORS.red;
        ctx.font = `bold ${s(52)}px monospace`;
        ctx.fillText("GAME OVER", W / 2, s(170));

        ctx.fillStyle = COLORS.white;
        ctx.font = `bold ${s(62)}px monospace`;
        ctx.fillText(`${finalScore}`, W / 2, s(244));
        ctx.fillStyle = "#BBB";
        ctx.font = `${s(15)}px monospace`;
        ctx.fillText("PUNTOS", W / 2, s(268));

        ctx.fillStyle = "#B0BEC5";
        ctx.font = `bold ${s(16)}px monospace`;
        ctx.fillText(`Tiempo: ${formatTime(finalTime)}`, W / 2, s(290));

        if (finalScore >= highScore && finalScore > 0) {
          ctx.fillStyle = COLORS.yellow;
          ctx.font = `bold ${s(24)}px monospace`;
          ctx.fillText("¡NUEVO RÉCORD!", W / 2, s(206));
        }

        // Share button
        ctx.fillStyle = "#1E88E5";
        ctx.fillRect(W / 2 - s(100), s(310), s(200), s(40));
        ctx.fillStyle = COLORS.white;
        ctx.font = `bold ${s(16)}px monospace`;
        ctx.textAlign = "center";
        ctx.fillText(shareText || "COMPARTIR", W / 2, s(335));

        const blink = Math.sin(now * 0.006) > 0;
        if (blink) {
          ctx.fillStyle = COLORS.white;
          ctx.font = `bold ${s(18)}px monospace`;
          ctx.fillText("TOCA O PULSA PARA REINICIAR", W / 2, s(395));
        }

        ctx.fillStyle = "#9E9E9E";
        ctx.font = `${s(14)}px monospace`;
        ctx.fillText(`Partidas: ${gamesPlayed || 0} · Mejor combo: ${bestCombo || 0} · Mejor fase: ${(bestPhase || 0) + 1}`, W / 2, s(425));
        return;
      }

      const g = gameRef.current;
      if (!g) return;

      const stadium = updateGameState(
        g,
        now,
        (score) => {
          saveEndGameStats(g, score);
          setGameState("gameover");
        },
        (score) => {
          saveEndGameStats(g, score);
          setGameState("victory");
        },
      );

      ctx.save();
      ctx.translate(g.shakeX, g.shakeY);

      drawSky(ctx, stadium);
      drawStands(ctx, stadium, g.scrollX);
      drawGround(ctx, g.scrollX, g.laneSmooth);

      const sorted = [...g.obstacles].sort((a, b) => b.depth - a.depth);
      sorted.forEach((obs) => {
        if (obs.depth > 0 && obs.depth < 1) drawObstacle(ctx, obs, stadium);
      });

      // Draw boosters
      g.boosters.forEach((b) => {
        if (b.depth > 0 && b.depth < 1) drawBooster(ctx, b, stadium);
      });

      drawTrail(ctx, now, g.targetLane - g.laneSmooth, cosmeticTheme.trail);
      drawCoachBack(ctx, W / 2, CAMERA_HEIGHT, g.frame, g.isDucking, g.isInvincible, now, g.targetLane - g.laneSmooth, cosmeticTheme.coach, g.jumpHeight);

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

      drawHUD(ctx, g.score, g.lives, g.combo, g.phase, g.elapsedTime, g.activeBooster);

      // Sub-phase label
      if (g.subPhaseLabelTimer > 0 && g.subPhaseLabel) {
        const alpha = Math.min(1, g.subPhaseLabelTimer / 30);
        ctx.globalAlpha = alpha * 0.8;
        ctx.fillStyle = "rgba(0,0,0,0.6)";
        ctx.fillRect(W / 2 - 140, 70, 280, 30);
        ctx.globalAlpha = alpha;
        ctx.fillStyle = COLORS.yellow;
        ctx.font = "bold 16px monospace";
        ctx.textAlign = "center";
        ctx.fillText(g.subPhaseLabel, W / 2, 90);
        ctx.globalAlpha = 1;
      }

      if (g.phaseTransition >= 0) {
        drawPhaseTransition(ctx, g.phaseTransition, STADIUMS[g.phaseTransitionTarget]);
      }

      ctx.restore();
    };

    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [bestCombo, bestNoDamageDodges, bestPhase, cosmeticTheme, finalScore, finalTime, gameState, gamesPlayed, highScore, phase3PerfectRuns, progression.challenges, saveEndGameStats, shareText, totalDodges, totalNearMisses]);

  return (
    <div style={{
      width: "100vw",
      height: "100dvh",
      background: cosmeticTheme.palette.bg,
      overflow: "hidden",
      touchAction: "none",
      userSelect: "none",
    }}>
      <canvas
        ref={canvasRef}
        width={W}
        height={H}
        style={{
          width: "100vw",
          height: "100dvh",
          display: "block",
          imageRendering: "pixelated",
          cursor: "pointer",
        }}
        onClick={() => {
          if (gameState !== "playing" && gameState !== "gameover" && gameState !== "victory") startGame();
        }}
      />
    </div>
  );
}
