import { W, HORIZON_Y, GROUND_BOTTOM } from "../constants";

export function px(ctx, x, y, w, h, c) {
  ctx.fillStyle = c;
  ctx.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h));
}

export function laneToX(lane, depth, cameraLane) {
  const center = W / 2 - (cameraLane - 1) * (22 + (1 - depth) * 14);
  const spread = 55 + (1 - depth) * 220;
  return center + (lane - 1) * spread;
}

export function depthToY(depth) {
  return HORIZON_Y + (GROUND_BOTTOM - HORIZON_Y) * (1 - depth);
}

export function depthScale(depth) {
  return 0.25 + (1 - depth) * 0.8;
}
