import type { TransitionFn } from '../../spec/schema';

/**
 * Crossfade transition — smooth linear alpha blend over the transition window.
 * Returns 0→1 over the first half of the progress range, then stays at 1.
 * P1-16
 */
const crossfade: TransitionFn = (progress) => Math.min(1, progress * 2);

export default crossfade;
