import type {
  KenBurnsConfig,
  PulseConfig,
  RotateConfig,
  BloomConfig,
  ParticlesConfig,
  FogConfig,
  ChromaticAberrationConfig,
  VignetteConfig,
  ScreenShakeConfig,
  TextConfig,
  Plate,
} from './schema';

// Current schema version — bump this on any breaking change to sequence.schema.json
export const CURRENT_SCHEMA_VERSION = '1.1.0';

// ─── Effect defaults ──────────────────────────────────────────────────────────

export const defaultKenBurns: Required<KenBurnsConfig> = {
  startScale: 1.0,
  endScale: 1.15,
  panX: 0.02,
  panY: 0.01,
  anchor: 'center',
};

export const defaultPulse: Required<PulseConfig> = {
  frequency: 2,
  amplitude: 0.02,
};

export const defaultRotate: Required<RotateConfig> = {
  maxAngle: 2,
};

// ─── Post-effect defaults ─────────────────────────────────────────────────────

export const defaultVignette: Required<VignetteConfig> = {
  intensity: 0.4,
};

export const defaultBloom: Required<BloomConfig> = {
  intensity: 0.15,
};

export const defaultParticles: Required<ParticlesConfig> = {
  count: 40,
  seed: 42,
};

export const defaultFog: Required<FogConfig> = {
  intensity: 0.12,
};

export const defaultChromaticAberration: Required<ChromaticAberrationConfig> = {
  intensity: 2,
};

export const defaultScreenShake: Required<ScreenShakeConfig> = {
  intensity: 5,
  decay: true,
};

// ─── Text defaults ────────────────────────────────────────────────────────────

export const defaultTextConfig: Required<TextConfig> = {
  fontSize: 28,
  fontFamily: 'Georgia, serif',
  color: '#ffffff',
  position: 'center',
  fadeIn: 0.15,
  fadeOut: 0.15,
  maxWidth: 0.8,
  shadow: true,
  lineHeight: 1.5,
};

// ─── Default plate factory ────────────────────────────────────────────────────

/**
 * Creates a sensible default plate for a given index.
 * Used when a new image is dropped and no config exists yet.
 */
export function createDefaultPlate(index: number): Plate {
  return {
    id: `plate_${index + 1}`,
    duration: 5,
    effect: 'kenBurns',
    effectConfig: { ...defaultKenBurns },
    post: ['vignette'],
    postConfig: {
      vignette: { ...defaultVignette },
    },
    transition: 'crossfade',
    transitionDuration: 1.0,
    text: '',
    textConfig: { ...defaultTextConfig },
  };
}
