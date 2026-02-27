import type { PostFn, BloomConfig } from '../../spec/schema';

/**
 * Bloom post-effect — white overlay pulse peaking at mid-plate.
 * P1-09
 */
const bloom: PostFn = (ctx, canvas, progress, config = {}) => {
    const { intensity = 0.15 } = config as BloomConfig;

    const bloomAlpha = Math.sin(progress * Math.PI) * intensity;
    if (bloomAlpha > 0) {
        ctx.fillStyle = `rgba(255,255,255,${bloomAlpha})`;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
    }
};

export default bloom;
