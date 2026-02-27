/**
 * ExportBar — P3-14
 * Export WebM button + progress bar + hardware tier badge (P3-18).
 */

import { useProjectStore } from '../store/project';
import { usePlaybackStore } from '../store/playback';
import { useSettingsStore } from '../store/settings';
import { exportAndDownload } from '../engine/exporter';

export default function ExportBar() {
    // Individual selectors — avoids new-object-per-render Zustand bug
    const spec = useProjectStore((s) => s.spec);
    const images = useProjectStore((s) => s.images);

    const isExporting = usePlaybackStore((s) => s.isExporting);
    const exportProgress = usePlaybackStore((s) => s.exportProgress);
    const setExporting = usePlaybackStore((s) => s.setExporting);
    const setExportProgress = usePlaybackStore((s) => s.setExportProgress);
    const setPlaying = usePlaybackStore((s) => s.setPlaying);

    // Inline computation inside selector — NOT a function call on the store object
    const tier = useSettingsStore((s) => s.tierOverride ?? s.tier);

    const handleExport = async () => {
        if (!spec.plates.length || !images.length) return;
        setPlaying(false);
        setExporting(true);
        setExportProgress(0);

        try {
            const imgElements = images.map((e) => e.img);
            await exportAndDownload(spec, imgElements, {
                onProgress: (progress: number) => {
                    setExportProgress(Math.round(progress));
                },
            });
        } catch (e) {
            alert(`Export failed: ${(e as Error).message}`);
        } finally {
            setExporting(false);
            setExportProgress(0);
        }
    };

    const TIER_COLOR: Record<string, string> = {
        high: '#4ade80',
        medium: '#facc15',
        low: '#f87171',
    };

    return (
        <div className="export-bar">
            {/* Hardware tier badge (P3-18) */}
            <span
                className="tier-badge"
                style={{ borderColor: TIER_COLOR[tier] ?? '#888' }}
                title={`Hardware tier: ${tier}`}
                aria-label={`Hardware tier: ${tier}`}
            >
                {tier.toUpperCase()}
            </span>

            {/* Export button (P3-14) */}
            <button
                className="btn btn--export"
                onClick={handleExport}
                disabled={isExporting || !spec.plates.length}
                aria-label="Export to WebM"
                aria-busy={isExporting}
            >
                {isExporting ? `Exporting… ${exportProgress}%` : '⬇ Export WebM'}
            </button>

            {/* Progress bar */}
            {isExporting && (
                <div
                    className="export-progress"
                    role="progressbar"
                    aria-valuenow={exportProgress}
                    aria-valuemin={0}
                    aria-valuemax={100}
                >
                    <div
                        className="export-progress__fill"
                        style={{ width: `${exportProgress}%` }}
                    />
                </div>
            )}
        </div>
    );
}
