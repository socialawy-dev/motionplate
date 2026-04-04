import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { createRoot } from 'react-dom/client';
import ExportBar from '../../src/composer/ExportBar';
import { useProjectStore } from '../../src/store/project';
import { usePlaybackStore } from '../../src/store/playback';
import { useSettingsStore } from '../../src/store/settings';
import { exportAndDownload } from '../../src/engine/exporter';

// Mock dependencies
vi.mock('../../src/engine/exporter', () => ({
    exportAndDownload: vi.fn().mockResolvedValue(undefined),
}));

describe('ExportBar', () => {
    let container: HTMLDivElement;

    beforeEach(() => {
        vi.clearAllMocks();

        container = document.createElement('div');
        document.body.appendChild(container);

        // Reset stores to default state
        useProjectStore.setState({
            spec: { meta: { title: 'Test', fps: 30, width: 1920, height: 1080, schemaVersion: '1.1.0' }, plates: [{ id: 'p1', duration: 5, effect: 'static', transition: 'cut' }] },
            images: [{ file: new File([], 'test.png'), url: 'blob:test', img: new Image() }],
            isSaving: false,
            saveNow: vi.fn().mockResolvedValue(undefined),
        });

        usePlaybackStore.setState({
            isExporting: false,
            exportProgress: 0,
            setExporting: vi.fn(),
            setExportProgress: vi.fn(),
            setPlaying: vi.fn(),
        });

        useSettingsStore.setState({
            tier: 'high',
            tierOverride: null,
            exportResolution: null
        });
    });

    afterEach(() => {
        document.body.removeChild(container);
    });

    it('sets default resolution based on tier', async () => {
        // We test useEffect logic that depends on `tier` mapping.
        // Note: the component itself does NOT render anything early, but let's give the effect
        // more time and use requestAnimationFrame or longer timeout.

        // --- Test 1: Low tier ---
        useSettingsStore.setState({ tier: 'low', exportResolution: null });

        const root = createRoot(container);
        root.render(<ExportBar />);

        // Poll for state update instead of guessing wait time
        await vi.waitFor(() => {
            expect(useSettingsStore.getState().exportResolution).toBe('720p');
        }, { timeout: 1000 });

        root.unmount();

        // --- Test 2: Medium tier ---
        useSettingsStore.setState({ tier: 'medium', exportResolution: null });

        const root2 = createRoot(container);
        root2.render(<ExportBar />);

        await vi.waitFor(() => {
            expect(useSettingsStore.getState().exportResolution).toBe('1080p');
        }, { timeout: 1000 });

        root2.unmount();
    });

    it('disables unavailable resolutions for low tier', async () => {
        useSettingsStore.setState({ tier: 'low' });
        const root = createRoot(container);
        await new Promise<void>((resolve) => {
            root.render(<ExportBar />);
            setTimeout(resolve, 50);
        });

        const select = document.querySelector('select');
        const options = Array.from(select!.querySelectorAll('option'));

        expect(options.find(o => o.value === '720p')?.disabled).toBe(false);
        expect(options.find(o => o.value === '1080p')?.disabled).toBe(true);
        expect(options.find(o => o.value === '4K')?.disabled).toBe(true);

        root.unmount();
    });

    it('disables unavailable resolutions for medium tier', async () => {
        useSettingsStore.setState({ tier: 'medium' });
        const root = createRoot(container);
        await new Promise<void>((resolve) => {
            root.render(<ExportBar />);
            setTimeout(resolve, 50);
        });

        const select = document.querySelector('select');
        const options = Array.from(select!.querySelectorAll('option'));

        expect(options.find(o => o.value === '720p')?.disabled).toBe(false);
        expect(options.find(o => o.value === '1080p')?.disabled).toBe(false);
        expect(options.find(o => o.value === '4K')?.disabled).toBe(true);

        root.unmount();
    });

    it('enables all resolutions for high tier', async () => {
        useSettingsStore.setState({ tier: 'high' });
        const root = createRoot(container);
        await new Promise<void>((resolve) => {
            root.render(<ExportBar />);
            setTimeout(resolve, 50);
        });

        const select = document.querySelector('select');
        const options = Array.from(select!.querySelectorAll('option'));

        expect(options.find(o => o.value === '720p')?.disabled).toBe(false);
        expect(options.find(o => o.value === '1080p')?.disabled).toBe(false);
        expect(options.find(o => o.value === '4K')?.disabled).toBe(false);

        root.unmount();
    });

    it('updates file size estimate when resolution changes', async () => {
        const root = createRoot(container);
        await new Promise<void>((resolve) => {
            root.render(<ExportBar />);
            setTimeout(resolve, 50);
        });

        useSettingsStore.getState().setExportResolution('720p');
        await new Promise((resolve) => setTimeout(resolve, 10));
        const estimate720p = document.querySelector('.export-estimate')?.textContent;

        useSettingsStore.getState().setExportResolution('1080p');
        await new Promise((resolve) => setTimeout(resolve, 10));
        const estimate1080p = document.querySelector('.export-estimate')?.textContent;

        useSettingsStore.getState().setExportResolution('4K');
        await new Promise((resolve) => setTimeout(resolve, 10));
        const estimate4K = document.querySelector('.export-estimate')?.textContent;

        expect(estimate720p).not.toEqual(estimate1080p);
        expect(estimate1080p).not.toEqual(estimate4K);

        root.unmount();
    });

    it('calls saveNow when the Save button is clicked', async () => {
        const root = createRoot(container);
        root.render(<ExportBar />);

        // Wait for render
        await new Promise((resolve) => setTimeout(resolve, 0));

        const buttons = document.querySelectorAll('button');
        const saveButton = Array.from(buttons).find(b => b.textContent?.includes('Save'));

        expect(saveButton).toBeDefined();

        // Simulate click
        saveButton!.click();

        const saveNowMock = useProjectStore.getState().saveNow;
        expect(saveNowMock).toHaveBeenCalledTimes(1);

        root.unmount();
    });

    it('calls saveNow before starting the export when the Export button is clicked', async () => {
        const root = createRoot(container);
        root.render(<ExportBar />);

        await new Promise((resolve) => setTimeout(resolve, 0));

        const buttons = document.querySelectorAll('button');
        const exportButton = Array.from(buttons).find(b => b.textContent?.includes('Export WebM'));

        expect(exportButton).toBeDefined();

        // Simulate click
        exportButton!.click();

        // Let promises flush
        await new Promise((resolve) => setTimeout(resolve, 10));

        const saveNowMock = useProjectStore.getState().saveNow;
        expect(saveNowMock).toHaveBeenCalledTimes(1);
        expect(exportAndDownload).toHaveBeenCalledTimes(1);

        root.unmount();
    });
});
