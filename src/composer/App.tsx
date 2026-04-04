/**
 * App — P3-01 + P5-10
 * Root layout: header + 3-panel composer + footer.
 * Also wires:
 *   - Ctrl+Z / Ctrl+Y undo/redo (P3-17)
 *   - Hardware tier detection on mount (P3-18)
 *   - Settings mode tab switching
 *   - IndexedDB project restore on mount (P5-10)
 */

import { useEffect } from 'react';
import DropZone from './DropZone';
import PlateList from './PlateList';
import AudioPanel from './AudioPanel';
import PreviewCanvas from './PreviewCanvas';
import Transport from './Transport';
import PlateEditor from './PlateEditor';
import SpecView from './SpecView';
import ExportBar from './ExportBar';
import DirectorPanel from './DirectorPanel';
import ProjectPicker from './ProjectPicker';
import LandingPage from './LandingPage';
import { useProjectStore } from '../store/project';
import { useSettingsStore } from '../store/settings';
import { detectHardwareTier } from '../engine/profiler';

export default function App() {
    // Individual selectors — avoids new-object-per-render Zustand bug
    const undo = useProjectStore((s) => s.undo);
    const redo = useProjectStore((s) => s.redo);
    const platesLength = useProjectStore((s) => s.spec.plates.length);
    const initFromLastProject = useProjectStore((s) => s.initFromLastProject);
    const isLoading = useProjectStore((s) => s.isLoading);

    const activeMode = useSettingsStore((s) => s.activeMode);
    const setActiveMode = useSettingsStore((s) => s.setActiveMode);
    const setTier = useSettingsStore((s) => s.setTier);

    const hasPlates = platesLength > 0;

    // Detect hardware tier on mount (P3-18)
    useEffect(() => {
        const result = detectHardwareTier();
        setTier(result.tier);
    }, [setTier]);

    // Restore last project from IndexedDB on mount (P5-10)
    useEffect(() => {
        initFromLastProject();
    }, [initFromLastProject]);

    // Undo/Redo keyboard shortcuts (P3-17)
    useEffect(() => {
        const handler = (e: KeyboardEvent) => {
            const tag = (e.target as HTMLElement).tagName;
            if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;
            if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
                e.preventDefault();
                undo();
            }
            if (
                ((e.ctrlKey || e.metaKey) && e.key === 'y') ||
                ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'z')
            ) {
                e.preventDefault();
                redo();
            }
        };
        window.addEventListener('keydown', handler);
        return () => window.removeEventListener('keydown', handler);
    }, [undo, redo]);

    return (
        <div className="app">
            {/* ── Header ──────────────────────────────────────────── */}
            <header className="app__header">
                <div className="app__logo">
                    <span className="app__logo-icon">⬡</span>
                    <span className="app__logo-text">MotionPlate</span>
                </div>

                <ProjectPicker />

                <nav className="app__tabs" aria-label="Mode tabs">
                    {(['compose', 'preview', 'spec', 'director'] as const).map((mode) => (
                        <button
                            key={mode}
                            className={`tab-btn ${activeMode === mode ? 'tab-btn--active' : ''}`}
                            onClick={() => setActiveMode(mode)}
                            aria-selected={activeMode === mode}
                            aria-label={`${mode} mode`}
                        >
                            {mode === 'compose' && '⊞ Compose'}
                            {mode === 'preview' && '▶ Preview'}
                            {mode === 'spec' && '{ } Spec'}
                            {mode === 'director' && '🎬 Director'}
                        </button>
                    ))}
                </nav>

                <ExportBar />
            </header>

            {/* ── Loading overlay ──────────────────────────────────── */}
            {isLoading && (
                <div className="app__loading">
                    <span>Loading project…</span>
                </div>
            )}

            {/* ── Main 3-panel layout (compose mode) ─────────────── */}
            {activeMode === 'compose' && (
                <main className="app__main">
                    <aside className="panel panel--left">
                        <DropZone />
                        <AudioPanel />
                        <PlateList />
                    </aside>

                    <section className="panel panel--center" aria-label="Preview">
                        {hasPlates ? (
                            <>
                                <PreviewCanvas />
                                <Transport />
                            </>
                        ) : (
                            <LandingPage />
                        )}
                    </section>

                    <PlateEditor />
                </main>
            )}

            {/* ── Preview mode ────────────────────────────────────── */}
            {activeMode === 'preview' && (
                <main className="app__main app__main--preview">
                    <section className="panel panel--fullscreen" aria-label="Full preview">
                        <PreviewCanvas />
                        <Transport />
                    </section>
                </main>
            )}

            {/* ── Spec mode ───────────────────────────────────────── */}
            {activeMode === 'spec' && (
                <main className="app__main">
                    <SpecView />
                </main>
            )}

            {/* ── Director mode ───────────────────────────────────── */}
            {activeMode === 'director' && (
                <main className="app__main">
                    <DirectorPanel />
                </main>
            )}
        </div>
    );
}
