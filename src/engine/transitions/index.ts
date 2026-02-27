import type { TransitionFn, TransitionName } from '../../spec/schema';
import cut from './cut';
import crossfade from './crossfade';
import fadeThroughBlack from './fadeThroughBlack';
import fadeThroughWhite from './fadeThroughWhite';
import lightBleed from './lightBleed';

/**
 * Transition registry — P1-20
 */
const registry: Record<TransitionName, TransitionFn> = {
    cut,
    crossfade,
    fadeThroughBlack,
    fadeThroughWhite,
    lightBleed,
};

export function getTransition(name: TransitionName): TransitionFn {
    const fn = registry[name];
    if (!fn) throw new Error(`Unknown transition: "${name}"`);
    return fn;
}

export default registry;
