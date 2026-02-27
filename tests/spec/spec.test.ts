import { describe, it, expect } from 'vitest';
import { validateSequence, assertValidSequence } from '../../src/spec/validator';
import { importSpecFromJSON, specToJSON } from '../../src/spec/io';
import { diffSpecs, diffSummary } from '../../src/spec/diff';
import { createDefaultPlate, CURRENT_SCHEMA_VERSION } from '../../src/spec/defaults';
import type { Sequence } from '../../src/spec/schema';

// ─── Fixtures ────────────────────────────────────────────────────────────────

const validSpec: Sequence = {
    meta: { title: 'Test', fps: 30, width: 1280, height: 720, schemaVersion: '1.0.0' },
    plates: [
        { id: 'p1', duration: 5, effect: 'kenBurns', transition: 'crossfade' },
        { id: 'p2', duration: 4, effect: 'static', transition: 'cut', text: 'Hello' },
    ],
};

// ─── Validator tests ──────────────────────────────────────────────────────────

describe('validateSequence', () => {
    it('passes a valid spec', () => {
        const result = validateSequence(validSpec);
        expect(result.valid).toBe(true);
        expect(result.errors).toHaveLength(0);
    });

    it('fails when plates is missing', () => {
        const bad = { meta: validSpec.meta };
        const result = validateSequence(bad);
        expect(result.valid).toBe(false);
        expect(result.errors.length).toBeGreaterThan(0);
    });

    it('fails when meta is missing', () => {
        const result = validateSequence({ plates: [] });
        expect(result.valid).toBe(false);
    });

    it('fails on unknown effect name', () => {
        const bad = { ...validSpec, plates: [{ ...validSpec.plates[0], effect: 'magic' }] };
        const result = validateSequence(bad);
        expect(result.valid).toBe(false);
    });

    it('fails on unknown transition name', () => {
        const bad = { ...validSpec, plates: [{ ...validSpec.plates[0], transition: 'wipe' }] };
        const result = validateSequence(bad);
        expect(result.valid).toBe(false);
    });

    it('fails on negative duration', () => {
        const bad = { ...validSpec, plates: [{ ...validSpec.plates[0], duration: -1 }] };
        const result = validateSequence(bad);
        expect(result.valid).toBe(false);
    });

    it('warns on minor schema version mismatch', () => {
        const old = { ...validSpec, meta: { ...validSpec.meta, schemaVersion: '1.0.1' } };
        const result = validateSequence(old);
        // Minor mismatch — should still be valid with a warning
        expect(result.warnings.length).toBeGreaterThan(0);
    });

    it('errors on major schema version mismatch', () => {
        const old = { ...validSpec, meta: { ...validSpec.meta, schemaVersion: '2.0.0' } };
        const result = validateSequence(old);
        expect(result.valid).toBe(false);
        expect(result.errors.some((e) => e.includes('Major version'))).toBe(true);
    });
});

describe('assertValidSequence', () => {
    it('does not throw for valid spec', () => {
        expect(() => assertValidSequence(validSpec)).not.toThrow();
    });

    it('throws for invalid spec', () => {
        expect(() => assertValidSequence({ plates: [] })).toThrow();
    });
});

// ─── IO tests ────────────────────────────────────────────────────────────────

describe('importSpecFromJSON', () => {
    it('round-trips: export → import returns equivalent spec', () => {
        const json = specToJSON(validSpec);
        const imported = importSpecFromJSON(json);
        // schemaVersion gets stamped, then imported — values should match
        expect(imported.meta.title).toBe(validSpec.meta.title);
        expect(imported.plates).toHaveLength(validSpec.plates.length);
        expect(imported.plates[0].id).toBe('p1');
    });

    it('stamps current schemaVersion on export', () => {
        const json = specToJSON(validSpec);
        const parsed = JSON.parse(json) as Sequence;
        expect(parsed.meta.schemaVersion).toBe(CURRENT_SCHEMA_VERSION);
    });

    it('throws on invalid JSON string', () => {
        expect(() => importSpecFromJSON('not json')).toThrow('Failed to parse JSON');
    });

    it('throws on invalid spec structure', () => {
        expect(() => importSpecFromJSON('{"meta":{}}')).toThrow('Invalid sequence spec');
    });
});

// ─── Defaults tests ───────────────────────────────────────────────────────────

describe('createDefaultPlate', () => {
    it('creates a plate with expected id', () => {
        const plate = createDefaultPlate(0);
        expect(plate.id).toBe('plate_1');
    });

    it('creates unique ids per index', () => {
        const a = createDefaultPlate(0);
        const b = createDefaultPlate(3);
        expect(a.id).not.toBe(b.id);
        expect(b.id).toBe('plate_4');
    });

    it('has valid default effect and transition', () => {
        const plate = createDefaultPlate(0);
        expect(plate.effect).toBe('kenBurns');
        expect(plate.transition).toBe('crossfade');
    });
});

// ─── Diff tests ───────────────────────────────────────────────────────────────

describe('diffSpecs', () => {
    it('returns no changes for identical specs', () => {
        const diff = diffSpecs(validSpec, validSpec);
        expect(diff.hasChanges).toBe(false);
        expect(diff.added).toHaveLength(0);
        expect(diff.removed).toHaveLength(0);
        expect(diff.modified).toHaveLength(0);
    });

    it('detects added plates', () => {
        const b: Sequence = {
            ...validSpec,
            plates: [...validSpec.plates, { id: 'p3', duration: 3, effect: 'drift', transition: 'cut' }],
        };
        const diff = diffSpecs(validSpec, b);
        expect(diff.added).toContain('p3');
        expect(diff.hasChanges).toBe(true);
    });

    it('detects removed plates', () => {
        const b: Sequence = { ...validSpec, plates: [validSpec.plates[0]] };
        const diff = diffSpecs(validSpec, b);
        expect(diff.removed).toContain('p2');
    });

    it('detects modified plate fields', () => {
        const b: Sequence = {
            ...validSpec,
            plates: [{ ...validSpec.plates[0], duration: 99 }, validSpec.plates[1]],
        };
        const diff = diffSpecs(validSpec, b);
        expect(diff.modified).toHaveLength(1);
        expect(diff.modified[0].plateId).toBe('p1');
        expect(diff.modified[0].changes[0]).toContain('duration');
    });

    it('detects meta changes', () => {
        const b: Sequence = { ...validSpec, meta: { ...validSpec.meta, title: 'New Title' } };
        const diff = diffSpecs(validSpec, b);
        expect(diff.metaChanges.length).toBeGreaterThan(0);
    });

    it('diffSummary returns "No changes." for identical specs', () => {
        expect(diffSummary(diffSpecs(validSpec, validSpec))).toBe('No changes.');
    });

    it('diffSummary mentions modified plate id', () => {
        const b: Sequence = {
            ...validSpec,
            plates: [{ ...validSpec.plates[0], duration: 99 }, validSpec.plates[1]],
        };
        const summary = diffSummary(diffSpecs(validSpec, b));
        expect(summary).toContain('p1');
        expect(summary).toContain('duration');
    });
});
