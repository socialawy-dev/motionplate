import type { PostFn, VignetteConfig } from '../../spec/schema';

/**
 * Vignette post-effect — radial gradient darkening toward edges.
 * P1-08
 */
const vignette: PostFn = (ctx, canvas, _progress, config = {}) => {
    const { intensity = 0.4 } = config as VignetteConfig;

    const gradient = ctx.createRadialGradient(
        canvas.width / 2,
        canvas.height / 2,
        canvas.width * 0.25,
        canvas.width / 2,
        canvas.height / 2,
        canvas.width * 0.75,
    );
    gradient.addColorStop(0, 'rgba(0,0,0,0)');
    gradient.addColorStop(1, `rgba(0,0,0,${intensity})`);
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
};

export default vignette;
