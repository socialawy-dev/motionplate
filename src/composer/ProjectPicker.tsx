/**
 * ProjectPicker — P5-11
 *
 * Dropdown in the header showing recent projects with new/open/delete actions.
 * Also shows storage usage tip per the user's request.
 */

import { useState, useEffect, useRef } from 'react';
import { useProjectStore } from '../store/project';
import { estimateStorageUsed, formatBytes } from '../store/persistence';

export default function ProjectPicker() {
    const [isOpen, setIsOpen] = useState(false);
    const [storageUsed, setStorageUsed] = useState<string>('');
    const dropdownRef = useRef<HTMLDivElement>(null);

    const projectId = useProjectStore((s) => s.projectId);
    const specTitle = useProjectStore((s) => s.spec.meta.title);
    const recentProjects = useProjectStore((s) => s.recentProjects);
    const refreshProjectList = useProjectStore((s) => s.refreshProjectList);
    const loadProjectById = useProjectStore((s) => s.loadProjectById);
    const createNewProject = useProjectStore((s) => s.createNewProject);
    const deleteProjectById = useProjectStore((s) => s.deleteProjectById);
    const isLoading = useProjectStore((s) => s.isLoading);

    // Refresh list when dropdown opens
    useEffect(() => {
        if (isOpen) {
            refreshProjectList();
            estimateStorageUsed().then((bytes) => setStorageUsed(formatBytes(bytes)));
        }
    }, [isOpen, refreshProjectList]);

    // Close on click outside
    useEffect(() => {
        if (!isOpen) return;
        const handler = (e: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, [isOpen]);

    const handleLoad = async (id: string) => {
        const result = await loadProjectById(id);
        if (result?.migrated) {
            console.info(`[MotionPlate] Project migrated from v${result.fromVersion}`);
        }
        setIsOpen(false);
    };

    const handleDelete = async (e: React.MouseEvent, id: string) => {
        e.stopPropagation();
        if (confirm('Delete this project? This cannot be undone.')) {
            await deleteProjectById(id);
        }
    };

    const handleNew = () => {
        createNewProject();
        setIsOpen(false);
    };

    return (
        <div className="project-picker" ref={dropdownRef}>
            <button
                className="project-picker__trigger"
                onClick={() => setIsOpen(!isOpen)}
                aria-expanded={isOpen}
                aria-haspopup="true"
                aria-label="Project menu"
                title="Switch or create projects"
            >
                <span className="project-picker__title">{specTitle || 'Untitled'}</span>
                <span className="project-picker__caret">{isOpen ? '▲' : '▼'}</span>
            </button>

            {isOpen && (
                <div className="project-picker__dropdown" role="menu">
                    <div className="project-picker__header">
                        <span>Recent Projects</span>
                        <button
                            className="project-picker__new-btn"
                            onClick={handleNew}
                            aria-label="Create new project"
                        >
                            + New
                        </button>
                    </div>

                    {isLoading && (
                        <div className="project-picker__loading">Loading…</div>
                    )}

                    <div className="project-picker__list">
                        {recentProjects.length === 0 && !isLoading && (
                            <div className="project-picker__empty">No saved projects yet</div>
                        )}
                        {recentProjects.map((p) => (
                            <div
                                key={p.id}
                                className={`project-picker__item ${p.id === projectId ? 'project-picker__item--active' : ''}`}
                                onClick={() => handleLoad(p.id)}
                                role="menuitem"
                                tabIndex={0}
                                onKeyDown={(e) => { if (e.key === 'Enter') handleLoad(p.id); }}
                            >
                                <div className="project-picker__item-info">
                                    <span className="project-picker__item-title">{p.title}</span>
                                    <span className="project-picker__item-meta">
                                        {p.plateCount} plate{p.plateCount !== 1 ? 's' : ''} · {timeAgo(p.updatedAt)}
                                    </span>
                                </div>
                                {p.id !== projectId && (
                                    <button
                                        className="project-picker__delete-btn"
                                        onClick={(e) => handleDelete(e, p.id)}
                                        aria-label={`Delete ${p.title}`}
                                        title="Delete project"
                                    >
                                        ×
                                    </button>
                                )}
                            </div>
                        ))}
                    </div>

                    {storageUsed && (
                        <div className="project-picker__footer">
                            <span className="project-picker__storage-tip">
                                💾 {storageUsed} used — images are stored locally in your browser
                            </span>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function timeAgo(ts: number): string {
    const diff = Date.now() - ts;
    const mins = Math.floor(diff / 60_000);
    if (mins < 1) return 'just now';
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    const days = Math.floor(hrs / 24);
    if (days < 30) return `${days}d ago`;
    return new Date(ts).toLocaleDateString();
}
