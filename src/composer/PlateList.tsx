/**
 * PlateList — P3-02 / P3-15 / P3-16
 * Left panel: plate thumbnail strip with selection, reorder, duplicate, and delete.
 */

import { useRef } from 'react';
import { useProjectStore } from '../store/project';

export default function PlateList() {
    // Individual selectors — avoids new-object-per-render Zustand bug
    const plates = useProjectStore((s) => s.spec.plates);
    const images = useProjectStore((s) => s.images);
    const selectedPlateIdx = useProjectStore((s) => s.selectedPlateIdx);
    const selectPlate = useProjectStore((s) => s.selectPlate);
    const removePlate = useProjectStore((s) => s.removePlate);
    const duplicatePlate = useProjectStore((s) => s.duplicatePlate);
    const movePlate = useProjectStore((s) => s.movePlate);

    const dragIdx = useRef<number | null>(null);

    const handleDragStart = (idx: number) => { dragIdx.current = idx; };

    const handleDrop = (targetIdx: number) => {
        if (dragIdx.current !== null && dragIdx.current !== targetIdx) {
            movePlate(dragIdx.current, targetIdx);
            dragIdx.current = null;
        }
    };

    if (!plates.length) return null;

    return (
        <aside className="plate-list" aria-label="Plate list">
            {plates.map((plate, idx) => {
                const entry = images[idx];
                const isSelected = idx === selectedPlateIdx;

                return (
                    <div
                        key={plate.id}
                        className={`plate-item ${isSelected ? 'plate-item--selected' : ''}`}
                        draggable
                        onDragStart={() => handleDragStart(idx)}
                        onDragOver={(e) => e.preventDefault()}
                        onDrop={() => handleDrop(idx)}
                        onClick={() => selectPlate(idx)}
                        role="button"
                        tabIndex={0}
                        onKeyDown={(e) => e.key === 'Enter' && selectPlate(idx)}
                        aria-pressed={isSelected}
                        aria-label={`Plate ${idx + 1}: ${plate.effect}`}
                    >
                        <div className="plate-item__thumb">
                            {entry?.url ? (
                                <img src={entry.url} alt={`Plate ${idx + 1}`} />
                            ) : (
                                <span className="plate-item__thumb-placeholder">?</span>
                            )}
                        </div>

                        <div className="plate-item__info">
                            <span className="plate-item__label">{idx + 1}. {plate.effect}</span>
                            <span className="plate-item__duration">{plate.duration}s</span>
                        </div>

                        <div className="plate-item__actions">
                            <button
                                className="icon-btn"
                                onClick={(e) => { e.stopPropagation(); duplicatePlate(idx); }}
                                aria-label="Duplicate plate"
                                title="Duplicate"
                            >⧉</button>
                            <button
                                className="icon-btn icon-btn--danger"
                                onClick={(e) => { e.stopPropagation(); removePlate(idx); }}
                                aria-label="Delete plate"
                                title="Delete"
                            >✕</button>
                        </div>
                    </div>
                );
            })}
        </aside>
    );
}
