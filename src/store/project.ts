/**
 * Project store — P3 + P5-10 (Zustand)
 *
 * Owns the Sequence spec + undo/redo history + loaded images.
 * This is the single source of truth for everything the engine reads.
 *
 * P5-10 additions: IndexedDB persistence via debounced auto-save.
 */

import { create } from 'zustand';
import type { Sequence, Plate, EffectName, TransitionName, PostEffectName, TextConfig } from '../spec/schema';
import { createDefaultPlate, CURRENT_SCHEMA_VERSION } from '../spec/defaults';
import {
    saveProject as dbSave,
    loadProject as dbLoad,
    setLastProjectId,
    getLastProjectId,
    listProjects as dbListProjects,
    deleteProject as dbDelete,
    type ProjectMeta,
} from './persistence';

// ─── Default sequence ─────────────────────────────────────────────────────────

const DEFAULT_SPEC: Sequence = {
    meta: {
        title: 'Untitled Sequence',
        fps: 30,
        width: 1280,
        height: 720,
        schemaVersion: CURRENT_SCHEMA_VERSION,
    },
    plates: [],
};

const MAX_HISTORY = 50;

// ─── Auto-save debounce ───────────────────────────────────────────────────────

let _saveTimer: ReturnType<typeof setTimeout> | null = null;
const SAVE_DEBOUNCE_MS = 2000;

function debouncedSave(state: ProjectState) {
    if (_saveTimer) clearTimeout(_saveTimer);
    _saveTimer = setTimeout(() => {
        const { projectId, spec, images } = state;
        if (!projectId) return;
        const files = images.map((e) => e.file);
        dbSave(projectId, spec, files).then(() => {
            setLastProjectId(projectId);
        }).catch((err) => {
            console.error('[MotionPlate] Auto-save failed:', err);
        });
    }, SAVE_DEBOUNCE_MS);
}

// ─── UUID helper ──────────────────────────────────────────────────────────────

