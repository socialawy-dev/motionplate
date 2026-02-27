import '@testing-library/jest-dom';
import { vi } from 'vitest';

// ─── Canvas 2D mock for jsdom ─────────────────────────────────────────────────
// jsdom does not implement HTMLCanvasElement.getContext() without the native
// `canvas` npm package. We provide a vi.fn()-based stub here so engine unit
// tests can run headlessly.

function makeCtxMock() {
    const ctx = {
        canvas: null as unknown as HTMLCanvasElement,
        clearRect: vi.fn(),
        fillRect: vi.fn(),
        drawImage: vi.fn(),
        fillText: vi.fn(),
        strokeText: vi.fn(),
        measureText: vi.fn().mockReturnValue({ width: 100 }),
        save: vi.fn(),
        restore: vi.fn(),
        translate: vi.fn(),
        rotate: vi.fn(),
        scale: vi.fn(),
        beginPath: vi.fn(),
        arc: vi.fn(),
        fill: vi.fn(),
        stroke: vi.fn(),
        createRadialGradient: vi.fn().mockReturnValue({ addColorStop: vi.fn() }),
        createLinearGradient: vi.fn().mockReturnValue({ addColorStop: vi.fn() }),
        getImageData: vi.fn().mockReturnValue({
            data: new Uint8ClampedArray(1280 * 720 * 4),
            width: 1280,
            height: 720,
        }),
        putImageData: vi.fn(),
        // Settable properties as plain values
        fillStyle: '' as string | CanvasGradient | CanvasPattern,
        globalAlpha: 1,
        font: '10px sans-serif',
        textAlign: 'center' as CanvasTextAlign,
        textBaseline: 'middle' as CanvasTextBaseline,
        direction: 'ltr' as CanvasDirection,
        shadowColor: '',
        shadowBlur: 0,
        shadowOffsetX: 0,
        shadowOffsetY: 0,
    };
    return ctx;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
(HTMLCanvasElement.prototype as any).getContext = function (contextId: string) {
    if (contextId === '2d') {
        const ctx = makeCtxMock();
        ctx.canvas = this as HTMLCanvasElement;
        return ctx;
    }
    // webgl / webgl2 — return null (no GPU in test env)
    return null;
};

// Patch captureStream — used by exporter, not available in jsdom
if (!('captureStream' in HTMLCanvasElement.prototype)) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (HTMLCanvasElement.prototype as any).captureStream = vi.fn().mockReturnValue({
        getTracks: () => [],
    });
}
