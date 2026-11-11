// npm run plan -- [slug]  — edit.json যাচাই → timeline.json (+ YouTube চ্যাপ্টার)
import { existsSync, writeFileSync } from "node:fs";
import path from "node:path";
import {
  AROLL_FULL,
  type BrandFile,
  CAPTION_STYLES,
  CORNERS,
  type EditFile,
  FITS,
  GFX_OVERLAY,
  LAYOUTS,
  MOVES,
  NEEDS_BROLL,
  NEEDS_GFX,
  SCENES,
  SIDE_PANEL_SCENES,
  SOCIALS,
  type Timeline,
  type TimelineShot,
} from "../src/timeline-types";
import { scanAssets } from "./assets";
import { type CaptionLine, readJson, writeJson } from "./lib";
import { LIBRARY, resolveSlug, vpath, webPath } from "./paths";
import { ensureSfx } from "./sfx";

const slug = resolveSlug(process.argv[2]);
const errors: string[] = [];
const warns: string[] = [];

if (!existsSync(vpath(slug, "edit.json"))) {
  console.error(`✗ media/videos/${slug}/edit.json নেই। Claude-কে বলুন "${slug}-এর edit plan বানাও"`);
  process.exit(1);
}
let edit: EditFile;
try {
  edit = readJson<EditFile>(vpath(slug, "edit.json"));
} catch (e) {
  console.error(`✗ edit.json-এ JSON ভুল (কমা/বন্ধনী দেখুন): ${(e as Error).message}`);
  process.exit(1);
}
if (!Array.isArray(edit.shots) || !edit.shots.length) {
  console.error('✗ edit.json-এ "shots" তালিকা নেই/খালি');
  process.exit(1);
}
const project = readJson<{ durationInFrames: number; fps: number }>(vpath(slug, "project.json"));
const lines = existsSync(vpath(slug, "captions.json")) ? readJson<{ lines: CaptionLine[] }>(vpath(slug, "captions.json")).lines : [];
const totalMs = Math.floor((project.durationInFrames / project.fps) * 1000);
const assets = scanAssets(slug);
const brollMap = new Map(assets.broll.map((a) => [a.name, a]));
const musicMap = new Map(assets.music.map((a) => [a.name, a]));
const sec = (ms: number) => (ms / 1000).toFixed(1);
const formatWarned = new Set<string>(); // ফরম্যাটের সতর্কতা প্রতি ক্লিপে একবার

// রং: প্রতিটা মান 0.5–1.5 (1 = যেমন আছে)
const checkGrade = (g: EditFile["brollGrade"], tag: string) => {
  for (const [k, v] of Object.entries(g ?? {}))
    if (!["brightness", "contrast", "saturation"].includes(k)) errors.push(`${tag}: grade-এ অজানা "${k}" — brightness, contrast, saturation`);
    else if (!(Number(v) >= 0.5 && Number(v) <= 1.5)) errors.push(`${tag}: grade.${k} হবে 0.5 থেকে 1.5 (1 = যেমন আছে)`);
};
// মার্কেটিং scene-গুলোর দরকারি তথ্য আছে কিনা (না থাকলে ফাঁকা কার্ড রেন্ডার হয়)
const words = (v: unknown) => String(v ?? "").trim().split(/\s+/).filter(Boolean).length;
const checkGfx = (g: NonNullable<TimelineShot["gfx"]>, tag: string, overlay: boolean) => {
  if (g.scene === "Offer") {
    if (!String(g.price ?? "").trim()) errors.push(`${tag}: Offer-এ "price" (নতুন দাম) দিতে হবে`);
  } else if (g.scene === "SpecTable") {
    const rows = Array.isArray(g.rows) ? g.rows : [];
    const ok = (r: unknown) => (Array.isArray(r) ? r.length === 2 : Boolean(r && typeof r === "object" && "label" in r && "value" in r));
    if (!rows.length || !rows.every(ok)) errors.push(`${tag}: SpecTable-এ "rows": [{ "label": "পাওয়ার", "value": "6000W" }, …] দিতে হবে`);
    else if (rows.length > (overlay ? 5 : 7)) warns.push(`${tag}: SpecTable-এ ${rows.length}টা সারি — ${overlay ? "ফুটেজের উপর ৫টা" : "৭টা"}র বেশি হলে পড়া কঠিন`);
  } else if (g.scene === "Review") {
    if (!String(g.quote ?? "").trim()) errors.push(`${tag}: Review-এ "quote" (কাস্টমারের কথা) দিতে হবে`);
    else if (words(g.quote) > (overlay ? 18 : 30)) warns.push(`${tag}: Review-এর কথা ${words(g.quote)} শব্দ — ${overlay ? 18 : 30} শব্দের মধ্যে রাখুন`);
    if (g.rating !== undefined && !(Number(g.rating) >= 1 && Number(g.rating) <= 5)) errors.push(`${tag}: Review-এর "rating" হবে 1 থেকে 5`);
  }
};
checkGrade(edit.arollGrade, "arollGrade");
checkGrade(edit.brollGrade, "brollGrade");

