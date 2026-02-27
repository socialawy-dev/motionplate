import type { CompositeTransitionFn } from '../../spec/schema';

/**
 * Slide Left — both plates slide laterally.
 * Outgoing pushes off to the left, incoming enters from the right.
 */
const slideLeft: CompositeTransitionFn = (ctx, canvas, outgoing, incoming, progress) => {
    const w = canvas.width;
    const h = canvas.height;
    const offset = w * progress;

    // Outgoing slides left
    ctx.drawImage(outgoing, -offset, 0, w, h);

    // Incoming enters from right
    ctx.drawImage(incoming, w - offset, 0, w, h);
};

export default slideLeft;