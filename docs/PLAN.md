# MotionPlate — Development Plan

> **Browser-based cinematic sequence builder. Static images in → video out.**
>
> Version: Plan v1.0 | Date: 2026-02-27 | Author: A.F.Sadek + Claude Opus 4.6

---

## Separation Notice

**MotionPlate** is a standalone, universal tool. It has no dependency on Doxascope, VideoFormation, or any other project. The Doxascope Prologue teaser is used as a **golden standard test** — a demanding real-world sequence that exercises every feature. Future integration points (VideoFormation blueprint bridge, VOID Engine handoff) are acknowledged as v2.0+ concerns and are not in scope.

---

## Architecture

```
┌──────────────────────────────────────────────────────────┐
│                    MotionPlate System                     │
├──────────────┬──────────────────┬────────────────────────┤
│  Layer 3     │   Layer 2        │   Layer 1              │
│  COMPOSER    │   ENGINE         │   SPEC                 │
│  (UI)        │   (Renderer)     │   (JSON Schema)        │
│              │                  │                        │
│  Timeline    │   Canvas2D       │   sequence.json        │
│  Plate list  │   WebGL (opt.)   │   Validated schema     │
│  Effects UI  │   MediaRecorder  │   Import/Export        │
│  Text editor │   Frame pipeline │   Version controlled   │
│  Transport   │   HW profiler    │                        │
│              │                  │                        │
│  Optional:   │                  │                        │
│  LLM Director│                  │                        │
└──────────────┴──────────────────┴────────────────────────┘

Data flow: Composer writes → Spec ← Engine reads
           LLM Director generates → Spec
```

### Core Principles

1. **JSON is truth** — `sequence.json` defines everything. The UI writes it, the engine reads it, humans can hand-edit it.
2. **Separation of concerns** — Composer, Engine, and Spec are independent. Swap the UI, replace the renderer, or generate specs externally.
3. **Hardware-aware** — Auto-detect capabilities, expose quality tiers, let users override.
4. **Provider-agnostic AI** — The LLM Director uses an adapter pattern. Swappable between Gemini, Claude, OpenAI, Ollama, or none.

### PoC - Perfect! `local-files\motionplate-engine-poc.jsx`

---

## Tech Stack

| Layer | Technology | Rationale |
|-------|-----------|-----------|
| Framework | React 18 + TypeScript | Matches existing ecosystem |
| Build | Vite | Fast, already standard across projects |
| State | Zustand | Lightweight, proven in VideoFormation + VirtuaStudio |
| Rendering | Canvas2D (primary) + WebGL (optional - useful for advanced effects) | Progressive enhancement |
| Export | MediaRecorder API (WebM VP9) | Zero dependencies, browser-native |
| Validation | AJV (JSON Schema) | Already used in GRID, lightweight |
| Styling | Tailwind CSS | Utility-first, consistent with stack |
| Testing | Vitest | Vite-native, fast |

### Future Stack (v2.0+, not installed now)

| Technology | Purpose | When |
|-----------|---------|------|
| FFmpeg WASM | MP4 export | v1.5 |
| Web Audio API | Audio sync + playback | v1.5 |
| WebGL2 shaders | Advanced effects (displacement, distortion) | v2.0 |
| Remotion bridge | Server-side rendering | v2.0 |

---

## Phase Plan

### Phase 0 — Scaffold & Foundation (x)

**Goal:** Clean project structure, dev environment, CI-ready.

| Task ID | Task | Input | Output | Test |
|---------|------|-------|--------|------|
| P0-01 | Init Vite + React + TS project | `npm create vite@latest` | Running dev server | `npm run dev` serves blank page |
| P0-02 | Install core deps | package.json | Zustand, Tailwind, AJV installed | `npm run build` succeeds |
| P0-03 | Configure Tailwind with dark theme | tailwind.config.ts | MotionPlate color tokens defined | Visual check |
| P0-04 | Create directory structure | — | See Directory Layout below | All dirs exist |
| P0-05 | Setup Vitest | vitest.config.ts | `npm test` runs | Empty test passes |
| P0-06 | Setup ESLint + Prettier | .eslintrc, .prettierrc | Linting works | `npm run lint` passes |
| P0-07 | Create README.md | — | Project description + quick start | Human review |
| P0-08 | Git init + .gitignore | — | Clean repo | `git status` clean |

**Directory Layout:**

