// edit.json (Claude/আপনি লেখেন) এবং timeline.json (npm run plan বানায়) — দুটোর গঠন

export const LAYOUTS = ["aroll", "aroll+gfx", "broll", "split", "pip", "motion", "motion+aroll", "endscreen"] as const;
export type Layout = (typeof LAYOUTS)[number];

export const SCENES = ["TitleCard", "ChapterCard", "BulletList", "StatCard", "LowerThird", "CTA", "Callout", "Compare"] as const;
export type SceneName = (typeof SCENES)[number];

export const MOVES = ["none", "slowZoomIn", "slowZoomOut", "panLeft", "panRight"] as const;
export type Move = (typeof MOVES)[number];

export const CAPTION_STYLES = ["box", "highlight", "none"] as const;
export type CaptionStyle = (typeof CAPTION_STYLES)[number];

export const CORNERS = ["top-left", "top-right", "bottom-left", "bottom-right"] as const;
export type Corner = (typeof CORNERS)[number];

export const SOCIALS = ["facebook", "whatsapp", "youtube", "web", "phone"] as const;
export type Social = { type: (typeof SOCIALS)[number]; text: string };

// ---- ব্র্যান্ড: media/library/brand/brand.json (সব ভিডিওতে) + edit.json-এর "brand" (শুধু এই ভিডিওতে বদল) ----
export type BrandFile = {
  name?: string; // দোকান/চ্যানেলের নাম
  address?: string;
  phone?: string;
  phoneLabel?: string; // যেমন "অর্ডার করতে কল করুন"
  logo?: string | false; // ছবির নাম (না দিলে logo.png): আগে media/videos/<slug>/brand/, না পেলে media/library/brand/
  logoPosition?: Corner; // ডিফল্ট "top-right"
  logoSize?: number; // 1080p-তে উচ্চতা px (ডিফল্ট 80)
  logoOpacity?: number; // ডিফল্ট 0.9
  qr?: string | false; // QR কোডের ছবি (না দিলে qr.png; logo-র মতো একই জায়গায় খোঁজা হয়)
  social?: Social[];
  contactBar?: false | { start?: number; every?: number; duration?: number; atEnd?: boolean }; // সেকেন্ড
};

export type TimelineBrand = {
  name?: string;
  address?: string;
  phone?: string;
  phoneLabel?: string;
  logo?: { path: string; position: Corner; size: number; opacity: number };
  qr?: string;
  social: Social[];
  bars: { startMs: number; endMs: number }[]; // যোগাযোগ বার কখন কখন দেখাবে
};

export type Gfx = { scene: SceneName } & Record<string, unknown>;
// রং মেলানো: 1 = যেমন আছে; 0.8–1.2 সাধারণ সীমা
export type Grade = { brightness?: number; contrast?: number; saturation?: number };
export type BrollRef = {
  file: string;
  from?: number;
  move?: Move;
  sound?: number; // B-roll-এর নিজের শব্দ (০–১), যেমন মেশিন চলার শব্দ 0.15; ডিফল্ট 0 = বন্ধ
  rate?: number; // গতি: 0.5 = স্লো-মোশন (৬০fps ফুটেজে মসৃণ), 2 = দ্রুত
  grade?: Grade; // এই ক্লিপের রং (না দিলে edit.json-এর brollGrade)
};

// ---- edit.json ----
export type EditShot = {
  until: string | number; // "c12" = ক্যাপশন লাইন ১২ শেষে | "end" | সেকেন্ড (42.5)
  layout: Layout;
  broll?: string | BrollRef; // broll / split / pip
  gfx?: Gfx; // aroll+gfx / motion / motion+aroll
  punch?: number; // aroll / aroll+gfx: স্থির ক্রপ-জুম (জাম্প-কাট ঢাকতে), যেমন 1.12
  zoom?: number; // aroll / aroll+gfx: শট জুড়ে ধীরে পুশ-ইন, যেমন 1.08
  captions?: boolean; // false = এই শটে ক্যাপশন লুকানো
  sfx?: boolean; // false = এই শটের সাউন্ড ইফেক্ট বন্ধ
  note?: string; // শুধু মানুষের জন্য
};

export type MusicRef = { file: string; volume?: number; duck?: number; until?: string | number };
export type MusicSection = { path: string; startMs: number; endMs: number; volume: number; duck: number };

export type EditFile = {
  arollFocus?: string; // মুখ কোথায় (CSS object-position), যেমন "50% 35%"
  captionStyle?: CaptionStyle; // ডিফল্ট "box"
  autoPunch?: boolean; // পরপর aroll শটে পালা করে 1.0 / 1.1 পাঞ্চ (ডিফল্ট true)
  arollGrade?: Grade; // A-roll-এর রং
  endScreen?: number | { seconds: number; text?: string }; // শেষের ৫–২০s: A-roll বাঁয়ে ছোট, ডান দিক YouTube end screen-এর জন্য ফাঁকা
  brollGrade?: Grade; // সব B-roll-এর রং (ফোনের ফুটেজ ক্যামেরার সাথে মেলাতে)
  sfx?: boolean | { volume?: number }; // ডিফল্ট true
  // একটা ট্র্যাক, বা অংশভেদে কয়েকটা: [{ "file": "calm.mp3", "until": "c40" }, { "file": "upbeat.mp3" }] — মাঝে ক্রসফেড
  music?: MusicRef | MusicRef[];
  captionEmphasis?: boolean; // দাম/সংখ্যা/পণ্যের নাম ক্যাপশনে ব্র্যান্ড রঙে (ডিফল্ট true)
  brand?: false | BrandFile; // false = এই ভিডিওতে ব্র্যান্ডিং বন্ধ; অবজেক্ট = brand.json-এর উপর বদল
  shots: EditShot[];
};

// ---- timeline.json (যাচাই করা, সময় ও পাথসহ) ----
export type TimelineShot = {
  index: number;
  startMs: number;
  endMs: number;
  layout: Layout;
  broll?: BrollRef & { path: string; kind: "video" | "image"; durationSec: number | null };
  gfx?: Gfx;
  punch: number;
  zoom?: number;
  captions: boolean;
  sfx: boolean;
};

export type Timeline = {
  arollFocus: string;
  arollGrade?: Grade;
  endScreenText?: string;
  captionStyle: CaptionStyle;
  sfx: { volume: number; whoosh: string; pop: string } | null;
  music?: MusicSection[];
  captionEmphasis?: boolean;
  brand?: TimelineBrand;
  shots: TimelineShot[];
};

export const NEEDS_BROLL: Layout[] = ["broll", "split", "pip"];
export const NEEDS_GFX: Layout[] = ["aroll+gfx", "motion", "motion+aroll"];
export const AROLL_FULL: Layout[] = ["aroll", "aroll+gfx"];
