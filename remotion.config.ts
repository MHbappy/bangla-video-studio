import { Config } from "@remotion/cli/config";

Config.setEntryPoint("src/index.ts");
// সব মিডিয়া (ভিডিও ফোল্ডার + লাইব্রেরি) media/ থেকে পরিবেশিত হয়
Config.setPublicDir("media");
Config.setVideoImageFormat("jpeg");
Config.setJpegQuality(95);
Config.setOverwriteOutput(true);
Config.setConcurrency(null);
