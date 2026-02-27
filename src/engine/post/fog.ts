import type { PostFn, FogConfig } from '../../spec/schema';

/**
 * Fog post-effect — bottom-rising gradient haze, peaks at mid-plate.
 * P1-11
 */
const fog: PostFn = (ctx, canvas, progress, config = {}) => {
    const { intensity = 0.12 } = config as FogConfig;

    const alpha = intensity * Math.sin(progress * Math.PI);
    const gradient = ctx.createLinearGradient(0, canvas.height * 0.5, 0, canvas.height);
    gradient.addColorStop(0, `rgba(180,200,220,0)`);
    gradient.addColorStop(0.5, `rgba(180,200,220,${alpha * 0.5})`);
    gradient.addColorStop(1, `rgba(180,200,220,${alpha})`);
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
};

export default fog;
