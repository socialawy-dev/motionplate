import type { HardwareTierResult } from '../spec/schema';

/**
 * Hardware profiler — P1-25
 *
 * Detects the hardware tier based on WebGL2 support, GPU renderer string,
 * and available device memory. Runs once on app load; results should be
 * cached in the settings store.
 */
export function detectHardwareTier(): HardwareTierResult {
    // Memory — navigator.deviceMemory is non-standard but widely available
    const memory = (navigator as Navigator & { deviceMemory?: number }).deviceMemory ?? 0;

    // WebGL probe
    const canvas = document.createElement('canvas');
    const gl =
        (canvas.getContext('webgl2') as WebGL2RenderingContext | null) ??
        (canvas.getContext('webgl') as WebGLRenderingContext | null);

    const webgl = gl !== null;
    let gpu = 'unknown';
    let hasWebGL2 = false;

    if (gl) {
        const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
        if (debugInfo) {
            gpu = gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL) as string;
        }
        hasWebGL2 = canvas.getContext('webgl2') !== null;
    }

    // Tier classification
    let tier: HardwareTierResult['tier'];
    if (hasWebGL2 && memory >= 8) {
        tier = 'high';
    } else if (webgl) {
        tier = 'medium';
    } else {
        tier = 'low';
    }

    return { tier, webgl, gpu, memory };
}
