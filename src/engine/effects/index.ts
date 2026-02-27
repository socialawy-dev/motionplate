import type { EffectFn, EffectName } from '../../spec/schema';
import kenBurns from './kenBurns';
import pulse from './pulse';
import drift from './drift';
import rotate from './rotate';
import staticEffect from './static';

/**
 * Effect registry — P1-07
 * Returns the effect function for a given name.
 */
const registry: Record<EffectName, EffectFn> = {
    kenBurns,
    pulse,
    drift,
    rotate,
    static: staticEffect,
};

export function getEffect(name: EffectName): EffectFn {
    const fn = registry[name];
    if (!fn) throw new Error(`Unknown effect: "${name}"`);
    return fn;
}

export default registry;
