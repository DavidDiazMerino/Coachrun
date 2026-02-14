import { COLORS } from "../constants";
import { px } from "./projection";

export function drawObstacle(ctx, obs, stadium) {
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