// "c12" → লাইন ১২ শেষ আর লাইন ১৩ শুরুর মাঝখানে (কাট পড়ে বিরতিতে)
const resolveUntil = (u: string | number, label: string): number | null => {
  if (typeof u === "number") return Math.round(u * 1000);
  if (u === "end") return totalMs;
  const m = /^c(\d+)$/.exec(String(u));
  if (!m) {
    errors.push(`${label}: "until": "${u}" বুঝিনি — "c12", "end" বা সেকেন্ড দিন`);
    return null;
  }
  const n = Number(m[1]);
  const line = lines[n - 1];
  if (!line) {
    errors.push(`${label}: c${n} নেই (মোট ${lines.length} লাইন — captions-index.txt দেখুন)`);
    return null;
  }
  const next = lines[n];
  return next ? Math.round((line.endMs + next.startMs) / 2) : Math.min(totalMs, line.endMs + 300);
};

const shots: TimelineShot[] = [];
let start = 0;
edit.shots.forEach((s, i) => {
  const tag = `শট ${i + 1} (${s.layout})`;
  if (!LAYOUTS.includes(s.layout)) return void errors.push(`শট ${i + 1}: অজানা layout "${s.layout}" — ${LAYOUTS.join(", ")}`);
  const end = resolveUntil(s.until, `শট ${i + 1}`);
  if (end === null) return;
  if (end <= start) return void errors.push(`${tag}: শেষ (${sec(end)}s) আগের শটের শেষ (${sec(start)}s)-এর পরে হতে হবে`);

  const shot: TimelineShot = {
    index: i + 1,
    startMs: start,
    endMs: Math.min(end, totalMs),
    layout: s.layout,
    punch: 1,
    captions: s.captions ?? true,
    sfx: s.sfx ?? true,
  };

  if (NEEDS_BROLL.includes(s.layout)) {
    const ref = typeof s.broll === "string" ? { file: s.broll } : s.broll;
    const a = ref?.file ? brollMap.get(ref.file) : undefined;
    if (!ref?.file) errors.push(`${tag}: "broll" ফাইল দিতে হবে`);
    else if (!a) errors.push(`${tag}: B-roll "${ref.file}" পাওয়া যায়নি (npm run assets দিয়ে তালিকা দেখুন)`);
    else if (a.kind === "audio") errors.push(`${tag}: ${ref.file} অডিও ফাইল, B-roll হতে পারে না`);
    else {
      if (ref.move && !MOVES.includes(ref.move)) errors.push(`${tag}: অজানা move "${ref.move}" — ${MOVES.join(", ")}`);
      if (ref.sound !== undefined && !(ref.sound >= 0 && ref.sound <= 1)) errors.push(`${tag}: "sound" হবে ০ থেকে ১ (যেমন 0.15)`);
      if (ref.rate !== undefined && !(ref.rate >= 0.25 && ref.rate <= 4)) errors.push(`${tag}: "rate" হবে 0.25 থেকে 4 (0.5 = স্লো-মোশন)`);
      if (a.kind === "image" && (ref.sound || ref.rate)) warns.push(`${tag}: ছবিতে sound/rate কাজ করে না`);
      if (a.kind === "video" && ref.sound && a.hasAudio === false) warns.push(`${tag}: ${ref.file}-এ কোনো শব্দ নেই — "sound" কাজ করবে না`);
      if (a.kind === "video" && ref.rate && ref.rate < 1 && a.fps && a.fps * ref.rate < 24)
        warns.push(`${tag}: ${a.fps}fps ফুটেজ ${ref.rate}x-এ ঝাঁকুনি দেখাবে — স্লো-মোশনের জন্য ৫০/৬০fps-এ শুট করুন`);
      if (a.warn && !formatWarned.has(a.name)) {
        formatWarned.add(a.name);
        warns.push(`${tag}: ${ref.file} — ${a.warn}`);
      }
      if (ref.fit !== undefined && !FITS.includes(ref.fit)) errors.push(`${tag}: "fit" হবে ${FITS.join(" | ")} (fit = পুরো ছবি + ঝাপসা পটভূমি, fill = কেটে ভরাট)`);
      if (ref.focus !== undefined && !/^\d+(\.\d+)?% \d+(\.\d+)?%$/.test(String(ref.focus))) errors.push(`${tag}: "focus" হবে "x% y%" (যেমন "70% 50%" = ডান দিক)`);
      checkGrade(ref.grade, tag);
      const need = ((shot.endMs - shot.startMs) / 1000) * (ref.rate ?? 1) + (ref.from ?? 0);
      if (a.kind === "video" && a.durationSec && (ref.from ?? 0) >= a.durationSec) errors.push(`${tag}: "from" ${ref.from}s, কিন্তু ক্লিপ মাত্র ${a.durationSec.toFixed(1)}s`);
      else if (a.kind === "video" && a.durationSec && a.durationSec < need) warns.push(`${tag}: ${ref.file} ছোট (${a.durationSec.toFixed(1)}s, দরকার ${need.toFixed(1)}s) — লুপ হবে`);
      if (a.kind === "image" && a.width && a.width < 1600) warns.push(`${tag}: ছবি ${a.width}px চওড়া — জুমে ফেটে যেতে পারে`);
      shot.broll = { ...ref, grade: ref.grade ?? edit.brollGrade, path: a.path, kind: a.kind, durationSec: a.durationSec, aspect: a.width && a.height ? Math.round((a.width / a.height) * 1000) / 1000 : undefined };
    }
  } else if (s.broll) warns.push(`${tag}: এই লেআউটে broll লাগে না — বাদ`);

  if (NEEDS_GFX.includes(s.layout)) {
    if (!s.gfx?.scene) errors.push(`${tag}: "gfx": { "scene": ... } দিতে হবে`);
    else if (!SCENES.includes(s.gfx.scene)) errors.push(`${tag}: অজানা scene "${s.gfx.scene}" — ${SCENES.join(", ")}`);
    else shot.gfx = s.gfx;
  } else if (s.gfx && NEEDS_BROLL.includes(s.layout)) {
    // B-roll / স্ক্রিন রেকর্ডিংয়ের উপর গ্রাফিক্স (ঐচ্ছিক): দাম, ফিচারের নাম, "এখানে চাপুন"
    if (!s.gfx.scene || !SCENES.includes(s.gfx.scene)) errors.push(`${tag}: অজানা scene "${s.gfx.scene}" — ${SCENES.join(", ")}`);
    else {
      shot.gfx = s.gfx;
      if (s.layout === "split" && SIDE_PANEL_SCENES.includes(s.gfx.scene))
        warns.push(`${tag}: split-এ ${s.gfx.scene} কার্ড ডান পাশের B-roll ঢেকে দেয় — "broll" বা "aroll+gfx" ভালো`);
      // তীর একটা নির্দিষ্ট জায়গা দেখায় — ফুটেজ নড়লে সরে যায়
      if (s.gfx.scene === "Callout" && shot.broll) {
        const given = typeof s.broll === "object" ? s.broll.move : undefined;
        if (!given) shot.broll.move = "none";
        else if (given !== "none") warns.push(`${tag}: Callout-এর সাথে move "${given}" — ফুটেজ নড়লে তীর ভুল জায়গায় যাবে ("move": "none" দিন)`);
      }
    }
  } else if (s.gfx) warns.push(`${tag}: এই লেআউটে gfx লাগে না — বাদ`);

  if (AROLL_FULL.includes(s.layout)) {
    if (s.punch) shot.punch = Math.min(1.35, Math.max(1, s.punch));
    if (s.zoom) shot.zoom = Math.min(1.3, Math.max(1, s.zoom));
  } else if (s.punch || s.zoom) warns.push(`${tag}: punch/zoom শুধু aroll / aroll+gfx-এ কাজ করে`);

  if (shot.gfx) checkGfx(shot.gfx, tag, GFX_OVERLAY.includes(s.layout));
  const dur = (shot.endMs - shot.startMs) / 1000;
  if (dur < 1) warns.push(`${tag}: মাত্র ${dur.toFixed(1)}s — চোখে ঝাঁকুনি লাগতে পারে`);
  if (["motion", "motion+aroll"].includes(s.layout) && dur < 2.5) warns.push(`${tag}: মোশন ${dur.toFixed(1)}s — পড়ার সময় কম`);
  if (shot.gfx && GFX_OVERLAY.includes(s.layout) && dur < 2) warns.push(`${tag}: ${shot.gfx.scene} মাত্র ${dur.toFixed(1)}s — পড়ার সময় কম`);
  shots.push(shot);
  start = shot.endMs;
});

