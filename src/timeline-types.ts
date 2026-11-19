// edit.json (Claude/আপনি লেখেন) এবং timeline.json (npm run plan বানায়) — দুটোর গঠন

export const LAYOUTS = ["aroll", "aroll+gfx", "broll", "split", "pip", "motion", "motion+aroll", "endscreen"] as const;
export type Layout = (typeof LAYOUTS)[number];

export const SCENES = ["TitleCard", "ChapterCard", "BulletList", "StatCard", "LowerThird", "CTA", "Callout", "Compare", "Offer", "SpecTable", "Review"] as const;
export type SceneName = (typeof SCENES)[number];

export const MOVES = ["none", "slowZoomIn", "slowZoomOut", "panLeft", "panRight"] as const;
export type Move = (typeof MOVES)[number];

export const CAPTION_STYLES = ["box", "highlight", "none"] as const;
export type CaptionStyle = (typeof CAPTION_STYLES)[number];

export const CORNERS = ["top-left", "top-right", "bottom-left", "bottom-right"] as const;
export type Corner = (typeof CORNERS)[number];

export const SOCIALS = ["facebook", "whatsapp", "youtube", "web", "phone"] as const;
export type Social = { type: (typeof SOCIALS)[number]; text: string };

// ---- ক্যাপশনের জায়গা: x = মাঝখান (বাঁ থেকে %), y = নিচের প্রান্ত (উপর থেকে %) ----
// horizontal = ১৬:৯ ফ্রেম, vertical = খাড়া ৯:১৬ ফ্রেম (Shorts/Reels / খাড়া ফুটেজ), feed = ৪:৫ ফ্রেম (Facebook/Instagram feed)
export type CaptionXY = { x: number; y: number };
export const FRAME_KINDS = ["horizontal", "vertical", "feed"] as const;
export type FrameKind = (typeof FRAME_KINDS)[number];
export type CaptionPosition = Record<FrameKind, CaptionXY>;
export type CaptionPositionFile = Partial<Record<FrameKind, Partial<CaptionXY>>>;
// feed-এ ভিডিওর উপরে প্ল্যাটফর্মের লেখা/বোতাম বসে না — ক্যাপশন নিচে নামানো যায়
export const CAPTION_POSITION: CaptionPosition = { horizontal: { x: 50, y: 93.5 }, vertical: { x: 50, y: 73 }, feed: { x: 50, y: 92 } };
// সীমা: ক্যাপশন ফ্রেমের বাইরে বা (৯:১৬-এ) একদম নিচের প্ল্যাটফর্ম-UI-তে না যায়
export const CAPTION_RANGE = { x: [10, 90], horizontal: [15, 97], vertical: [15, 85], feed: [15, 97] } as const;
// ফ্রেমের ধরন: চওড়া → horizontal; খাড়া কিন্তু ২:৩-এর চেয়ে খাটো (৪:৫, ১:১-এর কাছাকাছি) → feed; বাকি খাড়া → vertical
export const frameKind = (width: number, height: number): FrameKind => (height <= width ? "horizontal" : height / width < 1.5 ? "feed" : "vertical");

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
  // ৯:১৬ ফ্রেমে উপরের লোগো আর যোগাযোগ বার উপর থেকে কত % নিচে (ডিফল্ট 14; সীমা 0–30; 0 = একদম উপরে) —
  // Reels/Shorts-এ উপরের ~১৪%-এ অ্যাপের আইকন বসে। ১৬:৯ আর ৪:৫-এ খাটে না
  verticalTop?: number;
  qr?: string | false; // QR কোডের ছবি (না দিলে qr.png; logo-র মতো একই জায়গায় খোঁজা হয়)
  social?: Social[];
  // সেকেন্ড; always = পুরো ভিডিও জুড়ে (মোশন/PiP শট বাদে) — তখন start/every/duration/atEnd খাটে না
  contactBar?: false | { start?: number; every?: number; duration?: number; atEnd?: boolean; always?: boolean };
  captionPosition?: CaptionPositionFile; // সব ভিডিওর ডিফল্ট ক্যাপশনের জায়গা (রিসোর্স ম্যানেজার থেকে); এক ভিডিওতে বদল → edit.json-এর captionPosition
  // ভিডিওতে কী থাকবে (রিসোর্স ম্যানেজার থেকে; ডিফল্ট true) — এক ভিডিওতে বদল → edit.json-এর captions / graphics
  captions?: boolean; // false = ক্যাপশন নেই
  graphics?: boolean; // false = মোশন গ্রাফিক্সের লেখা আর সাউন্ড ইফেক্ট নেই (লোগো/যোগাযোগ বার থাকে)
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
  verticalTop?: number; // ৯:১৬-এ লোগো/বারের উপরের দূরত্ব (%)
};
export const VERTICAL_TOP = { default: 14, min: 0, max: 30 } as const;

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
  // ফুটেজ আর ফ্রেমের আকার না মিললে (চওড়া ক্লিপ খাড়া Shorts-এ, বা ফোনের খাড়া ক্লিপ ১৬:৯-এ):
  // "fit" = পুরো ছবি দেখায়, পেছনে ঝাপসা কপি · "fill" = ফ্রেম ভরে, পাশ কাটা পড়ে
  // না দিলে: কাটলে অর্ধেকের বেশি হারালে fit, নইলে fill
  fit?: Fit;
  focus?: string; // fill-এ কোন অংশ থাকবে (CSS object-position), যেমন "70% 50%" = ডান দিক; ডিফল্ট মাঝখান
};
export const FITS = ["fill", "fit"] as const;
export type Fit = (typeof FITS)[number];

