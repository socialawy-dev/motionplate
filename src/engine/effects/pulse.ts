import type { EffectFn, PulseConfig } from '../../spec/schema';

/**
 * Pulse effect — image breathes with sinusoidal scale oscillation.
 * P1-03
 */
const pulse: EffectFn = (ctx, img, canvas, progress, config = {}) => {
    const { frequency = 2, amplitude = 0.02 } = config as PulseConfig;

    const scale = 1 + Math.sin(progress * Math.PI * frequency) * amplitude;
    const w = canvas.width * scale;
    const h = canvas.height * scale;
    const x = (canvas.width - w) / 2;
    const y = (canvas.height - h) / 2;

    ctx.drawImage(img, x, y, w, h);
};

export default pulse;
