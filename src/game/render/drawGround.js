import { CAMERA_HEIGHT, COLORS, H, HORIZON_Y, LANE_COUNT, W } from "../constants";
import { depthScale, depthToY, laneToX, px } from "./projection";

export function drawGround(ctx, scrollX, cameraLane, palette = {}) {
  const grassTop = palette.grassTop || COLORS.grassB;
  const grassBottom = palette.grassBottom || COLORS.grassA;

  const grad = ctx.createLinearGradient(0, HORIZON_Y, 0, H);
  grad.addColorStop(0, grassTop);
  grad.addColorStop(1, grassBottom);
  ctx.fillStyle = grad;
  ctx.fillRect(0, HORIZON_Y, W, H - HORIZON_Y);

  for (let i = 0; i < 14; i++) {
    const d = 1 - ((i * 0.08 + (scrollX * 0.012) % 0.08) % 1);
    const y = depthToY(d);
    const y2 = depthToY(Math.max(0, d - 0.045));
    if (i % 2 === 0) {
      ctx.fillStyle = "rgba(255,255,255,0.04)";
      ctx.fillRect(0, y, W, y2 - y);
    }
  }

  for (let d = 0; d < 1; d += 0.01) {
    const y = depthToY(d);
    const left = laneToX(1, d, cameraLane) - (78 + (1 - d) * 95);
    px(ctx, left, y, Math.max(1, 3 - d), 2, "#FFFFFFCC");
  }

  for (let lane = 0; lane < LANE_COUNT; lane++) {
    for (let d = 0; d < 1; d += 0.03) {
      const seg = (d + (scrollX * 0.006) % 0.07) % 1;
      const y = depthToY(seg);
      const sc = depthScale(seg);
      const x = laneToX(lane, seg, cameraLane);
      px(ctx, x - sc * 2, y, sc * 4, Math.max(1, sc * 4), "rgba(255,255,255,0.08)");
    }
  }

  ctx.fillStyle = "rgba(0,0,0,0.22)";
  ctx.fillRect(0, CAMERA_HEIGHT + 15, W, H - (CAMERA_HEIGHT + 15));
}
