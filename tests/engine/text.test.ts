import { describe, it, expect, vi } from 'vitest';
import { isRTL, wrapText, renderText } from '../../src/engine/text';

function makeCanvas(w = 1280, h = 720): HTMLCanvasElement {
    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    return canvas;
}

function makeCtx(canvas: HTMLCanvasElement): CanvasRenderingContext2D {
    return canvas.getContext('2d')!;
}

describe('isRTL', () => {
    it('returns true for Arabic text', () => {
        expect(isRTL('مرحبا')).toBe(true);
        expect(isRTL('في البدء')).toBe(true);
    });

    it('returns false for Latin text', () => {
        expect(isRTL('Hello world')).toBe(false);
        expect(isRTL('')).toBe(false);
    });

    it('returns true for mixed Arabic/Latin', () => {
        expect(isRTL('Hello مرحبا')).toBe(true);
    });
});

describe('wrapText', () => {
    it('returns a single line when text fits', () => {
        const canvas = makeCanvas();
        const ctx = makeCtx(canvas);
        ctx.font = '28px Georgia, serif';
        const lines = wrapText(ctx, 'Short text', 10000);
        expect(lines).toHaveLength(1);
        expect(lines[0]).toBe('Short text');
    });

    it('wraps long text into multiple lines', () => {
        const canvas = makeCanvas();
        const ctx = makeCtx(canvas);
        ctx.font = '28px Georgia, serif';
        // The mock measureText always returns width=100.
        // Using maxWidth=50 (<100) forces every word onto its own line.
        const longText = 'word1 word2 word3 word4 word5';
        const lines = wrapText(ctx, longText, 50);
        expect(lines.length).toBeGreaterThan(1);
    });

    it('handles single long word without breaking', () => {
        const canvas = makeCanvas();
        const ctx = makeCtx(canvas);
        ctx.font = '28px Georgia, serif';
        const lines = wrapText(ctx, 'Superlongwordthatdoesnotfit', 1);
        // Single word can't be split, so it'll stay as one "line"
        expect(lines).toHaveLength(1);
    });
});

describe('renderText', () => {
    it('does not throw for normal text', () => {
        const canvas = makeCanvas();
        const ctx = makeCtx(canvas);
        expect(() => renderText(ctx, canvas, 'Hello', 0.5, {})).not.toThrow();
    });

    it('does not throw for Arabic text', () => {
        const canvas = makeCanvas();
        const ctx = makeCtx(canvas);
        expect(() => renderText(ctx, canvas, 'في البدء لم يكن ثمة بداية', 0.5, {})).not.toThrow();
    });

    it('skips rendering at progress=0 (fully transparent in fade-in)', () => {
        const canvas = makeCanvas();
        const ctx = makeCtx(canvas);
        // With default fadeIn=0.15, at progress=0 alpha=0 → nothing drawn
        // We can check this by spying on fillText
        const spy = vi.spyOn(ctx, 'fillText');
        renderText(ctx, canvas, 'Test', 0, { fadeIn: 0.15 });
        expect(spy).not.toHaveBeenCalled();
    });

    it('renders text at mid-plate progress', () => {
        const canvas = makeCanvas();
        const ctx = makeCtx(canvas);
        const spy = vi.spyOn(ctx, 'fillText');
        renderText(ctx, canvas, 'Test', 0.5, {});
        expect(spy).toHaveBeenCalled();
    });

    it('supports all text positions without throwing', () => {
        const canvas = makeCanvas();
        const ctx = makeCtx(canvas);
        for (const pos of ['top', 'center', 'bottom'] as const) {
            expect(() => renderText(ctx, canvas, 'Test', 0.5, { position: pos })).not.toThrow();
        }
    });
});
