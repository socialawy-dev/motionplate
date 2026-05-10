import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';
import LandingPage from '../../src/composer/LandingPage';
import { useProjectStore } from '../../src/store/project';

// Mocks
vi.mock('../../src/store/persistence', () => ({
    listProjects: vi.fn().mockResolvedValue([]),
    loadProjectThumbnail: vi.fn().mockResolvedValue(null),
    deleteProject: vi.fn().mockResolvedValue(undefined),
    clearAllProjects: vi.fn().mockResolvedValue(undefined),
    saveProject: vi.fn().mockResolvedValue(undefined),
    setLastProjectId: vi.fn().mockResolvedValue(undefined),
}));

// Mock fetch
const originalFetch = globalThis.fetch;

beforeEach(() => {
    useProjectStore.getState().resetProject();
    useProjectStore.setState({ recentProjects: [] });

    // Mock fetch for example loading
    globalThis.fetch = vi.fn().mockImplementation(async (url: string) => {
        if (url.endsWith('sequence.json')) {
            return {
                ok: true,
                json: async () => ({
                    meta: { title: 'Prologue Example' },
                    plates: Array.from({ length: 22 }, (_, i) => ({ id: `plate-${(i+1).toString().padStart(2, '0')}` }))
                })
            };
        }
        if (url.endsWith('.png')) {
            return {
                ok: true,
                blob: async () => new Blob(['dummy-image-data'], { type: 'image/png' })
            };
        }
        return { ok: false };
    });

    // Mock URL.createObjectURL
    globalThis.URL.createObjectURL = vi.fn().mockReturnValue('blob:dummy-url');

    // Mock Image since we construct it in loadExampleProject
    globalThis.Image = class {
        onload: () => void = () => {};
        onerror: () => void = () => {};
        src: string = '';
        constructor() {
            setTimeout(() => this.onload(), 0);
        }
    } as unknown as typeof Image;
});

afterEach(() => {
    globalThis.fetch = originalFetch;
    vi.restoreAllMocks();
});

describe('ExampleLoader (LandingPage)', () => {
    it('loads the prologue example when the button is clicked', async () => {
        render(<LandingPage />);

        const exampleCard = await screen.findByTestId('example-project-card');
        expect(exampleCard).toBeDefined();

        fireEvent.click(exampleCard);

        await waitFor(() => {
            const state = useProjectStore.getState();
            expect(state.spec.meta.title).toBe('Prologue Example');
            expect(state.spec.plates.length).toBe(22);
            expect(state.images.length).toBe(22);
        });

        expect(globalThis.fetch).toHaveBeenCalledWith('/examples/prologue/sequence.json');
        expect(globalThis.fetch).toHaveBeenCalledWith('/examples/prologue/plate-01.png');
        expect(globalThis.fetch).toHaveBeenCalledWith('/examples/prologue/plate-22.png');
    });
});
