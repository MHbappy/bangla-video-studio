import React from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig } from "remotion";
import { theme } from "../theme";
import type { CaptionLine } from "../types";
import { isKeyword } from "./emphasis";

// ১৬:৯ সাবটাইটেল। style "box" = আধা-স্বচ্ছ বক্স; "highlight" = বক্স ছাড়া, বলা শব্দ রঙিন
export const BoxCaptions: React.FC<{ lines: CaptionLine[]; style: "box" | "highlight"; rightInset?: number; bottomInset?: number; emphasis?: boolean }> = ({
  lines,
  style,
  rightInset = 0,
  bottomInset = 0,
  emphasis = true,
}) => {
  const frame = useCurrentFrame();
  const { fps, height } = useVideoConfig();
  const ms = (frame / fps) * 1000;
  const line = lines.find((l) => ms >= l.startMs && ms < l.endMs);
  if (!line) return null;
  const fontSize = Math.round(height * 0.046);
  const box = style === "box";
  return (
    <AbsoluteFill style={{ justifyContent: "flex-end", alignItems: "center", paddingBottom: height * 0.065 + bottomInset, paddingRight: rightInset }}>
      <div
        style={{
          fontFamily: theme.font,
          fontWeight: box ? 500 : 700,
          fontSize,
          lineHeight: 1.45,
          color: "#fff",
          background: box ? "rgba(0,0,0,0.62)" : undefined,
          padding: box ? `${fontSize * 0.16}px ${fontSize * 0.55}px` : 0,
          borderRadius: fontSize * 0.25,
          maxWidth: "80%",
          textAlign: "center",
          textShadow: box ? undefined : "0 3px 12px rgba(0,0,0,.85), 0 0 3px rgba(0,0,0,.9)",
        }}
      >
        {line.words.map((w, i) => {
          const key = emphasis && isKeyword(w.text);
          // box: গুরুত্বপূর্ণ শব্দ ব্র্যান্ড রঙে; highlight: বলা শব্দ ব্র্যান্ড রঙে, গুরুত্বপূর্ণ শব্দ দ্বিতীয় রঙে
          const color = box ? (key ? theme.color.accent : "#fff") : ms >= w.startMs && ms < w.endMs ? theme.color.accent : key ? theme.color.accent2 : "#fff";
          return (
            <span key={i} style={{ color, fontWeight: key ? 700 : undefined }}>
              {w.text}
              {i < line.words.length - 1 ? " " : ""}
            </span>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};
