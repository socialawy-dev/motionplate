import type { Sequence, Plate, PlateAtTime, PostEffectName } from '../spec/schema';
import { getEffect } from './effects/index';
import { getPost } from './post/index';
import { getTransition } from './transitions/index';
import { renderText } from './text';

/**
 * Sequencer — P1-24
 *
 * Given a sequence and a time `t` (in seconds), returns the active plate,
 * its index, its local progress (0→1), and the absolute start time.
 * Returns null if `t` is past the end of the sequence or the sequence is empty.
 */
export function getPlateAtTime(spec: Sequence, t: number): PlateAtTime | null {
    if (!spec.plates.length) return null;

    let elapsed = 0;
    for (let i = 0; i < spec.plates.length; i++) {
        const plate = spec.plates[i];
        if (t < elapsed + plate.duration) {
            return {
                plate,
                plateIdx: i,
                progress: (t - elapsed) / plate.duration,
                plateStart: elapsed,
            };
        }
        elapsed += plate.duration;
    }

    return null; // past end
}

/**
 * Returns the total duration of a sequence in seconds.
 */
export function getTotalDuration(spec: Sequence): number {
    return spec.plates.reduce((sum, p) => sum + p.duration, 0);
}

/**
 * Applies the transition overlay for a plate based on current local time.
 *
 * Strategy (matches PoC behaviour):
 *   - Fade IN at the start of the plate (when plateIdx > 0)
 *   - Fade OUT at the end of every plate (into the next one)
 */
function applyTransitionOverlay(
    ctx: CanvasRenderingContext2D,
    canvas: HTMLCanvasElement,
    plate: Plate,
    plateIdx: number,
    localTime: number,
): void {
    const transition = plate.transition ?? 'cut';
    if (transition === 'cut') return;

    const td = plate.transitionDuration ?? 1.0;
    const plateDur = plate.duration;
    const transFn = getTransition(transition);

    // Fade IN at the start (only if not the first plate)
    if (localTime < td && plateIdx > 0) {
        const tp = localTime / td;
        const v = transFn(tp);

        if (transition === 'fadeThroughWhite') {
            ctx.fillStyle = `rgba(255,255,255,${1 - v})`;
            ctx.fillRect(0, 0, canvas.width, canvas.height);
        } else if (transition === 'fadeThroughBlack') {
            ctx.fillStyle = `rgba(0,0,0,${1 - v})`;
            ctx.fillRect(0, 0, canvas.width, canvas.height);
        } else if (transition === 'lightBleed') {
            // lightBleed: use a white flash overlay at the start
            const flashAlpha = 1 - v;
            if (flashAlpha > 0) {
                ctx.fillStyle = `rgba(255,255,255,${flashAlpha})`;
                ctx.fillRect(0, 0, canvas.width, canvas.height);
            }
        } else {
            // crossfade: fade from black overlay
            const fadeAlpha = 1 - v;
            if (fadeAlpha > 0.005) {
                ctx.fillStyle = `rgba(0,0,0,${fadeAlpha})`;
                ctx.fillRect(0, 0, canvas.width, canvas.height);
            }
        }
    }

    // Fade OUT at the end of the plate
    if (localTime > plateDur - td) {
        const tp = (plateDur - localTime) / td;
        const alpha = Math.max(0, Math.min(1, tp));
        ctx.fillStyle = `rgba(0,0,0,${1 - alpha})`;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
    }

    ctx.globalAlpha = 1;
}

/**
 * Main frame renderer — P1-23
 *
 * Renders a complete frame onto the provided canvas context at time `t`.
 * `images` is indexed by plate position; modulo-wrapped if fewer images
 * than plates (matches PoC behaviour).
 *
 * Render order: black fill → effect → post-effects → transition overlay → text
 */
export function renderFrame(
    ctx: CanvasRenderingContext2D,
    canvas: HTMLCanvasElement,
    spec: Sequence,
    images: HTMLImageElement[],
    t: number,
): void {
    // Clear to black
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    if (images.length === 0) return;

    const result = getPlateAtTime(spec, t);
    if (!result) return;

    const { plate, plateIdx, progress, plateStart } = result;
    const imgIdx = plateIdx % images.length;
    const img = images[imgIdx];
    if (!img) return;

    // 1. Main motion effect
    const effectFn = getEffect(plate.effect);
    effectFn(ctx, img, canvas, progress, plate.effectConfig);

    // 2. Post-processing effects
    if (plate.post?.length) {
        for (const postName of plate.post) {
            const postFn = getPost(postName as PostEffectName);
            const postConfig = plate.postConfig?.[postName as PostEffectName];
            postFn(ctx, canvas, progress, postConfig);
        }
    }

    // 3. Transition overlay
    const localTime = t - plateStart;
    applyTransitionOverlay(ctx, canvas, plate, plateIdx, localTime);

    // 4. Text overlay
    if (plate.text) {
        renderText(ctx, canvas, plate.text, progress, plate.textConfig);
    }
}
