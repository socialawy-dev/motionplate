import type { PostFn, ScreenShakeConfig } from '../../spec/schema';

/**
 * Screen Shake post-effect — random pixel offset decaying over plate time.
 * P1-13
 */
const screenShake: PostFn = (ctx, canvas, progress, config = {}) => {
    const { intensity: shakeIntensity = 5, decay = true } = config as ScreenShakeConfig;

    const mult = decay ? Math.max(0, 1 - progress * 3) : 1;
    if (mult < 0.01) return;

    const dx = (Math.random() - 0.5) * shakeIntensity * 2 * mult;
    const dy = (Math.random() - 0.5) * shakeIntensity * 2 * mult;

    const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.putImageData(imgData, dx, dy);
};

export default screenShake;
