// সব পাথ এক জায়গায়। প্রতিটা ভিডিও: media/videos/<slug>/ ; শেয়ার্ড: media/library/
import { existsSync, mkdirSync, readFileSync, realpathSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

// এই কম্পিউটারের সেটিং (.env — git-এ যায় না): QUALITY, DEVICE, OFFLINE, PORT, BROWSER_EXECUTABLE…
// টার্মিনালে দেওয়া env আগে ধরা হয়; ফাইল না থাকলে কিছু হয় না
try {
  process.loadEnvFile?.(".env");
} catch {
  /* .env নেই */
}

export const MEDIA = "media";
export const LIBRARY = path.join(MEDIA, "library");
export const VIDEOS = path.join(MEDIA, "videos");
const CURRENT = path.join(MEDIA, ".current");

export const vpath = (slug: string, ...p: string[]) => path.join(VIDEOS, slug, ...p);
// Remotion-এর staticFile-এর জন্য (media/ থেকে আপেক্ষিক, সবসময় "/" দিয়ে)
export const webPath = (p: string) => path.relative(MEDIA, p).split(path.sep).join("/");

export const isSlug = (s: string) => /^[a-z0-9][a-z0-9-]{0,60}$/.test(s);

export const setCurrent = (slug: string) => {
  mkdirSync(MEDIA, { recursive: true });
  writeFileSync(CURRENT, slug, "utf8");
};

// স্লাগ: কমান্ডের প্রথম আর্গুমেন্ট, না দিলে শেষবার যে ভিডিওতে কাজ হয়েছে
export const resolveSlug = (arg?: string): string => {
  const slug = arg && !arg.startsWith("--") ? arg : existsSync(CURRENT) ? readFileSync(CURRENT, "utf8").trim() : "";
  if (!slug) {
    console.error("✗ কোন ভিডিও? যেমন: npm run <কমান্ড> -- gas-detector   (তালিকা: npm run list)");
    process.exit(1);
  }
  if (!existsSync(vpath(slug))) {
    console.error(`✗ ভিডিও "${slug}" নেই। নতুন বানাতে: npm run new -- ${slug} <ভিডিও ফাইল>   (তালিকা: npm run list)`);
    process.exit(1);
  }
  setCurrent(slug);
  return slug;
};

// ---- কমান্ডের অপশন ----
// `--` ছাড়া চালালে (বা পুরনো npm + Windows PowerShell-এ `--` হারিয়ে গেলে) npm নিজেই --অপশনগুলো খেয়ে ফেলে:
// মানগুলো নামহীন হয়ে আসে আর npm_config_<নাম> সেট হয়। চুপচাপ ভুল কাজ না করে থেমে কারণ জানাই।
const script = process.env.npm_lifecycle_event ?? "<কমান্ড>";
const swallowed = (name: string) => process.env[`npm_config_${name.replace(/-/g, "_")}`];
const dashHelp = (): never => {
  console.error(
    `✗ অপশনগুলো npm নিজে খেয়ে ফেলেছে — কমান্ডের নামের পরে "--" দিন:\n` +
      `    npm run ${script} -- <নাম> --অপশন মান\n` +
      `  "--" দেওয়ার পরও এটা এলে (পুরনো npm + PowerShell): npm run ${script} '--' …  লিখুন, বা npm আপডেট করুন (npm i -g npm)।`,
  );
  process.exit(1);
};
// মান লাগে এমন অপশন npm খেয়ে ফেললে মানটা কোনটার ছিল আর বোঝা যায় না — শুরুতেই থামি
if (["format", "from", "to", "pick", "title", "sub", "side", "quality", "device", "port", "shot", "at"].some((n) => swallowed(n) !== undefined)) dashHelp();

export const flag = (name: string) => {
  if (process.argv.includes(`--${name}`)) return true;
  // npm খেয়ে ফেললেও হ্যাঁ/না অপশন ঠিকই বোঝা যায় (--fast → "true", --no-master → master="")
  return name.startsWith("no-") ? swallowed(name.slice(3)) === "" : swallowed(name) === "true";
};
export const opt = (name: string) => {
  const i = process.argv.indexOf(`--${name}`);
  return i > -1 ? process.argv[i + 1] : undefined;
};
// কমান্ড সর্বোচ্চ n-টা নামহীন আর্গুমেন্ট নেয়; বেশি এলে আর কোনো --অপশন না থাকলে npm সেগুলো খেয়েছে
export const maxArgs = (n: number) => {
  const a = process.argv.slice(2);
  if (a.length > n && !a.some((x) => x.startsWith("--"))) dashHelp();
};

// এই ফাইলটাই সরাসরি চালানো হয়েছে কিনা (import নয়) — Windows-এ ড্রাইভ অক্ষরের ছোট/বড় হাতের পার্থক্যেও ঠিক থাকে
export const isMain = (metaUrl: string) => {
  if (!process.argv[1]) return false;
  const norm = (p: string) => {
    let r = path.resolve(p);
    try {
      r = realpathSync.native(r);
    } catch {
      /* যেমন আছে */
    }
    return process.platform === "win32" ? r.toLowerCase() : r;
  };
  return norm(fileURLToPath(metaUrl)) === norm(process.argv[1]);
};