```
motionplate/
├── src/
│   ├── engine/                # Layer 2 — Renderer
│   │   ├── effects/           # Effect implementations
│   │   │   ├── kenBurns.ts
│   │   │   ├── pulse.ts
│   │   │   ├── drift.ts
│   │   │   ├── rotate.ts
│   │   │   ├── static.ts
│   │   │   └── index.ts       # Effect registry
│   │   ├── post/              # Post-processing effects
│   │   │   ├── vignette.ts
│   │   │   ├── bloom.ts
│   │   │   ├── particles.ts
│   │   │   ├── fog.ts
│   │   │   ├── chromaticAberration.ts
│   │   │   ├── screenShake.ts
│   │   │   └── index.ts
│   │   ├── transitions/       # Transition implementations
│   │   │   ├── crossfade.ts
│   │   │   ├── fadeThroughBlack.ts
│   │   │   ├── fadeThroughWhite.ts
│   │   │   ├── lightBleed.ts
│   │   │   ├── cut.ts
│   │   │   └── index.ts
│   │   ├── text.ts            # Text overlay renderer
│   │   ├── renderer.ts        # Main render loop
│   │   ├── exporter.ts        # MediaRecorder export
│   │   └── profiler.ts        # Hardware detection
│   ├── spec/                  # Layer 1 — Schema
│   │   ├── schema.ts          # TypeScript types
│   │   ├── sequence.schema.json
│   │   ├── validator.ts       # AJV validation
│   │   ├── defaults.ts        # Default plate configs
│   │   └── io.ts              # Import/export helpers
│   ├── composer/              # Layer 3 — UI
│   │   ├── App.tsx            # Root layout
│   │   ├── Timeline.tsx       # Plate sequence timeline
│   │   ├── PlateList.tsx      # Left panel plate list
│   │   ├── PlateEditor.tsx    # Right panel plate settings
│   │   ├── PreviewCanvas.tsx  # Center canvas + transport
│   │   ├── Transport.tsx      # Play/pause/seek/export
│   │   ├── SpecView.tsx       # JSON spec viewer
│   │   └── DropZone.tsx       # Image upload area
│   ├── director/              # Optional LLM Director
│   │   ├── adapter.ts         # Provider interface
│   │   ├── providers/
│   │   │   ├── gemini.ts
│   │   │   ├── claude.ts
│   │   │   ├── openai.ts
│   │   │   └── ollama.ts
│   │   ├── parser.ts          # Script → beat extraction
│   │   ├── mapper.ts          # Beat → plate assignment
│   │   └── director.ts        # Orchestrator
│   ├── store/                 # Zustand stores
│   │   ├── project.ts         # Spec state + history
│   │   ├── playback.ts        # Transport state
│   │   └── settings.ts        # User preferences + HW tier
│   └── main.tsx
├── public/
│   └── test-assets/           # Golden standard test images
├── schemas/
│   └── sequence.schema.json   # Published schema
├── tests/
│   ├── engine/
│   ├── spec/
│   ├── director/
│   └── golden/                # Golden standard test suite
└── docs/
    └── PLAN.md                # This file
```

---

### Phase 1 — Engine Core (Layer 2) (x)

**Goal:** Standalone renderer that takes a spec + images and outputs frames.

| Task ID | Task | Input | Output | Test |
|---------|------|-------|--------|------|
| P1-01 | Define `Plate`, `Sequence`, `EffectConfig` types | — | `src/spec/schema.ts` | Types compile |
| P1-02 | Implement `kenBurns` effect | Image + canvas + progress + config | Drawn frame | Visual: image pans/zooms over 5s |
| P1-03 | Implement `pulse` effect | Image + canvas + progress + config | Drawn frame | Visual: image breathes |
| P1-04 | Implement `drift` effect | Image + canvas + progress | Drawn frame | Visual: image floats |
| P1-05 | Implement `rotate` effect | Image + canvas + progress + config | Drawn frame | Visual: subtle rotation |
| P1-06 | Implement `static` effect | Image + canvas | Drawn frame | Image displayed at full canvas |
| P1-07 | Create effect registry | All effect modules | `getEffect(name)` function | Returns correct fn for each name |
| P1-08 | Implement `vignette` post-effect | Canvas context | Radial gradient overlay | Visual check |
| P1-09 | Implement `bloom` post-effect | Canvas + progress | White overlay pulse | Visual check |
| P1-10 | Implement `particles` post-effect | Canvas + progress + config | Floating dots | Visual: particles drift upward |
| P1-11 | Implement `fog` post-effect | Canvas + progress | Gradient haze | Visual check |
| P1-12 | Implement `chromaticAberration` post | Canvas + intensity | RGB channel split | Visual: color fringing at edges |
| P1-13 | Implement `screenShake` post-effect | Canvas + progress + config | Offset frame | Visual: frame jitters then decays |
| P1-14 | Create post-effect registry | All post modules | `getPost(name)` function | Returns correct fn for each name |
| P1-15 | Implement `cut` transition | — | Instant swap | No interpolation between plates |
| P1-16 | Implement `crossfade` transition | Progress 0→1 | Alpha blend | Smooth opacity transition |
| P1-17 | Implement `fadeThroughBlack` transition | Progress 0→1 | Fade out → black → fade in | Black midpoint visible |
| P1-18 | Implement `fadeThroughWhite` transition | Progress 0→1 | Fade out → white → fade in | White flash visible |
| P1-19 | Implement `lightBleed` transition | Progress 0→1 | Hold → bright flash → new plate | Bright flash at ~40% |
| P1-20 | Create transition registry | All transition modules | `getTransition(name)` function | Returns correct fn for each name |
| P1-21 | Implement text overlay renderer | Text + config + progress | Rendered text on canvas | Text appears, wraps, fades |
| P1-22 | Implement RTL text support | Arabic text + config | Correct RTL rendering | Arabic text displays properly |
| P1-23 | Build main `renderFrame()` | Spec + images + time → canvas | Complete rendered frame | Full plate with effects + text |
| P1-24 | Build frame sequencer | Spec → time mapping | `getPlateAtTime(t)` + progress | Returns correct plate index |
| P1-25 | Implement hardware profiler | — | `{ tier, webgl, gpu, memory }` | Detects tier on load |
| P1-26 | Build WebM exporter | Canvas + spec | Downloaded .webm file | File plays in VLC/browser |
| P1-27 | Unit tests for all effects | Test inputs | Pass/fail | `npm test` all green |

