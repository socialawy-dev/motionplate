/**
 * DropZone — P3-03
 * Accepts image files via drag-and-drop or click-to-browse.
 * Converts Files → ImageEntry objects and hands off to the project store.
 */

import React, { useCallback, useState } from 'react';
import { useProjectStore } from '../store/project';
import type { ImageEntry } from '../store/project';

async function filesToEntries(files: File[]): Promise<ImageEntry[]> {
    return Promise.all(
        files
            .filter((f) => f.type.startsWith('image/'))
            .map(
                (file) =>
                    new Promise<ImageEntry>((resolve) => {
                        const url = URL.createObjectURL(file);
                        const img = new Image();
                        img.onload = () => resolve({ file, url, img });
                        img.src = url;
                    }),
            ),
    );
}

export default function DropZone() {
    const addImages = useProjectStore((s) => s.addImages);
    const [dragging, setDragging] = useState(false);

    const handleDrop = useCallback(
        async (e: React.DragEvent<HTMLDivElement>) => {
            e.preventDefault();
            setDragging(false);
            const files = Array.from(e.dataTransfer.files);
            const entries = await filesToEntries(files);
            if (entries.length) addImages(entries);
        },
        [addImages],
    );

    const handleFileInput = useCallback(
        async (e: React.ChangeEvent<HTMLInputElement>) => {
            const files = Array.from(e.target.files ?? []);
            const entries = await filesToEntries(files);
            if (entries.length) addImages(entries);
            e.target.value = '';
        },
        [addImages],
    );

    return (
        <div
            className={`dropzone ${dragging ? 'dropzone--active' : ''}`}
            onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
            onDragLeave={() => setDragging(false)}
            onDrop={handleDrop}
            aria-label="Drop images here or click to add"
        >
            <span className="dropzone__icon">🖼️</span>
            <span className="dropzone__text">
                {dragging ? 'Release to add images' : 'Drop images or click to browse'}
            </span>
            <label className="dropzone__btn">
                Browse
                <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleFileInput}
                    style={{ display: 'none' }}
                    aria-label="Upload images"
                />
            </label>
        </div>
    );
}
