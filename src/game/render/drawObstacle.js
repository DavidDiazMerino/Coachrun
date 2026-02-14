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
    case "barrier":
      // Low orange barrier to jump over
      px(ctx, -28, -8, 56, 6, def.color);
      px(ctx, -30, -14, 8, 14, def.color);
      px(ctx, 22, -14, 8, 14, def.color);
      px(ctx, -28, -12, 56, 3, def.detail);
      break;
    case "puddle": {
      // Flat water puddle on the ground
      ctx.globalAlpha = 0.7;
      px(ctx, -22, -4, 44, 10, def.color);
      px(ctx, -18, -3, 36, 8, def.detail);
      ctx.globalAlpha = 1;
      const shimmer = Math.sin(Date.now() * 0.005) * 0.3;
      ctx.globalAlpha = 0.3 + shimmer;
      px(ctx, -10, -2, 8, 3, "#FFFFFF");
      ctx.globalAlpha = 1;
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
      for (let i = 0; i < 6; i++) {
        const wave = Math.sin(Date.now() * 0.004 + i) * 3;
        px(ctx, -24 + i * 9, -8 + wave, 10, 10, i % 2 ? def.detail : def.color);
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
    case "flag":
      // Waving flag thrown from stands
      for (let i = 0; i < 5; i++) {
        const wave = Math.sin(Date.now() * 0.005 + i * 0.8) * 4;
        px(ctx, -20 + i * 10, -10 + wave, 11, 14, i % 2 ? def.detail : def.color);
      }
      px(ctx, -22, -10, 3, 20, "#8D6E63");
      break;
    case "seat":
      // Stadium seat thrown
      px(ctx, -14, -20, 28, 18, def.color);
      px(ctx, -12, -22, 24, 6, def.detail);
      px(ctx, -10, -4, 8, 8, "#424242");
      px(ctx, 4, -4, 8, 8, "#424242");
      break;
    case "hooligan": {
      // Person running onto pitch - red shirt hooligan
      const armSwing = Math.sin(Date.now() * 0.008) * 8;
      px(ctx, -10, -40, 20, 32, def.color);
      px(ctx, -8, -44, 16, 10, def.detail);
      px(ctx, -6, -48, 12, 6, "#8B4513");
      px(ctx, -18, -28 + armSwing, 10, 20, def.color);
      px(ctx, 8, -28 - armSwing, 10, 20, def.color);
      px(ctx, -12, -8, 10, 16, "#1A237E");
      px(ctx, 2, -8, 10, 16, "#1A237E");
      break;
    }
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
    case "referee": {
      // Referee in black with yellow card raised
      const cardWave = Math.sin(Date.now() * 0.004) * 3;
      px(ctx, -10, -42, 20, 34, def.color);
      px(ctx, -8, -46, 16, 10, "#E9BA88");
      px(ctx, -6, -50, 12, 6, "#1B1B1B");
      px(ctx, -16, -32 + cardWave, 8, 22, def.color);
      px(ctx, -18, -38 + cardWave, 10, 12, def.detail);
      px(ctx, 8, -24, 8, 22, def.color);
      px(ctx, -12, -8, 10, 16, def.color);
      px(ctx, 2, -8, 10, 16, def.color);
      break;
    }
    case "trophy_barrier":
      // Gold VIP barrier
      px(ctx, -26, -10, 52, 6, def.color);
      px(ctx, -28, -18, 6, 18, def.color);
      px(ctx, 22, -18, 6, 18, def.color);
      px(ctx, -26, -14, 52, 2, def.detail);
      break;
    default:
      break;
  }

  ctx.restore();
}

export function drawBooster(ctx, booster, stadium) {
  const def = stadium.booster;
  if (!def) return;

  ctx.save();
  ctx.translate(booster.screenX, booster.screenY);
  ctx.scale(booster.scale, booster.scale);

  const bob = Math.sin(Date.now() * 0.006) * 4;
  const glow = 0.3 + Math.sin(Date.now() * 0.008) * 0.2;

  // Glow ring
  ctx.globalAlpha = glow;
  ctx.strokeStyle = def.color;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(0, -8 + bob, 18, 0, Math.PI * 2);
  ctx.stroke();
  ctx.globalAlpha = 1;

  switch (def.type) {
    case "flowers":
      // Bouquet of flowers
      for (let i = 0; i < 5; i++) {
        const angle = (i / 5) * Math.PI * 2 + Date.now() * 0.002;
        const fx = Math.cos(angle) * 8;
        const fy = Math.sin(angle) * 6 + bob - 8;
        px(ctx, fx - 3, fy - 3, 6, 6, def.color);
        px(ctx, fx - 1, fy - 1, 2, 2, "#FFEB3B");
      }
      px(ctx, -2, bob, 4, 12, def.detail);
      break;
    case "shield":
      // Shield shape
      px(ctx, -10, -14 + bob, 20, 24, def.color);
      px(ctx, -8, -12 + bob, 16, 20, def.detail);
      px(ctx, -4, -8 + bob, 8, 12, def.color);
      break;
    case "whistle":
      // Whistle
      px(ctx, -8, -6 + bob, 16, 10, def.color);
      px(ctx, 6, -4 + bob, 8, 6, def.detail);
      px(ctx, -10, -8 + bob, 6, 4, def.color);
      break;
    default:
      break;
  }

  ctx.restore();
}
