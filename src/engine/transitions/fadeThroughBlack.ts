import type { TransitionFn } from '../../spec/schema';

/**
 * Fade Through Black transition — outgoing plate fades to black (0→0.5),
 * then incoming plate fades in from black (0.5→1).
 * The renderer applies a black overlay at `1 - returned_alpha`. P1-17
 */
const fadeThroughBlack: TransitionFn = (progress) => {
    if (progress < 0.5) {
        return 1 - progress * 2; // 1 → 0 (fading out)
    }
    return (progress - 0.5) * 2; // 0 → 1 (fading in)
};

export default fadeThroughBlack;