**Milestone:** Headless renderer that can produce a WebM from a spec + images array programmatically.

---

### Phase 2 — Spec Schema (Layer 1) (x)

**Goal:** Validated, versioned JSON schema. Import/export. Defaults.

| Task ID | Task | Input | Output | Test |
|---------|------|-------|--------|------|
| P2-01 | Write `sequence.schema.json` | Type definitions | JSON Schema (draft-07) | AJV validates sample spec |
| P2-02 | Implement AJV validator | Schema + spec | `{ valid, errors }` | Invalid spec returns errors |
| P2-03 | Define default plate configs | — | `defaults.ts` with presets | Each effect has a sensible default |
| P2-04 | Build spec import (JSON file) | File input | Parsed + validated spec | Round-trip: export → import matches |
| P2-05 | Build spec export (JSON file) | Current spec | Downloaded .json | File is valid against schema |
| P2-06 | Schema versioning | — | `schemaVersion` field in spec | Old specs get migration warning |
| P2-07 | Spec diffing utility | Two specs | Diff summary | Detects added/removed/changed plates |

**Milestone:** `sequence.json` files are portable, validated, and self-describing.

---

### Phase 3 — Composer UI (Layer 3) (x)

**Goal:** Full interactive editor. Compose, preview, export.

| Task ID | Task | Input | Output | Test |
|---------|------|-------|--------|------|
| P3-01 | Build root App layout | — | Header + 3-panel layout | Renders without errors |
| P3-02 | Build PlateList (left panel) | Spec | Plate thumbnails + selection | Click selects plate, highlight shows |
| P3-03 | Build DropZone | File input | Images loaded + plates created | Drop 3 images → 3 plates appear |
| P3-04 | Build PreviewCanvas (center) | Spec + images + time | Rendered frame | Matches engine output |
| P3-05 | Build Transport controls | — | Play/Pause/Seek/Time display | Play animates, seek scrubs |
| P3-06 | Build PlateEditor (right panel) | Selected plate | Edit form | Changes update spec + re-render |
| P3-07 | Effect selector | — | Dropdown with all effects | Selecting effect updates plate |
| P3-08 | Post-effect toggles | — | Toggle buttons for each post | Enable/disable updates spec |
| P3-09 | Transition selector | — | Dropdown + duration input | Transition changes on preview |
| P3-10 | Text overlay editor | — | Textarea + font/position controls | Text appears on preview canvas |
| P3-11 | SpecView panel | Current spec | Formatted JSON display | Matches current spec state |
| P3-12 | Spec download button | Current spec | Downloaded .json | File is valid |
| P3-13 | Spec import button | .json file | Loaded spec + UI update | Imported spec renders correctly |
| P3-14 | Export WebM button | — | Progress bar → downloaded .webm | File plays correctly |
| P3-15 | Plate reorder (drag-and-drop) | — | Plates change position in list | Spec order updates, preview matches |
| P3-16 | Plate duplicate | — | New plate with same settings | Duplicate appears after original |
| P3-17 | Undo/Redo | Ctrl+Z / Ctrl+Y | State rollback/forward | 10-step history minimum |
| P3-18 | Hardware tier display | Profiler output | Badge showing detected tier | Correct tier shown |
| P3-19 | Quality override | User selection | Render quality changes | Export respects selected tier |
| P3-20 | Keyboard shortcuts | — | Space=play, arrows=seek, etc. | All shortcuts functional |
| P3-21 | Responsive layout | — | Works at 1024px+ | Panels collapse gracefully |

