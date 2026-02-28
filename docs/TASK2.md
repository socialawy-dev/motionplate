# Task: Phase 4.7 Steps 10-11 — Tests + Gate

## Context
We just added spatial transitions and dual-plate composite rendering to MotionPlate.
All code is written and compiles (tsc clean, 76/76 tests passing, lint clean).
What's missing: tests for the new code.

## Files to read first
- src/spec/schema.ts (CompositeTransitionFn type, TransitionName union)
- src/engine/transitions/index.ts (dual registry: getTransition, getCompositeTransition, isCompositeTransition)
- src/engine/transitions/crossfade.ts (crossfadeComposite export)
- src/engine/transitions/wipeLeft.ts
- src/engine/transitions/wipeDown.ts  
- src/engine/transitions/slideLeft.ts
- src/engine/transitions/zoomThrough.ts
- src/engine/renderer.ts (renderPlateToBuffer, getBuffer, composite path in renderFrame)
- tests/engine/transitions.test.ts (existing — ADD to this file)
- tests/engine/renderer.test.ts (existing — ADD to this file)

## Tests to add (in transitions.test.ts)

### Composite transition tests
For each of wipeLeft, wipeDown, slideLeft, crossfadeComposite:
- At progress=0: outgoing plate dominates
- At progress=1: incoming plate dominates
- At progress=0.5: both plates involved (verify ctx method calls)

For wipeLeft specifically: verify ctx.save(), ctx.beginPath(), ctx.rect(), ctx.clip(), ctx.restore() are called at progress=0.5
For slideLeft: verify drawImage called with negative offset for outgoing

For zoomThrough:
- At progress=0.2 (phase 1): outgoing visible + white overlay building
- At progress=0.5 (phase 2): white flash + incoming emerging  
- At progress=0.8 (phase 3): incoming visible + flash fading

### Registry tests
- isCompositeTransition('crossfade') → true
- isCompositeTransition('wipeLeft') → true
- isCompositeTransition('fadeThroughBlack') → false
- isCompositeTransition('cut') → false
- getCompositeTransition('wipeLeft') returns a function
- getCompositeTransition for unknown falls back to crossfadeComposite

## Tests to add (in renderer.test.ts)

### Dual-plate composite rendering
- Create a 2-plate spec where plate[1].transition = 'crossfade'
- Call renderFrame at a time within plate[1]'s transition zone (localTime < td)
- Verify that both plates' effects were applied (both images drawn)
- The test mock setup already exists in this file — follow the existing pattern

## Gate (Step 11)
After tests are added, run and verify:
```bash
npx tsc --noEmit
npm run lint  
npm run build
npm run test