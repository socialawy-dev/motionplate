import type { TransitionFn, TransitionName, CompositeTransitionFn } from '../../spec/schema';
import cut from './cut';
import crossfade from './crossfade';
import fadeThroughBlack from './fadeThroughBlack';
import fadeThroughWhite from './fadeThroughWhite';
import lightBleed from './lightBleed';

/**
 * Transition registry — P1-20
 *
 * Overlay transitions: scalar (progress) => alpha
 * Composite transitions: (ctx, canvas, bufA, bufB, progress) => void
 *
 * The 4 new composite transitions (wipeLeft, wipeDown, slideLeft, zoomThrough)
 * are stubbed as crossfade until their files are created in Steps 5-7.
 */

// --- Overlay registry (scalar) ---
const overlayRegistry: Record<string, TransitionFn> = {
    cut,
    crossfade,
    fadeThroughBlack,
    fadeThroughWhite,
    lightBleed,
};

export function getTransition(name: TransitionName): TransitionFn {
    const fn = overlayRegistry[name];
    if (!fn) return overlayRegistry.crossfade;
    return fn;
}

// --- Composite registry ---
const COMPOSITE_NAMES = new Set<TransitionName>([
    'crossfade', 'wipeLeft', 'wipeDown', 'slideLeft', 'zoomThrough',
]);

export function isCompositeTransition(name: TransitionName): boolean {
    return COMPOSITE_NAMES.has(name);
}

// Stub: all composites fall back to alpha crossfade until real files land
function crossfadeComposite(
    ctx: CanvasRenderingContext2D,
    canvas: HTMLCanvasElement,
    outgoing: HTMLCanvasElement,
    incoming: HTMLCanvasElement,
    progress: number,
): void {
    ctx.globalAlpha = 1;
    ctx.drawImage(outgoing, 0, 0, canvas.width, canvas.height);
    ctx.globalAlpha = progress;
    ctx.drawImage(incoming, 0, 0, canvas.width, canvas.height);
    ctx.globalAlpha = 1;
}

const compositeRegistry: Record<string, CompositeTransitionFn> = {
    crossfade: crossfadeComposite,
    wipeLeft: crossfadeComposite,
    wipeDown: crossfadeComposite,
    slideLeft: crossfadeComposite,
    zoomThrough: crossfadeComposite,
};

export function getCompositeTransition(name: TransitionName): CompositeTransitionFn {
    return compositeRegistry[name] || crossfadeComposite;
}

export default overlayRegistry;