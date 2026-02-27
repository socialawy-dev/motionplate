/**
 * PreviewCanvas — P3-04
 * Center canvas driven by the engine's renderFrame().
 * Animates with requestAnimationFrame when playing.
 */

import { useEffect, useRef, useCallback } from 'react';
import { useProjectStore } from '../store/project';
import { usePlaybackStore } from '../store/playback';
import { renderFrame, getTotalDuration } from '../engine/renderer';

export default function PreviewCanvas() {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const animRef = useRef<number>(0);
    const lastTimeRef = useRef<number | null>(null);

    // Individual selectors
    const spec = useProjectStore((s) => s.spec);
    const images = useProjectStore((s) => s.images);

    const currentTime = usePlaybackStore((s) => s.currentTime);
    const isPlaying = usePlaybackStore((s) => s.isPlaying);
    const setCurrentTime = usePlaybackStore((s) => s.setCurrentTime);
    const setPlaying = usePlaybackStore((s) => s.setPlaying);

    const imgElements = images.map((e) => e.img);
    const totalDuration = getTotalDuration(spec);

    const paint = useCallback(
        (t: number) => {
            const canvas = canvasRef.current;
            if (!canvas) return;
            const ctx = canvas.getContext('2d');
            if (!ctx) return;
            renderFrame(ctx, canvas, spec, imgElements, t);
        },
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [spec, imgElements.length],
    );

    // Repaint on seek when paused
    useEffect(() => {
        if (!isPlaying) paint(currentTime);
    }, [currentTime, isPlaying, paint]);

    // Animation loop when playing
    useEffect(() => {
        if (!isPlaying) {
            cancelAnimationFrame(animRef.current);
            lastTimeRef.current = null;
            return;
        }

        const step = (wallTime: number) => {
            if (lastTimeRef.current === null) lastTimeRef.current = wallTime;
            const delta = (wallTime - lastTimeRef.current) / 1000;
            lastTimeRef.current = wallTime;

            // Read current time from store directly to avoid stale closure
            const next = usePlaybackStore.getState().currentTime + delta;

            if (next >= totalDuration) {
                setCurrentTime(totalDuration);
                setPlaying(false);
                paint(totalDuration);
                return;
            }

            setCurrentTime(next);
            paint(next);
            animRef.current = requestAnimationFrame(step);
        };

        animRef.current = requestAnimationFrame(step);
        return () => cancelAnimationFrame(animRef.current);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isPlaying, totalDuration, paint]);

    return (
        <canvas
            ref={canvasRef}
            className="preview-canvas"
            width={spec.meta.width}
            height={spec.meta.height}
            aria-label="Preview canvas"
        />
    );
}
