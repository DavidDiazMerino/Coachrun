import { useState, useEffect, useRef, useCallback } from "react";
import {
  CAMERA_HEIGHT,
  COLORS,
  H,
  W,
} from "./src/game/constants";
import { STADIUMS } from "./src/game/stadiums";
import { drawSky } from "./src/game/render/drawSky";
import { drawStands } from "./src/game/render/drawStands";
import { drawGround } from "./src/game/render/drawGround";
import { drawCoachBack } from "./src/game/render/drawCoachBack";
import { drawObstacle } from "./src/game/render/drawObstacle";
import { drawHUD } from "./src/game/render/drawHUD";
import { px } from "./src/game/render/projection";
import { createInitialGameState, updateGameState } from "./src/game/core/updateGame";

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
        return;
      }

      const g = gameRef.current;
      if (!g) return;

      const stadium = updateGameState(g, now, (score) => {
        setFinalScore(score);
        setHighScore((prev) => Math.max(prev, score));
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
