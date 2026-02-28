/**
 * IndexedDB persistence layer — P5-10
 *
 * Stores projects (spec + image blobs) in IndexedDB using the `idb` wrapper.
 * Images are serialized as ArrayBuffers so full project state survives reloads.
 *
 * Two object stores:
 *   - `projects` — keyed by UUID. Contains spec, image blobs, and metadata.
 *   - `appState` — single row for global app settings (last opened project, etc.)
 */

import { openDB, type IDBPDatabase } from 'idb';
import type { Sequence } from '../spec/schema';
import { migrateSpec } from '../spec/migrate';
import { validateSequence } from '../spec/validator';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface StoredImage {
    name: string;
    type: string;
    buffer: ArrayBuffer;
}

export interface StoredProject {
    id: string;
    spec: Sequence;
    images: StoredImage[];
    createdAt: number;   // unix ms
    updatedAt: number;   // unix ms
}

export interface ProjectMeta {
    id: string;
    title: string;
    plateCount: number;
    createdAt: number;
    updatedAt: number;
}

// ─── DB setup ─────────────────────────────────────────────────────────────────

const DB_NAME = 'motionplate';
const DB_VERSION = 1;

let _db: IDBPDatabase | null = null;

export async function getDB(): Promise<IDBPDatabase> {
    if (_db) return _db;
    _db = await openDB(DB_NAME, DB_VERSION, {
        upgrade(db) {
            if (!db.objectStoreNames.contains('projects')) {
                db.createObjectStore('projects', { keyPath: 'id' });
            }
            if (!db.objectStoreNames.contains('appState')) {
                db.createObjectStore('appState');
            }
        },
    });
    return _db;
}

// ─── Image serialization ─────────────────────────────────────────────────────

/**
 * Converts a File + loaded HTMLImageElement pair into a serializable StoredImage.
 */
export async function serializeImage(file: File): Promise<StoredImage> {
    const buffer = await file.arrayBuffer();
    return { name: file.name, type: file.type, buffer };
}

/**
 * Reconstitutes a StoredImage back into a File → object URL → HTMLImageElement.
 * Includes a timeout fallback for test environments (jsdom) where Image.onload may not fire.
 */
export function deserializeImage(stored: StoredImage): Promise<{
    file: File;
    url: string;
    img: HTMLImageElement;
}> {
    const blob = new Blob([stored.buffer], { type: stored.type });
    const file = new File([blob], stored.name, { type: stored.type });
    const url = URL.createObjectURL(blob);

    return new Promise((resolve) => {
        const img = new Image();
        let settled = false;

        const finish = () => {
            if (settled) return;
            settled = true;
            resolve({ file, url, img });
        };

        img.onload = finish;
        img.onerror = finish; // Still resolve — let the caller decide what to do with a broken image
        img.src = url;

        // Fallback for test environments where Image events don't fire
        setTimeout(finish, 100);
    });
}

// ─── Project CRUD ─────────────────────────────────────────────────────────────

/**
 * Saves a project to IndexedDB.
 * Serializes all images as ArrayBuffers alongside the spec.
 */
export async function saveProject(
    id: string,
    spec: Sequence,
    imageFiles: File[],
): Promise<void> {
    const db = await getDB();
    const images: StoredImage[] = await Promise.all(imageFiles.map(serializeImage));

    const now = Date.now();
    const existing = await db.get('projects', id) as StoredProject | undefined;

    const project: StoredProject = {
        id,
        spec,
        images,
        createdAt: existing?.createdAt ?? now,
        updatedAt: now,
    };

    await db.put('projects', project);
}

/**
 * Loads a project from IndexedDB.
 * Runs schema migration if needed, then reconstitutes images.
 * Returns null if project not found.
 */
export async function loadProject(
    id: string,
): Promise<{ spec: Sequence; images: { file: File; url: string; img: HTMLImageElement }[]; migrated: boolean; fromVersion: string } | null> {
    const db = await getDB();
    const stored = (await db.get('projects', id)) as StoredProject | undefined;
    if (!stored) return null;

    // Run schema migration (P5-12)
    const { spec, migrated, fromVersion } = migrateSpec(stored.spec);

    // Validate after migration
    const validation = validateSequence(spec);
    if (!validation.valid) {
        console.error('[MotionPlate] Loaded project failed validation after migration:', validation.errors);
        // Still return — let the user see what they have
    }
    for (const w of validation.warnings) {
        console.warn('[MotionPlate]', w);
    }

    // Reconstitute images
    const images = await Promise.all(stored.images.map(deserializeImage));

    // If migrated, auto-save the upgraded version
    if (migrated) {
        const imageFiles = images.map((i) => i.file);
        await saveProject(id, spec, imageFiles);
    }

    return { spec, images, migrated, fromVersion };
}

/**
 * Returns metadata for all saved projects (for the project picker).
 * Sorted by updatedAt descending (most recent first).
 */
export async function listProjects(): Promise<ProjectMeta[]> {
    const db = await getDB();
    const all = (await db.getAll('projects')) as StoredProject[];
    return all
        .map((p) => ({
            id: p.id,
            title: p.spec.meta.title,
            plateCount: p.spec.plates.length,
            createdAt: p.createdAt,
            updatedAt: p.updatedAt,
        }))
        .sort((a, b) => b.updatedAt - a.updatedAt);
}

/**
 * Deletes a project from IndexedDB.
 */
export async function deleteProject(id: string): Promise<void> {
    const db = await getDB();
    await db.delete('projects', id);
}

// ─── App state ────────────────────────────────────────────────────────────────

const LAST_PROJECT_KEY = 'lastProjectId';

export async function getLastProjectId(): Promise<string | null> {
    const db = await getDB();
    const val = await db.get('appState', LAST_PROJECT_KEY);
    return (val as string) ?? null;
}

export async function setLastProjectId(id: string): Promise<void> {
    const db = await getDB();
    await db.put('appState', id, LAST_PROJECT_KEY);
}

// ─── Storage info (user-facing tip) ──────────────────────────────────────────

/**
 * Estimates total IndexedDB storage used by all projects.
 * Returns bytes. Useful for user-facing storage indicators.
 */
export async function estimateStorageUsed(): Promise<number> {
    const db = await getDB();
    const all = (await db.getAll('projects')) as StoredProject[];
    let total = 0;
    for (const p of all) {
        // Rough estimate: JSON size + image buffer sizes
        total += JSON.stringify(p.spec).length;
        for (const img of p.images) {
            total += img.buffer.byteLength;
        }
    }
    return total;
}

/**
 * Formats bytes into a human-readable string (e.g. "4.2 MB").
 */
export function formatBytes(bytes: number): string {
    if (bytes === 0) return '0 B';
    const units = ['B', 'KB', 'MB', 'GB'];
    const i = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
    const val = bytes / Math.pow(1024, i);
    return `${val.toFixed(i > 0 ? 1 : 0)} ${units[i]}`;
}
