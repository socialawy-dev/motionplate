import { describe, it, expect, vi } from 'vitest';
import { getPlateAtTime, getTotalDuration, renderFrame } from '../../src/engine/renderer';
import type { Sequence } from '../../src/spec/schema';

// ─── Fixtures ────────────────────────────────────────────────────────────────

const testSequence: Sequence = {
    meta: { title: 'Test', fps: 30, width: 1280, height: 720, schemaVersion: '1.0.0' },
    plates: [
        {
            id: 'p1',
            duration: 5,
            effect: 'kenBurns',
            transition: 'cut',
        },
        {
            id: 'p2',
            duration: 4,
            effect: 'pulse',
            transition: 'crossfade',
            transitionDuration: 1,
        },
        {
            id: 'p3',
            duration: 6,
            effect: 'static',
            transition: 'cut',
            text: 'Test text',
        },
    ],
};

function makeCanvas(): HTMLCanvasElement {
    const canvas = document.createElement('canvas');
    canvas.width = 1280;
    canvas.height = 720;
    return canvas;
}

function makeImg(): HTMLImageElement {
    const img = new Image();
    Object.defineProperty(img, 'naturalWidth', { value: 1920 });
    Object.defineProperty(img, 'naturalHeight', { value: 1080 });
    return img;
}

// ─── getPlateAtTime tests ────────────────────────────────────────────────────

describe('getPlateAtTime', () => {
    it('returns first plate at t=0', () => {
        const result = getPlateAtTime(testSequence, 0);
        expect(result).not.toBeNull();
        expect(result!.plateIdx).toBe(0);
        expect(result!.plate.id).toBe('p1');
        expect(result!.progress).toBe(0);
        expect(result!.plateStart).toBe(0);
    });

    it('returns correct plate at exact boundary (start of plate 2)', () => {
        const result = getPlateAtTime(testSequence, 5);
        expect(result).not.toBeNull();
        expect(result!.plateIdx).toBe(1);
        expect(result!.progress).toBe(0);
    });

    it('returns last plate at t near end', () => {
        const result = getPlateAtTime(testSequence, 14); // 5+4+5=14 < 5+4+6=15
        expect(result!.plateIdx).toBe(2);
    });

    it('returns null past the total duration', () => {
        const result = getPlateAtTime(testSequence, 15); // end of last plate
        expect(result).toBeNull();
    });

    it('returns null for empty sequence', () => {
        const empty: Sequence = { ...testSequence, plates: [] };
        expect(getPlateAtTime(empty, 0)).toBeNull();
    });

    it('progress is 0.5 at midpoint of first plate (t=2.5)', () => {
        const result = getPlateAtTime(testSequence, 2.5);
        expect(result!.progress).toBeCloseTo(0.5, 5);
    });

    it('progress approaches 1 just before plate end', () => {
        const result = getPlateAtTime(testSequence, 4.9999);
        expect(result!.progress).toBeCloseTo(1, 3);
    });
});

// ─── getTotalDuration tests ──────────────────────────────────────────────────

describe('getTotalDuration', () => {
    it('returns sum of all plate durations', () => {
        expect(getTotalDuration(testSequence)).toBe(15); // 5+4+6
    });

    it('returns 0 for empty sequence', () => {
        const empty: Sequence = { ...testSequence, plates: [] };
        expect(getTotalDuration(empty)).toBe(0);
    });
});

// ─── renderFrame tests ────────────────────────────────────────────────────────

describe('renderFrame', () => {
    it('does not throw with valid inputs', () => {
        const canvas = makeCanvas();
        const ctx = canvas.getContext('2d')!;
        const img = makeImg();
        expect(() => renderFrame(ctx, canvas, testSequence, [img, img, img], 2.5)).not.toThrow();
    });

    it('renders black fill when no images provided', () => {
        const canvas = makeCanvas();
        const ctx = canvas.getContext('2d')!;
        const fillRectSpy = vi.spyOn(ctx, 'fillRect');
        renderFrame(ctx, canvas, testSequence, [], 0);
        // Should still call fillRect for clearing (black background)
        expect(fillRectSpy).toHaveBeenCalled();
    });

    it('does not throw past end of sequence', () => {
        const canvas = makeCanvas();
        const ctx = canvas.getContext('2d')!;
        const img = makeImg();
        expect(() => renderFrame(ctx, canvas, testSequence, [img], 999)).not.toThrow();
    });

    it('wraps image index for plates beyond image count (modulo behaviour)', () => {
        const canvas = makeCanvas();
        const ctx = canvas.getContext('2d')!;
        const img = makeImg();
        const drawSpy = vi.spyOn(ctx, 'drawImage');
        // Only 1 image, 3 plates — plate 0 and plate 2 should both use img[0]
        renderFrame(ctx, canvas, testSequence, [img], 9); // into plate 3
        expect(drawSpy).toHaveBeenCalled();
    });

    it('renders text when plate has text', () => {
        const canvas = makeCanvas();
        const ctx = canvas.getContext('2d')!;
        const img = makeImg();
        const fillTextSpy = vi.spyOn(ctx, 'fillText');
        renderFrame(ctx, canvas, testSequence, [img], 10.5); // inside plate 3 which has text
        expect(fillTextSpy).toHaveBeenCalled();
    });
});

// ─── Composite transition rendering ──────────────────────────────────────────

describe('composite transition rendering', () => {
    it('routes through composite path in transition zone (crossfade at plate boundary)', () => {
        const canvas = makeCanvas();
        const ctx = canvas.getContext('2d')!;
        const img = makeImg();
        const drawSpy = vi.spyOn(ctx, 'drawImage');

        // testSequence: plate[0]=5s cut, plate[1]=4s crossfade td=1s, plate[2]=6s cut
        // t=5.5 → plate[1] active, localTime=0.5 < td=1.0 → composite path
        // crossfadeComposite draws outgoing buffer + incoming buffer onto main ctx
        renderFrame(ctx, canvas, testSequence, [img, img, img], 5.5);

        // At least 2 drawImage calls on main ctx: one per buffer from crossfadeComposite
        expect(drawSpy.mock.calls.length).toBeGreaterThanOrEqual(2);
    });
});
