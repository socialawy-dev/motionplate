/**
 * AJV-based spec validator — P2-02 / P2-06
 *
 * Validates any unknown object against the MotionPlate JSON Schema.
 * Also handles schema version migration warnings (P2-06).
 */

import Ajv from 'ajv';
import type { Sequence } from './schema';
import { CURRENT_SCHEMA_VERSION } from './defaults';
import schema from '../../schemas/sequence.schema.json';

const ajv = new Ajv({ allErrors: true, strict: false });
const validate = ajv.compile(schema);

// ─── Semver helpers ───────────────────────────────────────────────────────────

function parseSemver(v: string): [number, number, number] {
    const [major = 0, minor = 0, patch = 0] = v.split('.').map(Number);
    return [major, minor, patch];
}

function isMajorMismatch(a: string, b: string): boolean {
    return parseSemver(a)[0] !== parseSemver(b)[0];
}

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ValidationResult {
    valid: boolean;
    errors: string[];
    warnings: string[];
}

// ─── Main export ──────────────────────────────────────────────────────────────

/**
 * Validates an unknown object against the sequence JSON schema.
 * Returns `{ valid, errors, warnings }`.
 * - `errors` are schema violations that make the spec unusable.
 * - `warnings` are non-fatal issues (e.g. old schema version).
 */
export function validateSequence(obj: unknown): ValidationResult {
    const valid = validate(obj) as boolean;
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!valid && validate.errors) {
        for (const e of validate.errors) {
            const path = e.instancePath || '(root)';
            errors.push(`${path}: ${e.message ?? 'unknown error'}`);
        }
    }

    // Schema version migration warning (P2-06)
    if (valid && obj && typeof obj === 'object') {
        const spec = obj as Partial<Sequence>;
        const fileVersion = spec.meta?.schemaVersion;
        if (fileVersion && fileVersion !== CURRENT_SCHEMA_VERSION) {
            if (isMajorMismatch(fileVersion, CURRENT_SCHEMA_VERSION)) {
                errors.push(
                    `Schema version mismatch: file is v${fileVersion}, current is v${CURRENT_SCHEMA_VERSION}. ` +
                    `Major version difference — spec may be incompatible.`,
                );
            } else {
                warnings.push(
                    `Schema version: file is v${fileVersion}, current is v${CURRENT_SCHEMA_VERSION}. ` +
                    `Minor/patch difference — spec should work but consider re-saving.`,
                );
            }
        }
    }

    return { valid: valid && errors.length === 0, errors, warnings };
}

/**
 * Throws if the spec is invalid. Convenience for non-UI contexts.
 */
export function assertValidSequence(obj: unknown): asserts obj is Sequence {
    const result = validateSequence(obj);
    if (!result.valid) {
        throw new Error(`Invalid sequence spec:\n${result.errors.join('\n')}`);
    }
}
