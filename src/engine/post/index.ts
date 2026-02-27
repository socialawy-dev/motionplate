import type { PostFn, PostEffectName } from '../../spec/schema';
import vignette from './vignette';
import bloom from './bloom';
import particles from './particles';
import fog from './fog';
import chromaticAberration from './chromaticAberration';
import screenShake from './screenShake';

/**
 * Post-effect registry — P1-14
 */
const registry: Record<PostEffectName, PostFn> = {
    vignette,
    bloom,
    particles,
    fog,
    chromaticAberration,
    screenShake,
};

export function getPost(name: PostEffectName): PostFn {
    const fn = registry[name];
    if (!fn) throw new Error(`Unknown post-effect: "${name}"`);
    return fn;
}

export default registry;