if (!errors.length && start < totalMs - 50) {
  warns.push(`শট শেষ ${sec(start)}s-এ, ভিডিও ${sec(totalMs)}s — বাকিটা aroll করা হলো`);
  shots.push({ index: shots.length + 1, startMs: start, endMs: totalMs, layout: "aroll", punch: 1, captions: true, sfx: true });
}

// End screen: শেষের N সেকেন্ড — আগের শটগুলো সেখানে কেটে শেষে "endscreen" শট
const es = typeof edit.endScreen === "number" ? { seconds: edit.endScreen } : edit.endScreen;
if (es && !errors.length) {
  if (!(es.seconds >= 5 && es.seconds <= 20)) errors.push("endScreen হবে ৫ থেকে ২০ সেকেন্ড (YouTube-এর নিয়ম)");
  else if (es.seconds * 1000 > totalMs * 0.3) warns.push(`endScreen ${es.seconds}s — ভিডিওর তুলনায় বেশি লম্বা, বাদ`);
  else {
    const at = totalMs - es.seconds * 1000;
    const dropped: string[] = [];
    while (shots.length && shots[shots.length - 1].startMs >= at - 1000) {
      const d = shots.pop()!;
      dropped.unshift(`শট ${d.index} (${d.gfx?.scene ?? d.layout})`);
    }
    if (dropped.length) warns.push(`endScreen ${es.seconds}s-এর জায়গায় বাদ: ${dropped.join(", ")} — দরকারি হলে আগের শটগুলোর until আগে আনুন`);
    const last = shots[shots.length - 1];
    if (last) last.endMs = at;
    shots.push({ index: shots.length + 1, startMs: last ? at : 0, endMs: totalMs, layout: "endscreen", punch: 1, captions: false, sfx: true });
  }
}

