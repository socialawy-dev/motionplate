// ——— MotionPlate — Layer 1: TypeScript Spec Types ————————————————————————
// JSON is truth. This file defines every shape used by the engine and composer.

// ——— Effect Names ————————————————————————————————————————————————————————

export type EffectName = 'kenBurns' | 'pulse' | 'drift' | 'rotate' | 'static';

export type PostEffectName =
  | 'vignette'
  | 'bloom'
  | 'particles'
  | 'fog'
  | 'chromaticAberration'
  | 'screenShake';

// ——— Transition Names (split by rendering strategy) ——————————————————————

/** Overlay transitions: single-plate + color overlay */
export type OverlayTransitionName = 'fadeThroughBlack' | 'fadeThroughWhite' | 'lightBleed';

/** Composite transitions: dual-plate geometric compositing */
export type CompositeTransitionName = 'crossfade' | 'wipeLeft' | 'wipeDown' | 'slideLeft' | 'zoomThrough';

/** All transition names (cut is neither overlay nor composite — instant swap) */
export type TransitionName = 'cut' | OverlayTransitionName | CompositeTransitionName;

// ——— Effect Configs ——————————————————————————————————————————————————————

export interface KenBurnsConfig {
  startScale?: number;
  endScale?: number;
  panX?: number;
  panY?: number;
  anchor?: 'center' | 'topLeft';
}

export interface PulseConfig {
  frequency?: number;
  amplitude?: number;
}

export interface RotateConfig {
  maxAngle?: number;
}

export interface DriftConfig {
  [key: string]: unknown;
}

export interface StaticConfig {
  [key: string]: unknown;
}

export type EffectConfig =
  | KenBurnsConfig
  | PulseConfig
  | RotateConfig
  | DriftConfig
  | StaticConfig;

// ——— Post-Effect Configs —————————————————————————————————————————————————

export interface VignetteConfig {
  intensity?: number;
}

export interface BloomConfig {
  intensity?: number;
}

export interface ParticlesConfig {
  count?: number;
  seed?: number;
}

export interface FogConfig {
  intensity?: number;
}

export interface ChromaticAberrationConfig {
  intensity?: number;
}

export interface ScreenShakeConfig {
  intensity?: number;
  decay?: boolean;
}

export type PostConfig =
  | VignetteConfig
  | BloomConfig
  | ParticlesConfig
  | FogConfig
  | ChromaticAberrationConfig
  | ScreenShakeConfig;

// ——— Text Overlay Config —————————————————————————————————————————————————

export type TextPosition = 'top' | 'center' | 'bottom';

export interface TextConfig {
  fontSize?: number;
  fontFamily?: string;
  color?: string;
  position?: TextPosition;
  fadeIn?: number;
  fadeOut?: number;
  maxWidth?: number;
  shadow?: boolean;
  lineHeight?: number;
}

// ——— Plate ———————————————————————————————————————————————————————————————

export interface Plate {
  id: string;
  duration: number;
  effect: EffectName;
  effectConfig?: EffectConfig;
  post?: PostEffectName[];
  postConfig?: Partial<Record<PostEffectName, PostConfig>>;
  transition: TransitionName;
  transitionDuration?: number;
  text?: string;
  textConfig?: TextConfig;
}

// ——— Sequence ————————————————————————————————————————————————————————————

export interface SequenceMeta {
  title: string;
  fps: number;
  width: number;
  height: number;
  schemaVersion: string;
}

export interface Sequence {
  meta: SequenceMeta;
  plates: Plate[];
}

// ——— Hardware Profiler ———————————————————————————————————————————————————

export type HardwareTier = 'high' | 'medium' | 'low';

export interface HardwareTierResult {
  tier: HardwareTier;
  webgl: boolean;
  gpu: string;
  memory: number;
}

// ——— Engine Function Signatures ——————————————————————————————————————————

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

/** Scalar transition — returns alpha given progress 0→1 (overlay transitions) */
export type TransitionFn = (progress: number) => number;

/** Composite transition — renders both plates onto ctx given progress 0→1 */
export type CompositeTransitionFn = (
  ctx: CanvasRenderingContext2D,
  canvas: HTMLCanvasElement,
  outgoing: HTMLCanvasElement,
  incoming: HTMLCanvasElement,
  progress: number,
) => void;

// ——— Sequencer Result ————————————————————————————————————————————————————

export interface PlateAtTime {
  plate: Plate;
  plateIdx: number;
  progress: number;
  plateStart: number;
}