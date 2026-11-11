---
name: remotion-scene-builder
description: Create or modify a motion-graphics scene (React/Remotion component) for the bangla-video-studio template — on-brand, Bangla-font safe, working in both overlay and full-screen modes and in 16:9 and 9:16. Use for "নতুন scene বানাও", "a timeline/diagram/map graphic", or restyling an existing scene.
---

# Remotion scene builder

A scene is a reusable motion graphic. Every video uses it through `gfx: { "scene": "Name", ...props }` in `edit.json`.

## Before writing
Read `src/theme.ts` (colors, radius, springs, timings), `src/scenes/common.tsx` (helpers), and one similar existing scene. `BulletList.tsx` and `StatCard.tsx` are good references.

## Contract — every scene must
1. **Signature:** `React.FC<SceneProps<{ ...props }>>`. `mode` is `"overlay"` (drawn over footage: the speaker in `aroll+gfx`, or B-roll / a screen recording when a `broll`, `split` or `pip` shot carries a `gfx` — `useContext(ShotLayoutContext)` from `common.tsx` gives the layout, e.g. to stay clear of the small PiP box as `SidePanel` does) or `"full"` (owns the screen in `motion` / `motion+aroll`). Implement both. If one mode makes no sense, render a sensible fallback rather than nothing.
2. **Sizes:** derive all of them from `useUnit()` (1 = 1080p landscape; 0.9 × width/1080 in vertical). Never hard-code pixels, so 4K and Shorts work.
3. **Orientation:** branch layout with `useIsVertical()`. In vertical: stack instead of placing side by side, keep content in the middle 86% width, avoid the top 10% and the bottom 30% (captions and platform UI). In overlay mode, keep clear of the bottom 22% in landscape (captions) and of the speaker's face (usually centre, 35% from the top). An overlay anchored to the top must use `paddingTop: Math.max(<its own top>, useTopClear())` (from `common.tsx`): in vertical the contact bar sits at the top, and this moves the graphic below it while the bar shows (0 otherwise) — see `CTA.tsx`.
4. **Motion:** entrance via `useEnter(delay, cfg)` (springs from theme) and exit via `useExit()` (fades the last `theme.exitFrames`). Stagger elements by 4–10 frames. Use no more than 2–3 motion ideas per scene. Nothing should bounce endlessly. Small subtle loops are fine.
5. **Style:** colors only from `theme.color`. Font is `theme.font` (Hind Siliguri — Bangla + Latin). Full mode sits on `<FullBg>`. Overlay panels use `theme.color.panel` with `theme.radius`, or reuse `<SidePanel>`.
6. **Bangla text:** never split Bangla strings per character — it breaks conjuncts. Animate whole words or lines. Line-height ≥ 1.3. Convert digits that are displayed as Bangla with `"০১২৩৪৫৬৭৮৯"`.
7. **Duration-aware:** read `useVideoConfig().durationInFrames` (the shot length), and have all content appear within about 60% of it.
8. **Sound (optional):** `<PopAt frame={n} />` from `src/sfx.tsx` for item reveals. It is silent automatically when SFX are off.
9. **Robust props:** give every optional prop a default, guard arrays with `= []`, and never throw on missing data.

## Register
1. Export the component from `src/scenes/<Name>.tsx`.
2. Add it to `REGISTRY` in `src/scenes/index.tsx`.
3. Add the name to `SCENES` in `src/timeline-types.ts`.
4. Add a row (props, overlay use, full use) to the scene table in `.claude/skills/bangla-video-edit-plan/SKILL.md`, and to the scene list in `CLAUDE.md`, so plans can use it.

## Verify — required
1. `npm run typecheck`
2. Put the scene into a test shot in the current video's `edit.json` (or the demo's: `npm run demo`), then run `npm run plan`.
3. Render stills of both modes and orientations, and look at them:
   ```
   node node_modules/@remotion/cli/remotion-cli.js still Main   out.png --frame=<f> --props='{"slug":"demo"}'
   node node_modules/@remotion/cli/remotion-cli.js still Vertical out-v.png --frame=<f> --props='{"slug":"demo"}'
   ```
   Check for clipped text, Bangla rendering, overlap with captions or the face, and contrast. Fix and re-check.
4. Restore the user's `edit.json` if you changed it for testing.

## Ideas that fit this channel
Timeline or steps (numbered horizontal path), a circuit or pin diagram with labeled points, a price breakdown table, a progress or "step X of Y" tag, a quote card, a map pin, before/after image wipe, a checklist with ticks, a warning/safety card.
