import type { PostFn, ChromaticAberrationConfig } from '../../spec/schema';

/**
 * Chromatic Aberration post-effect — separates R and B channels horizontally.
 * Uses getImageData/putImageData for per-pixel manipulation.
 * P1-12
 */
const chromaticAberration: PostFn = (ctx, canvas, _progress, config = {}) => {
    const { intensity = 2 } = config as ChromaticAberrationConfig;

    const shift = Math.round(intensity);
    if (shift <= 0) return;

    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;
    const copy = new Uint8ClampedArray(data);

    for (let i = 0; i < data.length; i += 4) {
        const pixel = i / 4;
        const x = pixel % canvas.width;

        // Shift red channel right
        if (x + shift < canvas.width) {
            data[i] = copy[i + shift * 4];
        }

        // Shift blue channel left
        if (x - shift >= 0) {
            data[i + 2] = copy[i - shift * 4 + 2];
        }
    }

    ctx.putImageData(imageData, 0, 0);
};

export default chromaticAberration;
