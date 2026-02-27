import type { TransitionFn } from '../../spec/schema';

/**
 * Cut transition — instant swap, no interpolation.
 * Returns 1 always. P1-15
 */
const cut: TransitionFn = (_progress) => 1;

export default cut;
