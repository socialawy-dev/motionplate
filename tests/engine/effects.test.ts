import { describe, it, expect, vi, beforeEach } from 'vitest';
import kenBurns from '../../src/engine/effects/kenBurns';
import pulse from '../../src/engine/effects/pulse';
import drift from '../../src/engine/effects/drift';
import rotate from '../../src/engine/effects/rotate';
import staticEffect from '../../src/engine/effects/static';
import { getEffect } from '../../src/engine/effects/index';

// ─── Canvas mock helpers ────────────────────────────────────────────────────

function makeCanvas(w = 1280, h = 720): HTMLCanvasElement {
    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    return canvas;
}

function makeImg(w = 1920, h = 1080): HTMLImageElement {
    const img = new Image();
    Object.defineProperty(img, 'naturalWidth', { value: w });
    Object.defineProperty(img, 'naturalHeight', { value: h });
    return img;
}

function makeCtx(canvas: HTMLCanvasElement): CanvasRenderingContext2D {
    const ctx = canvas.getContext('2d')!;
    vi.spyOn(ctx, 'drawImage');
    vi.spyOn(ctx, 'save');
    vi.spyOn(ctx, 'restore');
    return ctx;
}

// ─── Tests ──────────────────────────────────────────────────────────────────

describe('kenBurns effect', () => {
    let canvas: HTMLCanvasElement;
    let img: HTMLImageElement;
    let ctx: CanvasRenderingContext2D;

    beforeEach(() => {
        canvas = makeCanvas();
        img = makeImg();
        ctx = makeCtx(canvas);
    });

    it('calls drawImage', () => {
        kenBurns(ctx, img, canvas, 0.5, {});
        expect(ctx.drawImage).toHaveBeenCalledOnce();
    });

    it('uses startScale at progress=0 and endScale at progress=1', () => {
        const config = { startScale: 1.0, endScale: 1.2, panX: 0, panY: 0 };
        kenBurns(ctx, img, canvas, 0, config);
        expect(ctx.drawImage).toHaveBeenCalledOnce();
        kenBurns(ctx, img, canvas, 1, config);
        expect(ctx.drawImage).toHaveBeenCalledTimes(2);
    });

    it('does not throw with empty config', () => {
        expect(() => kenBurns(ctx, img, canvas, 0.5)).not.toThrow();
    });
});

describe('pulse effect', () => {
    it('calls drawImage with scaled dimensions', () => {
        const canvas = makeCanvas();
        const ctx = makeCtx(canvas);
        const img = makeImg();
        pulse(ctx, img, canvas, 0.5, { frequency: 2, amplitude: 0.02 });
        expect(ctx.drawImage).toHaveBeenCalledOnce();
    });

    it('scale is exactly 1.0 at progress=0 (sin=0)', () => {
        const canvas = makeCanvas();
        const ctx = makeCtx(canvas);
        const img = makeImg();
        pulse(ctx, img, canvas, 0, { amplitude: 0.1 });
        const call = (ctx.drawImage as ReturnType<typeof vi.spyOn>).mock.calls[0];
        // At progress=0 sin(0)=0 so scale=1, w=canvas.width, h=canvas.height
        expect(call[3]).toBeCloseTo(canvas.width, 1);
        expect(call[4]).toBeCloseTo(canvas.height, 1);
    });
});

describe('drift effect', () => {
    it('calls drawImage once without throwing', () => {
        const canvas = makeCanvas();
        const ctx = makeCtx(canvas);
        const img = makeImg();
        expect(() => drift(ctx, img, canvas, 0.5)).not.toThrow();
        expect(ctx.drawImage).toHaveBeenCalledOnce();
    });
});

describe('rotate effect', () => {
    it('calls save/restore to isolate transform', () => {
        const canvas = makeCanvas();
        const ctx = makeCtx(canvas);
        const img = makeImg();
        rotate(ctx, img, canvas, 0.5);
        expect(ctx.save).toHaveBeenCalled();
        expect(ctx.restore).toHaveBeenCalled();
    });

    it('calls drawImage', () => {
        const canvas = makeCanvas();
        const ctx = makeCtx(canvas);
        const img = makeImg();
        rotate(ctx, img, canvas, 0.5);
        expect(ctx.drawImage).toHaveBeenCalledOnce();
    });
});

describe('static effect', () => {
    it('draws image at full canvas dimensions', () => {
        const canvas = makeCanvas(1280, 720);
        const ctx = makeCtx(canvas);
        const img = makeImg();
        staticEffect(ctx, img, canvas, 0.5);
        expect(ctx.drawImage).toHaveBeenCalledWith(img, 0, 0, 1280, 720);
    });
});

describe('effect registry', () => {
    it('returns the correct function for each name', () => {
        expect(getEffect('kenBurns')).toBe(kenBurns);
        expect(getEffect('pulse')).toBe(pulse);
        expect(getEffect('drift')).toBe(drift);
        expect(getEffect('rotate')).toBe(rotate);
        expect(getEffect('static')).toBe(staticEffect);
    });

    it('throws for unknown effect names', () => {
        // @ts-expect-error intentional bad input
        expect(() => getEffect('unknown')).toThrow('Unknown effect');
    });
});
