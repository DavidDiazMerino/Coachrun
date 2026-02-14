import { COLORS, H, HORIZON_Y, W } from "../constants";
import { px } from "./projection";

export function drawStands(ctx, stadium, scrollX) {
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
