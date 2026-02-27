/**
 * Project store — P3 (Zustand)
 *
 * Owns the Sequence spec + undo/redo history + loaded images.
 * This is the single source of truth for everything the engine reads.
 */

import { create } from 'zustand';
import type { Sequence, Plate, EffectName, TransitionName, PostEffectName, TextConfig } from '../spec/schema';
import { createDefaultPlate, CURRENT_SCHEMA_VERSION } from '../spec/defaults';

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

// ─── Store types ──────────────────────────────────────────────────────────────

export interface ImageEntry {
    file: File;
    url: string;           // object URL
    img: HTMLImageElement; // loaded image element
}

interface ProjectState {
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
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function pushHistory(past: Sequence[], current: Sequence): Sequence[] {
    const next = [...past, current];
    return next.length > MAX_HISTORY ? next.slice(next.length - MAX_HISTORY) : next;
}

// ─── Store ────────────────────────────────────────────────────────────────────

export const useProjectStore = create<ProjectState>((set, get) => ({
    spec: DEFAULT_SPEC,
    images: [],
    selectedPlateIdx: 0,
    past: [],
    future: [],

    setSpec: (spec) =>
        set((s) => ({ spec, past: pushHistory(s.past, s.spec), future: [] })),

    setSpecWithImages: (spec, images) =>
        set((s) => ({
            spec,
            images,
            selectedPlateIdx: 0,
            past: pushHistory(s.past, s.spec),
            future: [],
        })),

    addImages: (entries) =>
        set((s) => {
            const newImages = [...s.images, ...entries];
            const startIdx = s.spec.plates.length;
            const newPlates = entries.map((_, i) => createDefaultPlate(startIdx + i));
            const spec: Sequence = {
                ...s.spec,
                plates: [...s.spec.plates, ...newPlates],
            };
            return { images: newImages, spec, past: pushHistory(s.past, s.spec), future: [] };
        }),

    addPlate: (entry) =>
        set((s) => {
            const idx = s.spec.plates.length;
            const plate = createDefaultPlate(idx);
            const spec: Sequence = { ...s.spec, plates: [...s.spec.plates, plate] };
            return {
                images: [...s.images, entry],
                spec,
                past: pushHistory(s.past, s.spec),
                future: [],
            };
        }),

    removeImage: (idx) =>
        set((s) => ({
            images: s.images.filter((_, i) => i !== idx),
        })),

    selectPlate: (idx) => set({ selectedPlateIdx: idx }),

    updatePlate: (idx, patch) =>
        set((s) => {
            const plates = s.spec.plates.map((p, i) => (i === idx ? { ...p, ...patch } : p));
            return {
                spec: { ...s.spec, plates },
                past: pushHistory(s.past, s.spec),
                future: [],
            };
        }),

    removePlate: (idx) =>
        set((s) => {
            const plates = s.spec.plates.filter((_, i) => i !== idx);
            const images = s.images.filter((_, i) => i !== idx);
            const selectedPlateIdx = Math.max(0, Math.min(s.selectedPlateIdx, plates.length - 1));
            return {
                spec: { ...s.spec, plates },
                images,
                selectedPlateIdx,
                past: pushHistory(s.past, s.spec),
                future: [],
            };
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
            return {
                spec: { ...s.spec, plates },
                images,
                past: pushHistory(s.past, s.spec),
                future: [],
            };
        }),

    movePlate: (from, to) =>
        set((s) => {
            const plates = [...s.spec.plates];
            const images = [...s.images];
            const [plate] = plates.splice(from, 1);
            const [img] = images.splice(from, 1);
            plates.splice(to, 0, plate);
            images.splice(to, 0, img);
            return {
                spec: { ...s.spec, plates },
                images,
                past: pushHistory(s.past, s.spec),
                future: [],
            };
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
            return {
                spec: { ...s.spec, plates },
                past: pushHistory(s.past, s.spec),
                future: [],
            };
        }),

    setTextConfig: (idx, patch) =>
        set((s) => {
            const plate = s.spec.plates[idx];
            if (!plate) return s;
            const textConfig = { ...plate.textConfig, ...patch };
            const plates = s.spec.plates.map((p, i) => (i === idx ? { ...p, textConfig } : p));
            return {
                spec: { ...s.spec, plates },
                past: pushHistory(s.past, s.spec),
                future: [],
            };
        }),

    undo: () =>
        set((s) => {
            if (!s.past.length) return s;
            const past = [...s.past];
            const previous = past.pop()!;
            return {
                spec: previous,
                past,
                future: [s.spec, ...s.future].slice(0, MAX_HISTORY),
            };
        }),

    redo: () =>
        set((s) => {
            if (!s.future.length) return s;
            const [next, ...future] = s.future;
            return {
                spec: next,
                past: pushHistory(s.past, s.spec),
                future,
            };
        }),

    resetProject: () =>
        set({ spec: DEFAULT_SPEC, images: [], selectedPlateIdx: 0, past: [], future: [] }),
}));
