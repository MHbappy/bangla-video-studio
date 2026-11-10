// ব্র্যান্ড — রং, ফন্ট, অ্যানিমেশন এক জায়গায়। এখানে বদলালে সব ভিডিওতে বদলাবে।
import { FONT_FAMILY } from "./fonts";

export const theme = {
  font: FONT_FAMILY,
  color: {
    bg: "#0E1116", // মোশন দৃশ্যের ব্যাকগ্রাউন্ড
    bg2: "#1B2230",
    panel: "rgba(14,17,22,0.82)", // ফুটেজের উপর কার্ড
    text: "#FFFFFF",
    muted: "#A9B4C4",
    accent: "#FFB020", // হাইলাইট / ব্র্যান্ড রং
    accent2: "#2EC4B6",
  },
  radius: 22,
  spring: { damping: 200, stiffness: 120, mass: 0.6 }, // মসৃণ, বাউন্স ছাড়া
  pop: { damping: 14, stiffness: 180 }, // হালকা বাউন্স
  layoutTransitionFrames: 8, // লেআউট বদলের সময় A-roll সরে যাওয়ার গতি
  brollFadeFrames: 5,
  exitFrames: 8,
} as const;
