// ─── MotionPlate — Layer 1: TypeScript Spec Types ────────────────────────────
// JSON is truth. This file defines every shape used by the engine and composer.

// ─── Effect Names ─────────────────────────────────────────────────────────────

export type EffectName = 'kenBurns' | 'pulse' | 'drift' | 'rotate' | 'static';

export type PostEffectName =
  | 'vignette'
  | 'bloom'
  | 'particles'
  | 'fog'
  | 'chromaticAberration'
  | 'screenShake';

export type TransitionName =
  | 'cut'
  | 'crossfade'
  | 'fadeThroughBlack'
  | 'fadeThroughWhite'
  | 'lightBleed';

// ─── Effect Configs ───────────────────────────────────────────────────────────

export interface KenBurnsConfig {
  startScale?: number;   // default 1.0
  endScale?: number;     // default 1.15
  panX?: number;         // 0..1 fraction of canvas width (default 0.02)
  panY?: number;         // 0..1 fraction of canvas height (default 0.01)
  anchor?: 'center' | 'topLeft'; // default 'center'
}

export interface PulseConfig {
  frequency?: number;    // oscillations per plate (default 2)
  amplitude?: number;    // scale amplitude (default 0.02)
}

export interface RotateConfig {
  maxAngle?: number;     // degrees (default 2)
}

export interface DriftConfig {
  // Uses built-in sinusoidal; no user config currently.
  [key: string]: unknown;
}

export interface StaticConfig {
  [key: string]: unknown;
}

// Union of all effect configs
export type EffectConfig =
  | KenBurnsConfig
  | PulseConfig
  | RotateConfig
  | DriftConfig
  | StaticConfig;

// ─── Post-Effect Configs ──────────────────────────────────────────────────────

export interface VignetteConfig {
  intensity?: number;    // 0-1 (default 0.4)
}

export interface BloomConfig {
  intensity?: number;    // 0-1 (default 0.15)
}

export interface ParticlesConfig {
  count?: number;        // particle count (default 40)
  seed?: number;         // RNG seed (default 42)
}

export interface FogConfig {
  intensity?: number;    // 0-1 (default 0.12)
}

export interface ChromaticAberrationConfig {
  intensity?: number;    // pixel shift (default 2)
}

export interface ScreenShakeConfig {
  intensity?: number;    // max pixel offset (default 5)
  decay?: boolean;       // shake decays over plate time (default true)
}

export type PostConfig =
  | VignetteConfig
  | BloomConfig
  | ParticlesConfig
  | FogConfig
  | ChromaticAberrationConfig
  | ScreenShakeConfig;

// ─── Text Overlay Config ──────────────────────────────────────────────────────

export type TextPosition = 'top' | 'center' | 'bottom';

export interface TextConfig {
  fontSize?: number;        // px (default 28)
  fontFamily?: string;      // CSS font (default 'Georgia, serif')
  color?: string;           // CSS color (default '#ffffff')
  position?: TextPosition;  // (default 'center')
  fadeIn?: number;          // 0-1 fraction of plate duration (default 0.15)
  fadeOut?: number;         // 0-1 (default 0.15)
  maxWidth?: number;        // 0-1 fraction of canvas width (default 0.8)
  shadow?: boolean;         // drop shadow (default true)
  lineHeight?: number;      // multiplier (default 1.5)
}

// ─── Plate ────────────────────────────────────────────────────────────────────

export interface Plate {
  id: string;
  duration: number;                    // seconds
  effect: EffectName;
  effectConfig?: EffectConfig;
  post?: PostEffectName[];
  postConfig?: Partial<Record<PostEffectName, PostConfig>>;
  transition: TransitionName;
  transitionDuration?: number;         // seconds (default 1.0)
  text?: string;
  textConfig?: TextConfig;
}

// ─── Sequence ─────────────────────────────────────────────────────────────────

export interface SequenceMeta {
  title: string;
  fps: number;             // default 30
  width: number;           // px (default 1280)
  height: number;          // px (default 720)
  schemaVersion: string;   // semver e.g. "1.0.0"
}

export interface Sequence {
  meta: SequenceMeta;
  plates: Plate[];
}

// ─── Hardware Profiler ────────────────────────────────────────────────────────

export type HardwareTier = 'high' | 'medium' | 'low';

export interface HardwareTierResult {
  tier: HardwareTier;
  webgl: boolean;
  gpu: string;
  memory: number; // GB reported by navigator.deviceMemory or 0 if unavailable
}

// ─── Engine Function Signatures ───────────────────────────────────────────────

export type EffectFn = (
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  canvas: HTMLCanvasElement,
  progress: number,
  config?: EffectConfig
) => void;

export type PostFn = (
  ctx: CanvasRenderingContext2D,
  canvas: HTMLCanvasElement,
  progress: number,
  config?: PostConfig
) => void;

// Returns an alpha value 0→1 given transition progress 0→1
export type TransitionFn = (progress: number) => number;

// ─── Sequencer Result ─────────────────────────────────────────────────────────

export interface PlateAtTime {
  plate: Plate;
  plateIdx: number;
  progress: number; // 0→1 within the plate
  plateStart: number; // absolute time where this plate started
}