// ---- edit.json ----
export type EditShot = {
  until: string | number; // "c12" = ক্যাপশন লাইন ১২ শেষে | "end" | সেকেন্ড (42.5)
  layout: Layout;
  broll?: string | BrollRef; // broll / split / pip
  gfx?: Gfx; // aroll+gfx / motion / motion+aroll-এ আবশ্যক; broll / split / pip-এ ঐচ্ছিক — ফুটেজের উপর বসে (দাম, ফিচারের নাম, "এখানে চাপুন")
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
  // ৪:৫ feed রেন্ডারে (--format feed) ফুটেজের কোন অংশ থাকবে (না দিলে arollFocus): খাড়া ফুটেজের উপর-নিচ কাটা পড়ে —
  // "50% 0%" = উপরের অংশ থাকে (মাথা ফ্রেমের উপরে হলে), "50% 100%" = নিচের অংশ
  feedFocus?: string;
  captionStyle?: CaptionStyle; // ডিফল্ট "box"
  captions?: boolean; // false = এই ভিডিওতে ক্যাপশন নেই (brand.json-এর captions-এর উপর)
  graphics?: boolean; // false = মোশন গ্রাফিক্সের লেখা + সাউন্ড ইফেক্ট নেই; motion শট A-roll হয়ে যায় (brand.json-এর graphics-এর উপর)
  // ক্যাপশনের জায়গা, শুধু এই ভিডিওতে (brand.json-এর captionPosition-এর উপর): { "vertical": { "y": 50 } } — পণ্য নিচে থাকলে উপরে তুলতে
  captionPosition?: CaptionPositionFile;
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
  broll?: BrollRef & { path: string; kind: "video" | "image"; durationSec: number | null; aspect?: number }; // aspect = চওড়া ÷ উঁচু
  gfx?: Gfx;
  punch: number;
  zoom?: number;
  captions: boolean;
  sfx: boolean;
};

export type Timeline = {
  arollFocus: string;
  feedFocus?: string;
  arollGrade?: Grade;
  endScreenText?: string;
  captionStyle: CaptionStyle;
  captionPosition?: CaptionPosition;
  sfx: { volume: number; whoosh: string; pop: string } | null;
  music?: MusicSection[];
  captionEmphasis?: boolean;
  brand?: TimelineBrand;
  shots: TimelineShot[];
};

export const NEEDS_BROLL: Layout[] = ["broll", "split", "pip"];
export const NEEDS_GFX: Layout[] = ["aroll+gfx", "motion", "motion+aroll"];
export const AROLL_FULL: Layout[] = ["aroll", "aroll+gfx"];
// এই লেআউটগুলোতে gfx ফুটেজের উপরে (overlay) বসে; বাকিগুলোতে (motion…) পুরো স্ক্রিন নেয়
export const GFX_OVERLAY: Layout[] = ["aroll+gfx", "broll", "split", "pip"];
// overlay-এ ডান পাশের কার্ড (SidePanel) হয়ে বসে — split-এ B-roll-এর অর্ধেক ঢেকে দেয়
export const SIDE_PANEL_SCENES: SceneName[] = ["BulletList", "StatCard", "Compare", "Offer", "SpecTable", "Review"];
