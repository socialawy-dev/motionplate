/**
 * Settings store — P3 (Zustand)
 *
 * User preferences and detected hardware tier.
 * Persisted to localStorage via a simple manual approach.
 */

import { create } from 'zustand';
import type { HardwareTier } from '../spec/schema';

type ActiveMode = 'compose' | 'preview' | 'spec';

interface SettingsState {
    tier: HardwareTier;
    tierOverride: HardwareTier | null; // user override
    activeMode: ActiveMode;

    setTier: (tier: HardwareTier) => void;
    setTierOverride: (tier: HardwareTier | null) => void;
    setActiveMode: (mode: ActiveMode) => void;

    effectiveTier: () => HardwareTier;
}

export const useSettingsStore = create<SettingsState>((set, get) => ({
    tier: 'medium',
    tierOverride: null,
    activeMode: 'compose',

    setTier: (tier) => set({ tier }),
    setTierOverride: (tierOverride) => set({ tierOverride }),
    setActiveMode: (activeMode) => set({ activeMode }),

    effectiveTier: () => get().tierOverride ?? get().tier,
}));
