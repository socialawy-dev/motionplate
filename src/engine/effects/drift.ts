import type { EffectFn } from '../../spec/schema';

/**
 * Drift effect — slow sinusoidal float in X and Y.
 * P1-04
 */
const drift: EffectFn = (ctx, img, canvas, progress) => {
    const x = Math.sin(progress * Math.PI * 0.5) * 20;
    const y = Math.cos(progress * Math.PI * 0.3) * 10;

    ctx.drawImage(img, x, y, canvas.width, canvas.height);
};

export default drift;
