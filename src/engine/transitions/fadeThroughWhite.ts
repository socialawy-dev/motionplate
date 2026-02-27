import type { TransitionFn } from '../../spec/schema';

/**
 * Fade Through White transition — same curve as fadeThroughBlack but the
 * renderer applies a white overlay instead of black. P1-18
 */
const fadeThroughWhite: TransitionFn = (progress) => {
    if (progress < 0.5) {
        return 1 - progress * 2; // 1 → 0 (fading out to white)
    }
    return (progress - 0.5) * 2; // 0 → 1 (fading in from white)
};

export default fadeThroughWhite;
