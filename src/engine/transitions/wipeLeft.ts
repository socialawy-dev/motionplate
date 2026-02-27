import type { CompositeTransitionFn } from '../../spec/schema';

/**
 * Wipe Left — hard-edge left-to-right reveal.
 * Outgoing plate is fully visible, incoming reveals from the left edge.
 */
const wipeLeft: CompositeTransitionFn = (ctx, canvas, outgoing, incoming, progress) => {
    const w = canvas.width;
    const h = canvas.height;
    const boundary = w * progress;

    // Draw outgoing full
    ctx.drawImage(outgoing, 0, 0, w, h);

    // Clip incoming to revealed region
    ctx.save();
    ctx.beginPath();
    ctx.rect(0, 0, boundary, h);
    ctx.clip();
    ctx.drawImage(incoming, 0, 0, w, h);
    ctx.restore();
};

export default wipeLeft;