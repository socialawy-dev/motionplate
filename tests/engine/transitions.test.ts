import { describe, it, expect } from 'vitest';
import cut from '../../src/engine/transitions/cut';
import crossfade from '../../src/engine/transitions/crossfade';
import fadeThroughBlack from '../../src/engine/transitions/fadeThroughBlack';
import fadeThroughWhite from '../../src/engine/transitions/fadeThroughWhite';
import lightBleed from '../../src/engine/transitions/lightBleed';
import { getTransition } from '../../src/engine/transitions/index';

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
