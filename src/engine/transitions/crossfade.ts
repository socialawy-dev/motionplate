import type { TransitionFn, CompositeTransitionFn } from '../../spec/schema';

/**
 * Crossfade (scalar) — smooth linear alpha blend.
 * Returns 0→1 over the first half of the progress range, then stays at 1.
 * P1-16
 */
const crossfade: TransitionFn = (progress) => Math.min(1, progress * 2);

/**
 * Crossfade (composite) — draws both plates with alpha blending.
 * This is the real dual-image crossfade: both plates visible simultaneously.
 */
export const crossfadeComposite: CompositeTransitionFn = (ctx, canvas, outgoing, incoming, progress) => {
    ctx.globalAlpha = 1;
    ctx.drawImage(outgoing, 0, 0, canvas.width, canvas.height);
    ctx.globalAlpha = progress;
    ctx.drawImage(incoming, 0, 0, canvas.width, canvas.height);
    ctx.globalAlpha = 1;
};

export default crossfade;
