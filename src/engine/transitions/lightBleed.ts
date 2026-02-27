import type { TransitionFn } from '../../spec/schema';

/**
 * Light Bleed transition — hold current plate → bright flash at ~40% →
 * hold black → incoming plate emerges. Creates a filmic "burn" effect. P1-19
 *
 * Stages:
 *   0.0 → 0.3  : hold at full opacity (1)
 *   0.3 → 0.5  : flash: ramp down from 1 → 0
 *   0.5 → 0.7  : hold at 0 (black / white peak)
 *   0.7 → 1.0  : incoming fades in: ramp up 0 → 1
 */
const lightBleed: TransitionFn = (progress) => {
    if (progress < 0.3) return 1;
    if (progress < 0.5) return 1 - (progress - 0.3) / 0.2;
    if (progress < 0.7) return 0;
    return (progress - 0.7) / 0.3;
};

export default lightBleed;
