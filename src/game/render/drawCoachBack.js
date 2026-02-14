import { COLORS } from "../constants";
import { px } from "./projection";

export function drawCoachBack(ctx, x, y, frame, isDucking, isInvincible, now, laneLean, cosmeticCoach = {}, jumpHeight = 0) {
  if (isInvincible && Math.floor(now / 70) % 2 === 0) return;

  const suit = cosmeticCoach.suit || COLORS.suit;
  const suitLight = cosmeticCoach.suitLight || COLORS.suitLight;
  const accent = cosmeticCoach.accent || COLORS.red;
  const hair = cosmeticCoach.hair || COLORS.black;

  const bob = Math.sin(frame * 0.22) * 3;
  const lean = laneLean * 15;
  const jumpOffset = jumpHeight * -80;

  ctx.save();
  ctx.translate(x, y + bob + jumpOffset);

  // Shadow (shrinks during jump)
  const shadowScale = 1 - jumpHeight * 0.5;
  ctx.fillStyle = COLORS.shadow;
  ctx.beginPath();
  ctx.ellipse(0, 42 - jumpOffset, 58 * shadowScale, 14 * shadowScale, 0, 0, Math.PI * 2);
  ctx.fill();

  const legSwing = Math.sin(frame * 0.32) * 12;
  px(ctx, -24 + lean * 0.4, 10, 16, 44 + legSwing, suit);
  px(ctx, 8 + lean * 0.4, 10, 16, 44 - legSwing, suit);
  px(ctx, -28 + lean * 0.4, 48 + legSwing, 22, 8, COLORS.black);
  px(ctx, 6 + lean * 0.4, 48 - legSwing, 22, 8, COLORS.black);

  if (isDucking) {
    px(ctx, -36 + lean, -14, 72, 38, suit);
    px(ctx, -30 + lean, -10, 60, 30, suitLight);
    px(ctx, -20 + lean, -34, 40, 22, COLORS.skin);
    px(ctx, -20 + lean, -40, 40, 10, hair);
    px(ctx, -42 + lean, -8, 12, 24, suit);
    px(ctx, 30 + lean, -8, 12, 24, suit);
  } else {
    px(ctx, -34 + lean, -36, 68, 58, suit);
    px(ctx, -30 + lean, -32, 60, 50, suitLight);
    px(ctx, -6 + lean, -36, 12, 34, accent);

    const armSwing = Math.sin(frame * 0.32) * 15;
    px(ctx, -52 + lean, -24 + armSwing, 16, 38, suit);
    px(ctx, 36 + lean, -24 - armSwing, 16, 38, suit);
    px(ctx, -50 + lean, 10 + armSwing, 12, 10, COLORS.skin);
    px(ctx, 38 + lean, 10 - armSwing, 12, 10, COLORS.skin);

    px(ctx, -20 + lean, -68, 40, 34, COLORS.skin);
    px(ctx, -20 + lean, -74, 40, 10, hair);
    px(ctx, -22 + lean, -70, 44, 8, "#323232");
    px(ctx, -14 + lean, -44, 6, 4, COLORS.skinShadow);
    px(ctx, 8 + lean, -44, 6, 4, COLORS.skinShadow);
  }

  ctx.restore();
}
