import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { createRoot } from 'react-dom/client';
import ExportBar from '../../src/composer/ExportBar';
import { useProjectStore } from '../../src/store/project';
import { usePlaybackStore } from '../../src/store/playback';
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
    });

    afterEach(() => {
        document.body.removeChild(container);
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
