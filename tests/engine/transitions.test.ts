import { describe, it, expect, vi } from 'vitest';
import cut from '../../src/engine/transitions/cut';
import crossfade from '../../src/engine/transitions/crossfade';
import { crossfadeComposite } from '../../src/engine/transitions/crossfade';
import fadeThroughBlack from '../../src/engine/transitions/fadeThroughBlack';
import fadeThroughWhite from '../../src/engine/transitions/fadeThroughWhite';
import lightBleed from '../../src/engine/transitions/lightBleed';
import wipeLeft from '../../src/engine/transitions/wipeLeft';
import wipeDown from '../../src/engine/transitions/wipeDown';
import slideLeft from '../../src/engine/transitions/slideLeft';
import zoomThrough from '../../src/engine/transitions/zoomThrough';
import { getTransition, getCompositeTransition, isCompositeTransition } from '../../src/engine/transitions/index';

describe('cut transition', () => {
    it('always returns 1', () => {
        expect(cut(0)).toBe(1);
        expect(cut(0.5)).toBe(1);
        expect(cut(1)).toBe(1);
    });
});

describe('crossfade transition', () => {
    it('returns 0 at progress=0', () => {
        expect(crossfade(0)).toBe(0);
    });

    it('returns 1 at progress=0.5 and above', () => {
        expect(crossfade(0.5)).toBe(1);
        expect(crossfade(1)).toBe(1);
    });

    it('returns intermediate values', () => {
        expect(crossfade(0.25)).toBeCloseTo(0.5, 5);
    });
});

describe('fadeThroughBlack transition', () => {
    it('returns 1 at progress=0 (fully visible)', () => {
        expect(fadeThroughBlack(0)).toBe(1);
    });

    it('returns 0 at midpoint (fully black)', () => {
        expect(fadeThroughBlack(0.5)).toBeCloseTo(0, 5);
    });

    it('returns 1 at progress=1 (fully in)', () => {
        expect(fadeThroughBlack(1)).toBeCloseTo(1, 5);
    });

    it('fades symmetrically', () => {
        expect(fadeThroughBlack(0.25)).toBeCloseTo(0.5, 5);
        expect(fadeThroughBlack(0.75)).toBeCloseTo(0.5, 5);
    });
});

describe('fadeThroughWhite transition', () => {
    it('mirrors fadeThroughBlack curve', () => {
        expect(fadeThroughWhite(0)).toBe(1);
        expect(fadeThroughWhite(0.5)).toBeCloseTo(0, 5);
        expect(fadeThroughWhite(1)).toBeCloseTo(1, 5);
    });
});

describe('lightBleed transition', () => {
    it('returns 1 in hold phase (0→0.3)', () => {
        expect(lightBleed(0)).toBe(1);
        expect(lightBleed(0.2)).toBe(1);
    });

    it('returns 0 in black phase (0.5→0.7)', () => {
        expect(lightBleed(0.6)).toBeCloseTo(0, 5);
    });

    it('returns 1 at progress=1 (fully in)', () => {
        expect(lightBleed(1)).toBeCloseTo(1, 5);
    });
});

describe('transition registry', () => {
    it('returns correct functions', () => {
        expect(getTransition('cut')).toBe(cut);
        expect(getTransition('crossfade')).toBe(crossfade);
        expect(getTransition('fadeThroughBlack')).toBe(fadeThroughBlack);
        expect(getTransition('fadeThroughWhite')).toBe(fadeThroughWhite);
        expect(getTransition('lightBleed')).toBe(lightBleed);
    });

    it('falls back to crossfade for unknown transition names', () => {
        // @ts-expect-error intentional bad input
        const fn = getTransition('unknown');
        // Should return crossfade (not throw)
        expect(fn(0)).toBe(0);
        expect(fn(1)).toBe(1);
    });
});

// ─── Composite transition helpers ─────────────────────────────────────────────

function makeCtx() {
    const canvas = document.createElement('canvas');
    canvas.width = 100;
    canvas.height = 100;
    const ctx = canvas.getContext('2d')!;
    return { canvas, ctx };
}

function makeBuffer() {
    const buf = document.createElement('canvas');
    buf.width = 100;
    buf.height = 100;
    return buf;
}

// ─── crossfadeComposite ───────────────────────────────────────────────────────

describe('crossfadeComposite', () => {
    it('draws both plates at progress=0.5', () => {
        const { canvas, ctx } = makeCtx();
        const spy = vi.spyOn(ctx, 'drawImage');
        crossfadeComposite(ctx, canvas, makeBuffer(), makeBuffer(), 0.5);
        expect(spy).toHaveBeenCalledTimes(2);
    });

    it('restores globalAlpha to 1 after compositing', () => {
        const { canvas, ctx } = makeCtx();
        crossfadeComposite(ctx, canvas, makeBuffer(), makeBuffer(), 0.75);
        expect(ctx.globalAlpha).toBe(1);
    });
});

// ─── wipeLeft ────────────────────────────────────────────────────────────────

