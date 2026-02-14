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

  const now = Date.now();
  ctx.save();
  ctx.translate(booster.screenX, booster.screenY);

  const scalePulse = 1 + Math.sin(now * 0.008) * 0.12;
  ctx.scale(booster.scale * scalePulse, booster.scale * scalePulse);

  const bob = Math.sin(now * 0.005) * 6;
  const glow = 0.35 + Math.sin(now * 0.007) * 0.25;

  // Outer glow aura
  ctx.globalAlpha = glow * 0.3;
  ctx.fillStyle = def.color;
  ctx.beginPath();
  ctx.arc(0, -16 + bob, 34, 0, Math.PI * 2);
  ctx.fill();

  // Pulsing ring
  ctx.globalAlpha = glow;
  ctx.strokeStyle = def.color;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(0, -16 + bob, 28, 0, Math.PI * 2);
  ctx.stroke();
  ctx.globalAlpha = 1;

  // Upward arrows (collect me!)
  const arrowAlpha = 0.4 + Math.sin(now * 0.01) * 0.3;
  ctx.globalAlpha = arrowAlpha;
  for (let a = 0; a < 3; a++) {
    const ay = 14 - a * 10 + ((now * 0.03 + a * 40) % 30);
    px(ctx, -3, ay + bob, 6, 3, COLORS.white);
    px(ctx, -5, ay + 3 + bob, 10, 2, COLORS.white);
  }
  ctx.globalAlpha = 1;

  switch (def.type) {
    case "flowers": {
      // Big bouquet of flowers - corner kick flowers
      px(ctx, -4, bob - 2, 8, 18, def.detail); // main stem
      px(ctx, -8, bob + 2, 3, 14, def.detail); // left stem
      px(ctx, 5, bob + 2, 3, 14, def.detail); // right stem
      // Flower heads - big pink petals
      for (let i = 0; i < 7; i++) {
        const angle = (i / 7) * Math.PI * 2 + now * 0.0015;
        const r = i < 3 ? 14 : 10;
        const fx = Math.cos(angle) * r;
        const fy = Math.sin(angle) * (r * 0.7) + bob - 18;
        const size = i < 3 ? 10 : 8;
        px(ctx, fx - size / 2, fy - size / 2, size, size, def.color);
        px(ctx, fx - 2, fy - 2, 4, 4, "#FFEB3B"); // yellow center
      }
      // Central large flower
      px(ctx, -7, bob - 24, 14, 14, def.color);
      px(ctx, -4, bob - 21, 8, 8, "#FFEB3B");
      break;
    }
    case "shield": {
      // Big shield shape - Atletico style
      px(ctx, -16, -30 + bob, 32, 40, def.color);
      px(ctx, -14, -28 + bob, 28, 36, def.detail);
      // Shield point at bottom
      px(ctx, -10, 8 + bob, 20, 8, def.color);
      px(ctx, -6, 14 + bob, 12, 6, def.color);
      // Star emblem in center
      px(ctx, -5, -18 + bob, 10, 10, def.color);
      px(ctx, -3, -16 + bob, 6, 6, COLORS.white);
      // Highlight edge
      px(ctx, -16, -30 + bob, 4, 40, "#42A5F5");
      px(ctx, 12, -30 + bob, 4, 40, "#42A5F5");
      break;
    }
    case "whistle": {
      // Big golden whistle
      px(ctx, -14, -12 + bob, 28, 16, def.color);
      px(ctx, -12, -10 + bob, 24, 12, "#FFF176");
      // Mouthpiece
      px(ctx, 12, -8 + bob, 12, 10, def.detail);
      px(ctx, 10, -6 + bob, 8, 6, "#BDBDBD");
      // Ring/cord
      px(ctx, -18, -16 + bob, 8, 6, def.color);
      ctx.strokeStyle = def.color;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(-14, -20 + bob, 8, 0, Math.PI * 2);
      ctx.stroke();
      // Sound waves
      const waveAlpha = 0.3 + Math.sin(now * 0.01) * 0.2;
      ctx.globalAlpha = waveAlpha;
      for (let w = 0; w < 3; w++) {
        ctx.strokeStyle = def.color;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(22 + w * 6, -4 + bob, 4 + w * 3, -0.5, 0.5);
        ctx.stroke();
      }
      ctx.globalAlpha = 1;
      break;
    }
    default:
      break;
  }

  // Name label below
  ctx.globalAlpha = 0.9;
  ctx.fillStyle = COLORS.white;
  ctx.font = "bold 11px monospace";
  ctx.textAlign = "center";
  ctx.fillText(def.name.toUpperCase(), 0, 28 + bob);
  ctx.globalAlpha = 1;

  ctx.restore();
}
