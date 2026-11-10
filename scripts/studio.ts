// npm run studio -- [slug]  → ব্রাউজারে প্রিভিউ
import { existsSync } from "node:fs";
import { resolveSlug, vpath } from "./paths";
import { props, remotionLive } from "./remotion";

const slug = resolveSlug(process.argv[2]);
if (!existsSync(vpath(slug, "timeline.json"))) console.warn(`⚠ timeline.json নেই — শুধু A-roll + ক্যাপশন দেখাবে। আগে: npm run plan -- ${slug}`);
console.log(`→ Studio: ${slug}  (Main = ১৬:৯, Vertical = Shorts, Graphics = স্বচ্ছ লেয়ার)`);
remotionLive(["studio", props(slug)]);
