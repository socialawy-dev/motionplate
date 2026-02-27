/**
 * Spec import / export helpers — P2-04, P2-05
 *
 * - `importSpec(file)` — reads a File object, validates, returns Sequence
 * - `exportSpec(spec)` — serialises and triggers a browser download
 * - `importSpecFromJSON(json)` — parses a string, validates, returns Sequence
 */

import type { Sequence } from './schema';
import { validateSequence } from './validator';
import { CURRENT_SCHEMA_VERSION } from './defaults';

// ─── Import ───────────────────────────────────────────────────────────────────

/**
 * Parses and validates a raw JSON string.
 * Throws with descriptive error message on invalid input.
 */
export function importSpecFromJSON(json: string): Sequence {
    let parsed: unknown;
    try {
        parsed = JSON.parse(json);
    } catch (e) {
        throw new Error(`Failed to parse JSON: ${(e as Error).message}`);
    }

    const result = validateSequence(parsed);

    // Surface warnings to console (non-fatal)
    if (result.warnings.length) {
        for (const w of result.warnings) console.warn('[MotionPlate]', w);
    }

    if (!result.valid) {
        throw new Error(`Invalid sequence spec:\n${result.errors.join('\n')}`);
    }

    return parsed as Sequence;
}

/**
 * Reads a File (from an <input type="file"> or drag-and-drop), parses,
 * and validates it as a Sequence.
 */
export async function importSpec(file: File): Promise<Sequence> {
    const text = await file.text();
    return importSpecFromJSON(text);
}

// ─── Export ───────────────────────────────────────────────────────────────────

/**
 * Serialises a Sequence to a formatted JSON string.
 * Ensures `meta.schemaVersion` is stamped with the current version.
 */
export function specToJSON(spec: Sequence): string {
    const stamped: Sequence = {
        ...spec,
        meta: { ...spec.meta, schemaVersion: CURRENT_SCHEMA_VERSION },
    };
    return JSON.stringify(stamped, null, 2);
}

/**
 * Triggers a browser download of the spec as a .json file.
 * Filename: `<title>_sequence.json`.
 */
export function exportSpec(spec: Sequence): void {
    const json = specToJSON(spec);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${spec.meta.title.replace(/\s+/g, '_')}_sequence.json`;
    a.click();
    URL.revokeObjectURL(url);
}
