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
import { drawObstacle } from "./game/render/drawObstacle";
import { drawHUD } from "./game/render/drawHUD";
import { px } from "./game/render/projection";
import { createInitialGameState, updateGameState } from "./game/core/updateGame";
import {
  CHALLENGES,
  PROGRESSION_KEYS,
  deriveActiveCosmetics,
  evaluateProgress,
  getNextChallenge,
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
      window.localStorage.setItem(key, String(value));
    } catch {
      // Modo incógnito / storage bloqueado: ignoramos sin romper el juego.
    }
  };

  const canvasRef = useRef(null);
  const gameRef = useRef(null);
  const touchRef = useRef({ x: 0, y: 0 });

  const [gameState, setGameState] = useState("menu");
  const [finalScore, setFinalScore] = useState(0);
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
    safeWriteJSON(PROGRESSION_KEYS.unlocks, progression.unlocks);
    safeWriteJSON(PROGRESSION_KEYS.challenges, progression.challenges);
  }, [progression.unlocks, progression.challenges]);

  const initGame = useCallback(() => {
    gameRef.current = createInitialGameState();
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
        drawGround(ctx, now * 0.02, 1);
        drawTrail(ctx, now, 0, cosmeticTheme.trail);
        drawCoachBack(ctx, W / 2, CAMERA_HEIGHT, now * 0.03, false, false, now, 0, cosmeticTheme.coach);

        ctx.fillStyle = "rgba(0,0,0,0.52)";
        ctx.fillRect(W / 2 - 330, 86, 660, 310);
        ctx.textAlign = "center";
        ctx.fillStyle = COLORS.white;
        ctx.font = "bold 56px monospace";
        ctx.fillText("CHOLO RUN", W / 2, 148);
        ctx.fillStyle = COLORS.red;
        ctx.font = "bold 22px monospace";
        ctx.fillText("Pseudo primera persona detrás del míster", W / 2, 184);
        ctx.fillStyle = "#CCCCCC";
        ctx.font = "15px monospace";
        ctx.fillText("Esquiva por carriles, agáchate a tiempo y supera estadios", W / 2, 212);
        ctx.fillStyle = COLORS.yellow;
        ctx.font = "bold 16px monospace";
        ctx.fillText("← → mover | ↓ / espacio agacharse", W / 2, 244);

        const blink = Math.sin(now * 0.006) > 0;
        if (blink) {
          ctx.fillStyle = COLORS.white;
          ctx.font = "bold 20px monospace";
          ctx.fillText("PULSA CUALQUIER TECLA O TOCA PARA EMPEZAR", W / 2, 288);
        }

        if (highScore > 0) {
          ctx.fillStyle = "#FFD54F";
          ctx.font = "bold 18px monospace";
          ctx.fillText(`RÉCORD: ${highScore}`, W / 2, 320);
        }

        ctx.fillStyle = "#9E9E9E";
        ctx.font = "14px monospace";
        ctx.fillText(`Partidas: ${gamesPlayed || 0} · Mejor combo: ${bestCombo || 0} · Mejor fase: ${(bestPhase || 0) + 1}`, W / 2, 344);

        const completed = CHALLENGES.filter((c) => progression.challenges[c.id]?.completed).length;
        ctx.fillStyle = "#8EE69B";
        ctx.fillText(`Desafíos: ${completed}/${CHALLENGES.length}`, W / 2, 366);

        if (nextChallenge) {
          const progress = progression.challenges[nextChallenge.id];
          ctx.fillStyle = "#B7D7FF";
          ctx.fillText(`Siguiente objetivo: ${nextChallenge.label} (${progress?.current || 0}/${nextChallenge.target})`, W / 2, 386);
        } else {
          ctx.fillStyle = "#B7D7FF";
          ctx.fillText("¡Todos los desafíos completados!", W / 2, 386);
        }
        return;
      }

      if (gameState === "gameover") {
        const stadium = STADIUMS[Math.min(STADIUMS.length - 1, 1)];
        drawSky(ctx, stadium);
        drawStands(ctx, stadium, now * 0.02);
        drawGround(ctx, now * 0.02, 1);

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

        ctx.fillStyle = "#9E9E9E";
        ctx.font = "14px monospace";
        ctx.fillText(`Partidas: ${gamesPlayed || 0} · Mejor combo: ${bestCombo || 0} · Mejor fase: ${(bestPhase || 0) + 1}`, W / 2, 390);
        return;
      }

      const g = gameRef.current;
      if (!g) return;

      const stadium = updateGameState(g, now, (score) => {
        setFinalScore(score);
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

        setGameState("gameover");
      });

      ctx.save();
      ctx.translate(g.shakeX, g.shakeY);

      drawSky(ctx, stadium);
      drawStands(ctx, stadium, g.scrollX);
      drawGround(ctx, g.scrollX, g.laneSmooth);

      const sorted = [...g.obstacles].sort((a, b) => b.depth - a.depth);
      sorted.forEach((obs) => {
        if (obs.depth > 0 && obs.depth < 1) drawObstacle(ctx, obs, stadium);
      });

      drawTrail(ctx, now, g.targetLane - g.laneSmooth, cosmeticTheme.trail);
      drawCoachBack(ctx, W / 2, CAMERA_HEIGHT, g.frame, g.isDucking, g.isInvincible, now, g.targetLane - g.laneSmooth, cosmeticTheme.coach);

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
  }, [bestCombo, bestNoDamageDodges, bestPhase, cosmeticTheme, finalScore, gameState, gamesPlayed, highScore, phase3PerfectRuns, progression.challenges, totalDodges, totalNearMisses]);

  return (
    <div style={{
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      minHeight: "100vh",
      background: cosmeticTheme.palette.bg,
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
          border: `3px solid ${cosmeticTheme.palette.border}`,
          borderRadius: "4px",
          maxWidth: "100%",
          imageRendering: "pixelated",
          cursor: "pointer",
          boxShadow: `0 0 40px ${cosmeticTheme.palette.glow}, 0 0 80px ${cosmeticTheme.palette.glow}`,
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
