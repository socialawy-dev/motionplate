/**
 * Phase 5a — Persistence + Migration tests
 *
 * P5-10: IndexedDB save/load round-trip
 * P5-11: Project listing
 * P5-12: Schema migration 1.0.0 → 1.1.0
 *
 * Uses `fake-indexeddb` to shim IndexedDB in the jsdom test environment.
 */

import 'fake-indexeddb/auto';
import { describe, it, expect, beforeEach } from 'vitest';
import type { Sequence } from '../../src/spec/schema';
import { CURRENT_SCHEMA_VERSION } from '../../src/spec/defaults';
import { migrateSpec } from '../../src/spec/migrate';
import {
    saveProject,
    loadProject,
    listProjects,
    deleteProject,
    getLastProjectId,
    setLastProjectId,
    estimateStorageUsed,
    formatBytes,
    getDB,
} from '../../src/store/persistence';

// ─── Fixtures ────────────────────────────────────────────────────────────────

const specV100: Sequence = {
    meta: { title: 'Old Project', fps: 30, width: 1280, height: 720, schemaVersion: '1.0.0' },
    plates: [
        { id: 'p1', duration: 5, effect: 'kenBurns', transition: 'crossfade' },
        { id: 'p2', duration: 4, effect: 'static', transition: 'fadeThroughBlack' },
    ],
};

const specV110: Sequence = {
    meta: { title: 'Current Project', fps: 30, width: 1280, height: 720, schemaVersion: '1.1.0' },
    plates: [
        { id: 'p1', duration: 5, effect: 'kenBurns', transition: 'wipeLeft' },
    ],
};

function makeFakeFile(name: string): File {
    const content = new Uint8Array([0x89, 0x50, 0x4E, 0x47]); // PNG magic bytes
    return new File([content], name, { type: 'image/png' });
}

// ─── Migration tests (P5-12) ─────────────────────────────────────────────────

describe('migrateSpec', () => {
    it('passes through a spec already at the current version', () => {
        const result = migrateSpec(specV110);
        expect(result.migrated).toBe(false);
        expect(result.spec.meta.schemaVersion).toBe(CURRENT_SCHEMA_VERSION);
    });

    it('migrates 1.0.0 → 1.1.0 (stamps version, plates unchanged)', () => {
        const result = migrateSpec(specV100);
        expect(result.migrated).toBe(true);
        expect(result.fromVersion).toBe('1.0.0');
        expect(result.spec.meta.schemaVersion).toBe('1.1.0');
        // Plates must be unchanged — additive migration
        expect(result.spec.plates).toHaveLength(2);
        expect(result.spec.plates[0].id).toBe('p1');
        expect(result.spec.plates[1].transition).toBe('fadeThroughBlack');
    });

    it('throws on a spec with a future major version', () => {
        const future: Sequence = {
            ...specV110,
            meta: { ...specV110.meta, schemaVersion: '2.0.0' },
        };
        expect(() => migrateSpec(future)).toThrow('Cannot downgrade');
    });

    it('handles missing schemaVersion (defaults to 1.0.0)', () => {
        const noVersion = { ...specV100, meta: { ...specV100.meta, schemaVersion: undefined } } as unknown as Sequence;
        const result = migrateSpec(noVersion);
        expect(result.migrated).toBe(true);
        expect(result.fromVersion).toBe('1.0.0');
    });

    it('handles patch version differences gracefully', () => {
        const patch: Sequence = {
            ...specV110,
            meta: { ...specV110.meta, schemaVersion: '1.0.3' },
        };
        const result = migrateSpec(patch);
        expect(result.migrated).toBe(true);
        expect(result.spec.meta.schemaVersion).toBe(CURRENT_SCHEMA_VERSION);
    });
});

// ─── Persistence tests (P5-10) ───────────────────────────────────────────────

describe('IndexedDB persistence', () => {
    // Reset database before each test
    beforeEach(async () => {
        const db = await getDB();
        const tx = db.transaction(['projects', 'appState'], 'readwrite');
        await tx.objectStore('projects').clear();
        await tx.objectStore('appState').clear();
        await tx.done;
    });

    it('saveProject + loadProject round-trips spec correctly', async () => {
        const files = [makeFakeFile('test.png')];
        await saveProject('test-1', specV110, files);

        const result = await loadProject('test-1');
        expect(result).not.toBeNull();
        expect(result!.spec.meta.title).toBe('Current Project');
        expect(result!.spec.plates).toHaveLength(1);
        expect(result!.migrated).toBe(false);
    });

    it('loadProject returns null for non-existent project', async () => {
        const result = await loadProject('does-not-exist');
        expect(result).toBeNull();
    });

    it('listProjects returns metadata sorted by updatedAt', async () => {
        await saveProject('a', specV110, []);

        // Ensure different timestamps so sort order is deterministic
        await new Promise((r) => setTimeout(r, 10));

        const laterSpec: Sequence = {
            ...specV110,
            meta: { ...specV110.meta, title: 'Later Project' },
        };
        await saveProject('b', laterSpec, []);

        const list = await listProjects();
        expect(list).toHaveLength(2);
        expect(list[0].id).toBe('b'); // Most recent first
        expect(list[0].title).toBe('Later Project');
        expect(list[1].id).toBe('a');
    });

    it('deleteProject removes a project', async () => {
        await saveProject('del-1', specV110, []);
        expect(await listProjects()).toHaveLength(1);

        await deleteProject('del-1');
        expect(await listProjects()).toHaveLength(0);
    });

    it('loadProject auto-migrates a 1.0.0 spec to 1.1.0', async () => {
        await saveProject('old-1', specV100, []);

        const result = await loadProject('old-1');
        expect(result).not.toBeNull();
        expect(result!.migrated).toBe(true);
        expect(result!.fromVersion).toBe('1.0.0');
        expect(result!.spec.meta.schemaVersion).toBe('1.1.0');
        // Plates preserved
        expect(result!.spec.plates).toHaveLength(2);
    });

    it('last project ID persists', async () => {
        await setLastProjectId('proj-42');
        const id = await getLastProjectId();
        expect(id).toBe('proj-42');
    });

    it('getLastProjectId returns null when unset', async () => {
        const id = await getLastProjectId();
        expect(id).toBeNull();
    });
});

// ─── Utility tests ───────────────────────────────────────────────────────────

describe('Storage utilities', () => {
    beforeEach(async () => {
        const db = await getDB();
        const tx = db.transaction(['projects', 'appState'], 'readwrite');
        await tx.objectStore('projects').clear();
        await tx.objectStore('appState').clear();
        await tx.done;
    });

    it('estimateStorageUsed returns 0 with no projects', async () => {
        const bytes = await estimateStorageUsed();
        expect(bytes).toBe(0);
    });

    it('estimateStorageUsed reflects saved data', async () => {
        await saveProject('s1', specV110, [makeFakeFile('img.png')]);
        const bytes = await estimateStorageUsed();
        expect(bytes).toBeGreaterThan(0);
    });

    it('formatBytes formats correctly', () => {
        expect(formatBytes(0)).toBe('0 B');
        expect(formatBytes(1024)).toBe('1.0 KB');
        expect(formatBytes(1048576)).toBe('1.0 MB');
        expect(formatBytes(500)).toBe('500 B');
    });
});
