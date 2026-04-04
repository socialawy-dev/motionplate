/**
 * ExportBar — P3-14
 * Export WebM button + progress bar + hardware tier badge (P3-18).
 */

import { useEffect } from 'react';
import { useProjectStore } from '../store/project';
import { usePlaybackStore } from '../store/playback';
import { useSettingsStore } from '../store/settings';
import { exportAndDownload } from '../engine/exporter';
import { getTotalDuration } from '../engine/renderer';

export default function ExportBar() {
    // Individual selectors — avoids new-object-per-render Zustand bug
    const spec = useProjectStore((s) => s.spec);
    const images = useProjectStore((s) => s.images);
    const saveNow = useProjectStore((s) => s.saveNow);
    const isSaving = useProjectStore((s) => s.isSaving);

    const isExporting = usePlaybackStore((s) => s.isExporting);
    const exportProgress = usePlaybackStore((s) => s.exportProgress);
    const setExporting = usePlaybackStore((s) => s.setExporting);
    const setExportProgress = usePlaybackStore((s) => s.setExportProgress);
    const setPlaying = usePlaybackStore((s) => s.setPlaying);

    // Inline computation inside selector — NOT a function call on the store object
    const tier = useSettingsStore((s) => s.tierOverride ?? s.tier);
    const exportResolution = useSettingsStore((s) => s.exportResolution);
    const setExportResolution = useSettingsStore((s) => s.setExportResolution);

    useEffect(() => {
        if (!exportResolution) {
            setExportResolution(tier === 'low' ? '720p' : '1080p');
        } else if (tier === 'low' && exportResolution !== '720p') {
            setExportResolution('720p');
        } else if (tier === 'medium' && exportResolution === '4K') {
            setExportResolution('1080p');
        }
    }, [tier, exportResolution, setExportResolution]);

    // Default bitrate logic matches exportWebM
    const baseBitrate = 5_000_000;
    const duration = spec.plates.length ? getTotalDuration(spec) : 0;

    let resolutionMultiplier = 1;
    if (exportResolution === '1080p') resolutionMultiplier = 2.25; // roughly 1920x1080 / 1280x720
    else if (exportResolution === '4K') resolutionMultiplier = 9; // roughly 3840x2160 / 1280x720

    const targetBitrate = baseBitrate * resolutionMultiplier;

    const handleExport = async () => {
        if (!spec.plates.length || !images.length) return;
        setPlaying(false);
        setExporting(true);
        setExportProgress(0);

        try {
            // Auto-save before export (P5-10)
            await saveNow();

            const imgElements = images.map((e) => e.img);
            await exportAndDownload(spec, imgElements, {
                resolution: exportResolution || undefined,
                bitrate: targetBitrate,
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

    const is1080pDisabled = tier === 'low';
    const is4KDisabled = tier === 'low' || tier === 'medium';

    // Very rough estimation: (bitrate * multiplier) * duration_in_seconds / 8 (bits to bytes) / 1024 / 1024 (to MB)
    const estimatedSizeMB = ((targetBitrate * duration) / 8 / 1024 / 1024).toFixed(1);

    return (
        <div className="export-bar flex items-center gap-4 flex-wrap">
            {/* Save project button (P5-10) */}
            <button
                className="btn btn--secondary"
                onClick={() => saveNow()}
                disabled={isSaving || !spec.plates.length}
                aria-label="Save project"
                title="Save current project to browser storage"
            >
                {isSaving ? 'Saving…' : '💾 Save'}
            </button>

            {/* Hardware tier badge (P3-18) */}
            <span
                className="tier-badge"
                style={{ borderColor: TIER_COLOR[tier] ?? '#888' }}
                title={`Hardware tier: ${tier}`}
                aria-label={`Hardware tier: ${tier}`}
            >
                {tier.toUpperCase()}
            </span>

            <div className="export-settings flex items-center gap-2">
                <select
                    title="Export resolution"
                    aria-label="Export resolution"
                    value={exportResolution || '720p'}
                    onChange={(e) => setExportResolution(e.target.value as '720p' | '1080p' | '4K')}
                    disabled={isExporting}
                    className="px-2 py-1 rounded bg-slate-800 text-white border border-slate-600 disabled:opacity-50"
                >
                    <option value="720p">720p (1280×720)</option>
                    <option
                        value="1080p"
                        disabled={is1080pDisabled}
                        title={is1080pDisabled ? '1080p requires Medium or High hardware tier' : ''}
                    >
                        1080p (1920×1080)
                    </option>
                    <option
                        value="4K"
                        disabled={is4KDisabled}
                        title={is4KDisabled ? '4K requires High hardware tier' : ''}
                    >
                        4K (3840×2160)
                    </option>
                </select>

                <span className="export-estimate text-sm text-slate-400">
                    ~{estimatedSizeMB} MB
                </span>
            </div>

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
