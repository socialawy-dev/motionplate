import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { useProjectStore } from '../../src/store/project';

// We just need a simple blob for mocking images
const createMockBlob = () => new Blob(['fake image data'], { type: 'image/png' });

const mockSequence = {
    meta: {
        title: "Prologue Example",
        fps: 30,
        width: 1920,
        height: 1080,
        schemaVersion: "1.1.0"
    },
    plates: [
        { id: "plate-01.png", duration: 3, effect: "static", transition: "cut" }
    ]
};

// Mock IndexedDB
vi.mock('../../src/store/persistence', () => ({
    saveProject: vi.fn().mockResolvedValue(undefined),
    setLastProjectId: vi.fn().mockResolvedValue(undefined),
    listProjects: vi.fn().mockResolvedValue([])
}));

describe('ExampleLoader (loadExample)', () => {
    let originalFetch: typeof window.fetch;

    beforeEach(() => {
        originalFetch = window.fetch;

        // Mock window.URL.createObjectURL and Image constructor
        window.URL.createObjectURL = vi.fn().mockReturnValue('blob:mock-url');

        window.Image = class MockImage {
            onload: (() => void) | null = null;
            onerror: (() => void) | null = null;
            private _src: string = '';

            set src(value: string) {
                this._src = value;
                // Simulate async load
                setTimeout(() => {
                    if (this.onload) this.onload();
                }, 0);
            }
            get src() { return this._src; }
        } as unknown as typeof Image;
    });

    afterEach(() => {
        window.fetch = originalFetch;
        vi.restoreAllMocks();
    });

    it('should fetch the sequence and images, then populate the store', async () => {
        window.fetch = vi.fn().mockImplementation(async (url: string) => {
            if (url.endsWith('sequence.json')) {
                return {
                    ok: true,
                    json: async () => mockSequence,
                    statusText: 'OK'
                } as Response;
            } else if (url.includes('plate-01.png')) {
                return {
                    ok: true,
                    blob: async () => createMockBlob(),
                    statusText: 'OK'
                } as Response;
            }
            throw new Error(`Unexpected fetch URL: ${url}`);
        });

        const store = useProjectStore.getState();

        await store.loadExample('prologue');

        const state = useProjectStore.getState();

        // Assert state is populated
        expect(state.isLoading).toBe(false);
        expect(state.spec.meta.title).toBe('Prologue Example');
        expect(state.spec.plates.length).toBe(1);
        expect(state.spec.plates[0].id).toBe('plate-01.png');

        // Assert images are populated
        expect(state.images.length).toBe(1);
        expect(state.images[0].file.name).toBe('plate-01.png');
        expect(state.images[0].url).toBe('blob:mock-url');
        expect(state.images[0].img).toBeDefined();

        // Ensure persistence was called
        const { saveProject } = await import('../../src/store/persistence');
        expect(saveProject).toHaveBeenCalled();
    });
});
