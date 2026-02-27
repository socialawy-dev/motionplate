# Phase 1 — Engine Core Tasks

## Spec Types (P1-01)
- [x] P1-01 Define [Plate](file:///e:/co/motionplate/src/spec/schema.ts#113-125), [Sequence](file:///e:/co/motionplate/src/spec/schema.ts#136-140), [EffectConfig](file:///e:/co/motionplate/src/spec/schema.ts#52-58), [PostConfig](file:///e:/co/motionplate/src/spec/schema.ts#87-94), text types in [src/spec/schema.ts](file:///e:/co/motionplate/src/spec/schema.ts)

## Effects (P1-02 to P1-07)
- [x] P1-02 [kenBurns.ts](file:///e:/co/motionplate/src/engine/effects/kenBurns.ts) — pan + zoom effect
- [x] P1-03 [pulse.ts](file:///e:/co/motionplate/src/engine/effects/pulse.ts) — breathing/scale oscillation
- [x] P1-04 [drift.ts](file:///e:/co/motionplate/src/engine/effects/drift.ts) — slow float motion
- [x] P1-05 [rotate.ts](file:///e:/co/motionplate/src/engine/effects/rotate.ts) — subtle rotation
- [x] P1-06 [static.ts](file:///e:/co/motionplate/src/engine/effects/static.ts) — full canvas draw, no motion
- [x] P1-07 [effects/index.ts](file:///e:/co/motionplate/src/engine/effects/index.ts) — effect registry [getEffect(name)](file:///e:/co/motionplate/src/engine/effects/index.ts#20-25)

## Post-Processing (P1-08 to P1-14)
- [x] P1-08 [post/vignette.ts](file:///e:/co/motionplate/src/engine/post/vignette.ts)
- [x] P1-09 [post/bloom.ts](file:///e:/co/motionplate/src/engine/post/bloom.ts)
- [x] P1-10 [post/particles.ts](file:///e:/co/motionplate/src/engine/post/particles.ts)
- [x] P1-11 [post/fog.ts](file:///e:/co/motionplate/src/engine/post/fog.ts)
- [x] P1-12 [post/chromaticAberration.ts](file:///e:/co/motionplate/src/engine/post/chromaticAberration.ts)
- [x] P1-13 [post/screenShake.ts](file:///e:/co/motionplate/src/engine/post/screenShake.ts)
- [x] P1-14 [post/index.ts](file:///e:/co/motionplate/src/engine/post/index.ts) — post-effect registry

## Transitions (P1-15 to P1-20)
- [x] P1-15 [transitions/cut.ts](file:///e:/co/motionplate/src/engine/transitions/cut.ts)
- [x] P1-16 [transitions/crossfade.ts](file:///e:/co/motionplate/src/engine/transitions/crossfade.ts)
- [x] P1-17 [transitions/fadeThroughBlack.ts](file:///e:/co/motionplate/src/engine/transitions/fadeThroughBlack.ts)
- [x] P1-18 [transitions/fadeThroughWhite.ts](file:///e:/co/motionplate/src/engine/transitions/fadeThroughWhite.ts)
- [x] P1-19 [transitions/lightBleed.ts](file:///e:/co/motionplate/src/engine/transitions/lightBleed.ts)
- [x] P1-20 [transitions/index.ts](file:///e:/co/motionplate/src/engine/transitions/index.ts) — transition registry

## Text & Core (P1-21 to P1-26)
- [x] P1-21 [engine/text.ts](file:///e:/co/motionplate/src/engine/text.ts) — LTR text overlay renderer
- [x] P1-22 RTL support in [text.ts](file:///e:/co/motionplate/src/engine/text.ts) (auto-detect Arabic, set `direction: 'rtl'`)
- [x] P1-23 [engine/renderer.ts](file:///e:/co/motionplate/src/engine/renderer.ts) — [renderFrame(ctx, canvas, spec, images, time)](file:///e:/co/motionplate/src/engine/renderer.ts#98-151)
- [x] P1-24 [engine/renderer.ts](file:///e:/co/motionplate/src/engine/renderer.ts) — [getPlateAtTime(spec, t)](file:///e:/co/motionplate/src/engine/renderer.ts#7-33) sequencer
- [x] P1-25 [engine/profiler.ts](file:///e:/co/motionplate/src/engine/profiler.ts) — [detectHardwareTier()](file:///e:/co/motionplate/src/engine/profiler.ts#3-44) → `{ tier, webgl, gpu, memory }`
- [x] P1-26 [engine/exporter.ts](file:///e:/co/motionplate/src/engine/exporter.ts) — [exportWebM(spec, images)](file:///e:/co/motionplate/src/engine/exporter.ts#11-82) via MediaRecorder

## Tests (P1-27)
- [x] P1-27 [tests/engine/effects.test.ts](file:///e:/co/motionplate/tests/engine/effects.test.ts) — unit tests for all effects
- [x] P1-27 [tests/engine/transitions.test.ts](file:///e:/co/motionplate/tests/engine/transitions.test.ts) — unit tests for all transitions
- [x] P1-27 [tests/engine/renderer.test.ts](file:///e:/co/motionplate/tests/engine/renderer.test.ts) — unit tests for [getPlateAtTime](file:///e:/co/motionplate/src/engine/renderer.ts#7-33), [renderFrame](file:///e:/co/motionplate/src/engine/renderer.ts#98-151)
- [x] P1-27 [tests/engine/text.test.ts](file:///e:/co/motionplate/tests/engine/text.test.ts) — unit tests for text wrap logic

## Quality Gate
- [x] `npm test` — **51/51 tests passing**
- [x] `npm run build` — **clean, 517ms**
