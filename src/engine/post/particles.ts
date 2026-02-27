import type { PostFn, ParticlesConfig } from '../../spec/schema';

/**
 * Deterministic LCG-based pseudo-random number generator seeded per particle.
 * Ensures the same particle layout every frame regardless of render timing.
 */
function rng(seed: number, n: number): number {
    const s = seed + n * 9301 + 49297;
    return ((s * s) % 233280) / 233280;
}

/**
 * Particles post-effect — floating dots rising upward, seeded for determinism.
 * P1-10
 */
const particles: PostFn = (ctx, canvas, progress, config = {}) => {
    const { count = 40, seed = 42 } = config as ParticlesConfig;

    ctx.save();
    for (let i = 0; i < count; i++) {
        const x = rng(seed, i) * canvas.width;
        const baseY = rng(seed, i + 100) * canvas.height;
        const y = baseY - progress * 60 * rng(seed, i + 200);
        const size = 1 + rng(seed, i + 300) * 2;
        const alpha = (0.2 + rng(seed, i + 400) * 0.5) * Math.sin(progress * Math.PI);

        ctx.fillStyle = `rgba(200,220,255,${alpha})`;
        ctx.beginPath();
        ctx.arc(x, y % canvas.height, size, 0, Math.PI * 2);
        ctx.fill();
    }
    ctx.restore();
};

export default particles;
