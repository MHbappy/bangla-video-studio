import type { Layout } from "../timeline-types";

export type Rect = { x: number; y: number; w: number; h: number; radius: number; opacity: number };
const full = (W: number, H: number, opacity = 1): Rect => ({ x: 0, y: 0, w: W, h: H, radius: 0, opacity });

// প্রতিটা লেআউটে A-roll কোথায় (১৬:৯ ও খাড়া ৯:১৬ আলাদা)
// fitted = এই শটের B-roll পুরোটা দেখানো হচ্ছে (ঝাপসা পটভূমিসহ) — খাড়া PiP-এ তখন বক্সটা ছোট হয়ে ফুটেজের উপরে বসে
export const arollRect = (layout: Layout, W: number, H: number, fitted = false): Rect => {
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
        const w = W * (fitted ? 0.3 : 0.42);
        return { x: 50 * u, y: H * (fitted ? 0.09 : 0.11), w, h: w, radius: 28 * u, opacity: 1 };
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

// ---- ফুটেজ আর ফ্রেমের আকার না মিললে: fill (কেটে ভরাট) না fit (পুরোটা + ঝাপসা পটভূমি) ----
export type Box = { x: number; y: number; w: number; h: number };
type BrollShape = { aspect?: number; fit?: "fill" | "fit"; focus?: string };

// "70% 40%" → [0.7, 0.4]
export const parseFocus = (s: string | undefined, fallback: [number, number] = [0.5, 0.5]): [number, number] => {
  const m = /^\s*(\d+(?:\.\d+)?)%\s+(\d+(?:\.\d+)?)%\s*$/.exec(s ?? "");
  return m ? [Number(m[1]) / 100, Number(m[2]) / 100] : fallback;
};

// object-fit: cover-এ পুরো ছবিটা (কাটা অংশসহ) কোথায় বসে — CSS object-position-এর হিসাব
export const coverBox = (r: Box, aspect: number, [px, py]: [number, number]): Box => {
  const w = Math.max(r.w, r.h * aspect);
  const h = w / aspect;
  return { x: r.x + (r.w - w) * px, y: r.y + (r.h - h) * py, w, h };
};

// এই শটে B-roll পুরোটা দেখানো হবে কিনা। নিজে থেকে: কাটলে ছবির অর্ধেকের বেশি হারালে
export const brollFits = (b: BrollShape | undefined, layout: Layout, W: number, H: number): boolean => {
  if (!b?.aspect) return false; // পুরনো timeline.json-এ মাপ নেই — আগের মতো কেটে ভরাট
  const r = brollRect(layout, W, H);
  const box = r.w / r.h;
  const visible = Math.min(box / b.aspect, b.aspect / box);
  if (visible > 0.97) return false;
  return b.fit ? b.fit === "fit" : visible < 0.5;
};

// fit-এ ছবিটা কোথায় বসে
export const fitBox = (layout: Layout, W: number, H: number, aspect: number): Box => {
  const r = brollRect(layout, W, H);
  if (aspect > r.w / r.h) {
    const h = r.w / aspect;
    // খাড়া ফ্রেমে মাঝের একটু উপরে — নিচে ক্যাপশনের জায়গা থাকে; PiP-এ ছোট A-roll বক্সের ঠিক নিচে
    let y = r.y + (r.h - h) * (H > W ? 0.38 : 0.5);
    if (layout === "pip" && H > W) {
      const a = arollRect("pip", W, H, true);
      y = Math.max(y, a.y + a.h + 22 * (W / 1080));
    }
    return { x: r.x, y, w: r.w, h };
  }
  const w = r.h * aspect;
  return { x: r.x + (r.w - w) / 2, y: r.y, w, h: r.h };
};

// Callout-এর x,y মূল (১৬:৯) ফ্রেমের % — অন্য আকারের ফ্রেমে (Shorts) একই জিনিসের উপর বসাতে:
// মূল ফ্রেমে বিন্দুটা কোন ফুটেজের কোন জায়গায় → এই ফ্রেমে সেই জায়গা কোথায়। কাটা পড়ে গেলে null
export const mapPoint = (
  x: number,
  y: number,
  shot: { layout: Layout; broll?: BrollShape },
  main: { width: number; height: number },
  W: number,
  H: number,
  arollFocus: string,
): { x: number; y: number } | null => {
  if (Math.abs(W / H - main.width / main.height) < 0.01) return { x, y };
  const place = (w: number, h: number) => {
    const fitted = brollFits(shot.broll, shot.layout, w, h);
    const a = arollRect(shot.layout, w, h, fitted);
    const aroll = a.opacity > 0 ? { clip: a as Box, media: coverBox(a, main.width / main.height, parseFocus(arollFocus, [0.5, 0.35])) } : null;
    const asp = shot.broll?.aspect;
    const b = brollRect(shot.layout, w, h);
    const fit = asp && fitted ? fitBox(shot.layout, w, h, asp) : null;
    const broll = asp ? { clip: fit ?? (b as Box), media: fit ?? coverBox(b, asp, parseFocus(shot.broll?.focus)) } : null;
    return { aroll, broll };
  };
  const from = place(main.width, main.height);
  const to = place(W, H);
  const X = (x / 100) * main.width;
  const Y = (y / 100) * main.height;
  const inside = (k: Box, px: number, py: number) => px >= k.x && px <= k.x + k.w && py >= k.y && py <= k.y + k.h;
  const onAroll = Boolean(from.aroll && inside(from.aroll.clip, X, Y) && (arollOnTop(shot.layout) || !from.broll || !inside(from.broll.clip, X, Y)));
  const src = onAroll ? from.aroll : from.broll;
  const dst = onAroll ? to.aroll : to.broll;
  if (!src || !dst) return { x, y };
  const px = dst.media.x + ((X - src.media.x) / src.media.w) * dst.media.w;
  const py = dst.media.y + ((Y - src.media.y) / src.media.h) * dst.media.h;
  return inside(dst.clip, px, py) ? { x: (px / W) * 100, y: (py / H) * 100 } : null;
};
