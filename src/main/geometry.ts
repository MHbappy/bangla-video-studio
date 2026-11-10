import type { Layout } from "../timeline-types";

export type Rect = { x: number; y: number; w: number; h: number; radius: number; opacity: number };
const full = (W: number, H: number, opacity = 1): Rect => ({ x: 0, y: 0, w: W, h: H, radius: 0, opacity });

// প্রতিটা লেআউটে A-roll কোথায় (১৬:৯ ও খাড়া ৯:১৬ আলাদা)
export const arollRect = (layout: Layout, W: number, H: number): Rect => {
  const vertical = H > W;
  const u = vertical ? W / 1080 : Math.min(W / 1920, H / 1080);
  switch (layout) {
    case "aroll":
    case "aroll+gfx":
      return full(W, H);
    case "split":
      return vertical ? { x: 0, y: 0, w: W, h: H / 2, radius: 0, opacity: 1 } : { x: 0, y: 0, w: W / 2, h: H, radius: 0, opacity: 1 };
    case "pip": {
      if (vertical) {
        const w = W * 0.42;
        return { x: 50 * u, y: H * 0.11, w, h: w, radius: 28 * u, opacity: 1 };
      }
      const w = W * 0.25;
      return { x: W - w - 50 * u, y: H - (w * 9) / 16 - 50 * u, w, h: (w * 9) / 16, radius: 18 * u, opacity: 1 };
    }
    case "motion+aroll": {
      if (vertical) {
        const d = W * 0.4;
        return { x: (W - d) / 2, y: H * 0.64, w: d, h: d, radius: d / 2, opacity: 1 };
      }
      const d = H * 0.3;
      return { x: W - d - 60 * u, y: H - d - 60 * u, w: d, h: d, radius: d / 2, opacity: 1 };
    }
    case "endscreen": {
      // Shorts-এ end screen হয় না — পুরো A-roll
      if (vertical) return full(W, H);
      const w = W * 0.42;
      return { x: W * 0.05, y: (H - (w * 9) / 16) / 2 - 20 * u, w, h: (w * 9) / 16, radius: 18 * u, opacity: 1 };
    }
    default:
      return full(W, H, 0); // broll, motion
  }
};

export const brollRect = (layout: Layout, W: number, H: number): Rect => {
  if (layout !== "split") return full(W, H);
  return H > W ? { x: 0, y: H / 2, w: W, h: H / 2, radius: 0, opacity: 1 } : { x: W / 2, y: 0, w: W / 2, h: H, radius: 0, opacity: 1 };
};

export const lerpRect = (a: Rect, b: Rect, p: number): Rect => ({
  x: a.x + (b.x - a.x) * p,
  y: a.y + (b.y - a.y) * p,
  w: a.w + (b.w - a.w) * p,
  h: a.h + (b.h - a.h) * p,
  radius: a.radius + (b.radius - a.radius) * p,
  opacity: a.opacity + (b.opacity - a.opacity) * p,
});

export const arollOnTop = (layout: Layout) => layout === "pip" || layout === "motion+aroll";
