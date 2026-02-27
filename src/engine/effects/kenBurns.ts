import type { EffectFn, KenBurnsConfig } from '../../spec/schema';

/**
 * Ken Burns effect — progressive pan and zoom over the plate duration.
 * P1-02
 */
const kenBurns: EffectFn = (ctx, img, canvas, progress, config = {}) => {
    const {
        startScale = 1.0,
        endScale = 1.15,
        panX = 0.02,
        panY = 0.01,
        anchor = 'center',
    } = config as KenBurnsConfig;

    const scale = startScale + (endScale - startScale) * progress;
    const offsetX = panX * progress * canvas.width;
    const offsetY = panY * progress * canvas.height;

    const displayW = canvas.width / scale;
    const displayH = canvas.height / scale;

    const scaleX = img.naturalWidth / canvas.width;
    const scaleY = img.naturalHeight / canvas.height;

    let sx: number;
    let sy: number;

    if (anchor === 'center') {
        sx = (img.naturalWidth - displayW * scaleX) / 2 + offsetX * scaleX;
        sy = (img.naturalHeight - displayH * scaleY) / 2 + offsetY * scaleY;
    } else {
        sx = offsetX * scaleX;
        sy = offsetY * scaleY;
    }

    const sw = img.naturalWidth / scale;
    const sh = img.naturalHeight / scale;

    ctx.drawImage(img, sx, sy, sw, sh, 0, 0, canvas.width, canvas.height);
};

export default kenBurns;
