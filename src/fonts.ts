import { loadFont } from "@remotion/fonts";
import w500 from "@fontsource/hind-siliguri/files/hind-siliguri-bengali-500-normal.woff2";
import w700 from "@fontsource/hind-siliguri/files/hind-siliguri-bengali-700-normal.woff2";
import l500 from "@fontsource/hind-siliguri/files/hind-siliguri-latin-500-normal.woff2";
import l700 from "@fontsource/hind-siliguri/files/hind-siliguri-latin-700-normal.woff2";

export const FONT_FAMILY = "Hind Siliguri";

// বাংলা + ল্যাটিন (ESP32, Arduino ইত্যাদি) — অফলাইনে, প্রজেক্টের ভেতর থেকেই লোড হয়
const BENGALI = "U+0951-0952, U+0964-0965, U+0980-09FE, U+1CD0, U+1CD2, U+1CD5-1CD6, U+1CD8, U+1CE1, U+1CEA, U+1CED, U+1CF2, U+1CF5-1CF7, U+200C-200D, U+20B9, U+25CC, U+A8F1";
for (const [url, weight, range] of [
  [w500, "500", BENGALI],
  [w700, "700", BENGALI],
  [l500, "500", undefined],
  [l700, "700", undefined],
] as const) {
  loadFont({ family: FONT_FAMILY, url, weight, ...(range ? { unicodeRange: range } : {}) });
}
