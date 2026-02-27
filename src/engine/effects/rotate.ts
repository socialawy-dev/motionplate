import type { EffectFn, RotateConfig } from '../../spec/schema';

/**
 * Rotate effect — subtle sinusoidal rotation around canvas center.
 * P1-05
 */
const rotate: EffectFn = (ctx, img, canvas, progress, config = {}) => {
    const { maxAngle = 2 } = config as RotateConfig;

    const angle = ((maxAngle * Math.PI) / 180) * Math.sin(progress * Math.PI);

    ctx.save();
    ctx.translate(canvas.width / 2, canvas.height / 2);
    ctx.rotate(angle);
    ctx.drawImage(img, -canvas.width / 2, -canvas.height / 2, canvas.width, canvas.height);
    ctx.restore();
};

export default rotate;
