import type { CompositeTransitionFn } from '../../spec/schema';

/**
 * Wipe Down — hard-edge top-to-bottom reveal.
 * Outgoing plate is fully visible, incoming reveals from the top edge.
 */
const wipeDown: CompositeTransitionFn = (ctx, canvas, outgoing, incoming, progress) => {
    const w = canvas.width;
    const h = canvas.height;
    const boundary = h * progress;

    // Draw outgoing full
    ctx.drawImage(outgoing, 0, 0, w, h);

    // Clip incoming to revealed region
    ctx.save();
    ctx.beginPath();
    ctx.rect(0, 0, w, boundary);
    ctx.clip();
    ctx.drawImage(incoming, 0, 0, w, h);
    ctx.restore();
};

export default wipeDown;