// অটো-পাঞ্চ: পরপর দুটো পূর্ণ-A-roll শটে পালা করে ক্রপ বদল — জাম্প-কাট/একঘেয়েমি ঢাকে
if (edit.autoPunch ?? true) {
  let alt = false;
  shots.forEach((s, i) => {
    const prev = shots[i - 1];
    if (AROLL_FULL.includes(s.layout) && prev && AROLL_FULL.includes(prev.layout)) {
      alt = !alt;
      if (!edit.shots[i]?.punch && prev.punch === 1) s.punch = alt ? 1.1 : 1;
      else if (!edit.shots[i]?.punch && prev.punch > 1) s.punch = 1;
    } else alt = false;
  });
}

// একঘেয়েমি: টানা ১৫s+ একই পূর্ণ A-roll, zoom ছাড়া
shots.forEach((s) => {
  if (s.layout === "aroll" && !s.zoom && s.endMs - s.startMs > 15000)
    warns.push(`শট ${s.index}: টানা ${sec(s.endMs - s.startMs)}s শুধু aroll — zoom, B-roll বা ভাগ করুন`);
});

// মিউজিক: এক বা একাধিক অংশ; প্রতিটা "until" পর্যন্ত, শেষটা ভিডিওর শেষ পর্যন্ত
let music: Timeline["music"];
if (edit.music) {
  const refs = Array.isArray(edit.music) ? edit.music : [edit.music];
  let from = 0;
  music = [];
  refs.forEach((r, i) => {
    const tag = refs.length > 1 ? `music[${i + 1}]` : "music";
    const m = musicMap.get(r.file);
    const last = i === refs.length - 1;
    const end = last ? totalMs : r.until === undefined ? null : resolveUntil(r.until, tag);
    if (!m) return void errors.push(`${tag}: "${r.file}" পাওয়া যায়নি (এই ভিডিওর music/ বা library/music/)`);
    if (m.kind !== "audio") return void errors.push(`${tag}: "${r.file}" অডিও নয়`);
    if (end === null) return void errors.push(`${tag}: শেষটা ছাড়া প্রতিটা অংশে "until" দিন`);
    if (end - from < 8000) return void errors.push(`${tag}: অংশটা মাত্র ${sec(end - from)}s — মিউজিক বদলের জন্য অন্তত ৮s`);
    music!.push({ path: m.path, startMs: from, endMs: end, volume: r.volume ?? 0.12, duck: r.duck ?? 0.35 });
    from = end;
  });
}