**Milestone:** Complete interactive editor. Load images, compose sequence, preview, export.

---

### Phase 4 — LLM Director (Optional AI Layer)

**Goal:** Feed script text + images → get a composed sequence.json.

| Task ID | Task | Input | Output | Test |
|---------|------|-------|--------|------|
| P4-01 | Define adapter interface | — | `LLMAdapter` TypeScript interface | Interface compiles |
| P4-02 | Implement Gemini adapter | API key + prompt | LLM response | API call succeeds |
| P4-03 | Implement Claude adapter | API key + prompt | LLM response | API call succeeds |
| P4-04 | Implement OpenAI adapter | API key + prompt | LLM response | API call succeeds |
| P4-05 | Implement Ollama adapter (local) | Endpoint + model | LLM response | Local model responds |
| P4-06 | Build script parser | Raw text | Beat list with mood/keywords | Prologue → 12 beats extracted |
| P4-07 | Build image-beat mapper | Beats + image filenames | Plate assignments | Images assigned to matching beats |
| P4-08 | Build director prompt template | Schema + beats + images | Structured prompt | Prompt requests valid spec output |
| P4-09 | Build director orchestrator | Script + images + provider | Complete sequence.json | Valid spec generated |
| P4-10 | Director UI panel | — | Script input + provider selector | User can trigger generation |
| P4-11 | Director → Composer bridge | Generated spec | Loaded into Composer | Generated sequence plays in preview |
| P4-12 | Review/accept flow | Generated spec | Diff view → accept/reject | User can modify before accepting |

### Director Adapter Interface

```typescript
interface LLMAdapter {
  name: string;
  type: 'cloud' | 'local';
  
  // Check if provider is available (API key set, server running, etc.)
  isAvailable(): Promise<boolean>;
  
  // Generate a completion from a prompt
  generate(prompt: string, options?: GenerateOptions): Promise<string>;
  
  // Generate structured JSON output
  generateJSON<T>(prompt: string, schema?: object): Promise<T>;
}

interface GenerateOptions {
  temperature?: number;    // 0-1, default 0.3 for spec generation
  maxTokens?: number;      // default 4096
  systemPrompt?: string;   // Director system prompt
}

interface DirectorInput {
  script: string;          // Raw text (the prose)
  images: ImageMeta[];     // { filename, width, height, description? }
  style?: 'cinematic' | 'documentary' | 'poetic' | 'dramatic';
  duration?: number;       // Target total duration in seconds
  provider: string;        // Which adapter to use
}

interface DirectorOutput {
  sequence: Sequence;      // Valid sequence.json spec
  reasoning: string;       // Why the AI made these choices
  confidence: number;      // 0-1 self-assessed quality
}
```

### Director Prompt Strategy

The director prompt will include:
1. The full `sequence.schema.json` (so the LLM knows the output format)
2. The script text (parsed into beats with mood annotations)
3. Image filenames + descriptions (from filename convention or user input)
4. Style directive (cinematic pacing, transition preferences)
5. Instruction to output valid JSON only

The director does NOT render — it only generates a spec. The engine renders it. This means the director can be tested without any canvas/WebGL dependency.

**Milestone:** Paste a script, select images, pick a provider, click "Direct" → sequence appears in Composer.

---

### Phase 4.7 — Spatial Transitions & Dual-Image Compositing

> **Problem Statement**
> Current transitions are alpha-only overlays on a single plate. The renderer draws one image, then overlays a colored rectangle (`rgba(0,0,0,alpha)`). Real crossfades need to draw both plates blended simultaneously, and spatial transitions (wipe, slide, zoom-through) need to position both plates geometrically.

#### Architecture Change

Current flow:
```
renderFrame(t) →
  find active plate →
  draw plate image with effect →
  apply post effects →
  overlay transition color rectangle →
  draw text
```

New flow:
```
renderFrame(t) →
  find active plate via getPlateAtTime (unchanged) →
  compute localTime within plate →

  IF in transition-IN zone (localTime < td && plateIdx > 0):
    IF transition is COMPOSITE (crossfade | wipeLeft | wipeDown | slideLeft | zoomThrough):
      get outgoing = spec.plates[plateIdx - 1] + its image
      render outgoing → offscreen buffer A (effect + post, progress = 1.0)
      render incoming → offscreen buffer B (effect + post, current progress)
      call compositeTransitionFn(ctx, canvas, bufferA, bufferB, transitionProgress)
    ELSE (fadeThroughBlack | fadeThroughWhite | lightBleed — OVERLAY):
      render current plate normally (existing path)
      apply color overlay (existing applyTransitionOverlay, IN half)

  ELSE IF in transition-OUT zone (localTime > duration - td):
    IF current plate's transition is COMPOSITE:
      skip — the NEXT plate's transition-IN zone handles the blend
    ELSE:
      apply fade-out color overlay (existing applyTransitionOverlay, OUT half)

  ELSE (mid-plate):
    existing render path unchanged

  draw text (always last)
```

