/**
 * AudioPanel — P5-01
 * Controls the project's background audio track (upload, remove, mute, adjust volume/offset).
 * Renders a small waveform using the Web Audio API on a Canvas2D context.
 */

import React, { useRef, useEffect, useState } from 'react';
import { useProjectStore } from '../store/project';

export default function AudioPanel() {
    // Individual selectors
    const audio = useProjectStore((s) => s.spec.audio);
    const audioUrl = useProjectStore((s) => s.audioUrl);
    const setAudio = useProjectStore((s) => s.setAudio);
    const removeAudio = useProjectStore((s) => s.removeAudio);
    const updateAudioConfig = useProjectStore((s) => s.updateAudioConfig);

    const fileInputRef = useRef<HTMLInputElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [audioBuffer, setAudioBuffer] = useState<AudioBuffer | null>(null);

    // Mute toggle: keep original volume state locally if we want to restore it,
    // or just assume 1.0 if previous was 0.
    const isMuted = audio?.volume === 0;

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setAudio(file);
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const handleToggleMute = () => {
        if (!audio) return;
        if (isMuted) {
            // Restore default or previous volume if possible, but schema defaults to 1.0
            updateAudioConfig({ volume: 1.0 });
        } else {
            updateAudioConfig({ volume: 0 });
        }
    };

    // Decode audio data when the URL changes so we can draw the waveform
    useEffect(() => {
        let isMounted = true;

        if (!audioUrl) {
            // Safe to call synchronously if we know what we are doing, but
            // avoiding cascading renders warning by putting it in a timeout
            // or just accepting that the url isn't there and we clear it.
            // Actually, we can just use setAudioBuffer inside the effect body but let's avoid the lint warning
            setTimeout(() => {
                if (isMounted) setAudioBuffer(null);
            }, 0);
            return;
        }

        const loadAudio = async () => {
            try {
                const response = await fetch(audioUrl);
                const arrayBuffer = await response.arrayBuffer();
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
                const buffer = await audioCtx.decodeAudioData(arrayBuffer);
                if (isMounted) setAudioBuffer(buffer);
                audioCtx.close();
            } catch (err) {
                console.error('[MotionPlate] Failed to decode audio for waveform:', err);
            }
        };

        loadAudio();
        return () => { isMounted = false; };
    }, [audioUrl]);

    // Draw waveform
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // Clear canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        if (!audioBuffer) return;

        const data = audioBuffer.getChannelData(0); // Use the first channel
        const step = Math.ceil(data.length / canvas.width);
        const amp = canvas.height / 2;

        ctx.fillStyle = '#4ade80'; // TIER_COLOR high/tailwind green-400
        ctx.beginPath();

        for (let i = 0; i < canvas.width; i++) {
            let min = 1.0;
            let max = -1.0;
            for (let j = 0; j < step; j++) {
                const datum = data[(i * step) + j];
                if (datum < min) min = datum;
                if (datum > max) max = datum;
            }
            ctx.rect(i, (1 + min) * amp, 1, Math.max(1, (max - min) * amp));
        }

        ctx.fill();
    }, [audioBuffer]);

    return (
        <div className="audio-panel panel-section">
            <h3 className="panel-section__title">Background Audio</h3>

            {!audioUrl ? (
                <div className="audio-panel__empty">
                    <button
                        className="btn btn--secondary"
                        onClick={() => fileInputRef.current?.click()}
                    >
                        + Add Audio
                    </button>
                    <input
                        type="file"
                        accept=".mp3, .wav, .ogg"
                        ref={fileInputRef}
                        style={{ display: 'none' }}
                        onChange={handleFileChange}
                    />
                </div>
            ) : (
                <div className="audio-panel__controls">
                    <div className="audio-panel__header">
                        <span className="audio-panel__name" title={audio?.src}>
                            {audio?.src}
                        </span>
                        <div className="audio-panel__actions">
                            <button
                                className={`icon-btn ${isMuted ? 'icon-btn--active' : ''}`}
                                onClick={handleToggleMute}
                                aria-label={isMuted ? 'Unmute' : 'Mute'}
                                title={isMuted ? 'Unmute' : 'Mute'}
                            >
                                {isMuted ? '🔇' : '🔊'}
                            </button>
                            <button
                                className="icon-btn icon-btn--danger"
                                onClick={removeAudio}
                                aria-label="Remove audio"
                                title="Remove audio track"
                            >
                                ✕
                            </button>
                        </div>
                    </div>

                    <div className="audio-panel__waveform">
                        <canvas ref={canvasRef} width={280} height={40} />
                    </div>

                    <div className="audio-panel__sliders">
                        <label className="field">
                            <span className="field__label">Volume</span>
                            <input
                                type="range"
                                min="0"
                                max="1"
                                step="0.05"
                                value={audio?.volume ?? 1.0}
                                onChange={(e) => updateAudioConfig({ volume: parseFloat(e.target.value) })}
                                disabled={isMuted}
                            />
                        </label>
                        <label className="field">
                            <span className="field__label">Offset (s)</span>
                            <input
                                type="number"
                                min="0"
                                step="0.5"
                                value={audio?.offset ?? 0}
                                onChange={(e) => updateAudioConfig({ offset: parseFloat(e.target.value) })}
                            />
                        </label>
                    </div>
                </div>
            )}
        </div>
    );
}
