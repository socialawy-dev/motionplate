/**
 * PlateEditor — P3-06 to P3-10
 * Right panel: all controls for the selected plate.
 */

import { useProjectStore } from '../store/project';
import type { EffectName, TransitionName, PostEffectName } from '../spec/schema';

const EFFECTS: EffectName[] = ['kenBurns', 'pulse', 'drift', 'rotate', 'static'];
const TRANSITIONS: TransitionName[] = [
    'cut', 'crossfade', 'fadeThroughBlack', 'fadeThroughWhite', 'lightBleed',
    'wipeLeft', 'wipeDown', 'slideLeft', 'zoomThrough',
];
const POST_EFFECTS: PostEffectName[] = ['vignette', 'bloom', 'particles', 'fog', 'chromaticAberration', 'screenShake'];

const EFFECT_LABELS: Record<EffectName, string> = {
    kenBurns: 'Ken Burns', pulse: 'Pulse', drift: 'Drift', rotate: 'Rotate', static: 'Static',
};
const TRANSITION_LABELS: Record<TransitionName, string> = {
    cut: 'Cut', crossfade: 'Crossfade', fadeThroughBlack: 'Fade Black',
    fadeThroughWhite: 'Fade White', lightBleed: 'Light Bleed',
    wipeLeft: 'Wipe Left', wipeDown: 'Wipe Down',
    slideLeft: 'Slide Left', zoomThrough: 'Zoom Through',
};
const POST_LABELS: Record<PostEffectName, string> = {
    vignette: 'Vignette', bloom: 'Bloom', particles: 'Particles',
    fog: 'Fog', chromaticAberration: 'Chroma', screenShake: 'Shake',
};

export default function PlateEditor() {
    // Individual selectors
    const plates = useProjectStore((s) => s.spec.plates);
    const selectedPlateIdx = useProjectStore((s) => s.selectedPlateIdx);
    const updatePlate = useProjectStore((s) => s.updatePlate);
    const setEffect = useProjectStore((s) => s.setEffect);
    const setTransition = useProjectStore((s) => s.setTransition);
    const togglePost = useProjectStore((s) => s.togglePost);

    const plate = plates[selectedPlateIdx];

    if (!plate) {
        return (
            <aside className="plate-editor plate-editor--empty">
                <p>No plate selected.<br />Add images to get started.</p>
            </aside>
        );
    }

    const currentPost = plate.post ?? [];

    return (
        <aside className="plate-editor" aria-label="Plate editor">
            {/* Duration */}
            <section className="editor-section">
                <label className="editor-label" htmlFor="plate-duration">Duration (s)</label>
                <input
                    id="plate-duration" type="number" className="editor-input"
                    min={0.1} step={0.5} value={plate.duration}
                    onChange={(e) => updatePlate(selectedPlateIdx, { duration: Number(e.target.value) })}
                />
            </section>

            {/* Effect (P3-07) */}
            <section className="editor-section">
                <label className="editor-label" htmlFor="plate-effect">Motion Effect</label>
                <select
                    id="plate-effect" className="editor-select" value={plate.effect}
                    onChange={(e) => setEffect(selectedPlateIdx, e.target.value as EffectName)}
                >
                    {EFFECTS.map((ef) => <option key={ef} value={ef}>{EFFECT_LABELS[ef]}</option>)}
                </select>
            </section>

            {/* Post effects (P3-08) */}
            <section className="editor-section">
                <span className="editor-label">Post Effects</span>
                <div className="toggle-grid">
                    {POST_EFFECTS.map((pf) => {
                        const active = currentPost.includes(pf);
                        return (
                            <button
                                key={pf}
                                className={`toggle-btn ${active ? 'toggle-btn--on' : ''}`}
                                onClick={() => togglePost(selectedPlateIdx, pf)}
                                aria-pressed={active}
                                aria-label={`Toggle ${POST_LABELS[pf]}`}
                            >
                                {POST_LABELS[pf]}
                            </button>
                        );
                    })}
                </div>
            </section>

            {/* Transition (P3-09) */}
            <section className="editor-section">
                <label className="editor-label" htmlFor="plate-transition">Transition</label>
                <select
                    id="plate-transition" className="editor-select" value={plate.transition}
                    onChange={(e) => setTransition(selectedPlateIdx, e.target.value as TransitionName)}
                >
                    {TRANSITIONS.map((tr) => <option key={tr} value={tr}>{TRANSITION_LABELS[tr]}</option>)}
                </select>

                {plate.transition !== 'cut' && (
                    <>
                        <label className="editor-label" htmlFor="plate-trans-dur">Transition Duration (s)</label>
                        <input
                            id="plate-trans-dur" type="number" className="editor-input"
                            min={0} max={plate.duration} step={0.1}
                            value={plate.transitionDuration ?? 1}
                            onChange={(e) => updatePlate(selectedPlateIdx, { transitionDuration: Number(e.target.value) })}
                        />
                    </>
                )}
            </section>

            {/* Text overlay (P3-10) */}
            <section className="editor-section">
                <label className="editor-label" htmlFor="plate-text">Text Overlay</label>
                <textarea
                    id="plate-text" className="editor-textarea" rows={3}
                    value={plate.text ?? ''}
                    placeholder="Optional text overlay..."
                    onChange={(e) => updatePlate(selectedPlateIdx, { text: e.target.value })}
                />

                {plate.text && (
                    <div className="text-config">
                        <label className="editor-label" htmlFor="plate-text-pos">Position</label>
                        <select
                            id="plate-text-pos" className="editor-select"
                            value={plate.textConfig?.position ?? 'center'}
                            onChange={(e) => updatePlate(selectedPlateIdx, {
                                textConfig: { ...plate.textConfig, position: e.target.value as 'top' | 'center' | 'bottom' },
                            })}
                        >
                            <option value="top">Top</option>
                            <option value="center">Center</option>
                            <option value="bottom">Bottom</option>
                        </select>

                        <label className="editor-label" htmlFor="plate-font-size">Font Size</label>
                        <input
                            id="plate-font-size" type="number" className="editor-input"
                            min={8} max={200}
                            value={plate.textConfig?.fontSize ?? 28}
                            onChange={(e) => updatePlate(selectedPlateIdx, {
                                textConfig: { ...plate.textConfig, fontSize: Number(e.target.value) },
                            })}
                        />
                    </div>
                )}
            </section>
        </aside>
    );
}
