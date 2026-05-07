import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useProjectStore } from '../../src/store/project';
import { saveProject, setLastProjectId } from '../../src/store/persistence';

vi.mock('../../src/store/persistence', () => ({
    saveProject: vi.fn().mockResolvedValue(undefined),
    loadProject: vi.fn().mockResolvedValue(null),
    setLastProjectId: vi.fn().mockResolvedValue(undefined),
    getLastProjectId: vi.fn().mockResolvedValue('test-id'),
    listProjects: vi.fn().mockResolvedValue([]),
    deleteProject: vi.fn().mockResolvedValue(undefined),
    clearAllProjects: vi.fn().mockResolvedValue(undefined),
    estimateStorageUsed: vi.fn().mockResolvedValue(0),
}));

describe('project store - loadExample', () => {
    beforeEach(() => {
        useProjectStore.setState({ isLoading: false, images: [], spec: { meta: {} as unknown, plates: [] } as unknown as import('../../src/spec/schema').Sequence });
        vi.clearAllMocks();

        globalThis.fetch = vi.fn().mockImplementation((url: string) => {
            if (url === '/examples/prologue/sequence.json') {
                return Promise.resolve({
                    ok: true,
                    json: () => Promise.resolve({
                        meta: { title: 'Prologue Golden Test' },
                        plates: [{ id: 'plate_01' }]
                    })
                });
            } else if (url.startsWith('/examples/prologue/plate-')) {
                return Promise.resolve({
                    ok: true,
                    blob: () => Promise.resolve(new Blob(['fake'], { type: 'image/png' }))
                });
            }
            return Promise.reject(new Error('Unknown url'));
        });

        globalThis.URL.createObjectURL = vi.fn().mockReturnValue('blob:test');


        globalThis.Image = class {
            _src = '';
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            onload: any = null;
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            onerror: any = null;
            set src(val: string) {
                this._src = val;
                setTimeout(() => {
                    if (this.onload) this.onload();
                }, 0);
            }
            get src() { return this._src; }
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } as any;
    });

    it('fetches example spec and images, updates state, and saves', async () => {
        await useProjectStore.getState().loadExample();

        const state = useProjectStore.getState();
        expect(state.isLoading).toBe(false);
        expect(state.spec.meta.title).toBe('Prologue Golden Test');
        expect(state.images.length).toBe(1);
        expect(state.images[0].url).toBe('blob:test');
        expect(saveProject).toHaveBeenCalled();
        expect(setLastProjectId).toHaveBeenCalled();
    });
});
