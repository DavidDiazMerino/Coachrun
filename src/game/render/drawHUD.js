import { COLORS, H, MAX_LIVES, W } from "../constants";
import { STADIUMS } from "../stadiums";
import { px } from "./projection";

export function drawHUD(ctx, score, lives, combo, phase, elapsedTime, activeBooster) {
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

  // Timer
  if (elapsedTime !== undefined && elapsedTime >= 0) {
    const totalSec = Math.floor(elapsedTime / 1000);
    const min = Math.floor(totalSec / 60);
    const sec = totalSec % 60;
    const timeStr = `${min}:${sec.toString().padStart(2, "0")}`;

    ctx.fillStyle = "rgba(0,0,0,0.45)";
    ctx.fillRect(W / 2 - 36, H - 50, 72, 18);
    ctx.fillStyle = "#B0BEC5";
    ctx.textAlign = "center";
    ctx.font = "bold 12px monospace";
    ctx.fillText(timeStr, W / 2, H - 36);
  }

  // Active booster indicator
  if (activeBooster) {
    const barWidth = 100;
    const maxDur = activeBooster.maxDuration || 5000;
    const remaining = Math.max(0, activeBooster.timer / maxDur);
    const effectColors = { speed: "#E91E63", shield: "#1565C0", slowmo: "#FFD600" };
    const effectNames = { speed: "FLORES", shield: "ESCUDO", slowmo: "SILBATO" };
    const color = effectColors[activeBooster.effect] || COLORS.yellow;

    ctx.fillStyle = "rgba(0,0,0,0.5)";
    ctx.fillRect(W / 2 - barWidth / 2, 50, barWidth, 10);
    ctx.fillStyle = color;
    ctx.fillRect(W / 2 - barWidth / 2, 50, barWidth * remaining, 10);
    ctx.fillStyle = COLORS.white;
    ctx.font = "bold 10px monospace";
    ctx.textAlign = "center";
    ctx.fillText(effectNames[activeBooster.effect] || activeBooster.type.toUpperCase(), W / 2, 48);
  }
}
