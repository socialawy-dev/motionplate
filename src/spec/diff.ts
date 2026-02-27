/**
 * Spec diff utility — P2-07
 *
 * Compares two Sequence specs and returns a human-readable summary of changes.
 * Useful for the Director review/accept flow (P4-12) and debugging.
 */

import type { Sequence, Plate } from './schema';

export interface PlateDiff {
    plateId: string;
    changes: string[];
}

export interface SpecDiff {
    metaChanges: string[];
    added: string[];      // plate IDs added in b
    removed: string[];    // plate IDs removed from a
    modified: PlateDiff[];
    unchanged: string[];  // plate IDs with no changes
    hasChanges: boolean;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function jsonEqual(a: unknown, b: unknown): boolean {
    return JSON.stringify(a) === JSON.stringify(b);
}

function diffMeta(a: Sequence['meta'], b: Sequence['meta']): string[] {
    const changes: string[] = [];
    const keys = Object.keys({ ...a, ...b }) as (keyof Sequence['meta'])[];
    for (const k of keys) {
        if (!jsonEqual(a[k], b[k])) {
            changes.push(`meta.${k}: ${JSON.stringify(a[k])} → ${JSON.stringify(b[k])}`);
        }
    }
    return changes;
}

function diffPlate(a: Plate, b: Plate): string[] {
    const changes: string[] = [];
    const keys: (keyof Plate)[] = [
        'duration', 'effect', 'effectConfig',
        'post', 'postConfig',
        'transition', 'transitionDuration',
        'text', 'textConfig',
    ];
    for (const k of keys) {
        if (!jsonEqual(a[k], b[k])) {
            changes.push(`${k}: ${JSON.stringify(a[k])} → ${JSON.stringify(b[k])}`);
        }
    }
    return changes;
}

// ─── Main export ──────────────────────────────────────────────────────────────

/**
 * Returns a diff summary between two specs.
 * Plates are matched by `id`.
 */
export function diffSpecs(a: Sequence, b: Sequence): SpecDiff {
    const metaChanges = diffMeta(a.meta, b.meta);

    const aById = new Map(a.plates.map((p) => [p.id, p]));
    const bById = new Map(b.plates.map((p) => [p.id, p]));

    const added = b.plates.filter((p) => !aById.has(p.id)).map((p) => p.id);
    const removed = a.plates.filter((p) => !bById.has(p.id)).map((p) => p.id);

    const modified: PlateDiff[] = [];
    const unchanged: string[] = [];

    for (const [id, aPlate] of aById) {
        const bPlate = bById.get(id);
        if (!bPlate) continue; // removed — handled above
        const changes = diffPlate(aPlate, bPlate);
        if (changes.length > 0) {
            modified.push({ plateId: id, changes });
        } else {
            unchanged.push(id);
        }
    }

    const hasChanges =
        metaChanges.length > 0 ||
        added.length > 0 ||
        removed.length > 0 ||
        modified.length > 0;

    return { metaChanges, added, removed, modified, unchanged, hasChanges };
}

/**
 * Returns a compact human-readable summary string.
 */
export function diffSummary(diff: SpecDiff): string {
    if (!diff.hasChanges) return 'No changes.';
    const lines: string[] = [];
    if (diff.metaChanges.length) lines.push(`Meta: ${diff.metaChanges.join(', ')}`);
    if (diff.added.length) lines.push(`Added plates: ${diff.added.join(', ')}`);
    if (diff.removed.length) lines.push(`Removed plates: ${diff.removed.join(', ')}`);
    for (const m of diff.modified) {
        lines.push(`Modified ${m.plateId}: ${m.changes.join(' | ')}`);
    }
    return lines.join('\n');
}
