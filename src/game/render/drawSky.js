import { HORIZON_Y, W } from "../constants";

export function drawSky(ctx, stadium) {
  const grad = ctx.createLinearGradient(0, 0, 0, HORIZON_Y + 40);
  grad.addColorStop(0, stadium.skyTop);
  grad.addColorStop(1, stadium.skyBottom);
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, W, HORIZON_Y + 40);
}
