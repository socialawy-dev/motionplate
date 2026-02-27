import type { Sequence, Plate, PlateAtTime, PostEffectName, TransitionName } from '../spec/schema';
import { getEffect } from './effects/index';
import { getPost } from './post/index';
import { getTransition } from './transitions/index';
import { isCompositeTransition, getCompositeTransition } from './transitions/index';
import { renderText } from './text';

/**
 * Sequencer — P1-24
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

    return null;
}

/**
 * Returns the total duration of a sequence in seconds.
 */
export function getTotalDuration(spec: Sequence): number {
    return spec.plates.reduce((sum, p) => sum + p.duration, 0);
}

// ——— Offscreen buffers (module-scope singletons) —————————————————————————

let _bufferA: HTMLCanvasElement | null = null;
let _bufferB: HTMLCanvasElement | null = null;

function getBuffer(canvas: HTMLCanvasElement, slot: 'A' | 'B'): HTMLCanvasElement {
    const existing = slot === 'A' ? _bufferA : _bufferB;
    if (existing && existing.width === canvas.width && existing.height === canvas.height) {
        return existing;
    }
    const buf = document.createElement('canvas');
    buf.width = canvas.width;
    buf.height = canvas.height;
    if (slot === 'A') _bufferA = buf;
    else _bufferB = buf;
    return buf;
}

// ——— Helper: render a single plate (effect + post) to a canvas ———————————

function renderPlateToBuffer(
    buffer: HTMLCanvasElement,
    plate: Plate,
    img: HTMLImageElement,
    progress: number,
): void {
    const ctx = buffer.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, buffer.width, buffer.height);
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, buffer.width, buffer.height);

    // Effect
    const effectFn = getEffect(plate.effect);
    effectFn(ctx, img, buffer, progress, plate.effectConfig);

    // Post-processing
    if (plate.post?.length) {
        for (const postName of plate.post) {
            const postFn = getPost(postName as PostEffectName);
            const postConfig = plate.postConfig?.[postName as PostEffectName];
            postFn(ctx, buffer, progress, postConfig);
        }
    }
}

// ——— Overlay transitions (existing behavior) —————————————————————————————

function applyOverlayTransition(
    ctx: CanvasRenderingContext2D,
    canvas: HTMLCanvasElement,
    plate: Plate,
    plateIdx: number,
    localTime: number,
    nextPlateTransition?: string,
): void {
    const transition = plate.transition ?? 'cut';
    if (transition === 'cut') return;
    if (isCompositeTransition(transition as TransitionName)) return;

    const td = plate.transitionDuration ?? 1.0;
    const plateDur = plate.duration;
    const transFn = getTransition(transition as TransitionName);

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
            const flashAlpha = 1 - v;
            if (flashAlpha > 0) {
                ctx.fillStyle = `rgba(255,255,255,${flashAlpha})`;
                ctx.fillRect(0, 0, canvas.width, canvas.height);
            }
        } else {
            const fadeAlpha = 1 - v;
            if (fadeAlpha > 0.005) {
                ctx.fillStyle = `rgba(0,0,0,${fadeAlpha})`;
                ctx.fillRect(0, 0, canvas.width, canvas.height);
            }
        }
    }

    // Fade OUT at the end — skip if the next plate uses a composite transition
    // (its transition-IN zone will handle the blend)
    if (localTime > plateDur - td) {
        if (nextPlateTransition && isCompositeTransition(nextPlateTransition as TransitionName)) {
            // Next plate's composite handles this — do nothing
        } else {
            const tp = (plateDur - localTime) / td;
            const alpha = Math.max(0, Math.min(1, tp));
            ctx.fillStyle = `rgba(0,0,0,${1 - alpha})`;
            ctx.fillRect(0, 0, canvas.width, canvas.height);
        }
    }

    ctx.globalAlpha = 1;
}

// ——— Main frame renderer — P1-23 ————————————————————————————————————————

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

    const localTime = t - plateStart;
    const td = plate.transitionDuration ?? 1.0;
    const inTransitionZone = localTime < td && plateIdx > 0;

    // ——— COMPOSITE transition path ——————————————————————————————————————
    if (inTransitionZone && isCompositeTransition(plate.transition)) {
        const outgoingPlate = spec.plates[plateIdx - 1];
        const outgoingImg = images[(plateIdx - 1) % images.length];

        if (outgoingPlate && outgoingImg) {
            const bufA = getBuffer(canvas, 'A');
            const bufB = getBuffer(canvas, 'B');

            // Render outgoing plate at progress=1.0 (its final frame)
            renderPlateToBuffer(bufA, outgoingPlate, outgoingImg, 1.0);

            // Render incoming plate at current progress
            renderPlateToBuffer(bufB, plate, img, progress);

            // Composite
            const transitionProgress = localTime / td;
            const compositeFn = getCompositeTransition(plate.transition);
            compositeFn(ctx, canvas, bufA, bufB, transitionProgress);

            // Text for incoming plate
            if (plate.text) {
                renderText(ctx, canvas, plate.text, progress, plate.textConfig);
            }
            return;
        }
    }

    // ——— Standard single-plate path (unchanged) —————————————————————————

    // 1. Effect
    const effectFn = getEffect(plate.effect);
    effectFn(ctx, img, canvas, progress, plate.effectConfig);

    // 2. Post-processing
    if (plate.post?.length) {
        for (const postName of plate.post) {
            const postFn = getPost(postName as PostEffectName);
            const postConfig = plate.postConfig?.[postName as PostEffectName];
            postFn(ctx, canvas, progress, postConfig);
        }
    }

    // 3. Overlay transition
    const nextPlate = spec.plates[plateIdx + 1];
    applyOverlayTransition(ctx, canvas, plate, plateIdx, localTime, nextPlate?.transition);

    // 4. Text
    if (plate.text) {
        renderText(ctx, canvas, plate.text, progress, plate.textConfig);
    }
}