// Remotion CLI চালানো — npx ছাড়াই, সব OS-এ একভাবে
import { execFileSync, spawn } from "node:child_process";
import { existsSync, readdirSync } from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";

const require = createRequire(import.meta.url);
const cli = path.join(path.dirname(require.resolve("@remotion/cli/package.json")), "remotion-cli.js");
// ব্রাউজার: BROWSER_EXECUTABLE দিলে সেটা; Remotion-এর নিজের Chrome নামানো থাকলে সেটা;
// না থাকলে কম্পিউটারে ইনস্টল করা Chrome/Edge (নামানো আটকে গেলেও রেন্ডার চলে)
const SYSTEM_BROWSERS: Record<string, string[]> = {
  darwin: ["/Applications/Google Chrome.app/Contents/MacOS/Google Chrome", "/Applications/Chromium.app/Contents/MacOS/Chromium", "/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge"],
  win32: [
    `${process.env["PROGRAMFILES"]}\\Google\\Chrome\\Application\\chrome.exe`,
    `${process.env["PROGRAMFILES(X86)"]}\\Google\\Chrome\\Application\\chrome.exe`,
    `${process.env.LOCALAPPDATA}\\Google\\Chrome\\Application\\chrome.exe`,
    `${process.env["PROGRAMFILES(X86)"]}\\Microsoft\\Edge\\Application\\msedge.exe`,
  ],
  linux: ["/usr/bin/google-chrome", "/usr/bin/chromium", "/usr/bin/chromium-browser"],
};
// নামানো শেষ হলে ভেতরে chrome-headless-shell(.exe) ফাইল থাকে; আধা-নামানো/lock হলে নয়
const hasRemotionBrowser = (dir = path.join("node_modules", ".remotion", "chrome-headless-shell"), depth = 3): boolean =>
  existsSync(dir) &&
  readdirSync(dir, { withFileTypes: true }).some((e) =>
    e.isDirectory() ? depth > 0 && hasRemotionBrowser(path.join(dir, e.name), depth - 1) : /^chrome-headless-shell(\.exe)?$/.test(e.name),
  );
let browser: string | null | undefined;
const findBrowser = () => {
  if (browser === undefined) {
    browser = process.env.BROWSER_EXECUTABLE || null;
    if (!browser && !hasRemotionBrowser()) browser = (SYSTEM_BROWSERS[process.platform] ?? []).find((p) => existsSync(p)) ?? null;
  }
  return browser;
};
const extra = () => (findBrowser() ? [`--browser-executable=${findBrowser()}`] : []);

// setup-এ দেখানোর জন্য: রেন্ডার কোন ব্রাউজারে হবে ("download" = প্রথম রেন্ডারে Remotion নিজে নামাবে)
export const browserStatus = (): { kind: "custom" | "remotion" | "system" | "download"; path?: string } => {
  const b = findBrowser();
  if (b) return { kind: process.env.BROWSER_EXECUTABLE ? "custom" : "system", path: b };
  return { kind: hasRemotionBrowser() ? "remotion" : "download" };
};

export const remotion = (args: string[], quiet = false) =>
  execFileSync(process.execPath, [cli, ...args, ...extra()], { stdio: quiet ? "pipe" : "inherit" });

export const remotionLive = (args: string[]) => {
  const child = spawn(process.execPath, [cli, ...args, ...extra()], { stdio: "inherit" });
  child.on("exit", (code) => process.exit(code ?? 0));
};

export const props = (slug: string) => `--props=${JSON.stringify({ slug })}`;
