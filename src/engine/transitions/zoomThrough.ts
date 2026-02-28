import type { CompositeTransitionFn } from '../../spec/schema';

/**
 * Zoom Through — explosive zoom into outgoing + flash → incoming settles.
 *
 * Phase 1 (0.0–0.4): Outgoing zooms in, white overlay builds
 * Phase 2 (0.4–0.6): White flash peak, incoming begins to appear
 * Phase 3 (0.6–1.0): Incoming settles with slight zoom-out, flash fades
 */
const zoomThrough: CompositeTransitionFn = (ctx, canvas, outgoing, incoming, progress) => {
    const w = canvas.width;
    const h = canvas.height;

    if (progress < 0.4) {
        // Phase 1: outgoing zooms in + white overlay builds
        const p = progress / 0.4; // normalize 0→1 within phase
        const scale = 1 + p * 0.3; // zoom from 1.0 to 1.3
        const sw = w / scale;
        const sh = h / scale;
        const sx = (w - sw) / 2;
        const sy = (h - sh) / 2;

        ctx.drawImage(outgoing, sx, sy, sw, sh, 0, 0, w, h);

        // White overlay building
        const whiteAlpha = p * 0.7;
        ctx.fillStyle = `rgba(255,255,255,${whiteAlpha})`;
        ctx.fillRect(0, 0, w, h);

    } else if (progress < 0.6) {
        // Phase 2: white flash peak, incoming begins to emerge
        const p = (progress - 0.4) / 0.2; // normalize 0→1

        // Flash starts at full white, incoming emerges underneath
        ctx.drawImage(incoming, 0, 0, w, h);

        // White overlay fading from peak
        const whiteAlpha = 1 - p * 0.5; // 1.0 → 0.5
        ctx.fillStyle = `rgba(255,255,255,${whiteAlpha})`;
        ctx.fillRect(0, 0, w, h);

    } else {
        // Phase 3: incoming settles with slight zoom-out, flash fades
        const p = (progress - 0.6) / 0.4; // normalize 0→1
        const scale = 1.1 - p * 0.1; // settle from 1.1 to 1.0
        const sw = w / scale;
        const sh = h / scale;
        const sx = (w - sw) / 2;
        const sy = (h - sh) / 2;

        ctx.drawImage(incoming, sx, sy, sw, sh, 0, 0, w, h);

        // White overlay fading out
        const whiteAlpha = 0.5 * (1 - p); // 0.5 → 0
        if (whiteAlpha > 0.005) {
            ctx.fillStyle = `rgba(255,255,255,${whiteAlpha})`;
            ctx.fillRect(0, 0, w, h);
        }
    }
};

export default zoomThrough;