> **Key insight:** Compositing happens during the *incoming* plate's transition-IN zone, looking backward at the outgoing plate. This means "last plate has no next" is never an edge case for compositing — only "first plate has no previous", which is already guarded by `plateIdx > 0`. The overlay OUT-zone only fires for non-composite transitions.

#### Key Design Decisions

1. **Two offscreen canvases** — module-scope singletons with auto-resize guard. Created once on first use, reused every frame. No per-frame allocation.
2. **`CompositeTransitionFn`** — a new function type that receives two pre-rendered buffers and draws the final composite onto the main canvas. Completely separate from the existing `TransitionFn = (progress) => number`.
3. **Overlay transitions unchanged** — `fadeThroughBlack`, `fadeThroughWhite`, `lightBleed` stay single-plate + color overlay. Zero risk.
4. **`crossfade` keeps its scalar export** — existing `TransitionFn` scalar stays untouched (existing tests stay green). A new `crossfadeComposite: CompositeTransitionFn` export is added alongside it.
5. **Schema bump** — 4 new `TransitionName` values are additive (non-breaking). Schema version bumps `1.0.0 → 1.1.0`.

#### Type Additions (`src/spec/schema.ts`)

```ts
// Transition name subsets — used to drive registry routing in index.ts
export type OverlayTransitionName = 'fadeThroughBlack' | 'fadeThroughWhite' | 'lightBleed';
export type CompositeTransitionName = 'crossfade' | 'wipeLeft' | 'wipeDown' | 'slideLeft' | 'zoomThrough';

// Full union — extends existing TransitionName
// 'cut' is neither overlay nor composite — instant swap, no transition rendering
export type TransitionName = 'cut' | OverlayTransitionName | CompositeTransitionName;

// Existing — kept for overlay transitions (TransitionFn unchanged)
export type TransitionFn = (progress: number) => number;

// New — for dual-plate composite transitions
export type CompositeTransitionFn = (
    ctx: CanvasRenderingContext2D,
    canvas: HTMLCanvasElement,
    outgoing: HTMLCanvasElement,  // pre-rendered buffer A
    incoming: HTMLCanvasElement,  // pre-rendered buffer B
    progress: number,             // 0→1
) => void;
```

#### Offscreen Canvas Strategy (`src/engine/renderer.ts`)

Module-scope singletons with auto-resize. `renderFrame` signature is unchanged.

```ts
let _bufferA: HTMLCanvasElement | null = null;
let _bufferB: HTMLCanvasElement | null = null;

function getBuffer(canvas: HTMLCanvasElement, slot: 'A' | 'B'): HTMLCanvasElement {
    const cur = slot === 'A' ? _bufferA : _bufferB;
    if (cur && cur.width === canvas.width && cur.height === canvas.height) return cur;
    const buf = document.createElement('canvas');
    buf.width = canvas.width;
    buf.height = canvas.height;
    if (slot === 'A') _bufferA = buf; else _bufferB = buf;
    return buf;
}
```

#### Files to Change

| # | File | Change | Risk |
|---|------|--------|------|
| 1 | `src/spec/schema.ts` | Add `OverlayTransitionName`, `CompositeTransitionName`, update `TransitionName` union, add `CompositeTransitionFn` type | Low |
| 2 | `schemas/sequence.schema.json` | Add 4 enum values to `TransitionName`, bump schema to `1.1.0` | Low |
| 3 | `src/spec/defaults.ts` | Bump `CURRENT_SCHEMA_VERSION` to `1.1.0` | Low |
| 4 | `src/engine/renderer.ts` | **MAJOR** — `getBuffer()` singletons, `renderPlateToBuffer()` helper, composite routing path | High |
| 5 | `src/engine/transitions/crossfade.ts` | Keep existing scalar default export; add named `crossfadeComposite: CompositeTransitionFn` export | Low |
| 6 | `src/engine/transitions/wipeLeft.ts` | **NEW** — clip-rect reveal left-to-right | None |
| 7 | `src/engine/transitions/wipeDown.ts` | **NEW** — clip-rect reveal top-to-bottom | None |
| 8 | `src/engine/transitions/slideLeft.ts` | **NEW** — push A left, B enters from right | None |
| 9 | `src/engine/transitions/zoomThrough.ts` | **NEW** — 3-phase zoom + white flash (implement last) | None |
| 10 | `src/engine/transitions/index.ts` | Dual registry: `getTransition()` for overlay, `getCompositeTransition()` for composite, `isCompositeTransition()` guard | Medium |
| 11 | `src/director/prompts.ts` | Extend cinematography guide with 4 new transitions | Low |
| 12 | `tests/engine/transitions.test.ts` | Add composite fn tests; existing scalar crossfade tests stay untouched | Medium |
| 13 | `tests/engine/renderer.test.ts` | Add integration test: composite transition zone calls both buffers | Medium |

