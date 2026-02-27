import type { EffectFn } from '../../spec/schema';

/**
 * Static effect — image displayed at full canvas size with no motion.
 * P1-06
 */
const staticEffect: EffectFn = (ctx, img, canvas) => {
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
};

export default staticEffect;
