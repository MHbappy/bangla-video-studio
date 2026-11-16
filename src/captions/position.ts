import type React from "react";
import type { CaptionXY } from "../timeline-types";

// ক্যাপশনের খাপ: x = মাঝখান (বাঁ থেকে %), y = নিচের প্রান্ত (উপর থেকে %)।
// চওড়া সর্বোচ্চ maxFrac, আর কিনারার দিকে সরালে কমে — লেখা ভেঙে যায়, ফ্রেমের বাইরে যায় না। lift = নিচ থেকে বাড়তি px (যোগাযোগ বারের উপরে তুলতে)
export const captionBox = (pos: CaptionXY, width: number, height: number, maxFrac: number, lift = 0): React.CSSProperties => {
  const w = width * Math.min(maxFrac, (2 * Math.min(pos.x, 100 - pos.x)) / 100 - 0.04);
  return { position: "absolute", left: (width * pos.x) / 100 - w / 2, width: w, bottom: height * (1 - pos.y / 100) + lift, display: "flex", justifyContent: "center" };
};
