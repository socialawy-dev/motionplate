/**
 * SpecView — P3-11 / P3-12 / P3-13
 */

import React, { useRef } from 'react';
import { useProjectStore } from '../store/project';
import { specToJSON, importSpec, exportSpec } from '../spec/io';

export default function SpecView() {
    // Individual selectors
    const spec = useProjectStore((s) => s.spec);
    const setSpec = useProjectStore((s) => s.setSpec);
    const fileRef = useRef<HTMLInputElement>(null);

    const json = specToJSON(spec);

    const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        try {
            const imported = await importSpec(file);
            setSpec(imported);
        } catch (err) {
            alert(`Import failed: ${(err as Error).message}`);
        }
        e.target.value = '';
    };

    return (
        <div className="spec-view" aria-label="Sequence spec viewer">
            <div className="spec-view__toolbar">
                <h3 className="spec-view__title">sequence.json</h3>
                <div className="spec-view__actions">
                    <button className="btn btn--secondary" onClick={() => fileRef.current?.click()} aria-label="Import spec">
                        ↑ Import
                    </button>
                    <input
                        ref={fileRef} type="file" accept=".json,application/json"
                        style={{ display: 'none' }} onChange={handleImport} aria-label="Import spec file"
                    />
                    <button className="btn btn--primary" onClick={() => exportSpec(spec)} aria-label="Download spec">
                        ↓ Download
                    </button>
                </div>
            </div>
            <pre className="spec-view__pre" aria-readonly="true">{json}</pre>
        </div>
    );
}
