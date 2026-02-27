/**
 * Transport — P3-05 / P3-20
 * Play/pause, seek bar, time display, and keyboard shortcuts.
 */

import React, { useEffect, useCallback } from 'react';
import { usePlaybackStore } from '../store/playback';
import { useProjectStore } from '../store/project';
import { getTotalDuration } from '../engine/renderer';

function fmt(t: number): string {
    const m = Math.floor(t / 60);
    const s = (t % 60).toFixed(1).padStart(4, '0');
    return `${m}:${s}`;
}

export default function Transport() {
    const spec = useProjectStore((s) => s.spec);
    const totalDuration = getTotalDuration(spec);

    // Individual selectors
    const currentTime = usePlaybackStore((s) => s.currentTime);
    const isPlaying = usePlaybackStore((s) => s.isPlaying);
    const setCurrentTime = usePlaybackStore((s) => s.setCurrentTime);
    const setPlaying = usePlaybackStore((s) => s.setPlaying);

    const togglePlay = useCallback(() => {
        if (currentTime >= totalDuration) setCurrentTime(0);
        setPlaying(!isPlaying);
    }, [currentTime, isPlaying, totalDuration, setCurrentTime, setPlaying]);

    const seek = useCallback(
        (e: React.ChangeEvent<HTMLInputElement>) => {
            setCurrentTime(Number(e.target.value));
        },
        [setCurrentTime],
    );

    useEffect(() => {
        const handler = (e: KeyboardEvent) => {
            const tag = (e.target as HTMLElement).tagName;
            if (tag === 'INPUT' || tag === 'TEXTAREA') return;
            if (e.code === 'Space') { e.preventDefault(); togglePlay(); }
            if (e.code === 'ArrowLeft') setCurrentTime(Math.max(0, currentTime - 0.5));
            if (e.code === 'ArrowRight') setCurrentTime(Math.min(totalDuration, currentTime + 0.5));
        };
        window.addEventListener('keydown', handler);
        return () => window.removeEventListener('keydown', handler);
    }, [togglePlay, currentTime, totalDuration, setCurrentTime]);

    return (
        <div className="transport" role="group" aria-label="Playback controls">
            <button
                className="transport__play"
                onClick={togglePlay}
                aria-label={isPlaying ? 'Pause' : 'Play'}
                disabled={!totalDuration}
            >
                {isPlaying ? '⏸' : '▶'}
            </button>

            <input
                className="transport__scrubber"
                type="range"
                min={0}
                max={totalDuration || 1}
                step={0.033}
                value={currentTime}
                onChange={seek}
                aria-label="Playback position"
                aria-valuemin={0}
                aria-valuemax={totalDuration}
                aria-valuenow={currentTime}
            />

            <span className="transport__time">
                {fmt(currentTime)} / {fmt(totalDuration)}
            </span>
        </div>
    );
}