const captionStyle = edit.captionStyle ?? "box";
if (!CAPTION_STYLES.includes(captionStyle)) errors.push(`captionStyle হবে ${CAPTION_STYLES.join(" | ")}`);

let sfx: Timeline["sfx"] = null;
if (edit.sfx !== false) {
  ensureSfx();
  const volume = typeof edit.sfx === "object" ? (edit.sfx.volume ?? 0.35) : 0.35;
  sfx = { volume, whoosh: webPath(path.join(LIBRARY, "sfx", "whoosh.wav")), pop: webPath(path.join(LIBRARY, "sfx", "pop.wav")) };
}

// ব্র্যান্ড: library/brand/brand.json, তার উপর edit.json-এর "brand" (false = বন্ধ)
let brand: Timeline["brand"];
if (edit.brand !== false) {
  const brandJson = path.join(LIBRARY, "brand", "brand.json");
  let base: BrandFile = {};
  if (existsSync(brandJson)) {
    try {
      base = readJson<BrandFile>(brandJson);
    } catch (e) {
      errors.push(`media/library/brand/brand.json-এ JSON ভুল: ${(e as Error).message}`);
    }
  }
  // ফাঁকা ঘর ("") = নেই
  const b = Object.fromEntries(
    Object.entries({ ...base, ...(edit.brand ?? {}) }).filter(([, v]) => !(typeof v === "string" && !v.trim())),
  ) as BrandFile;
  // ছবি: আগে এই ভিডিওর brand/, না পেলে library/brand/
  const brandDirs = [vpath(slug, "brand"), path.join(LIBRARY, "brand")];
  // নাম না দিলে ফোল্ডারে logo.png / qr.png (বা jpg/webp/svg) থাকলে সেটাই
  const autoFind = (stem: string) =>
    ["png", "jpg", "jpeg", "webp", "svg"].map((e) => `${stem}.${e}`).find((n) => brandDirs.some((d) => existsSync(path.join(d, n))));
  if (b.logo === undefined) b.logo = autoFind("logo");
  if (b.qr === undefined) b.qr = autoFind("qr");
  const brandImage = (key: string, name: string) => {
    const full = brandDirs.map((d) => path.join(d, name)).find((p) => existsSync(p));
    if (!full) errors.push(`brand.${key}: "${name}" পাওয়া যায়নি (media/videos/${slug}/brand/ বা media/library/brand/)`);
    else if (!/\.(png|jpe?g|webp|svg)$/i.test(name)) errors.push(`brand.${key}: "${name}" ছবি নয় — png/jpg/webp/svg দিন`);
    else return webPath(full);
  };

  let logo: NonNullable<Timeline["brand"]>["logo"];
  if (b.logo) {
    const p = brandImage("logo", b.logo);
    const position = b.logoPosition ?? "top-right";
    if (!CORNERS.includes(position)) errors.push(`brand.logoPosition হবে ${CORNERS.join(" | ")}`);
    if (p) logo = { path: p, position, size: Math.min(240, Math.max(30, b.logoSize ?? 80)), opacity: Math.min(1, Math.max(0.1, b.logoOpacity ?? 0.9)) };
  }
  const qr = b.qr ? brandImage("qr", b.qr) : undefined;
  const social = (b.social ?? []).filter((s, i) => {
    if (!s?.text?.trim()) return false; // ফাঁকা ঘর বাদ
    if (SOCIALS.includes(s.type)) return true;
    errors.push(`brand.social[${i}]: অজানা type "${s.type}" — ${SOCIALS.join(" | ")}`);
    return false;
  });

  // যোগাযোগ বার: start থেকে প্রতি every সেকেন্ডে duration ধরে; মোশন/PiP শট এড়িয়ে; শেষে একবার
  const bars: { startMs: number; endMs: number }[] = [];
  const hasContact = Boolean(b.phone || b.name || social.length || qr);
  if (b.contactBar !== false && hasContact) {
    const cfg = { start: 4, every: 30, duration: 7, atEnd: true, ...b.contactBar };
    const dur = cfg.duration * 1000;
    if (cfg.duration < 2) errors.push("brand.contactBar.duration কমপক্ষে ২ সেকেন্ড");
    else if (cfg.every < cfg.duration + 2) errors.push(`brand.contactBar.every কমপক্ষে duration + ২ (${cfg.duration + 2}) সেকেন্ড`);
    else {
      const busy = shots.filter((s) => ["motion", "motion+aroll", "pip"].includes(s.layout));  // endscreen-এ বার থাকে — যোগাযোগের সেরা সময়
      const endStart = cfg.atEnd ? Math.max(0, totalMs - dur) : totalMs;
      let t = cfg.start * 1000;
      while (t + dur <= endStart - 2000) {
        const hit = busy.find((s) => t < s.endMs && t + dur > s.startMs);
        if (hit) t = hit.endMs + 500;
        else {
          bars.push({ startMs: t, endMs: t + dur });
          t += cfg.every * 1000;
        }
      }
      if (cfg.atEnd && totalMs > dur) {
        // শেষের মোশন/PiP শটের পরে শুরু; অন্তত ৩s জায়গা না থাকলে বাদ
        const last = busy.filter((s) => endStart < s.endMs).at(-1);
        const s0 = last ? last.endMs + 300 : endStart;
        if (totalMs - s0 >= 3000) bars.push({ startMs: s0, endMs: totalMs });
        else warns.push("ব্র্যান্ড: শেষের অংশে মোশন/PiP — শেষের যোগাযোগ বার বাদ");
      }
    }
  } else if (b.contactBar && !hasContact) warns.push("ব্র্যান্ড: contactBar চালু কিন্তু name/phone/social/qr কিছুই নেই");

  if (logo || bars.length) brand = { name: b.name, address: b.address, phone: b.phone, phoneLabel: b.phoneLabel, logo, qr, social, bars };
}

