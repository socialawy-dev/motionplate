/**
 * Schema migration — P5-12
 *
 * Migrates older sequence specs to the current schema version.
 * Called automatically when loading projects from IndexedDB.
 *
 * Migration chain: 1.0.0 → 1.1.0 (current)
 */

import type { Sequence } from './schema';
import { CURRENT_SCHEMA_VERSION } from './defaults';

// ─── Migration helpers ────────────────────────────────────────────────────────

function parseSemver(v: string): [number, number, number] {
    const [major = 0, minor = 0, patch = 0] = v.split('.').map(Number);
    return [major, minor, patch];
}

function semverLt(a: string, b: string): boolean {
    const [aMaj, aMin, aPat] = parseSemver(a);
    const [bMaj, bMin, bPat] = parseSemver(b);
    if (aMaj !== bMaj) return aMaj < bMaj;
    if (aMin !== bMin) return aMin < bMin;
    return aPat < bPat;
}

// ─── Individual migrations ────────────────────────────────────────────────────

/**
 * 1.0.0 → 1.1.0: Added 4 composite transition names (wipeLeft, wipeDown,
 * slideLeft, zoomThrough). Additive change — old specs never reference them,
 * so no plate data changes needed. Just bump the version string.
 */
function migrate_1_0_0_to_1_1_0(spec: Sequence): Sequence {
    return {
        ...spec,
        meta: { ...spec.meta, schemaVersion: '1.1.0' },
    };
}

// ─── Migration pipeline ──────────────────────────────────────────────────────

type MigrationEntry = {
    from: string;
    to: string;
    fn: (spec: Sequence) => Sequence;
};

const MIGRATIONS: MigrationEntry[] = [
    { from: '1.0.0', to: '1.1.0', fn: migrate_1_0_0_to_1_1_0 },
];

/**
 * Migrates a Sequence spec to the current schema version.
 *
 * - If already current, returns the spec unchanged.
 * - If older, applies sequential migrations up to the current version.
 * - If the major version is ahead of current, throws (incompatible).
 * - If no migration path exists, stamps the current version (best-effort).
 */
export function migrateSpec(spec: Sequence): { spec: Sequence; migrated: boolean; fromVersion: string } {
    const fromVersion = spec.meta?.schemaVersion ?? '1.0.0';

    // Already current
    if (fromVersion === CURRENT_SCHEMA_VERSION) {
        return { spec, migrated: false, fromVersion };
    }

    // Major version ahead — incompatible
    const [fromMajor] = parseSemver(fromVersion);
    const [currentMajor] = parseSemver(CURRENT_SCHEMA_VERSION);
    if (fromMajor > currentMajor) {
        throw new Error(
            `Cannot downgrade: spec is v${fromVersion}, current app supports v${CURRENT_SCHEMA_VERSION}.`,
        );
    }

    // Apply sequential migrations
    let result = { ...spec };
    let currentVersion = fromVersion;

    for (const migration of MIGRATIONS) {
        if (currentVersion === migration.from && semverLt(currentVersion, CURRENT_SCHEMA_VERSION)) {
            result = migration.fn(result);
            currentVersion = migration.to;
        }
    }

    // If we still haven't reached the target (e.g. patch versions with no explicit migration),
    // just stamp the current version (safe for additive changes)
    if (result.meta.schemaVersion !== CURRENT_SCHEMA_VERSION) {
        result = {
            ...result,
            meta: { ...result.meta, schemaVersion: CURRENT_SCHEMA_VERSION },
        };
    }

    console.info(`[MotionPlate] Migrated spec from v${fromVersion} → v${CURRENT_SCHEMA_VERSION}`);

    return { spec: result, migrated: true, fromVersion };
}