> `defaults.ts` has no `transitionConfig` shape — only the version constant changes (covered by #3 above). No new default objects needed.

#### Transition Specs

| Transition | Category | Visual |
|------------|----------|--------|
| `crossfade` | Composite (upgraded) | Outgoing at `1−p` alpha, incoming at `p` alpha — both drawn simultaneously |
| `wipeLeft` | Composite | Draw outgoing full; clip incoming to `[0, 0, width*p, height]` — sharp left-to-right reveal |
| `wipeDown` | Composite | Draw outgoing full; clip incoming to `[0, 0, width, height*p]` — top-to-bottom reveal |
| `slideLeft` | Composite | Outgoing offset `−width*p`; incoming offset `width*(1−p)` — both plates slide |
| `zoomThrough` | Composite | Phase 1 (0–0.4): outgoing scales up + white overlay builds. Phase 2 (0.4–0.6): white flash peak. Phase 3 (0.6–1.0): incoming fades in with slight zoom-out settle |
| `fadeThroughBlack` | Overlay (unchanged) | Single plate + black rectangle overlay |
| `fadeThroughWhite` | Overlay (unchanged) | Single plate + white rectangle overlay |
| `lightBleed` | Overlay (unchanged) | Hold + bright flash overlay |
| `cut` | None (unchanged) | Instant swap — no transition rendering |

#### Crossfade Migration

`crossfade.ts` keeps both exports so no existing code or tests break:

```ts
// Default export — scalar, unchanged. Existing tests target this.
const crossfade: TransitionFn = (progress) => Math.min(1, progress * 2);
export default crossfade;

// Named export — composite. New tests target this.
export const crossfadeComposite: CompositeTransitionFn = (
    ctx, canvas, outgoing, incoming, progress,
) => {
    ctx.globalAlpha = 1;
    ctx.drawImage(outgoing, 0, 0);
    ctx.globalAlpha = progress;
    ctx.drawImage(incoming, 0, 0);
    ctx.globalAlpha = 1;
};
```

#### Director Prompt Additions (`src/director/prompts.ts`)

Add under `## Transitions: Temporal Connectors`:

```
**wipeLeft** — Hard-edge left-to-right reveal. Distinct scene changes, chapter breaks, lateral momentum.
  Use between narratively separate beats where crossfade is too soft.
**wipeDown** — Top-to-bottom reveal. Descent, weight arriving, unveiling below.
  Use for gravity moments or downward revelations.
**slideLeft** — Both plates slide laterally together. Forward momentum, parallel narratives, moving through time.
  Use for sequences with clear linear progression.
**zoomThrough** — Outgoing explodes toward camera + white flash → incoming settles. Maximum impact.
  USE AT MOST ONCE per sequence. Reserve for the single most climactic transition.
```

#### Implementation Order

```
Step 1:  schema.ts              — lock all new types first (everything else depends on this)
Step 2:  sequence.schema.json  — 4 new enum values + version 1.1.0
Step 3:  defaults.ts           — CURRENT_SCHEMA_VERSION = '1.1.0'
Step 4:  renderer.ts           — getBuffer() singletons + renderPlateToBuffer() + composite routing
                                  (stub isCompositeTransition() → false so existing tests still pass)
Step 5:  crossfade.ts          — add crossfadeComposite named export alongside scalar default
Step 6:  wipeLeft.ts, wipeDown.ts, slideLeft.ts — pure clip/translate composites (no dependencies)
Step 7:  zoomThrough.ts        — 3-phase composite (most complex — implement last)
Step 8:  transitions/index.ts  — wire dual registry + isCompositeTransition() (unblocks renderer stub)
Step 9:  prompts.ts            — director cinematography guide
Step 10: tests                 — composite transition tests + renderer integration test
Step 11: lint + tsc + build + full test gate
```

#### Test Plan

| Test | What It Verifies |
|------|-----------------|
| `wipeLeft(ctx, canvas, A, B, 0)` | Only A drawn (start state) |
| `wipeLeft(ctx, canvas, A, B, 1)` | Only B drawn (end state) |
| `wipeLeft(ctx, canvas, A, B, 0.5)` | `ctx.save/clip/restore` called (mid-transition clipping) |
| Same pattern for `wipeDown`, `slideLeft` | Geometric correctness |
| `zoomThrough` at `progress = 0.39` | Outgoing visible, scale > 1 (phase 1) |
| `zoomThrough` at `progress = 0.5` | White flash peak (phase 2) |
| `zoomThrough` at `progress = 0.8` | Incoming visible (phase 3) |
| `crossfadeComposite` at `progress = 0.5` | `drawImage` called twice — both buffers drawn |
| `renderFrame` in composite transition zone | Both offscreen buffers populated and composite fn called |
| Existing scalar `crossfade` tests | No regression (scalar export unchanged) |
| `isCompositeTransition('wipeLeft')` | Returns `true` |
| `isCompositeTransition('fadeThroughBlack')` | Returns `false` |

#### Risk Mitigation

- `renderer.ts` is the only high-risk change. The existing overlay path for `fadeThroughBlack/White/lightBleed` is kept completely untouched.
- If the composite path throws, the renderer catches and falls back to the existing overlay behavior — no silent corruption.
- `zoomThrough` is the most complex transition (canvas transforms + alpha on both buffers across 3 timed phases). Implement it last so the rest of the system is stable and testable before tackling it.

---

### Phase 5a — Persistence (do first)

**Goal:** Save/load project state so golden test work survives reloads. Schema migration for existing 1.0.0 saves.

| Task ID | Task | Input | Output | Test |
|---------|------|-------|--------|------|
| P5-10 | Project save/load (local) | Current state | IndexedDB persistence | Reload preserves work |
| P5-11 | Recent projects | Saved projects | Project list | User can switch between projects |
| P5-12 | Schema migration on load | Saved 1.0.0 project | Auto-upgraded to 1.1.0, no data loss | Load old save → 4 new transitions available |

**Milestone:** Work survives browser reloads. Old saves load without errors.

---

### Phase 6a — Golden Standard Test (silent)

**Goal:** Produce the Doxascope Prologue teaser without audio. Identify all real-world bugs before Phase 5b.

> P4.7 context: 5 composite transitions now available (crossfade, wipeLeft, wipeDown, slideLeft, zoomThrough). Director cinematography prompt teaches them. Parser image-count cap means 22 images → up to 22 beats cleanly.

| Task ID | Task | Input | Output | Test |
|---------|------|-------|--------|------|
| P6-01 | Load all 22 prologue artworks | Image files | 22 plates in sequence | All images loaded |
| P6-02 | Map beats — Director + manual refinement | Script + 22 images | Populated sequence.json | Plates cover full prologue |
| P6-03 | Apply effect assignments | Per-beat effect plan | Each plate has correct effect + spatial transitions exercised | Visual review per plate |
| P6-04 | Apply text overlays | Prologue excerpts | Text appears with timing | Arabic + English text renders |
| P6-05 | Apply transitions | Storyboard plan | Composite transitions look correct at scale | No jarring cuts where not intended |
| P6-07 | Full preview review (silent) | — | 60-90 second continuous playback | Smooth, cinematic, no glitches |
| P6-08 | Export silent WebM | — | .webm file | Plays in browser + VLC |
| P6-09 | Director comparison: AI vs manual | Same script + images | Two sequences side by side | Cinematography quality comparison |
| P6-10 | Document results + bug list | — | Test report | Bug list becomes P5b priority input |

**Milestone:** Silent prologue teaser exported. Bug list locked. P5b scope confirmed.

---

### Phase 5b — Audio & Polish (informed by golden test)

**Goal:** Audio sync, export resolution, and polish items prioritised by golden test findings.

| Task ID | Task | Input | Output | Test |
|---------|------|-------|--------|------|
| P5-01 | Audio file slot (single track) | .mp3/.wav file | Audio loaded | File loads without error |
| P5-02 | Audio playback sync | Audio + transport | Synced playback | Audio matches visual timeline |
| P5-03 | Audio in export | Audio + canvas stream | WebM with audio track | Exported file has audio |
| P5-04 | Export resolution selector | User choice | Canvas resizes for export | Export at 720p/1080p/4K |
| P5-09 | Toast notifications | System events | Non-blocking alerts | Export complete, save done, etc. |
| P5-13 | Export resolution + buffer resize | Resolution change event | Offscreen buffers A/B auto-resize with main canvas | Export at 1080p uses 1080p buffers, not 720p |

> **Deferred to v1.5:** P5-05 (export time estimate), P5-06 (file size estimate) — effort vs value poor; export already shows progress %.
> **Cut:** P5-07 (plate preview thumbnails), P5-08 (effect preview on hover) — high effort, minimal impact; users preview on the canvas.

**Milestone:** Audio sync works. Export resolution correct end-to-end including composite buffers.

---

### Phase 6b — Golden Standard Test (final)

**Goal:** Add audio, final review, final 1080p export.

| Task ID | Task | Input | Output | Test |
|---------|------|-------|--------|------|
| P6-06 | Add ambient audio track | .mp3 file | Synced audio | Audio matches visual pacing |
| P6-07 | Full preview review with audio | — | 60-90 second continuous playback | Smooth, cinematic, no glitches |
| P6-08 | Export final WebM at 1080p | — | High-quality .webm file | Plays in browser + VLC |

**Milestone:** Finished Doxascope Prologue teaser video, produced entirely in the browser.

---

## Quality Gates

Each phase must pass its gate before the next phase begins:

| Phase | Gate | Criteria |
|-------|------|----------|
| P0 | **Build Gate** | `npm run build` succeeds, `npm test` passes, `npm run lint` clean |
| P1 | **Render Gate** | Headless renderer produces valid WebM from test spec |
| P2 | **Schema Gate** | AJV validates schema, round-trip import/export works |
| P3 | **UI Gate** | End-to-end: load images → compose → preview → export in browser |
| P4 | **Director Gate** | LLM generates valid spec from prologue script + images |
| P4.7 | **Composite Gate** | 93/93 tests, tsc + lint + build clean, composite transitions render correctly |
| P5a | **Persistence Gate** | IndexedDB save/load works; 1.0.0 → 1.1.0 migration lossless |
| P6a | **Silent Golden Gate** | 22-plate prologue renders and exports as silent WebM; bug list documented |
| P5b | **Production Gate** | Audio sync works; export resolution correct end-to-end including buffers |
| P6b | **Golden Gate** | Final prologue with audio exported at 1080p, reviewed and approved |

---

## Task Isolation Rules

Each task is designed for independent execution by a local agent (Windsurf, VS Code Copilot, Antigravity, Jules). To maintain quality:

1. **One task = one PR** — Each task ID maps to a branch and pull request
2. **Tests before merge** — Every task has a defined test. Don't merge without passing it
3. **No cross-phase dependencies in a single task** — If a task needs something from another phase, that's a blocker, not a subtask
4. **Schema changes are versioned** — Any change to `sequence.schema.json` bumps the schema version
5. **Engine has no UI imports** — `src/engine/` never imports from `src/composer/`
6. **Spec has no engine imports** — `src/spec/` never imports from `src/engine/`
7. **Director has no UI imports** — `src/director/` only imports from `src/spec/`

---

## Hardware Tiers

| Tier | Detection | Preview FPS | Export Res | Available Effects |
|------|-----------|-------------|------------|-------------------|
| **High** | WebGL2 + GPU + 8GB+ RAM | 60 | Up to 4K | All |
| **Medium** | WebGL1 or weak GPU | 30-60 | Up to 1080p | All except screenShake in preview |
| **Low** | No WebGL / mobile | 30 | Up to 720p | kenBurns, static, fade, text only |

Detection runs once on app load. User can override via settings. Export shows estimated time based on tier.

---

## Estimated Timeline

| Phase | Effort | Notes |
|-------|--------|-------|
| P0 — Scaffold | 1 day | Complete ✓ |
| P1 — Engine | 3-4 days | Complete ✓ |
| P2 — Schema | 1-2 days | Complete ✓ |
| P3 — Composer | 3-4 days | Complete ✓ |
| P4 — Director | 2-3 days | Complete ✓ |
| P4.7 — Spatial Transitions | 1-2 days | Complete ✓ |
| P5a — Persistence | ~1 day | Next |
| P6a — Golden Test (silent) | ~2 days | Bugs surface here |
| P5b — Audio & Polish | ~2 days | Scope informed by P6a |
| P6b — Golden Test (final) | ~1 day | Final milestone |

**Completed: ~13-19 days.** **Remaining: ~6 days.**

---

## Future Roadmap (Out of Scope)

These are acknowledged for architectural awareness, not for implementation:

| Version | Feature | Notes |
|---------|---------|-------|
| v1.5 | FFmpeg WASM for MP4 export | Replace MediaRecorder dependency |
| v1.5 | Multi-track audio | VO + ambient + SFX layering |
| v1.5 | Parallax depth layers (P7-01) | Fake depth: zoom + offset + blur duplicate on a second canvas layer |
| v1.5 | Soft-edge wipes (P7-03) | Feathered wipe transitions using gradient masks instead of hard clip-rect |
| v2.0 | Video generation adapter (P7-02) | Interface for Runway / Kling / SVD — generate video clips from plates |
| v2.0 | VideoFormation blueprint bridge | Map VF blueprint → MotionPlate spec |
| v2.0 | VOID Engine handoff | Export spec for native rendering |
| v2.0 | Remotion export | Server-side rendering pipeline |
| v2.0 | WebGL2 shader effects | Displacement maps, distortion, advanced particles |
| v2.0 | Preset library | Save/share effect+transition combos |
| v3.0 | Collaborative editing | Multi-user spec editing |
| v3.0 | Plugin system | Custom effects/transitions/post-processing |