function generateId(): string {
    if (typeof crypto !== 'undefined' && crypto.randomUUID) {
        return crypto.randomUUID();
    }
    // Fallback for older browsers
    return `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
}

// ─── Store types ──────────────────────────────────────────────────────────────

export interface ImageEntry {
    file: File;
    url: string;           // object URL
    img: HTMLImageElement; // loaded image element
}

interface ProjectState {
    // P5-10: Project identity
    projectId: string;
    isSaving: boolean;
    isLoading: boolean;

    spec: Sequence;
    images: ImageEntry[];  // indexed by plate order
    selectedPlateIdx: number;

    // History (undo/redo)
    past: Sequence[];
    future: Sequence[];

    // Actions
    setSpec: (spec: Sequence) => void;
    setSpecWithImages: (spec: Sequence, images: ImageEntry[]) => void;
    addImages: (entries: ImageEntry[]) => void;
    removeImage: (idx: number) => void;
    selectPlate: (idx: number) => void;
    updatePlate: (idx: number, patch: Partial<Plate>) => void;
    addPlate: (entry: ImageEntry) => void;
    removePlate: (idx: number) => void;
    duplicatePlate: (idx: number) => void;
    movePlate: (from: number, to: number) => void;
    setEffect: (idx: number, effect: EffectName) => void;
    setTransition: (idx: number, transition: TransitionName) => void;
    togglePost: (idx: number, post: PostEffectName) => void;
    setTextConfig: (idx: number, patch: Partial<TextConfig>) => void;
    undo: () => void;
    redo: () => void;
    resetProject: () => void;

    // P5-10: persistence actions
    saveNow: () => Promise<void>;
    loadProjectById: (id: string) => Promise<{ migrated: boolean; fromVersion: string } | null>;
    createNewProject: () => void;
    initFromLastProject: () => Promise<void>;

    // P5-11: project list
    recentProjects: ProjectMeta[];
    refreshProjectList: () => Promise<void>;
    deleteProjectById: (id: string) => Promise<void>;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function pushHistory(past: Sequence[], current: Sequence): Sequence[] {
    const next = [...past, current];
    return next.length > MAX_HISTORY ? next.slice(next.length - MAX_HISTORY) : next;
}

// ─── Store ────────────────────────────────────────────────────────────────────

export const useProjectStore = create<ProjectState>((set, get) => ({
    projectId: generateId(),
    isSaving: false,
    isLoading: false,
    spec: DEFAULT_SPEC,
    images: [],
    selectedPlateIdx: 0,
    past: [],
    future: [],
    recentProjects: [],

    setSpec: (spec) => {
        set((s) => {
            const newState = { ...s, spec, past: pushHistory(s.past, s.spec), future: [] };
            debouncedSave({ ...newState, images: s.images } as ProjectState);
            return newState;
        });
    },

    setSpecWithImages: (spec, images) => {
        set((s) => {
            const newState = {
                spec,
                images,
                selectedPlateIdx: 0,
                past: pushHistory(s.past, s.spec),
                future: [],
            };
            debouncedSave({ ...s, ...newState } as ProjectState);
            return newState;
        });
    },

    addImages: (entries) =>
        set((s) => {
            const newImages = [...s.images, ...entries];
            const startIdx = s.spec.plates.length;
            const newPlates = entries.map((_, i) => createDefaultPlate(startIdx + i));
            const spec: Sequence = {
                ...s.spec,
                plates: [...s.spec.plates, ...newPlates],
            };
            const newState = { images: newImages, spec, past: pushHistory(s.past, s.spec), future: [] };
            debouncedSave({ ...s, ...newState } as ProjectState);
            return newState;
        }),

    addPlate: (entry) =>
        set((s) => {
            const idx = s.spec.plates.length;
            const plate = createDefaultPlate(idx);
            const spec: Sequence = { ...s.spec, plates: [...s.spec.plates, plate] };
            const newState = {
                images: [...s.images, entry],
                spec,
                past: pushHistory(s.past, s.spec),
                future: [],
            };
            debouncedSave({ ...s, ...newState } as ProjectState);
            return newState;
        }),

    removeImage: (idx) =>
        set((s) => ({
            images: s.images.filter((_, i) => i !== idx),
        })),

    selectPlate: (idx) => set({ selectedPlateIdx: idx }),

    updatePlate: (idx, patch) =>
        set((s) => {
            const plates = s.spec.plates.map((p, i) => (i === idx ? { ...p, ...patch } : p));
            const newState = {
                spec: { ...s.spec, plates },
                past: pushHistory(s.past, s.spec),
                future: [],
            };
            debouncedSave({ ...s, ...newState } as ProjectState);
            return newState;
        }),

    removePlate: (idx) =>
        set((s) => {
            const plates = s.spec.plates.filter((_, i) => i !== idx);
            const images = s.images.filter((_, i) => i !== idx);
            const selectedPlateIdx = Math.max(0, Math.min(s.selectedPlateIdx, plates.length - 1));
            const newState = {
                spec: { ...s.spec, plates },
                images,
                selectedPlateIdx,
                past: pushHistory(s.past, s.spec),
                future: [],
            };
            debouncedSave({ ...s, ...newState } as ProjectState);
            return newState;
        }),

    duplicatePlate: (idx) =>
        set((s) => {
            const original = s.spec.plates[idx];
            if (!original) return s;
            const clone: Plate = { ...original, id: `plate_${Date.now()}` };
            const plates = [...s.spec.plates];
            plates.splice(idx + 1, 0, clone);
            const images = [...s.images];
            images.splice(idx + 1, 0, s.images[idx]);
            const newState = {
                spec: { ...s.spec, plates },
                images,
                past: pushHistory(s.past, s.spec),
                future: [],
            };
            debouncedSave({ ...s, ...newState } as ProjectState);
            return newState;
        }),

    movePlate: (from, to) =>
        set((s) => {
            const plates = [...s.spec.plates];
            const images = [...s.images];
            const [plate] = plates.splice(from, 1);
            const [img] = images.splice(from, 1);
            plates.splice(to, 0, plate);
            images.splice(to, 0, img);
            const newState = {
                spec: { ...s.spec, plates },
                images,
                past: pushHistory(s.past, s.spec),
                future: [],
            };
            debouncedSave({ ...s, ...newState } as ProjectState);
            return newState;
        }),

    setEffect: (idx, effect) => get().updatePlate(idx, { effect }),

    setTransition: (idx, transition) => get().updatePlate(idx, { transition }),

    togglePost: (idx, post) =>
        set((s) => {
            const plate = s.spec.plates[idx];
            if (!plate) return s;
            const current = plate.post ?? [];
            const next = current.includes(post)
                ? current.filter((p) => p !== post)
                : [...current, post];
            const plates = s.spec.plates.map((p, i) => (i === idx ? { ...p, post: next } : p));
            const newState = {
                spec: { ...s.spec, plates },
                past: pushHistory(s.past, s.spec),
                future: [],
            };
            debouncedSave({ ...s, ...newState } as ProjectState);
            return newState;
        }),

    setTextConfig: (idx, patch) =>
        set((s) => {
            const plate = s.spec.plates[idx];
            if (!plate) return s;
            const textConfig = { ...plate.textConfig, ...patch };
            const plates = s.spec.plates.map((p, i) => (i === idx ? { ...p, textConfig } : p));
            const newState = {
                spec: { ...s.spec, plates },
                past: pushHistory(s.past, s.spec),
                future: [],
            };
            debouncedSave({ ...s, ...newState } as ProjectState);
            return newState;
        }),

    undo: () =>
        set((s) => {
            if (!s.past.length) return s;
            const past = [...s.past];
            const previous = past.pop()!;
            const newState = {
                spec: previous,
                past,
                future: [s.spec, ...s.future].slice(0, MAX_HISTORY),
            };
            debouncedSave({ ...s, ...newState } as ProjectState);
            return newState;
        }),

    redo: () =>
        set((s) => {
            if (!s.future.length) return s;
            const [next, ...future] = s.future;
            const newState = {
                spec: next,
                past: pushHistory(s.past, s.spec),
                future,
            };
            debouncedSave({ ...s, ...newState } as ProjectState);
            return newState;
        }),

    resetProject: () =>
        set({ spec: DEFAULT_SPEC, images: [], selectedPlateIdx: 0, past: [], future: [] }),

    // ─── P5-10: Persistence actions ───────────────────────────────────────

    saveNow: async () => {
        const { projectId, spec, images } = get();
        set({ isSaving: true });
        try {
            const files = images.map((e) => e.file);
            await dbSave(projectId, spec, files);
            await setLastProjectId(projectId);
        } catch (err) {
            console.error('[MotionPlate] Manual save failed:', err);
        } finally {
            set({ isSaving: false });
        }
    },

    loadProjectById: async (id: string) => {
        set({ isLoading: true });
        try {
            const result = await dbLoad(id);
            if (!result) return null;

            set({
                projectId: id,
                spec: result.spec,
                images: result.images,
                selectedPlateIdx: 0,
                past: [],
                future: [],
                isLoading: false,
            });
            await setLastProjectId(id);
            return { migrated: result.migrated, fromVersion: result.fromVersion };
        } catch (err) {
            console.error('[MotionPlate] Load failed:', err);
            set({ isLoading: false });
            return null;
        }
    },

    createNewProject: () => {
        const newId = generateId();
        set({
            projectId: newId,
            spec: { ...DEFAULT_SPEC, meta: { ...DEFAULT_SPEC.meta, title: 'Untitled Sequence' } },
            images: [],
            selectedPlateIdx: 0,
            past: [],
            future: [],
        });
        // Auto-save the empty project so it appears in the project list
        dbSave(newId, DEFAULT_SPEC, []).then(() => {
            setLastProjectId(newId);
            get().refreshProjectList();
        });
    },

    initFromLastProject: async () => {
        set({ isLoading: true });
        try {
            const lastId = await getLastProjectId();
            if (lastId) {
                const result = await dbLoad(lastId);
                if (result) {
                    set({
                        projectId: lastId,
                        spec: result.spec,
                        images: result.images,
                        selectedPlateIdx: 0,
                        past: [],
                        future: [],
                    });
                    if (result.migrated) {
                        console.info(
                            `[MotionPlate] Project migrated from v${result.fromVersion} → v${CURRENT_SCHEMA_VERSION}`,
                        );
                    }
                }
            }
        } catch (err) {
            console.error('[MotionPlate] Init from last project failed:', err);
        } finally {
            set({ isLoading: false });
        }
    },

    // ─── P5-11: Project list ──────────────────────────────────────────────

    refreshProjectList: async () => {
        try {
            const projects = await dbListProjects();
            set({ recentProjects: projects });
        } catch (err) {
            console.error('[MotionPlate] Failed to list projects:', err);
        }
    },

    deleteProjectById: async (id: string) => {
        try {
            await dbDelete(id);
            const { projectId } = get();
            // If deleting the current project, create a new one
            if (id === projectId) {
                get().createNewProject();
            }
            await get().refreshProjectList();
        } catch (err) {
            console.error('[MotionPlate] Failed to delete project:', err);
        }
    },
}));
