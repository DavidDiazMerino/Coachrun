import { W, HORIZON_Y, GROUND_BOTTOM } from "../constants";

export function px(ctx, x, y, w, h, c) {
  ctx.fillStyle = c;
  ctx.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h));
}

export function laneToX(lane, depth, cameraLane) {
  const { leftEdge, columnWidth } = getTrackColumns(depth, cameraLane);
  return leftEdge + columnWidth * (lane + 1.5);
}

export function getTrackColumns(depth, cameraLane) {
  const center = W / 2 - (cameraLane - 1) * (24 + (1 - depth) * 18);
  const trackWidth = 180 + (1 - depth) * 380;
  const leftEdge = center - trackWidth / 2;
  return {
    leftEdge,
    rightEdge: leftEdge + trackWidth,
    trackWidth,
    columnWidth: trackWidth / 5,
  };
}

export function depthToY(depth) {
  return HORIZON_Y + (GROUND_BOTTOM - HORIZON_Y) * (1 - depth);
}

export function depthScale(depth) {
  return 0.25 + (1 - depth) * 0.8;
}