for (const w of warns) console.warn(`⚠ ${w}`);
if (errors.length) {
  console.error(`\n✗ ${errors.length}টা সমস্যা:\n  ` + errors.join("\n  "));
  process.exit(1);
}

writeJson(vpath(slug, "timeline.json"), { arollFocus: edit.arollFocus ?? "50% 35%", arollGrade: edit.arollGrade, endScreenText: es?.text, captionStyle, captionEmphasis: edit.captionEmphasis ?? true, sfx, music, brand, shots } satisfies Timeline);

// YouTube চ্যাপ্টার: ChapterCard শটগুলো থেকে
const hms = (ms: number) => {
  const t = Math.floor(ms / 1000);
  const h = Math.floor(t / 3600), m = Math.floor((t % 3600) / 60), s = t % 60;
  return (h ? `${h}:${String(m).padStart(2, "0")}` : `${m}`) + `:${String(s).padStart(2, "0")}`;
};
const chapters = shots.filter((s) => s.gfx?.scene === "ChapterCard").map((s) => ({ ms: s.startMs, title: String(s.gfx?.title ?? "") }));
if (chapters.length) {
  const all = chapters[0].ms < 1000 ? chapters : [{ ms: 0, title: "শুরু" }, ...chapters];
  writeFileSync(vpath(slug, "output", "chapters.txt"), all.map((c) => `${hms(c.ms)} ${c.title}`).join("\n") + "\n", "utf8");
  const short = all.some((c, i) => (all[i + 1]?.ms ?? totalMs) - c.ms < 10000);
  if (all.length < 3 || short) console.warn("⚠ YouTube চ্যাপ্টারের শর্ত: কমপক্ষে ৩টা, প্রতিটা ≥১০s — chapters.txt দেখে নিন");
}

console.log("\n  #   শুরু    শেষ   লেআউট          বিষয়বস্তু");
for (const s of shots)
  console.log(
    `${String(s.index).padStart(3)} ${sec(s.startMs).padStart(6)} ${sec(s.endMs).padStart(6)}   ${s.layout.padEnd(13)}  ${s.broll?.file ?? (s.gfx ? String(s.gfx.scene) : "")}${s.broll && s.gfx ? ` + ${s.gfx.scene}` : ""}${s.punch > 1 ? `  [punch ${s.punch}]` : ""}${s.zoom ? `  [zoom ${s.zoom}]` : ""}`,
  );
if (brand)
  console.log(
    `\n  ব্র্যান্ড: ${brand.logo ? `লোগো (${brand.logo.position})` : "লোগো নেই"} · যোগাযোগ বার ${brand.bars.length}বার${brand.bars.length ? ` (${brand.bars.map((x) => `${sec(x.startMs)}s`).join(", ")})` : ""}`,
  );
console.log(`\n✓ ${shots.length}টা শট → timeline.json${chapters.length ? " · output/chapters.txt" : ""}`);
console.log(`প্রিভিউ: npm run studio   এক শটের ছবি: npm run frame -- ${slug} --shot N   রেন্ডার: npm run render  (Shorts: --format shorts --from 12 --to 58)`);