describe('wipeLeft', () => {
    it('calls drawImage at progress=0', () => {
        const { canvas, ctx } = makeCtx();
        const spy = vi.spyOn(ctx, 'drawImage');
        wipeLeft(ctx, canvas, makeBuffer(), makeBuffer(), 0);
        expect(spy).toHaveBeenCalled();
    });

    it('uses save/clip/restore at progress=0.5', () => {
        const { canvas, ctx } = makeCtx();
        const saveSpy = vi.spyOn(ctx, 'save');
        const clipSpy = vi.spyOn(ctx, 'clip');
        const restoreSpy = vi.spyOn(ctx, 'restore');
        wipeLeft(ctx, canvas, makeBuffer(), makeBuffer(), 0.5);
        expect(saveSpy).toHaveBeenCalled();
        expect(clipSpy).toHaveBeenCalled();
        expect(restoreSpy).toHaveBeenCalled();
    });

    it('draws both buffers at progress=1', () => {
        const { canvas, ctx } = makeCtx();
        const spy = vi.spyOn(ctx, 'drawImage');
        wipeLeft(ctx, canvas, makeBuffer(), makeBuffer(), 1);
        expect(spy).toHaveBeenCalledTimes(2);
    });
});

// ─── wipeDown ────────────────────────────────────────────────────────────────

describe('wipeDown', () => {
    it('uses save/clip/restore at progress=0.5', () => {
        const { canvas, ctx } = makeCtx();
        const saveSpy = vi.spyOn(ctx, 'save');
        const clipSpy = vi.spyOn(ctx, 'clip');
        wipeDown(ctx, canvas, makeBuffer(), makeBuffer(), 0.5);
        expect(saveSpy).toHaveBeenCalled();
        expect(clipSpy).toHaveBeenCalled();
    });

    it('draws both buffers at progress=1', () => {
        const { canvas, ctx } = makeCtx();
        const spy = vi.spyOn(ctx, 'drawImage');
        wipeDown(ctx, canvas, makeBuffer(), makeBuffer(), 1);
        expect(spy).toHaveBeenCalledTimes(2);
    });
});

// ─── slideLeft ───────────────────────────────────────────────────────────────

describe('slideLeft', () => {
    it('draws both plates at progress=0.5', () => {
        const { canvas, ctx } = makeCtx();
        const spy = vi.spyOn(ctx, 'drawImage');
        slideLeft(ctx, canvas, makeBuffer(), makeBuffer(), 0.5);
        expect(spy).toHaveBeenCalledTimes(2);
    });

    it('outgoing has negative x offset at progress=0.5', () => {
        const { canvas, ctx } = makeCtx();
        const spy = vi.spyOn(ctx, 'drawImage');
        slideLeft(ctx, canvas, makeBuffer(), makeBuffer(), 0.5);
        // First call is outgoing: drawImage(outgoing, -offset, 0, w, h)
        const firstCallX = spy.mock.calls[0][1] as number;
        expect(firstCallX).toBeLessThan(0);
    });
});

// ─── zoomThrough ─────────────────────────────────────────────────────────────

describe('zoomThrough', () => {
    it('phase 1 (progress=0.2): draws outgoing + white overlay', () => {
        const { canvas, ctx } = makeCtx();
        const drawSpy = vi.spyOn(ctx, 'drawImage');
        const fillSpy = vi.spyOn(ctx, 'fillRect');
        zoomThrough(ctx, canvas, makeBuffer(), makeBuffer(), 0.2);
        expect(drawSpy).toHaveBeenCalled();
        expect(fillSpy).toHaveBeenCalled();
    });

    it('phase 2 (progress=0.5): white flash + incoming emerging', () => {
        const { canvas, ctx } = makeCtx();
        const drawSpy = vi.spyOn(ctx, 'drawImage');
        const fillSpy = vi.spyOn(ctx, 'fillRect');
        zoomThrough(ctx, canvas, makeBuffer(), makeBuffer(), 0.5);
        expect(drawSpy).toHaveBeenCalled();
        expect(fillSpy).toHaveBeenCalled();
    });

    it('phase 3 (progress=0.8): incoming visible', () => {
        const { canvas, ctx } = makeCtx();
        const drawSpy = vi.spyOn(ctx, 'drawImage');
        zoomThrough(ctx, canvas, makeBuffer(), makeBuffer(), 0.8);
        expect(drawSpy).toHaveBeenCalled();
    });
});

// ─── Composite registry ───────────────────────────────────────────────────────

describe('composite transition registry', () => {
    it('isCompositeTransition: all composite names return true', () => {
        expect(isCompositeTransition('crossfade')).toBe(true);
        expect(isCompositeTransition('wipeLeft')).toBe(true);
        expect(isCompositeTransition('wipeDown')).toBe(true);
        expect(isCompositeTransition('slideLeft')).toBe(true);
        expect(isCompositeTransition('zoomThrough')).toBe(true);
    });

    it('isCompositeTransition: overlay and cut names return false', () => {
        expect(isCompositeTransition('fadeThroughBlack')).toBe(false);
        expect(isCompositeTransition('fadeThroughWhite')).toBe(false);
        expect(isCompositeTransition('lightBleed')).toBe(false);
        expect(isCompositeTransition('cut')).toBe(false);
    });

    it('getCompositeTransition returns a function for known names', () => {
        expect(typeof getCompositeTransition('wipeLeft')).toBe('function');
        expect(typeof getCompositeTransition('zoomThrough')).toBe('function');
        expect(typeof getCompositeTransition('crossfade')).toBe('function');
    });

    it('getCompositeTransition falls back to a function for unknown names', () => {
        // @ts-expect-error intentional bad input
        expect(typeof getCompositeTransition('unknown')).toBe('function');
    });
});
