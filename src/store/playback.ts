/**
 * Playback store — P3 (Zustand)
 *
 * Transport state: current time, playing flag, export progress.
 * Kept separate from project to avoid re-rendering the canvas on every
 * spec edit.
 */

import { create } from 'zustand';

interface PlaybackState {
    currentTime: number;
    isPlaying: boolean;
    isExporting: boolean;
    exportProgress: number; // 0-100

    setCurrentTime: (t: number) => void;
    setPlaying: (v: boolean) => void;
    setExporting: (v: boolean) => void;
    setExportProgress: (p: number) => void;
    reset: () => void;
}

export const usePlaybackStore = create<PlaybackState>((set) => ({
    currentTime: 0,
    isPlaying: false,
    isExporting: false,
    exportProgress: 0,

    setCurrentTime: (t) => set({ currentTime: t }),
    setPlaying: (v) => set({ isPlaying: v }),
    setExporting: (v) => set({ isExporting: v }),
    setExportProgress: (p) => set({ exportProgress: p }),
    reset: () => set({ currentTime: 0, isPlaying: false, isExporting: false, exportProgress: 0 }),
}));
