import { COLORS } from "../constants";
import { px } from "./projection";

export function drawCoachBack(ctx, x, y, frame, isDucking, isInvincible, now, laneLean) {
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
