import type { TransitionFn, TransitionName, CompositeTransitionFn } from '../../spec/schema';
import cut from './cut';
import crossfade from './crossfade';
import { crossfadeComposite } from './crossfade';
import fadeThroughBlack from './fadeThroughBlack';
import fadeThroughWhite from './fadeThroughWhite';
import lightBleed from './lightBleed';
import wipeLeft from './wipeLeft';
import wipeDown from './wipeDown';
import slideLeft from './slideLeft';
import zoomThrough from './zoomThrough';

/**
 * Transition registry — P1-20 + P4.7
 *
 * Two registries:
 *   - Overlay (scalar): single-plate + color overlay (fadeThroughBlack, etc.)
 *   - Composite (dual-plate): both plates rendered to buffers, composited geometrically
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

export function isCompositeTransition(name: TransitionName | string): boolean {
    return COMPOSITE_NAMES.has(name as TransitionName);
}

const compositeRegistry: Record<string, CompositeTransitionFn> = {
    crossfade: crossfadeComposite,
    wipeLeft,
    wipeDown,
    slideLeft,
    zoomThrough,
};

export function getCompositeTransition(name: TransitionName): CompositeTransitionFn {
    return compositeRegistry[name] || crossfadeComposite;
}

export default overlayRegistry;