import type { Sequence } from '../spec/schema';
import { renderFrame, getTotalDuration } from './renderer';

export interface ExportOptions {
    /** Video bitrate in bps (default 5 Mbps) */
    bitrate?: number;
    /** Called each frame with progress 0→100 */
    onProgress?: (progress: number) => void;
}

/**
 * WebM exporter — P1-26
 *
 * Renders the full sequence frame-by-frame onto an offscreen canvas using
 * MediaRecorder + VP9 codec, then resolves with the resulting WebM Blob.
 *
 * The caller can trigger a download by creating an object URL from the blob.
 *
 * Notes:
 *  - Frame timing uses setTimeout to yield to the browser between frames.
 *    This keeps the UI responsive during export.
 *  - If VP9 is not supported, falls back to the browser default codec.
 */
export async function exportWebM(
    spec: Sequence,
    images: HTMLImageElement[],
    options: ExportOptions = {},
): Promise<Blob> {
    const { bitrate = 5_000_000, onProgress } = options;
    const { fps, width, height } = spec.meta;

    // Offscreen canvas at target resolution
    const exportCanvas = document.createElement('canvas');
    exportCanvas.width = width;
    exportCanvas.height = height;
    const ctx = exportCanvas.getContext('2d');
    if (!ctx) throw new Error('Could not obtain 2D context for export canvas');

    // MediaRecorder setup
    const stream = exportCanvas.captureStream(fps);
    const mimeType = MediaRecorder.isTypeSupported('video/webm;codecs=vp9')
        ? 'video/webm;codecs=vp9'
        : 'video/webm';

    const recorder = new MediaRecorder(stream, {
        mimeType,
        videoBitsPerSecond: bitrate,
    });

    const chunks: Blob[] = [];
    recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunks.push(e.data);
    };

    // Wrap recording lifecycle in a promise
    const recordingDone = new Promise<Blob>((resolve) => {
        recorder.onstop = () => {
            resolve(new Blob(chunks, { type: 'video/webm' }));
        };
    });

    recorder.start();

    const totalDuration = getTotalDuration(spec);
    const totalFrames = Math.ceil(totalDuration * fps);
    const frameInterval = 1000 / fps;

    for (let frame = 0; frame < totalFrames; frame++) {
        const t = frame / fps;
        renderFrame(ctx, exportCanvas, spec, images, t);
        onProgress?.(Math.round((frame / totalFrames) * 100));

        // Yield to browser — keeps UI alive and gives captureStream time to sample
        await new Promise<void>((r) => setTimeout(r, frameInterval / 4));
    }

    recorder.stop();
    onProgress?.(100);

    return recordingDone;
}

/**
 * Convenience helper — exports and auto-downloads the file.
 */
export async function exportAndDownload(
    spec: Sequence,
    images: HTMLImageElement[],
    options: ExportOptions = {},
): Promise<void> {
    const blob = await exportWebM(spec, images, options);
    const filename = `${spec.meta.title.replace(/\s+/g, '_')}.webm`;
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
}
